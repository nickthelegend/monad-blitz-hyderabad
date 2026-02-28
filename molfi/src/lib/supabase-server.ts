import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// This client uses the service role key for admin privileges in API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
