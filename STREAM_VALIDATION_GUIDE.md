# Stream Link Validation Guide

This guide explains how to validate streaming links and filter out non-working ones before sending them to your app.

## Quick Start

### 1. Test a Specific URL
```bash
npm run test:url "https://example.com/stream.m3u8"
```

### 2. Test All Providers
```bash
npm run test:streams
```

## Integration Options

### Option A: Validate in Individual Provider (Recommended)

Add validation to any provider's `stream.ts`:

```typescript
import { Stream, ProviderContext } from "../types";
import { validateStreams } from "../streamValidator";

export const getStream = async function ({ link, type, signal, providerContext }) {
  try {
    // ... your existing code to fetch streams ...
    const streams: Stream[] = [];
    
    // Fetch your streams...
    
    // Validate before returning
    const validStreams = await validateStreams(streams, {
      timeout: 10000,      // 10 second timeout per link
      maxConcurrent: 3,    // Check 3 links at a time
    });

    return validStreams;
  } catch (err) {
    return [];
  }
};
```

**Example added to:** `providers/showbox/stream.ts`

### Option B: Wrapper Approach (Validate All Providers)

Use the wrapper to add validation without modifying each provider:

```typescript
import { withStreamValidation } from "./streamValidatorWrapper";
import { getStream } from "./stream";

export default {
  // ... your provider config ...
  GetStream: withStreamValidation(getStream, { 
    timeout: 10000,
    enableLogging: true 
  })
};
```

### Option C: App-Level Validation

Validate streams in your main app before displaying:

```typescript
import { filterValidStreams } from "./streamValidatorWrapper";

// After getting streams from provider
const allStreams = await provider.GetStream({...});

// Filter out dead links
const workingStreams = await filterValidStreams(allStreams, {
  timeout: 10000,
  maxConcurrent: 5
});

// Show only working streams to user
displayStreams(workingStreams);
```

## How Validation Works

1. **HEAD Request**: First tries a HEAD request (fast, doesn't download content)
2. **Fallback to GET**: If HEAD fails, tries GET request
3. **Status Check**: Considers 2xx status codes as valid
4. **Timeout**: Respects timeout setting (default 10 seconds)
5. **Concurrent**: Processes multiple links in parallel (configurable)

## Configuration Options

```typescript
{
  timeout: 10000,        // Timeout per link (ms)
  maxConcurrent: 5,      // Parallel validations
  enableLogging: true,   // Log results to console
  validStatusCodes: [200, 206], // Custom valid codes
}
```

## Common Issues & Solutions

### Issue: Links fail validation but work in browser
**Solution**: The stream might require specific headers (Referer, User-Agent)
```typescript
const validStreams = await validateStreams(streams, {
  timeout: 15000  // Increase timeout
});
// The validator automatically uses stream.headers if provided
```

### Issue: Validation too slow
**Solution**: Reduce concurrent checks or timeout
```typescript
const validStreams = await validateStreams(streams, {
  timeout: 5000,      // 5 seconds
  maxConcurrent: 10   // Check more at once
});
```

### Issue: Valid links being filtered out
**Solution**: Check what status codes are being returned
```typescript
// In your stream.ts, log the validation results
const { validateStreamsWithReport } = require("./streamValidatorWrapper");
const { validStreams, invalidStreams, report } = await validateStreamsWithReport(streams);

console.log("Failed streams:", invalidStreams);
```

## Where Links Come From

Your streaming links are fetched from multiple sources:

1. **Base URLs**: `https://himanshu8443.github.io/providers/modflix.json`
   - Contains working domains for each provider
   - Updates when sites change domains

2. **Provider Sources** (40+ providers):
   - ShowBox: `febbox.vercel.app`
   - AutoEmbed: `webstreamr.hayd.uk`
   - KissKh: Netlify proxy
   - GuardaHD: `guardahd.stream`
   - MoviesApi: Various sources
   - And many more...

3. **Link Types**:
   - Direct MP4/MKV files
   - M3U8 playlists (HLS)
   - Embedded players
   - Redirect services (HubCloud, etc.)

## Testing Tools

### 1. Quick URL Test
```bash
node test-url.js "https://your-stream-url.m3u8"
```

### 2. Full Provider Test
```bash
npm run test:streams
```

### 3. Detailed Report
```typescript
const { validateStreamsWithReport } = require("./providers/streamValidatorWrapper");
const result = await validateStreamsWithReport(streams);
console.log(result.report);
// {
//   total: 10,
//   valid: 7,
//   invalid: 3,
//   successRate: "70.0%",
//   averageResponseTime: 2450
// }
```

## Files Created

1. **`providers/streamValidator.ts`** - Core validation logic
2. **`providers/streamValidatorWrapper.ts`** - Wrapper utilities
3. **`test-url.js`** - Quick single URL test
4. **`test-streams.js`** - Full provider testing
5. **Updated `providers/showbox/stream.ts`** - Example integration

## Next Steps

1. ✅ Run `npm run test:url` with a few known working URLs to verify
2. ✅ Add validation to your most-used providers
3. ✅ Run `npm run test:streams` to identify broken providers
4. ✅ Update broken providers or remove them from manifest

## Performance Tips

- **Don't validate on every request**: Cache validation results for 5-10 minutes
- **Parallel validation**: Use `maxConcurrent` to speed up validation
- **Smart timeouts**: Use shorter timeouts (5s) for fast checks, longer (15s) for thorough validation
- **Partial validation**: For many links, validate only the first 3-5 to save time

## Troubleshooting

### "Cannot find module '../streamValidator'"
Make sure you've built the project:
```bash
npm run build
```

### Validation always fails
Check if the links require authentication or special headers:
```typescript
// In your stream.ts, ensure headers are passed
stream.push({
  server: "MyServer",
  link: url,
  type: "m3u8",
  headers: {
    "Referer": "https://required-referer.com",
    "User-Agent": "Specific-User-Agent"
  }
});
```

### Memory issues with many links
Process in smaller batches:
```typescript
const batchSize = 5;
for (let i = 0; i < streams.length; i += batchSize) {
  const batch = streams.slice(i, i + batchSize);
  const validBatch = await validateStreams(batch);
  allValidStreams.push(...validBatch);
}
```
