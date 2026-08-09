#!/usr/bin/env node

/**
 * Interactive Index Helper
 * Helps users choose the right index generation strategy
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper functions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function showHeader() {
  console.log('\n🔥 Firestore Index Helper');
  console.log('=========================\n');
}

function showOptions() {
  console.log('📋 Available Index Generation Options:\n');
  console.log('1. 🚀 Simple Generator (Recommended)');
  console.log('   • 83 essential indexes');
  console.log('   • Covers all basic patterns');
  console.log('   • Fast and reliable');
  console.log('   • Best for: New projects, basic optimization\n');
  
  console.log('2. 🔍 Smart Analyzer');
  console.log('   • Analyzes your codebase');
  console.log('   • Generates custom indexes');
  console.log('   • Based on actual usage');
  console.log('   • Best for: Existing projects, custom queries\n');
  
  console.log('3. 🚀 Comprehensive Generator');
  console.log('   • 500+ advanced indexes');
  console.log('   • Text search optimization');
  console.log('   • Analytics support');
  console.log('   • Best for: High-performance apps\n');
  
  console.log('4. 📊 View Current Status');
  console.log('   • Check existing indexes');
  console.log('   • Validate current setup\n');
  
  console.log('5. 🛠️ Maintenance Tools');
  console.log('   • Backup/restore indexes');
  console.log('   • Performance analysis\n');
}

async function handleChoice(choice) {
  switch (choice) {
    case '1':
      return await runSimpleGenerator();
    case '2':
      return await runSmartAnalyzer();
    case '3':
      return await runComprehensiveGenerator();
    case '4':
      return await showCurrentStatus();
    case '5':
      return await showMaintenanceTools();
    default:
      console.log('❌ Invalid choice. Please select 1-5.');
      return false;
  }
}

async function runSimpleGenerator() {
  console.log('\n🚀 Running Simple Index Generator...');
  console.log('====================================\n');
  
  try {
    execSync('npm run indexes:generate', { stdio: 'inherit' });
    console.log('\n✅ Simple indexes generated successfully!');
    
    const deploy = await askQuestion('\n🚀 Deploy indexes now? (y/N): ');
    if (deploy.toLowerCase() === 'y') {
      await deployIndexes();
    } else {
      console.log('📝 To deploy later, run:');
      console.log('   cd generated-indexes');
      console.log('   ./deploy-indexes.sh');
    }
    return true;
  } catch (error) {
    console.error('❌ Error running simple generator:', error.message);
    return false;
  }
}

async function runSmartAnalyzer() {
  console.log('\n🔍 Running Smart Code Analyzer...');
  console.log('=================================\n');
  
  console.log('⚠️  Note: Smart analyzer requires additional dependencies');
  console.log('If you encounter errors, use the Simple Generator instead.\n');
  
  try {
    execSync('npm run indexes:smart', { stdio: 'inherit' });
    console.log('\n✅ Smart analysis completed!');
    
    const deploy = await askQuestion('\n🚀 Deploy analyzed indexes now? (y/N): ');
    if (deploy.toLowerCase() === 'y') {
      await deployIndexes('smart');
    }
    return true;
  } catch (error) {
    console.error('❌ Error running smart analyzer:', error.message);
    console.log('\n💡 Recommendation: Use Simple Generator instead');
    const fallback = await askQuestion('🔄 Run Simple Generator? (y/N): ');
    if (fallback.toLowerCase() === 'y') {
      return await runSimpleGenerator();
    }
    return false;
  }
}

async function runComprehensiveGenerator() {
  console.log('\n🚀 Running Comprehensive Generator...');
  console.log('====================================\n');
  
  console.log('⚠️  This will generate 500+ indexes.');
  console.log('💰 Consider Firebase pricing for large numbers of indexes.');
  console.log('⏱️  Deployment may take several minutes.\n');
  
  const confirm = await askQuestion('Continue? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled. Consider using Simple Generator instead.');
    return false;
  }
  
  try {
    execSync('npm run indexes:comprehensive', { stdio: 'inherit' });
    console.log('\n✅ Comprehensive indexes generated!');
    
    const deploy = await askQuestion('\n🚀 Deploy comprehensive indexes now? (y/N): ');
    if (deploy.toLowerCase() === 'y') {
      console.log('⚠️  This deployment will take several minutes...');
      await deployIndexes('comprehensive');
    }
    return true;
  } catch (error) {
    console.error('❌ Error running comprehensive generator:', error.message);
    return false;
  }
}

async function showCurrentStatus() {
  console.log('\n📊 Current Index Status');
  console.log('=======================\n');
  
  // Check if indexes exist
  const indexPath = path.join(process.cwd(), 'firestore.indexes.json');
  const generatedPath = path.join(process.cwd(), 'generated-indexes', 'firestore.indexes.json');
  
  if (fs.existsSync(indexPath)) {
    try {
      const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      console.log(`✅ Active indexes: ${indexData.indexes.length}`);
      
      // Count by collection
      const collectionCounts = {};
      indexData.indexes.forEach(index => {
        collectionCounts[index.collectionGroup] = (collectionCounts[index.collectionGroup] || 0) + 1;
      });
      
      console.log('\n📋 Indexes by collection:');
      Object.entries(collectionCounts).forEach(([collection, count]) => {
        console.log(`   ${collection}: ${count}`);
      });
      
    } catch (error) {
      console.log('❌ Error reading active indexes:', error.message);
    }
  } else {
    console.log('⚠️  No active indexes found (firestore.indexes.json missing)');
  }
  
  if (fs.existsSync(generatedPath)) {
    try {
      const generatedData = JSON.parse(fs.readFileSync(generatedPath, 'utf8'));
      console.log(`\n📦 Generated indexes ready: ${generatedData.indexes.length}`);
      console.log('💡 Run deployment script to activate');
    } catch (error) {
      console.log('❌ Error reading generated indexes');
    }
  } else {
    console.log('\n📦 No generated indexes found');
    console.log('💡 Run a generator to create indexes');
  }
  
  // Firebase CLI status
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('\n✅ Firebase CLI available');
  } catch (error) {
    console.log('\n❌ Firebase CLI not found');
    console.log('💡 Install with: npm install -g firebase-tools');
  }
  
  return true;
}

async function showMaintenanceTools() {
  console.log('\n🛠️ Maintenance Tools');
  console.log('===================\n');
  
  console.log('1. 💾 Backup current indexes');
  console.log('2. 🔄 Restore from backup');
  console.log('3. 🧹 Clean generated files');
  console.log('4. 📈 Performance analysis');
  console.log('5. ◀️ Back to main menu\n');
  
  const choice = await askQuestion('Select tool (1-5): ');
  
  switch (choice) {
    case '1':
      await backupIndexes();
      break;
    case '2':
      await restoreIndexes();
      break;
    case '3':
      await cleanGeneratedFiles();
      break;
    case '4':
      await performanceAnalysis();
      break;
    case '5':
      return true;
    default:
      console.log('❌ Invalid choice');
  }
  
  return false;
}

async function deployIndexes(type = 'simple') {
  const deployScript = type === 'smart' ? 'deploy-smart-indexes.sh' : 'deploy-indexes.sh';
  const scriptPath = path.join(process.cwd(), 'generated-indexes', deployScript);
  
  if (!fs.existsSync(scriptPath)) {
    console.log('❌ Deploy script not found. Generate indexes first.');
    return false;
  }
  
  try {
    console.log('\n🚀 Deploying indexes to Firebase...');
    execSync(`cd generated-indexes && ./${deployScript}`, { stdio: 'inherit' });
    console.log('\n✅ Indexes deployed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    return false;
  }
}

async function backupIndexes() {
  const indexPath = path.join(process.cwd(), 'firestore.indexes.json');
  
  if (!fs.existsSync(indexPath)) {
    console.log('❌ No indexes to backup');
    return;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `firestore.indexes.backup.${timestamp}.json`;
  
  try {
    fs.copyFileSync(indexPath, backupPath);
    console.log(`✅ Indexes backed up to: ${backupPath}`);
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  }
}

async function restoreIndexes() {
  console.log('🔍 Looking for backup files...');
  
  const backups = fs.readdirSync(process.cwd())
    .filter(file => file.startsWith('firestore.indexes.backup.'))
    .sort()
    .reverse();
  
  if (backups.length === 0) {
    console.log('❌ No backup files found');
    return;
  }
  
  console.log('\n📦 Available backups:');
  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup}`);
  });
  
  const choice = await askQuestion(`\nSelect backup (1-${backups.length}): `);
  const selectedBackup = backups[parseInt(choice) - 1];
  
  if (!selectedBackup) {
    console.log('❌ Invalid selection');
    return;
  }
  
  try {
    fs.copyFileSync(selectedBackup, 'firestore.indexes.json');
    console.log(`✅ Restored from: ${selectedBackup}`);
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
  }
}

async function cleanGeneratedFiles() {
  const generatedDir = path.join(process.cwd(), 'generated-indexes');
  
  if (!fs.existsSync(generatedDir)) {
    console.log('❌ No generated files to clean');
    return;
  }
  
  const confirm = await askQuestion('🗑️  Delete all generated files? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    return;
  }
  
  try {
    fs.rmSync(generatedDir, { recursive: true, force: true });
    console.log('✅ Generated files cleaned');
  } catch (error) {
    console.error('❌ Clean failed:', error.message);
  }
}

async function performanceAnalysis() {
  console.log('\n📈 Performance Analysis');
  console.log('======================\n');
  
  console.log('🔗 Firebase Console Links:');
  console.log('• Firestore Usage: https://console.firebase.google.com/project/[PROJECT]/firestore/usage');
  console.log('• Query Performance: https://console.firebase.google.com/project/[PROJECT]/firestore/performance');
  console.log('• Index Management: https://console.firebase.google.com/project/[PROJECT]/firestore/indexes\n');
  
  console.log('💡 Performance Tips:');
  console.log('• Monitor slow queries (>100ms)');
  console.log('• Check index usage patterns');
  console.log('• Remove unused indexes');
  console.log('• Optimize query structure');
}

// Main execution
async function main() {
  showHeader();
  
  while (true) {
    showOptions();
    const choice = await askQuestion('Select option (1-5) or "q" to quit: ');
    
    if (choice.toLowerCase() === 'q') {
      console.log('\n👋 Thanks for using Firestore Index Helper!');
      break;
    }
    
    const success = await handleChoice(choice);
    if (success) {
      console.log('\n✅ Operation completed successfully!\n');
    } else {
      console.log('\n⚠️  Operation not completed. Try again if needed.\n');
    }
    
    const another = await askQuestion('🔄 Perform another operation? (Y/n): ');
    if (another.toLowerCase() === 'n') {
      console.log('\n👋 Thanks for using Firestore Index Helper!');
      break;
    }
  }
  
  rl.close();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { main };