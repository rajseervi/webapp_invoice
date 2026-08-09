#!/usr/bin/env node

/**
 * Rollback Modern Layout Migration
 * 
 * This script restores all pages to their original state.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const APP_DIR = path.join(PROJECT_ROOT, 'src', 'app');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'original-pages-backup');

const MIGRATED_PAGES = [
  'invoices/page.tsx',
  'orders/page.tsx',
  'products/page.tsx',
  'parties/page.tsx',
  'purchases/page.tsx',
  'inventory/page.tsx',
  'categories/page.tsx',
  'reports/page.tsx',
  'invoices/new/page.tsx',
  'invoices/gst/page.tsx',
  'invoices/regular/page.tsx',
  'orders/new/page.tsx',
  'products/new/page.tsx',
  'products/management/page.tsx',
  'parties/new/page.tsx',
  'purchases/new/page.tsx',
  'reports/sales/page.tsx',
  'reports/products/page.tsx',
  'reports/profit-loss/page.tsx',
  'reports/users/page.tsx',
  'settings/page.tsx',
  'backup/page.tsx',
  'help-desk/page.tsx',
  'profile/page.tsx',
  'ledger/page.tsx',
  'accounting/page.tsx',
  'stock-management/page.tsx',
  'inventory/alerts/page.tsx'
];

console.log('🔄 Rolling back modern layout migration...');

let restoredCount = 0;
let errorCount = 0;

MIGRATED_PAGES.forEach(pagePath => {
  const currentPath = path.join(APP_DIR, pagePath);
  const backupPath = path.join(BACKUP_DIR, pagePath);
  const originalPagePath = path.join(path.dirname(currentPath), 'original-page.tsx');
  
  try {
    if (fs.existsSync(backupPath)) {
      // Restore original file
      fs.copyFileSync(backupPath, currentPath);
      
      // Remove original-page.tsx if it exists
      if (fs.existsSync(originalPagePath)) {
        fs.unlinkSync(originalPagePath);
      }
      
      console.log(`✅ Restored: ${pagePath}`);
      restoredCount++;
    } else {
      console.log(`⚠️  No backup found for: ${pagePath}`);
    }
  } catch (error) {
    console.log(`❌ Error restoring ${pagePath}: ${error.message}`);
    errorCount++;
  }
});

console.log(`\n📊 Rollback Summary:`);
console.log(`✅ Restored: ${restoredCount} files`);
console.log(`❌ Errors: ${errorCount} files`);

if (errorCount === 0) {
  console.log('\n🎉 Rollback completed successfully!');
  console.log('All pages have been restored to their original state.');
} else {
  console.log('\n⚠️  Rollback completed with some errors.');
  console.log('Please check the error messages above.');
}
