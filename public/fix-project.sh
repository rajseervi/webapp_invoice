#!/bin/bash

# Fix Next.js project structure issues

# Remove the .next directory to force a clean build
echo "Removing .next directory..."
rm -rf .next

# Clear any cached modules
echo "Clearing node_modules/.cache..."
rm -rf node_modules/.cache

# Make sure we're using the correct Next.js configuration
echo "Checking Next.js configuration..."
if [ -f "next.config.ts" ]; then
  echo "Converting next.config.ts to next.config.js..."
  mv next.config.ts next.config.js
fi

# Make sure we don't have conflicting React files
echo "Checking for conflicting React files..."
if [ -f "src/index.js" ]; then
  echo "Moving src/index.js to backup..."
  mkdir -p src/backup
  mv src/index.js src/backup/
fi

if [ -f "src/App.js" ]; then
  echo "Moving src/App.js to backup..."
  mkdir -p src/backup
  mv src/App.js src/backup/
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Done
echo "Project structure fixed! Try running 'npm run dev' now."