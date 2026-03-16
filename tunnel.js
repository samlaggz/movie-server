#!/usr/bin/env node
/**
 * Simple Cloudflare Tunnel
 * Usage: npm run tunnel
 * 
 * This runs: cloudflared tunnel --url http://localhost:3001
 */

const { spawn } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

console.log(`${colors.bright}\n🚀 Starting Cloudflare Tunnel...${colors.reset}\n`);
console.log(`${colors.cyan}Running: cloudflared tunnel --url http://localhost:3001${colors.reset}\n`);

const tunnel = spawn('cloudflared', [
  'tunnel',
  '--url',
  'http://localhost:3001'
], {
  stdio: 'inherit'
});

tunnel.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.log(`${colors.red}\n❌ cloudflared is not installed!${colors.reset}`);
    console.log(`${colors.yellow}\nDownload from: https://github.com/cloudflare/cloudflared/releases${colors.reset}\n`);
  } else {
    console.log(`${colors.red}\n❌ Error: ${err.message}${colors.reset}\n`);
  }
  process.exit(1);
});

tunnel.on('exit', (code) => {
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}🛑 Stopping tunnel...${colors.reset}`);
  tunnel.kill('SIGINT');
});
