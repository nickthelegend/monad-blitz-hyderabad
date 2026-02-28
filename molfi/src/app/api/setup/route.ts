import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        db: {
            schema: 'public',
        },
    }
);

export async function POST(request: NextRequest) {
    try {
        // Security: require a setup token
        const { token } = await request.json();
        if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try to create through RPC if available
        // Otherwise try direct SQL via the management API
        const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0];

        const sql = `
            CREATE TABLE IF NOT EXISTS "public"."TradeLog" (
                "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "agentId" INTEGER NOT NULL,
                "pair" TEXT NOT NULL,
                "side" TEXT NOT NULL,
                "size" DECIMAL NOT NULL,
                "collateral" DECIMAL NOT NULL,
                "leverage" INTEGER NOT NULL DEFAULT 1,
                "entryPrice" DECIMAL NOT NULL,
                "exitPrice" DECIMAL,
                "pnl" DECIMAL DEFAULT 0,
                "fees" DECIMAL DEFAULT 0,
                "status" TEXT DEFAULT 'OPEN',
                "openedAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
                "closedAt" TIMESTAMPTZ,
                CONSTRAINT "TradeLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."AIAgent"("agentId") ON DELETE CASCADE
            );
        `;

        // Method 1: Try pg-meta API (internal Supabase endpoint)
        try {
            const pgMetaRes = await fetch(
                `https://${projectRef}.supabase.co/pg-meta/default/query`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                    },
                    body: JSON.stringify({ query: sql }),
                }
            );

            if (pgMetaRes.ok) {
                // Also create indexes
                await fetch(
                    `https://${projectRef}.supabase.co/pg-meta/default/query`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                        },
                        body: JSON.stringify({
                            query: `
                                CREATE INDEX IF NOT EXISTS idx_tradelog_agentid ON "public"."TradeLog"("agentId");
                                CREATE INDEX IF NOT EXISTS idx_tradelog_status ON "public"."TradeLog"("status");
                                CREATE INDEX IF NOT EXISTS idx_tradelog_pair ON "public"."TradeLog"("pair");
                            `
                        }),
                    }
                );

                return NextResponse.json({ success: true, method: 'pg-meta' });
            }
        } catch (e: any) {
            console.log('pg-meta failed:', e.message);
        }

        // Method 2: Check if table exists, if not return SQL for manual creation
        const { error } = await supabase.from('TradeLog').select('id').limit(1);

        if (!error) {
            return NextResponse.json({ success: true, message: 'Table already exists' });
        }

        return NextResponse.json({
            success: false,
            error: 'Table does not exist and could not be auto-created',
            sql: sql,
            dashboard: `https://supabase.com/dashboard/project/${projectRef}/sql/new`,
        }, { status: 500 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
