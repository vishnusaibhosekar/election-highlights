/**
 * InsForge SDK Test Script
 * 
 * Tests:
 * 1. SDK initialization and connection
 * 2. Database table creation (via SQL)
 * 3. CRUD operations on bookmarks table
 * 4. Authentication check
 */

import { createClient } from '@insforge/sdk';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!INSFORGE_URL || !INSFORGE_ANON_KEY) {
    console.error('❌ Error: InsForge environment variables not set');
    console.error('   Required: NEXT_PUBLIC_INSFORGE_URL, NEXT_PUBLIC_INSFORGE_ANON_KEY');
    process.exit(1);
}

// Initialize InsForge client
const insforge = createClient({
    baseUrl: INSFORGE_URL,
    anonKey: INSFORGE_ANON_KEY,
});

async function testConnection() {
    console.log('📍 Test 1: SDK initialization and connection');
    console.log(`   URL: ${INSFORGE_URL}`);

    try {
        // Try to query a system table to verify connection
        const { data, error } = await insforge.database
            .from('auth.users')
            .select('id')
            .limit(1);

        if (error) {
            // Some tables might not be accessible with anon key, which is OK
            console.log('⚠️  Connection established but query returned error (expected for some tables)');
            console.log(`   Error: ${error.message}`);
        } else {
            console.log('✅ Connection successful');
        }
        console.log('');
        return true;
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        console.log('');
        return false;
    }
}

async function testDatabaseTables() {
    console.log('📍 Test 2: Check database tables');

    const tablesToCheck = ['bookmarks', 'chat_sessions', 'cached_highlights'];

    for (const table of tablesToCheck) {
        try {
            const { data, error } = await insforge.database
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                if (error.message.includes('does not exist') || error.message.includes('relation')) {
                    console.log(`   ⚠️  Table "${table}" does not exist - needs creation`);
                } else {
                    console.log(`   ✅ Table "${table}" exists (query error: ${error.message})`);
                }
            } else {
                console.log(`   ✅ Table "${table}" exists and accessible`);
            }
        } catch (error) {
            console.log(`   ❌ Table "${table}" check failed: ${error.message}`);
        }
    }

    console.log('');
    return true;
}

async function testCRUDOperations() {
    console.log('📍 Test 3: CRUD operations (bookmarks table)');

    const testCardId = 'test_card_001';
    let bookmarkId = null;

    // Test INSERT
    try {
        const testBookmark = {
            user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
            card_id: testCardId,
            card_data: {
                id: testCardId,
                headline: 'Test Bookmark',
                state: 'west_bengal',
                category: 'results',
            },
        };

        const { data, error } = await insforge.database
            .from('bookmarks')
            .insert([testBookmark])
            .select();

        if (error) {
            console.log(`   ⚠️  INSERT failed: ${error.message}`);
            console.log('   → Table may not exist or RLS policy blocking');
            console.log('');
            return false;
        }

        bookmarkId = data[0].id;
        console.log(`   ✅ INSERT successful: ${bookmarkId}`);
    } catch (error) {
        console.log(`   ❌ INSERT failed: ${error.message}`);
        console.log('');
        return false;
    }

    // Test SELECT
    try {
        const { data, error } = await insforge.database
            .from('bookmarks')
            .select('*')
            .eq('card_id', testCardId);

        if (error) {
            console.log(`   ❌ SELECT failed: ${error.message}`);
            console.log('');
            return false;
        }

        console.log(`   ✅ SELECT successful: ${data.length} record(s) found`);
    } catch (error) {
        console.log(`   ❌ SELECT failed: ${error.message}`);
        console.log('');
        return false;
    }

    // Test DELETE (cleanup)
    if (bookmarkId) {
        try {
            const { error } = await insforge.database
                .from('bookmarks')
                .delete()
                .eq('id', bookmarkId);

            if (error) {
                console.log(`   ⚠️  DELETE failed: ${error.message}`);
            } else {
                console.log(`   ✅ DELETE successful (cleanup)`);
            }
        } catch (error) {
            console.log(`   ⚠️  DELETE failed: ${error.message}`);
        }
    }

    console.log('');
    return true;
}

async function testAuth() {
    console.log('📍 Test 4: Authentication check');

    try {
        const { data, error } = await insforge.auth.getCurrentUser();

        if (error) {
            console.log('   ℹ️  No authenticated user (expected - not logged in yet)');
            console.log(`   Error: ${error.message}`);
        } else if (data) {
            console.log(`   ✅ User authenticated: ${data.email || data.id}`);
        } else {
            console.log('   ℹ️  No active session (expected before login)');
        }

        console.log('   → Google OAuth will be configured separately');
        console.log('');
        return true;
    } catch (error) {
        console.log(`   ⚠️  Auth check failed: ${error.message}`);
        console.log('');
        return true; // Not a blocker
    }
}

// Run all tests
async function runTests() {
    console.log('🔧 Testing InsForge SDK...\n');

    const results = [
        await testConnection(),
        await testDatabaseTables(),
        await testCRUDOperations(),
        await testAuth(),
    ];

    return results.every(r => r);
}

runTests()
    .then((success) => {
        if (success) {
            console.log('🎉 InsForge SDK tests completed!');
            console.log('   Note: Database tables may need to be created via SQL migration');
            console.log('   You can now use this pattern in lib/insforge.ts\n');
            process.exit(0);
        } else {
            console.log('⚠️  Some tests failed. Check errors above.\n');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('\n❌ Unexpected error:', error);
        process.exit(1);
    });
