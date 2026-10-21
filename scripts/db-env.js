#!/usr/bin/env node
/**
 * db-env.js
 * Automatically bridges hosted database environment variables (Vercel Postgres, Neon, Supabase)
 * to standard DATABASE_URL and DIRECT_URL required by Prisma CLI (generate, push, migrate).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const env = { ...process.env };
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!env[key]) env[key] = val;
    }
  }
}

// 1. Resolve runtime/query URL (DATABASE_URL)
if (!env.DATABASE_URL) {
  env.DATABASE_URL =
    env.POSTGRES_PRISMA_URL ||
    env.PRISMA_DATABASE_URL ||
    env.POSTGRES_URL ||
    env.PREONE_PG_URL ||
    'postgresql://postgres:postgres@127.0.0.1:5432/preone';
}

// 2. Resolve direct/migration URL (DIRECT_URL)
if (!env.DIRECT_URL) {
  env.DIRECT_URL =
    env.POSTGRES_URL_NON_POOLING ||
    env.POSTGRES_URL ||
    env.DATABASE_URL;
}

// 3. Resolve command to execute
const args = process.argv.slice(2);
let command;

if (args.length === 0) {
  command = 'generate';
} else {
  command = args.join(' ');
}

// If command starts with "prisma", resolve local prisma binary path for cross-platform support
const localPrismaBin = path.resolve(
  __dirname,
  '../node_modules/.bin/prisma' + (process.platform === 'win32' ? '.cmd' : '')
);

let fullCommand;
if (fs.existsSync(localPrismaBin)) {
  const cleanCmd = command.startsWith('prisma ') ? command.slice(7) : (command === 'prisma' ? 'generate' : command);
  fullCommand = `"${localPrismaBin}" ${cleanCmd}`;
} else {
  fullCommand = command.startsWith('prisma ') || command === 'prisma' ? `npx ${command}` : `npx prisma ${command}`;
}

try {
  execSync(fullCommand, { stdio: 'inherit', env });
} catch (error) {
  process.exit(error.status || 1);
}
