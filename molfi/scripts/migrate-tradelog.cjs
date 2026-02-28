/**
 * Create TradeLog table using pg client with Supabase connection
 * 
 * REQUIREMENT: Set DATABASE_URL in .env.local to your Supabase connection string
 * 
 * Find it at: https://supabase.com/dashboard/project/ujimcxfejkvfibybzjow/settings/database
 * Under "Connection String" > "Session mode"
 * 
 * Example: postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
 */
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

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
CREATE INDEX IF NOT EXISTS idx_tradelog_agentid ON "public"."TradeLog"("agentId");
CREATE INDEX IF NOT EXISTS idx_tradelog_status ON "public"."TradeLog"("status");
CREATE INDEX IF NOT EXISTS idx_tradelog_pair ON "public"."TradeLog"("pair");
CREATE INDEX IF NOT EXISTS idx_tradelog_opened ON "public"."TradeLog"("openedAt" DESC);
`;

async function run() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl || dbUrl.includes('[PASSWORD]')) {
        const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1].split('.')[0];
        console.log('');
        console.log('❌ DATABASE_URL is not configured with a real password');
        console.log('');
        console.log('To fix this:');
        console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
        console.log('2. Copy the "Connection string (Session)" URI');
        console.log('3. Replace the DATABASE_URL in .env.local with it');
        console.log('4. Re-run this script');
        console.log('');
        console.log('OR run this SQL manually in the SQL editor:');
        console.log('🔗 https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
        console.log('\n' + sql);
        return;
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
    });

    try {
        console.log('Connecting...');
        await client.connect();
        console.log('Connected! Running migration...');
        await client.query(sql);

        const result = await client.query('SELECT count(*) FROM "public"."TradeLog"');
        console.log('✅ TradeLog table exists with ' + result.rows[0].count + ' rows');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

run().catch(console.error);
