#!/bin/bash
set -e

DIR="/mnt/c/Users/Ruchira Daware/Documents/GitHub/PreOne/pre1"
cd "$DIR"

# Source nvm/node/bun if available
export PATH=$PATH:/usr/local/bin:~/.nvm/versions/node/$(ls ~/.nvm/versions/node 2>/dev/null | tail -1)/bin:~/.bun/bin:~/.nvm/versions/node/v20.18.0/bin

echo "Running prisma db push..."
DATABASE_URL="postgresql://preone:preone@127.0.0.1:54329/preone" npx prisma db push --accept-data-loss

echo "Running prisma db seed..."
DATABASE_URL="postgresql://preone:preone@127.0.0.1:54329/preone" npx tsx scripts/seed.ts

echo "Database initialized & seeded successfully!"
