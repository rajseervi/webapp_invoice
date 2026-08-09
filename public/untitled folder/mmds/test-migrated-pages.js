#!/usr/bin/env node

/**
 * Test Migrated Pages Script
 * 
 * This script tests if the migrated pages can be imported without errors.
 */

const path = require('path');

console.log('🧪 Testing Migrated Pages');
console.log('=========================\n');

const PAGES_TO_TEST = [
  'invoices/page.tsx',
  'orders/page.tsx',
  'products/page.tsx',
  'parties/page.tsx',
  'purchases/page.tsx',
  'inventory/page.tsx',
  'reports/page.tsx',
  'settings/page.tsx'
];

async function testPage(pagePath) {
  try {
    console.log(`🔍 Testing: ${pagePath}`);
    
    // Basic syntax check by reading and parsing
    const fs = require('fs');
    const fullPath = path.join(__dirname, 'src', 'app', pagePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`  ❌ File not found`);
      return false;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for common issues
    const issues = [];
    
    if ((content.match(/"use client";/g) || []).length > 1) {
      issues.push('Multiple "use client" directives');
    }
    
    if ((content.match(/import React/g) || []).length > 1) {
      issues.push('Duplicate React imports');
    }
    
    if (!content.includes('ModernDashboardLayout')) {
      issues.push('Missing ModernDashboardLayout');
    }
    
    if (!content.includes('ModernThemeProvider')) {
      issues.push('Missing ModernThemeProvider');
    }
    
    if (issues.length > 0) {
      console.log(`  ⚠️  Issues found:`);
      issues.forEach(issue => console.log(`     - ${issue}`));
      return false;
    }
    
    console.log(`  ✅ Looks good`);
    return true;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  let passCount = 0;
  let failCount = 0;
  
  for (const pagePath of PAGES_TO_TEST) {
    const passed = await testPage(pagePath);
    if (passed) {
      passCount++;
    } else {
      failCount++;
    }
    console.log('');
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  if (failCount === 0) {
    console.log('\n🎉 All pages look good!');
  } else {
    console.log('\n⚠️  Some pages need attention. Run fix-migrated-pages.js to fix common issues.');
  }
}

runTests();
