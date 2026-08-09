#!/usr/bin/env node

/**
 * Rollback Script for Modern Layout Migration
 * Run this to restore original files if needed
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(process.cwd(), 'src', 'app');

const MIGRATED_PAGES = [
  'invoices/page.tsx',
  'orders/page.tsx',
  'products/page.tsx',
  'parties/page.tsx',
  'purchases/page.tsx',
  'inventory/page.tsx',
  'reports/page.tsx',
  'settings/page.tsx'
];

console.log('🔄 Rolling back modern layout migration...');

let restoredCount = 0;

MIGRATED_PAGES.forEach(pagePath => {
  const originalPath = path.join(APP_DIR, pagePath);
  const backupPath = originalPath + '.backup';
  
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, originalPath);
    console.log(`✅ Restored: ${pagePath}`);
    restoredCount++;
  } else {
    console.log(`⚠️  No backup found for: ${pagePath}`);
  }
});

console.log(`\n🎉 Rollback complete! Restored ${restoredCount} files.`);
console.log('You can now remove .backup files if desired.');
