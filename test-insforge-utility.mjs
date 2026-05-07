/**
 * Test the InsForge utility module
 */

import {
    getCachedHighlights,
    cacheHighlights,
    clearExpiredCache
} from './src/lib/insforge.ts';

async function testUtility() {
    console.log('🧪 Testing InsForge utility module...\n');

    // Test 1: Cache insert
    console.log('📍 Test 1: Cache highlights (INSERT)');
    const testCards = [
        {
            id: 'test_card_001',
            state: 'west_bengal',
            category: 'results',
            headline: 'Test Card',
            context: 'Test context',
            key_stat: { value: '100', label: 'test' },
            detail: {
                full_text: 'Test',
                chart_type: 'bar',
                chart_data: [],
                sources: [],
                suggested_questions: [],
            },
            generated_at: new Date().toISOString(),
        },
    ];

    const cacheResult = await cacheHighlights(
        'west_bengal',
        'results',
        testCards,
        { test: true }
    );

    if (cacheResult.success) {
        console.log('✅ Cache INSERT successful');
        console.log(`   ID: ${cacheResult.data?.id}`);
        console.log(`   State: ${cacheResult.data?.state}`);
        console.log(`   Cards: ${cacheResult.data?.cards.length}\n`);
    } else {
        console.log(`❌ Cache INSERT failed: ${cacheResult.error}\n`);
        return false;
    }

    // Test 2: Cache read
    console.log('📍 Test 2: Get cached highlights (SELECT)');
    const getResult = await getCachedHighlights('west_bengal', 'results');

    if (getResult.success && getResult.data) {
        console.log('✅ Cache SELECT successful');
        console.log(`   Found ${getResult.data.cards.length} card(s)`);
        console.log(`   Generated at: ${getResult.data.generated_at}\n`);
    } else {
        console.log(`❌ Cache SELECT failed: ${getResult.error}\n`);
        return false;
    }

    // Test 3: Clear cache
    console.log('📍 Test 3: Clear expired cache');
    const clearResult = await clearExpiredCache(0); // Clear all

    if (clearResult.success) {
        console.log('✅ Cache clear successful\n');
    } else {
        console.log(`⚠️  Cache clear failed: ${clearResult.error}\n`);
    }

    return true;
}

testUtility()
    .then((success) => {
        if (success) {
            console.log('🎉 All InsForge utility tests passed!\n');
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
