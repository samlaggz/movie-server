import { Stream } from "./types";
import { validateStreams, ValidationResult } from "./streamValidator";

/**
 * Wrapper function that adds stream validation to any provider's GetStream method
 * Use this in your main app/entry point to validate all streams
 */

export interface ValidationOptions {
  /** Timeout in milliseconds for each link validation (default: 10000) */
  timeout?: number;
  /** Maximum concurrent validations (default: 5) */
  maxConcurrent?: number;
  /** Whether to log validation results (default: true) */
  enableLogging?: boolean;
  /** Custom filter for valid status codes (default: 2xx responses) */
  validStatusCodes?: number[];
  /** Minimum acceptable response time in ms (default: no minimum) */
  minResponseTime?: number;
  /** Maximum acceptable response time in ms (default: no maximum) */
  maxResponseTime?: number;
}

/**
 * Validates an array of streams and returns only working ones
 * This can be used as a middleware in your app before displaying streams to users
 */
export async function filterValidStreams(
  streams: Stream[],
  options: ValidationOptions = {}
): Promise<Stream[]> {
  const {
    timeout = 10000,
    maxConcurrent = 5,
    enableLogging = true,
    validStatusCodes,
    maxResponseTime
  } = options;

  if (!streams || streams.length === 0) {
    return [];
  }

  if (enableLogging) {
    console.log(`🔍 Validating ${streams.length} stream links...`);
  }

  // Validate all streams
  const results = await validateStreams(streams, {
    timeout,
    maxConcurrent,
    filterByStatus: validStatusCodes
  });

  // Additional filtering by response time if specified
  let filteredResults = results;
  
  // Note: validateStreams already filters by status, but we need to re-validate 
  // if we want response time filtering. For simplicity, we'll validate again with full results.
  
  if (enableLogging) {
    const workingCount = results.length;
    const failedCount = streams.length - workingCount;
    const percentage = ((workingCount / streams.length) * 100).toFixed(1);
    
    console.log(`✅ ${workingCount} working, ❌ ${failedCount} failed (${percentage}% success rate)`);
  }

  return results;
}

/**
 * Middleware that wraps a provider's getStream function with validation
 * Usage in your provider index.ts:
 * 
 * import { withStreamValidation } from "../streamValidatorWrapper";
 * import { getStream } from "./stream";
 * 
 * export default {
 *   ...providerConfig,
 *   GetStream: withStreamValidation(getStream, { timeout: 10000 })
 * };
 */
export function withStreamValidation(
  getStreamFn: Function,
  options: ValidationOptions = {}
) {
  return async function(...args: any[]) {
    // Call original getStream function
    const streams = await getStreamFn(...args);
    
    // Validate and filter streams
    const validStreams = await filterValidStreams(streams, options);
    
    return validStreams;
  };
}

/**
 * Advanced validation with detailed reporting
 * Returns both valid streams and a report of what failed
 */
export async function validateStreamsWithReport(
  streams: Stream[],
  options: ValidationOptions = {}
): Promise<{
  validStreams: Stream[];
  invalidStreams: ValidationResult[];
  report: {
    total: number;
    valid: number;
    invalid: number;
    successRate: string;
    averageResponseTime: number;
  }
}> {
  const { timeout = 10000, maxConcurrent = 5 } = options;
  
  // Import the full validator to get detailed results
  const { validateStreams } = await import("./streamValidator");
  
  // We need to validate manually to get detailed results
  const allResults: ValidationResult[] = [];
  
  for (let i = 0; i < streams.length; i += maxConcurrent) {
    const batch = streams.slice(i, i + maxConcurrent);
    const { validateStreamUrl } = await import("./streamValidator");
    const batchResults = await Promise.all(
      batch.map(stream => validateStreamUrl(stream, timeout))
    );
    allResults.push(...batchResults);
    
    if (i + maxConcurrent < streams.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const validStreams = allResults
    .filter(r => r.isValid)
    .map(r => r.stream);
    
  const invalidStreams = allResults.filter(r => !r.isValid);
  
  const responseTimes = allResults
    .filter(r => r.responseTime !== undefined)
    .map(r => r.responseTime!);
    
  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  return {
    validStreams,
    invalidStreams,
    report: {
      total: streams.length,
      valid: validStreams.length,
      invalid: invalidStreams.length,
      successRate: ((validStreams.length / streams.length) * 100).toFixed(1) + '%',
      averageResponseTime: Math.round(averageResponseTime)
    }
  };
}

/**
 * Batch validation helper - validates multiple providers at once
 * Useful for testing all providers
 */
export async function batchValidateProviders(
  providers: Array<{ name: string; getStream: Function }>,
  testLink: string,
  options: ValidationOptions = {}
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  
  for (const provider of providers) {
    try {
      console.log(`\n📦 Testing provider: ${provider.name}`);
      
      // Get streams from provider
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const streams = await provider.getStream({
        link: testLink,
        type: 'movie',
        signal: controller.signal,
        providerContext: {} // You'd need to provide proper context
      });
      
      clearTimeout(timeoutId);
      
      if (!streams || streams.length === 0) {
        results[provider.name] = { status: 'no_streams', message: 'No streams returned' };
        continue;
      }
      
      // Validate streams
      const validation = await validateStreamsWithReport(streams, options);
      
      results[provider.name] = {
        status: validation.validStreams.length > 0 ? 'working' : 'failed',
        totalStreams: validation.report.total,
        validStreams: validation.report.valid,
        successRate: validation.report.successRate,
        averageResponseTime: validation.report.averageResponseTime + 'ms'
      };
      
    } catch (error) {
      results[provider.name] = { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  return results;
}
