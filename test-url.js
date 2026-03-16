/**
 * Quick test script to validate specific streaming URLs
 * Usage: node test-url.js <url>
 * Example: node test-url.js "https://example.com/stream.m3u8"
 */

const TEST_TIMEOUT = 15000;

async function validateStreamUrl(url, headers = {}) {
  console.log(`\n🔍 Testing: ${url}\n`);
  
  const startTime = Date.now();
  
  try {
    // Try HEAD request first
    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TEST_TIMEOUT);
      
      response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          ...headers
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (headError) {
      // Fall back to GET
      console.log('  HEAD failed, trying GET...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TEST_TIMEOUT);
      
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          ...headers
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    }
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ URL is ACCESSIBLE');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response Time: ${responseTime}ms`);
    console.log(`   Content-Type: ${response.headers.get('content-type') || 'N/A'}`);
    console.log(`   Content-Length: ${response.headers.get('content-length') || 'N/A'}`);
    
    return true;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.log('❌ URL is NOT ACCESSIBLE');
    console.log(`   Error: ${error.message}`);
    console.log(`   Response Time: ${responseTime}ms`);
    
    return false;
  }
}

// Main
const url = process.argv[2];

if (!url) {
  console.log('Usage: node test-url.js <url>');
  console.log('Example: node test-url.js "https://example.com/stream.m3u8"');
  process.exit(1);
}

validateStreamUrl(url).then(isValid => {
  process.exit(isValid ? 0 : 1);
});
