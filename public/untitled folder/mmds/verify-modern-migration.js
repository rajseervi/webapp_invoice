#!/usr/bin/env node

/**
 * Verify Modern Migration Script
 * 
 * This script verifies that all pages have been successfully migrated
 * and checks for common issues.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Modern Layout Migration');
console.log('====================================\n');

const PROJECT_ROOT = process.cwd();
const APP_DIR = path.join(PROJECT_ROOT, 'src', 'app');

// Read migration summary
let migrationSummary;
try {
  migrationSummary = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'migration-summary.json'), 'utf8'));
} catch (error) {
  console.log('❌ Could not read migration summary. Run the migration first.');
  process.exit(1);
}

console.log(`📊 Migration Summary:`);
console.log(`   Total pages: ${migrationSummary.totalPages}`);
console.log(`   Successful: ${migrationSummary.successful}`);
console.log(`   Already modern: ${migrationSummary.alreadyModern}`);
console.log(`   Failed: ${migrationSummary.failed}\n`);

// Verification functions
function verifyPageStructure(pagePath) {
  const fullPath = path.join(APP_DIR, pagePath);
  
  if (!fs.existsSync(fullPath)) {
    return { valid: false, issues: ['File does not exist'] };
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const issues = [];
    
    // Check for required imports
    if (!content.includes('ModernDashboardLayout')) {
      issues.push('Missing ModernDashboardLayout import');
    }
    
    if (!content.includes('ModernThemeProvider')) {
      issues.push('Missing ModernThemeProvider import');
    }
    
    // Check for "use client" directive
    if (!content.includes('"use client"')) {
      issues.push('Missing "use client" directive');
    }
    
    // Check for duplicate "use client"
    const useClientCount = (content.match(/"use client";/g) || []).length;
    if (useClientCount > 1) {
      issues.push(`Multiple "use client" directives (${useClientCount})`);
    }
    
    // Check for proper export
    if (!content.includes('export default function')) {
      issues.push('Missing default export function');
    }
    
    // Check for original-page.tsx
    const originalPagePath = path.join(path.dirname(fullPath), 'original-page.tsx');
    if (!fs.existsSync(originalPagePath)) {
      issues.push('Missing original-page.tsx file');
    }
    
    return { valid: issues.length === 0, issues };
    
  } catch (error) {
    return { valid: false, issues: [`Error reading file: ${error.message}`] };
  }
}

function verifyImportStructure(pagePath) {
  const fullPath = path.join(APP_DIR, pagePath);
  const originalPagePath = path.join(path.dirname(fullPath), 'original-page.tsx');
  
  if (!fs.existsSync(originalPagePath)) {
    return { valid: false, issues: ['Original page file missing'] };
  }
  
  try {
    const content = fs.readFileSync(originalPagePath, 'utf8');
    const issues = [];
    
    // Check if original page has proper export
    if (!content.includes('export default function OriginalPageComponent')) {
      issues.push('Original page missing proper export');
    }
    
    // Check for duplicate "use client" in original page
    if (content.includes('"use client"')) {
      issues.push('Original page should not have "use client" directive');
    }
    
    return { valid: issues.length === 0, issues };
    
  } catch (error) {
    return { valid: false, issues: [`Error reading original page: ${error.message}`] };
  }
}

// Run verification
console.log('🔍 Verifying page structures...\n');

let totalChecked = 0;
let validPages = 0;
let pagesWithIssues = 0;
const detailedResults = [];

for (const result of migrationSummary.results) {
  if (!result.success) continue;
  
  totalChecked++;
  console.log(`Checking: ${result.title} (${result.page})`);
  
  const structureCheck = verifyPageStructure(result.page);
  const importCheck = verifyImportStructure(result.page);
  
  const allIssues = [...structureCheck.issues, ...importCheck.issues];
  
  if (allIssues.length === 0) {
    console.log(`  ✅ Valid`);
    validPages++;
  } else {
    console.log(`  ⚠️  Issues found:`);
    allIssues.forEach(issue => console.log(`     - ${issue}`));
    pagesWithIssues++;
  }
  
  detailedResults.push({
    page: result.page,
    title: result.title,
    valid: allIssues.length === 0,
    issues: allIssues
  });
  
  console.log('');
}

// Create verification report
const verificationReport = {
  timestamp: new Date().toISOString(),
  totalChecked,
  validPages,
  pagesWithIssues,
  results: detailedResults
};

fs.writeFileSync(
  path.join(PROJECT_ROOT, 'verification-report.json'),
  JSON.stringify(verificationReport, null, 2)
);

// Summary
console.log('📊 Verification Summary');
console.log('======================');
console.log(`✅ Valid pages: ${validPages}`);
console.log(`⚠️  Pages with issues: ${pagesWithIssues}`);
console.log(`📄 Report saved to: verification-report.json\n`);

if (pagesWithIssues === 0) {
  console.log('🎉 All pages passed verification!');
  console.log('Your modern layout migration is complete and ready to use.');
} else {
  console.log('⚠️  Some pages have issues that need attention.');
  console.log('Check the detailed output above for specific problems.');
}

// Test suggestions
console.log('\n🧪 Testing Suggestions:');
console.log('1. Start your development server: npm run dev');
console.log('2. Visit each migrated page to ensure it loads correctly');
console.log('3. Test theme switching (dark/light mode)');
console.log('4. Test responsive behavior on different screen sizes');
console.log('5. Check navigation and breadcrumbs work correctly');

// Performance check
console.log('\n⚡ Performance Tips:');
console.log('- Each page now loads the modern theme independently');
console.log('- Consider implementing theme caching for better performance');
console.log('- Monitor bundle sizes with: npm run build');

console.log('\n✨ Your application now has a completely modern layout!');

// Exit with appropriate code
process.exit(pagesWithIssues > 0 ? 1 : 0);