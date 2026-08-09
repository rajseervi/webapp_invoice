
// Test Modern Layout Components
// Run with: node test-modern-layout.js

console.log('🧪 Testing Modern Layout Components...');

const fs = require('fs');
const path = require('path');

const filesToTest = [
  'src/theme/modernTheme.ts',
  'src/contexts/ModernThemeContext.tsx',
  'src/components/ModernLayout/ModernSidebar.tsx',
  'src/components/ModernLayout/ModernDashboardLayout.tsx'
];

let allGood = true;

filesToTest.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.length > 100) {
      console.log(`✅ ${file} - OK`);
    } else {
      console.log(`⚠️  ${file} - File seems empty`);
      allGood = false;
    }
  } else {
    console.log(`❌ ${file} - Missing`);
    allGood = false;
  }
});

if (allGood) {
  console.log('\n🎉 All modern layout files are present and appear to be valid!');
  console.log('You can now start using the modern layout in your application.');
} else {
  console.log('\n⚠️  Some issues were found. Please check the files above.');
}

console.log('\n📚 For more information, see MODERN_LAYOUT_REDESIGN.md');
