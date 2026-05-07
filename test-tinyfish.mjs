/**
 * TinyFish Fetch API Test Script
 * 
 * Tests the TinyFish Fetch API by scraping the West Bengal 2026 election Wikipedia page.
 * This validates that our API key works and we can extract structured election data.
 */

const TINYFISH_API_KEY = process.env.TINYFISH_API_KEY;

if (!TINYFISH_API_KEY) {
    console.error('❌ Error: TINYFISH_API_KEY environment variable not set');
    process.exit(1);
}

const TEST_URLS = [
    'https://en.wikipedia.org/wiki/2026_West_Bengal_Legislative_Assembly_election',
    'https://en.wikipedia.org/wiki/2026_Tamil_Nadu_Legislative_Assembly_election'
];

async function testTinyFishFetch() {
    console.log('🐟 Testing TinyFish Fetch API...\n');
    console.log(`📡 Fetching ${TEST_URLS.length} Wikipedia election pages...\n`);

    try {
        const response = await fetch('https://api.fetch.tinyfish.ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': TINYFISH_API_KEY,
            },
            body: JSON.stringify({
                urls: TEST_URLS,
                format: 'markdown', // Best format for LLM processing
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Check for errors
        if (data.errors && data.errors.length > 0) {
            console.error('❌ Errors encountered:');
            data.errors.forEach((error) => {
                console.error(`  - ${error.url}: ${error.error}`);
            });
            console.log('');
        }

        // Process successful results
        if (data.results && data.results.length > 0) {
            console.log(`✅ Successfully fetched ${data.results.length} pages!\n`);

            data.results.forEach((result, index) => {
                console.log(`📄 Page ${index + 1}:`);
                console.log(`   URL: ${result.url}`);
                console.log(`   Title: ${result.title || 'N/A'}`);
                console.log(`   Language: ${result.language || 'N/A'}`);
                console.log(`   Content length: ${result.text?.length || 0} characters`);
                console.log(`   Latency: ${result.latency_ms || 'N/A'} ms`);

                // Show preview of content (first 500 chars)
                if (result.text) {
                    const preview = result.text.substring(0, 500);
                    console.log(`\n   Preview:`);
                    console.log(`   ${'─'.repeat(60)}`);
                    console.log(`   ${preview}...`);
                    console.log(`   ${'─'.repeat(60)}\n`);
                }

                console.log('');
            });

            // Validate we got election data
            const wbResult = data.results.find((r) =>
                r.url.includes('West_Bengal')
            );

            if (wbResult && wbResult.text) {
                const hasPartyData = wbResult.text.includes('BJP') || wbResult.text.includes('TMC');
                const hasSeatData = wbResult.text.includes('seat') || wbResult.text.includes('294');

                if (hasPartyData && hasSeatData) {
                    console.log('✅ Election data validation: PASSED');
                    console.log('   ✓ Contains party names (BJP/TMC)');
                    console.log('   ✓ Contains seat/election data');
                } else {
                    console.log('⚠️  Election data validation: INCOMPLETE');
                    console.log('   May need to check content structure');
                }
            }

            return true;
        } else {
            console.error('❌ No results returned');
            return false;
        }

    } catch (error) {
        console.error('❌ Test failed with error:');
        console.error(`   ${error.message}`);

        if (error.message.includes('401')) {
            console.error('\n   → Check your TINYFISH_API_KEY is correct');
        } else if (error.message.includes('429')) {
            console.error('\n   → Rate limit exceeded, wait and retry');
        }

        return false;
    }
}

// Run the test
testTinyFishFetch()
    .then((success) => {
        if (success) {
            console.log('\n🎉 TinyFish Fetch API test completed successfully!');
            console.log('   You can now use this pattern in lib/tinyfish.ts\n');
            process.exit(0);
        } else {
            console.log('\n⚠️  Test completed with issues. Check errors above.\n');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('\n❌ Unexpected error:', error);
        process.exit(1);
    });
