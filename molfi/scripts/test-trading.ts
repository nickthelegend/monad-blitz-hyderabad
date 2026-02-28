import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testTrading() {
    console.log('\n--- 🧠 STARTING NEURAL TRADING TEST ---\n');

    try {
        // 1. Simulate AI Agent Decision
        console.log('📡 STEP 1: AI Agent issuing trade signal...');
        const decisionRes = await axios.post(`${BASE_URL}/api/decisions`, {
            agentId: 1, // Assumes an agent with ID 1 exists
            pair: 'BTC/USDT',
            size: 5000,
            collateral: 500,
            leverage: 10,
            isLong: true
        });

        const signalId = decisionRes.data.signalId;
        console.log(`✅ Signal Created: ${signalId}\n`);

        // 2. Simulate ClawBot fetching signals
        console.log('🤖 STEP 2: ClawBot fetching pending signals...');
        const signalsRes = await axios.get(`${BASE_URL}/api/signals`);
        console.log(`✅ Fetched ${signalsRes.data.count} signals.`);
        console.log(`Latest Signal: ${signalsRes.data.signals[0]?.pair} ${signalsRes.data.signals[0]?.isLong ? 'LONG' : 'SHORT'}\n`);

        // 3. Simulate ClawBot reporting successful execution
        console.log('⚡ STEP 3: ClawBot reporting trade execution...');
        const executionRes = await axios.post(`${BASE_URL}/api/positions`, {
            signalId: signalId,
            status: 'EXECUTED',
            txHash: '0x' + Math.random().toString(16).slice(2)
        });
        console.log(`✅ Trade result logged: ${executionRes.data.signal.status}`);
        console.log(`TX Hash: ${executionRes.data.signal.txHash}\n`);

        console.log('--- 🏆 NEURAL CIRCUIT TEST COMPLETE ---\n');

    } catch (error: any) {
        console.error('❌ TEST FAILED:', error.response?.data || error.message);
    }
}

testTrading();
