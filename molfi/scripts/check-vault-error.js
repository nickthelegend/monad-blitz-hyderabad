require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Supabase env vars missing');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkVault() {
    const vaultAddress = '0xc580bce07c4c38d6907d94f9caa325aa4e7a7894';

    // Check agents table
    const { data: agents, error } = await supabase
        .from('agents')
        .select('*')
        .eq('vault_address', vaultAddress);

    if (error) {
        console.error('Error fetching agents:', error);
    } else {
        console.log('Agents with this vault:', agents);
    }

    // Check investments with this vault address (if joined)
    // Actually investments link to agent_id, so we find the agent first.
    if (agents && agents.length > 0) {
        const agentId = agents[0].agent_id;
        console.log(`Checking investments for Agent ID: ${agentId}`);
        const { data: investments, error: invError } = await supabase
            .from('investments')
            .select('*')
            .eq('agent_id', agentId);

        if (invError) console.error('Error fetching investments:', invError);
        else console.log('Investments count:', investments.length);
    } else {
        console.log('No agent found with this vault address.');

        // Maybe the vault address in the error came from the investment's joined agent data, 
        // which might be stale if the agent was updated but the investment record somehow points to old data? 
        // No, in the code: inv.agents.vault_address. `inv` comes from `/api/investments/user/${address}` 
        // which joins the `agents` table. So it must be the current data in `agents` table.
    }
}

checkVault();
