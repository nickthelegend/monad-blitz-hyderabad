/**
 * Test RPC endpoints and Chainlink feeds on Monad Testnet
 * Diagnoses why prices are falling back instead of using Chainlink
 * 
 * Usage: node scripts/test-rpc.cjs
 */
const { ethers } = require('ethers');

const AGGREGATOR_ABI = [
    'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
    'function decimals() external view returns (uint8)',
    'function description() external view returns (string)',
];

const RPC_URLS = [
    'https://testnet-rpc.monad.xyz',
    'https://monad-testnet.drpc.org',
    'https://rpc-testnet.monadinfra.com/v1/test',
];

const CHAINLINK_FEEDS = {
    'BTC/USD': '0x2Cd9D7E85494F68F5aF08EF96d6FD5e8F71B4d31',
    'ETH/USD': '0x0c76859E85727683Eeba0C70Bc2e0F5781337818',
    'LINK/USD': '0x4682035965Cd2B88759193ee2660d8A0766e1391',
};

async function testRpcEndpoints() {
    console.log('=== Testing RPC Endpoints ===\n');

    for (const url of RPC_URLS) {
        try {
            const provider = new ethers.JsonRpcProvider(url, undefined, {
                staticNetwork: true,
                batchMaxCount: 1,
            });

            const start = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const elapsed = Date.now() - start;

            console.log(`✅ ${url}`);
            console.log(`   Block: ${blockNumber} | Latency: ${elapsed}ms`);
        } catch (err) {
            console.log(`❌ ${url}`);
            console.log(`   Error: ${err.message.substring(0, 120)}`);
        }
        console.log('');
    }
}

async function testChainlinkFeeds() {
    console.log('\n=== Testing Chainlink Data Feeds ===\n');

    // Find first working RPC
    let provider = null;
    let workingUrl = null;

    for (const url of RPC_URLS) {
        try {
            const p = new ethers.JsonRpcProvider(url, undefined, {
                staticNetwork: true,
                batchMaxCount: 1,
            });
            await p.getBlockNumber();
            provider = p;
            workingUrl = url;
            break;
        } catch (e) {
            // skip
        }
    }

    if (!provider) {
        console.log('❌ No working RPC endpoint found! All Chainlink calls will fail.');
        return;
    }

    console.log(`Using RPC: ${workingUrl}\n`);

    for (const [pair, address] of Object.entries(CHAINLINK_FEEDS)) {
        console.log(`--- ${pair} (${address}) ---`);

        try {
            // First check if there's code at the address
            const code = await provider.getCode(address);
            if (code === '0x') {
                console.log('   ❌ No contract deployed at this address!');
                console.log('   This feed address is incorrect or not deployed on Monad testnet.');
                console.log('');
                continue;
            }
            console.log(`   ✅ Contract exists (code size: ${(code.length - 2) / 2} bytes)`);

            // Try calling decimals()
            const feed = new ethers.Contract(address, AGGREGATOR_ABI, provider);

            try {
                const decimals = await feed.decimals();
                console.log(`   ✅ decimals() = ${decimals}`);
            } catch (err) {
                console.log(`   ❌ decimals() failed: ${err.message.substring(0, 100)}`);
            }

            // Try calling description()
            try {
                const desc = await feed.description();
                console.log(`   ✅ description() = "${desc}"`);
            } catch (err) {
                console.log(`   ⚠️  description() failed (may not be implemented)`);
            }

            // Try calling latestRoundData()
            try {
                const roundData = await feed.latestRoundData();
                const [roundId, answer, startedAt, updatedAt, answeredInRound] = roundData;

                console.log(`   ✅ latestRoundData():`);
                console.log(`      roundId:         ${roundId}`);
                console.log(`      answer (raw):    ${answer}`);
                console.log(`      startedAt:       ${new Date(Number(startedAt) * 1000).toISOString()}`);
                console.log(`      updatedAt:       ${new Date(Number(updatedAt) * 1000).toISOString()}`);
                console.log(`      answeredInRound: ${answeredInRound}`);

                // Try to compute price
                try {
                    const decimals = await feed.decimals();
                    const price = Number(answer) / (10 ** Number(decimals));
                    console.log(`      💰 Price: $${price.toLocaleString()}`);
                } catch (e) {
                    console.log(`      ⚠️  Could not compute price`);
                }
            } catch (err) {
                console.log(`   ❌ latestRoundData() failed: ${err.message.substring(0, 150)}`);
            }

        } catch (err) {
            console.log(`   ❌ General error: ${err.message.substring(0, 150)}`);
        }

        console.log('');
    }
}

async function main() {
    console.log('🔍 MolFi RPC & Chainlink Diagnostics');
    console.log('=====================================\n');

    await testRpcEndpoints();
    await testChainlinkFeeds();

    console.log('\n=== Done ===');
}

main().catch(console.error);
