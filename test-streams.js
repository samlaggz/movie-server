/**
 * Test script to validate streaming links across all providers
 * Run with: npm run test:streams
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const PROVIDERS_DIR = path.join(__dirname, 'providers');
const DIST_DIR = path.join(__dirname, 'dist');
const TEST_TIMEOUT = 15000; // 15 seconds per link

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class StreamValidator {
  constructor() {
    this.results = {
      total: 0,
      working: 0,
      failed: 0,
      providers: {}
    };
  }

  async validateUrl(url, headers = {}, timeout = TEST_TIMEOUT) {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          ...headers
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      return {
        isValid: response.ok,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        error: null
      };
    } catch (error) {
      // Try GET if HEAD fails
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            ...headers
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        return {
          isValid: response.ok,
          statusCode: response.status,
          responseTime: Date.now() - startTime,
          error: null
        };
      } catch (getError) {
        return {
          isValid: false,
          statusCode: null,
          responseTime: Date.now() - startTime,
          error: error.message
        };
      }
    }
  }

  async testProvider(providerName) {
    console.log(`\n${colors.cyan}${colors.bright}Testing Provider: ${providerName}${colors.reset}`);
    
    try {
      // Load the built provider module
      const providerPath = path.join(DIST_DIR, providerName, 'index.js');
      
      if (!fs.existsSync(providerPath)) {
        console.log(`${colors.yellow}⚠ Provider not built yet. Run 'npm run build' first.${colors.reset}`);
        return;
      }

      // Delete require cache to get fresh module
      delete require.cache[require.resolve(providerPath)];
      const provider = require(providerPath);
      
      if (!provider.default || !provider.default.GetStream) {
        console.log(`${colors.yellow}⚠ No GetStream method found${colors.reset}`);
        return;
      }

      // Create mock context
      const providerContext = {
        axios: axios,
        cheerio: require('cheerio'),
        getBaseUrl: async (value) => {
          // Try to fetch base URL from modflix.json
          try {
            const response = await axios.get('https://himanshu8443.github.io/providers/modflix.json');
            return response.data[value]?.url || '';
          } catch {
            return '';
          }
        },
        commonHeaders: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        Aes: null
      };

      // Get a sample link to test (we'll need to search first)
      const streamLink = await this.getTestLink(provider.default, providerContext, providerName);
      
      if (!streamLink) {
        console.log(`${colors.yellow}⚠ No test link available${colors.reset}`);
        return;
      }

      console.log(`  Testing link: ${streamLink.substring(0, 80)}...`);

      // Get streams
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const streams = await provider.default.GetStream({
        link: streamLink,
        type: 'movie',
        signal: controller.signal,
        providerContext
      });
      
      clearTimeout(timeoutId);

      if (!streams || streams.length === 0) {
        console.log(`${colors.yellow}  ⚠ No streams returned${colors.reset}`);
        return;
      }

      console.log(`  Found ${streams.length} streams, validating...`);

      // Validate each stream
      this.results.providers[providerName] = {
        total: streams.length,
        working: 0,
        failed: 0,
        streams: []
      };

      for (const stream of streams) {
        this.results.total++;
        
        const validation = await this.validateUrl(stream.link, stream.headers);
        
        const streamResult = {
          server: stream.server,
          link: stream.link.substring(0, 100) + (stream.link.length > 100 ? '...' : ''),
          type: stream.type,
          ...validation
        };

        this.results.providers[providerName].streams.push(streamResult);

        if (validation.isValid) {
          this.results.working++;
          this.results.providers[providerName].working++;
          console.log(`${colors.green}  ✓ ${stream.server} (${validation.responseTime}ms)${colors.reset}`);
        } else {
          this.results.failed++;
          this.results.providers[providerName].failed++;
          console.log(`${colors.red}  ✗ ${stream.server} - ${validation.error || `HTTP ${validation.statusCode}`}${colors.reset}`);
        }
      }

    } catch (error) {
      console.log(`${colors.red}✗ Error testing ${providerName}: ${error.message}${colors.reset}`);
    }
  }

  async getTestLink(provider, providerContext, providerName) {
    try {
      // Try to search for a popular movie
      if (provider.GetSearchPosts) {
        const controller = new AbortController();
        const results = await provider.GetSearchPosts({
          searchQuery: 'inception',
          page: 1,
          providerValue: providerName,
          signal: controller.signal,
          providerContext
        });
        
        if (results && results.length > 0) {
          // Get metadata to find stream link
          if (provider.GetMetaData) {
            const meta = await provider.GetMetaData({
              link: results[0].link,
              provider: providerName,
              providerContext
            });
            
            if (meta && meta.linkList && meta.linkList.length > 0) {
              const link = meta.linkList[0];
              if (link.directLinks && link.directLinks.length > 0) {
                return link.directLinks[0].link;
              } else if (link.episodesLink) {
                // Get episode links
                if (provider.GetEpisodeLinks) {
                  const episodes = await provider.GetEpisodeLinks({
                    url: link.episodesLink,
                    providerContext
                  });
                  if (episodes && episodes.length > 0) {
                    return episodes[0].link;
                  }
                }
              }
            }
          }
          
          // Return first search result link if no metadata
          return results[0].link;
        }
      }
      
      // Try home posts
      if (provider.GetHomePosts) {
        const controller = new AbortController();
        const results = await provider.GetHomePosts({
          filter: provider.catalog?.[0]?.filter || '',
          page: 1,
          providerValue: providerName,
          signal: controller.signal,
          providerContext
        });
        
        if (results && results.length > 0) {
          return results[0].link;
        }
      }
    } catch (error) {
      console.log(`  ${colors.yellow}Could not get test link: ${error.message}${colors.reset}`);
    }
    
    return null;
  }

  printSummary() {
    console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}STREAM VALIDATION SUMMARY${colors.reset}`);
    console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
    
    console.log(`\n${colors.cyan}Total Links Tested: ${this.results.total}${colors.reset}`);
    console.log(`${colors.green}Working: ${this.results.working}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.results.failed}${colors.reset}`);
    
    if (this.results.total > 0) {
      const successRate = ((this.results.working / this.results.total) * 100).toFixed(1);
      console.log(`${colors.yellow}Success Rate: ${successRate}%${colors.reset}`);
    }

    // Per-provider breakdown
    console.log(`\n${colors.bright}Provider Breakdown:${colors.reset}`);
    for (const [provider, data] of Object.entries(this.results.providers)) {
      const successRate = data.total > 0 ? ((data.working / data.total) * 100).toFixed(1) : 0;
      const color = successRate > 70 ? colors.green : successRate > 30 ? colors.yellow : colors.red;
      console.log(`  ${color}${provider}: ${data.working}/${data.total} working (${successRate}%)${colors.reset}`);
    }

    // Save detailed results
    const reportPath = path.join(__dirname, 'stream-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n${colors.cyan}📄 Detailed report saved to: ${reportPath}${colors.reset}`);
  }

  async run() {
    console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}STREAM LINK VALIDATOR${colors.reset}`);
    console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);

    // Get all provider directories
    const providerDirs = fs.readdirSync(PROVIDERS_DIR, { withFileTypes: true })
      .filter(item => item.isDirectory() && !['extractors'].includes(item.name))
      .map(item => item.name);

    console.log(`\nFound ${providerDirs.length} providers to test`);
    
    // Test each provider
    for (const provider of providerDirs.slice(0, 5)) { // Test first 5 for demo
      await this.testProvider(provider);
    }

    this.printSummary();
  }
}

// Run if executed directly
if (require.main === module) {
  const validator = new StreamValidator();
  validator.run().catch(console.error);
}

module.exports = StreamValidator;
