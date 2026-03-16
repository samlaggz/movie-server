import { Stream } from "./types";

export interface ValidationResult {
  stream: Stream;
  isValid: boolean;
  statusCode?: number;
  error?: string;
  responseTime?: number;
}

/**
 * Validates if a stream URL is accessible
 * Uses HEAD request for efficiency, falls back to GET if needed
 */
export async function validateStreamUrl(
  stream: Stream,
  timeout: number = 10000
): Promise<ValidationResult> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Prepare headers if the stream requires them
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...(stream.headers || {})
    };

    // Try HEAD request first (faster, doesn't download content)
    let response: Response;
    try {
      response = await fetch(stream.link, {
        method: 'HEAD',
        headers,
        signal: controller.signal,
      });
    } catch (headError) {
      // If HEAD fails, try GET request
      clearTimeout(timeoutId);
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), timeout);
      
      try {
        response = await fetch(stream.link, {
          method: 'GET',
          headers,
          signal: controller2.signal,
        });
        clearTimeout(timeoutId2);
      } catch (getError) {
        clearTimeout(timeoutId2);
        throw getError;
      }
    }
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    // Check if response is successful (2xx status)
    const isValid = response.ok;
    
    return {
      stream,
      isValid,
      statusCode: response.status,
      responseTime,
    };
  } catch (error) {
    return {
      stream,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Validates multiple streams in parallel
 * Returns only the valid streams
 */
export async function validateStreams(
  streams: Stream[],
  options: {
    timeout?: number;
    maxConcurrent?: number;
    filterByStatus?: number[]; // Specific status codes to consider valid (default: 2xx)
  } = {}
): Promise<Stream[]> {
  const { 
    timeout = 10000, 
    maxConcurrent = 5,
    filterByStatus 
  } = options;
  
  if (!streams || streams.length === 0) {
    return [];
  }

  console.log(`🔍 Validating ${streams.length} stream links...`);
  
  const results: ValidationResult[] = [];
  
  // Process in batches to avoid overwhelming the network
  for (let i = 0; i < streams.length; i += maxConcurrent) {
    const batch = streams.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(stream => validateStreamUrl(stream, timeout));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + maxConcurrent < streams.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Log results
  const validCount = results.filter(r => r.isValid).length;
  const invalidCount = results.length - validCount;
  
  console.log(`✅ ${validCount} valid, ❌ ${invalidCount} invalid streams`);
  
  // Log failed streams for debugging
  results
    .filter(r => !r.isValid)
    .forEach(r => {
      console.log(`❌ Failed: ${r.stream.server} - ${r.error || `HTTP ${r.statusCode}`}`);
    });
  
  // Filter and return only valid streams
  return results
    .filter(result => {
      if (filterByStatus && result.statusCode) {
        return filterByStatus.includes(result.statusCode);
      }
      return result.isValid;
    })
    .map(result => result.stream);
}

/**
 * Quick check - validates a single URL
 */
export async function isStreamWorking(
  url: string, 
  headers?: Record<string, string>,
  timeout: number = 5000
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...headers
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
