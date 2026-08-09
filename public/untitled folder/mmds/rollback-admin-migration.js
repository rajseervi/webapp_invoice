#!/usr/bin/env node

/**
 * Rollback Admin Pages Migration
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const APP_DIR = path.join(PROJECT_ROOT, 'src', 'app');
const ADMIN_BACKUP_DIR = path.join(PROJECT_ROOT, 'admin-pages-backup');

const ADMIN_PAGES = [
  'admin/page.tsx',
  'admin/dashboard/page.tsx',
  'admin/users/page.tsx',
  'admin/roles/page.tsx',
  'admin/roles/assign/page.tsx',
  'admin/permissions/page.tsx'
];

console.log('🔄 Rolling back admin pages migration...');

let restoredCount = 0;
let errorCount = 0;

ADMIN_PAGES.forEach(pagePath => {
  const currentPath = path.join(APP_DIR, pagePath);
  const backupPath = path.join(ADMIN_BACKUP_DIR, pagePath);
  
  try {
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, currentPath);
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

console.log(`\n📊 Admin Rollback Summary:`);
console.log(`✅ Restored: ${restoredCount} files`);
console.log(`❌ Errors: ${errorCount} files`);

if (errorCount === 0) {
  console.log('\n🎉 Admin pages rollback completed successfully!');
} else {
  console.log('\n⚠️  Rollback completed with some errors.');
}
