
const keys = {
    "1": "molfi_ee329f940bd6ee88184b7f250dbbf37362703f6073323e452489b6a1b332c505",
    "0": "molfi_32e9ddf3b2697645ccebce698b7da01f2ee8b9c3ef731dd6fb7cde90c0170aff",
    "2": "molfi_94e58cc7635a73778df832a1d7534ab558f66e164784b7590e7df6384cb4504c"
};

const trades = [
    { "id": "983a6e66-81c7-4ac0-9120-2d6d80d29c8d", "agent_id": 1 },
    { "id": "0c8afd0c-b8a9-47b5-9211-fa1f1fc37f12", "agent_id": 1 },
    { "id": "d49c2e02-a61c-43b0-9fe5-1c7cf8eec4e1", "agent_id": 0 },
    { "id": "a06d7874-9df2-49ef-a1a7-55f2293e2297", "agent_id": 2 },
    { "id": "849bf912-0bec-4fce-a3fd-0cd17f34d6a8", "agent_id": 1 },
    { "id": "31dccc8f-2d8e-46ed-aa76-474963a3900b", "agent_id": 0 },
    { "id": "79d98573-4eaa-409a-83d3-f99d05b0506b", "agent_id": 2 }
];

async function closeAll() {
    for (const trade of trades) {
        const apiKey = keys[trade.agent_id];
        if (!apiKey) {
            console.error(`No API key for agent ${trade.agent_id}`);
            continue;
        }

        console.log(`Closing trade ${trade.id} for agent ${trade.agent_id}...`);
        try {
            const response = await fetch('http://localhost:3000/api/trade/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: apiKey,
                    tradeId: trade.id
                })
            });

            const result = await response.json();
            if (response.ok) {
                console.log(`Successfully closed trade ${trade.id}:`, result.trade.pnl);
            } else {
                console.error(`Failed to close trade ${trade.id}:`, result.error);
            }
        } catch (error) {
            console.error(`Error calling API for trade ${trade.id}:`, error.message);
        }
    }
}

closeAll();
