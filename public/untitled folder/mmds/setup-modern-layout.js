#!/usr/bin/env node

/**
 * Modern Layout Setup Script
 * 
 * This script helps set up the modern layout redesign for the application.
 * It checks dependencies, creates necessary files, and provides setup instructions.
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Modern Layout Setup Script');
console.log('==============================\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Read package.json
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
  process.exit(1);
}

console.log('✅ Project detected:', packageJson.name);
console.log('📦 Version:', packageJson.version);
console.log('');

// Check required dependencies
const requiredDependencies = {
  '@mui/material': '^5.0.0',
  '@mui/icons-material': '^5.0.0',
  '@emotion/react': '^11.0.0',
  '@emotion/styled': '^11.0.0',
  'framer-motion': '^10.0.0',
  'recharts': '^2.0.0',
  'next': '^14.0.0',
  'react': '^18.0.0'
};

console.log('🔍 Checking dependencies...');
const missingDependencies = [];

for (const [dep, version] of Object.entries(requiredDependencies)) {
  const installed = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
  if (!installed) {
    missingDependencies.push(`${dep}@${version}`);
    console.log(`❌ Missing: ${dep}`);
  } else {
    console.log(`✅ Found: ${dep}`);
  }
}

if (missingDependencies.length > 0) {
  console.log('\n📦 Install missing dependencies:');
  console.log(`npm install ${missingDependencies.join(' ')}`);
  console.log('or');
  console.log(`yarn add ${missingDependencies.join(' ')}`);
  console.log('');
}

// Check if modern layout files exist
const modernLayoutFiles = [
  'src/theme/modernTheme.ts',
  'src/contexts/ModernThemeContext.tsx',
  'src/components/ModernLayout/ModernSidebar.tsx',
  'src/components/ModernLayout/ModernDashboardLayout.tsx',
  'src/components/ModernLayout/ModernDashboard.tsx',
  'src/app/modern-dashboard-demo/page.tsx'
];

console.log('📁 Checking modern layout files...');
let allFilesExist = true;

for (const file of modernLayoutFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ Found: ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n⚠️  Some modern layout files are missing.');
  console.log('Please ensure all files have been created as per the documentation.');
}

// Create directories if they don't exist
const directories = [
  'src/theme',
  'src/contexts',
  'src/components/ModernLayout',
  'src/app/modern-dashboard-demo'
];

console.log('\n📂 Checking directories...');
for (const dir of directories) {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created: ${dir}`);
    } catch (error) {
      console.log(`❌ Failed to create: ${dir} - ${error.message}`);
    }
  } else {
    console.log(`✅ Exists: ${dir}`);
  }
}

// Check TypeScript configuration
const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
if (fs.existsSync(tsConfigPath)) {
  console.log('\n📝 TypeScript configuration found');
  try {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    const hasPathMapping = tsConfig.compilerOptions?.paths?.['@/*'];
    if (hasPathMapping) {
      console.log('✅ Path mapping configured');
    } else {
      console.log('⚠️  Path mapping not found. Add this to tsconfig.json:');
      console.log(`
"compilerOptions": {
  "paths": {
    "@/*": ["./src/*"]
  }
}
      `);
    }
  } catch (error) {
    console.log('❌ Error reading tsconfig.json:', error.message);
  }
} else {
  console.log('\n⚠️  TypeScript configuration not found');
}

// Provide setup instructions
console.log('\n🚀 Setup Instructions:');
console.log('======================');

if (missingDependencies.length > 0) {
  console.log('1. Install missing dependencies (see above)');
}

console.log('2. Ensure all modern layout files are in place');
console.log('3. Update your main layout to use ModernDashboardLayout');
console.log('4. Wrap your app with ModernThemeProvider');
console.log('5. Test the modern layout at /modern-dashboard-demo');

console.log('\n📖 Usage Example:');
console.log(`
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';

export default function MyPage() {
  return (
    <ModernThemeProvider>
      <ModernDashboardLayout title="My Page">
        <YourContent />
      </ModernDashboardLayout>
    </ModernThemeProvider>
  );
}
`);

console.log('\n🎯 Next Steps:');
console.log('- Read MODERN_LAYOUT_REDESIGN.md for detailed documentation');
console.log('- Test the demo page: /modern-dashboard-demo');
console.log('- Gradually migrate existing pages to use the modern layout');
console.log('- Customize the theme and navigation as needed');

console.log('\n✨ Modern layout setup complete!');
console.log('Happy coding! 🎉');

// Create a simple test file
const testFilePath = path.join(process.cwd(), 'test-modern-layout.js');
const testFileContent = `
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
      console.log(\`✅ \${file} - OK\`);
    } else {
      console.log(\`⚠️  \${file} - File seems empty\`);
      allGood = false;
    }
  } else {
    console.log(\`❌ \${file} - Missing\`);
    allGood = false;
  }
});

if (allGood) {
  console.log('\\n🎉 All modern layout files are present and appear to be valid!');
  console.log('You can now start using the modern layout in your application.');
} else {
  console.log('\\n⚠️  Some issues were found. Please check the files above.');
}

console.log('\\n📚 For more information, see MODERN_LAYOUT_REDESIGN.md');
`;

try {
  fs.writeFileSync(testFilePath, testFileContent);
  console.log(`\n🧪 Created test file: ${testFilePath}`);
  console.log('Run "node test-modern-layout.js" to test the installation');
} catch (error) {
  console.log('⚠️  Could not create test file:', error.message);
}