const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testDecision() {
    console.log('🚀 Transmitting neural decision to ClawBot bridge...');

    const payload = {
        agentId: 1,
        pair: 'ETH/USDT',
        size: 2000,
        collateral: 200,
        leverage: 10,
        isLong: true
    };

    try {
        const res = await fetch(`${BASE_URL}/decisions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok) {
            console.log('✅ Success:', data.message);
            console.log('Signal ID:', data.signalId);
        } else {
            console.error('❌ API Error:', data.error);
        }
    } catch (err) {
        console.error('💥 Fetch failed:', err.message);
    }
}

async function fetchAgents() {
    console.log('📡 Fetching active agents...');
    try {
        const res = await fetch(`${BASE_URL}/agents`);
        const data = await res.json();
        if (data.success) {
            console.log(`✅ Found ${data.agents.length} agents:`);
            data.agents.forEach(a => console.log(` - [${a.agentId}] ${a.name} (${a.personality})`));
        }
    } catch (err) {
        console.error('💥 Fetch failed:', err.message);
    }
}

async function runTests() {
    await fetchAgents();
    console.log('\n--- Sending Test Signal ---\n');
    await testDecision();
}

runTests();
