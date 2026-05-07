/**
 * Test the TinyFish utility module
 */

import { fetchElectionData, fetchAllElectionData } from './src/lib/tinyfish.ts';

async function testUtility() {
    console.log('🧪 Testing TinyFish utility module...\n');

    // Test 1: Fetch single state
    console.log('📍 Test 1: Fetch West Bengal election data');
    const wbResult = await fetchElectionData('west_bengal');

    if (wbResult.success) {
        console.log('✅ West Bengal fetch succeeded');
        console.log(`   Title: ${wbResult.data?.title}`);
        console.log(`   Content: ${wbResult.data?.text?.length || 0} chars\n`);
    } else {
        console.log(`❌ West Bengal fetch failed: ${wbResult.error}\n`);
        return false;
    }

    // Test 2: Fetch all states
    console.log('📍 Test 2: Fetch all election data (parallel)');
    const allResults = await fetchAllElectionData();

    const wb = allResults.west_bengal;
    const tn = allResults.tamil_nadu;

    if (wb.success && tn.success) {
        console.log('✅ Both states fetched successfully');
        console.log(`   West Bengal: ${wb.data?.text?.length || 0} chars`);
        console.log(`   Tamil Nadu: ${tn.data?.text?.length || 0} chars\n`);
    } else {
        console.log('❌ One or both states failed:');
        if (!wb.success) console.log(`   West Bengal: ${wb.error}`);
        if (!tn.success) console.log(`   Tamil Nadu: ${tn.error}`);
        console.log('');
        return false;
    }

    return true;
}

testUtility()
    .then((success) => {
        if (success) {
            console.log('🎉 All TinyFish utility tests passed!\n');
            process.exit(0);
        } else {
            console.log('⚠️  Some tests failed\n');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('❌ Test error:', error);
        process.exit(1);
    });
