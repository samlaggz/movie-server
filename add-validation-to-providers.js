#!/usr/bin/env node
/**
 * Bulk update script to add stream validation to all providers
 * Usage: node add-validation-to-providers.js
 * 
 * This script will:
 * 1. Find all providers with stream.ts files
 * 2. Add validation import and logic
 * 3. Show you what changes were made
 */

const fs = require('fs');
const path = require('path');

const PROVIDERS_DIR = path.join(__dirname, 'providers');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function findStreamFiles() {
  const providers = fs.readdirSync(PROVIDERS_DIR, { withFileTypes: true })
    .filter(item => item.isDirectory() && !['extractors', 'types.ts', 'getBaseUrl.ts', 'streamValidator.ts', 'streamValidatorWrapper.ts'].includes(item.name))
    .map(item => item.name);

  const streamFiles = [];
  
  for (const provider of providers) {
    const streamPath = path.join(PROVIDERS_DIR, provider, 'stream.ts');
    if (fs.existsSync(streamPath)) {
      streamFiles.push({
        provider,
        path: streamPath,
        content: fs.readFileSync(streamPath, 'utf8')
      });
    }
  }
  
  return streamFiles;
}

function needsValidation(content) {
  return !content.includes('validateStreams') && 
         !content.includes('streamValidator');
}

function addValidationToProvider(fileInfo) {
  let { content } = fileInfo;
  let modified = false;
  
  // Check if already has validation
  if (!needsValidation(content)) {
    return { modified: false, message: 'Already has validation' };
  }
  
  // Add import statement after the first import
  if (!content.includes('import { validateStreams }')) {
    // Find the last import statement
    const importMatch = content.match(/^(import .* from .*;)$/gm);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      content = content.replace(
        lastImport,
        `${lastImport}\nimport { validateStreams } from "../streamValidator";`
      );
      modified = true;
    }
  }
  
  // Find return statements with streams and add validation
  // Pattern 1: return streamLinks;
  if (content.includes('return streamLinks;') && !content.includes('validateStreams(streamLinks')) {
    content = content.replace(
      /return streamLinks;/g,
      `// Validate all stream links before returning
    const validStreams = await validateStreams(streamLinks, {
      timeout: 10000,
      maxConcurrent: 3,
    });
    return validStreams;`
    );
    modified = true;
  }
  
  // Pattern 2: return stream;
  if (content.includes('return stream;') && !content.includes('validateStreams(stream')) {
    content = content.replace(
      /return stream;$/gm,
      `// Validate all stream links before returning
    const validStreams = await validateStreams(stream, {
      timeout: 10000,
      maxConcurrent: 3,
    });
    return validStreams;`
    );
    modified = true;
  }
  
  // Pattern 3: return streams;
  if (content.includes('return streams;') && !content.includes('validateStreams(streams')) {
    content = content.replace(
      /return streams;$/gm,
      `// Validate all stream links before returning
    const validStreams = await validateStreams(streams, {
      timeout: 10000,
      maxConcurrent: 3,
    });
    return validStreams;`
    );
    modified = true;
  }
  
  // Pattern 4: return Streams; (autoEmbed style)
  if (content.includes('return Streams;') && !content.includes('validateStreams(Streams')) {
    content = content.replace(
      /return Streams;$/gm,
      `// Validate all stream links before returning
    const validStreams = await validateStreams(Streams, {
      timeout: 10000,
      maxConcurrent: 3,
    });
    return validStreams;`
    );
    modified = true;
  }
  
  // Pattern 5: return streamLinks.slice(...);
  if (content.match(/return streamLinks\.slice/) && !content.includes('validateStreams')) {
    content = content.replace(
      /return (streamLinks\.slice\([^)]+\));/,
      `// Validate all stream links before returning
    const validStreams = await validateStreams($1, {
      timeout: 10000,
      maxConcurrent: 3,
    });
    return validStreams;`
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(fileInfo.path, content, 'utf8');
    return { modified: true, message: 'Added validation' };
  }
  
  return { modified: false, message: 'No matching patterns found - manual update needed' };
}

function main() {
  console.log(`${colors.blue}🔍 Finding all provider stream files...${colors.reset}\n`);
  
  const streamFiles = findStreamFiles();
  console.log(`Found ${streamFiles.length} providers with stream.ts files\n`);
  
  let updated = 0;
  let skipped = 0;
  let manual = 0;
  
  for (const fileInfo of streamFiles) {
    const result = addValidationToProvider(fileInfo);
    
    if (result.modified) {
      console.log(`${colors.green}✓${colors.reset} ${fileInfo.provider}: ${result.message}`);
      updated++;
    } else if (result.message === 'Already has validation') {
      console.log(`${colors.yellow}○${colors.reset} ${fileInfo.provider}: ${result.message}`);
      skipped++;
    } else {
      console.log(`${colors.red}✗${colors.reset} ${fileInfo.provider}: ${result.message}`);
      manual++;
    }
  }
  
  console.log(`\n${colors.blue}Summary:${colors.reset}`);
  console.log(`  ${colors.green}Updated: ${updated}${colors.reset}`);
  console.log(`  ${colors.yellow}Skipped (already has validation): ${skipped}${colors.reset}`);
  console.log(`  ${colors.red}Needs manual update: ${manual}${colors.reset}`);
  
  if (manual > 0) {
    console.log(`\n${colors.yellow}For providers that need manual updates, see examples in:${colors.reset}`);
    console.log(`  - providers/showbox/stream.ts`);
    console.log(`  - providers/flixhq/stream.ts`);
    console.log(`  - providers/autoEmbed/stream.ts`);
    console.log(`  - providers/vega/stream.ts`);
  }
}

main();
