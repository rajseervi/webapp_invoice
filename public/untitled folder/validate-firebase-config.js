#!/usr/bin/env node

/**
 * Firebase Configuration Validator
 * 
 * This script validates the Firebase configuration files for the GST project
 * and checks for common issues before deployment.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} found: ${filePath}`, 'green');
    return true;
  } else {
    log(`❌ ${description} missing: ${filePath}`, 'red');
    return false;
  }
}

function validateJSON(filePath, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    log(`✅ ${description} is valid JSON`, 'green');
    return parsed;
  } catch (error) {
    log(`❌ ${description} has invalid JSON: ${error.message}`, 'red');
    return null;
  }
}

function validateFirebaseJson() {
  log('\n🔍 Validating firebase.json...', 'cyan');
  
  const config = validateJSON('./firebase.json', 'firebase.json');
  if (!config) return false;

  let isValid = true;

  // Check for firestore configuration
  if (config.firestore) {
    log('✅ Firestore configuration found', 'green');
    
    if (config.firestore.rules) {
      log(`✅ Firestore rules file specified: ${config.firestore.rules}`, 'green');
    } else {
      log('⚠️  No Firestore rules file specified', 'yellow');
    }
    
    if (config.firestore.indexes) {
      log(`✅ Firestore indexes file specified: ${config.firestore.indexes}`, 'green');
    } else {
      log('⚠️  No Firestore indexes file specified', 'yellow');
    }
  } else {
    log('❌ No Firestore configuration found', 'red');
    isValid = false;
  }

  // Check for emulators configuration
  if (config.emulators) {
    log('✅ Emulators configuration found', 'green');
    
    if (config.emulators.firestore) {
      log(`✅ Firestore emulator configured on port ${config.emulators.firestore.port}`, 'green');
    }
    
    if (config.emulators.auth) {
      log(`✅ Auth emulator configured on port ${config.emulators.auth.port}`, 'green');
    }
    
    if (config.emulators.ui) {
      log(`✅ Emulator UI configured on port ${config.emulators.ui.port}`, 'green');
    }
  } else {
    log('⚠️  No emulators configuration found', 'yellow');
  }

  return isValid;
}

function validateFirestoreIndexes() {
  log('\n🗂️  Validating firestore.indexes.json...', 'cyan');
  
  const indexes = validateJSON('./firestore.indexes.json', 'firestore.indexes.json');
  if (!indexes) return false;

  let isValid = true;

  if (indexes.indexes && Array.isArray(indexes.indexes)) {
    log(`✅ Found ${indexes.indexes.length} index definitions`, 'green');
    
    // Validate each index
    indexes.indexes.forEach((index, i) => {
      if (!index.collectionGroup) {
        log(`❌ Index ${i + 1}: Missing collectionGroup`, 'red');
        isValid = false;
      }
      
      if (!index.fields || !Array.isArray(index.fields)) {
        log(`❌ Index ${i + 1}: Missing or invalid fields array`, 'red');
        isValid = false;
      } else if (index.fields.length < 2) {
        log(`⚠️  Index ${i + 1}: Single field index (may not be necessary)`, 'yellow');
      }
      
      if (index.queryScope !== 'COLLECTION') {
        log(`⚠️  Index ${i + 1}: Non-standard queryScope: ${index.queryScope}`, 'yellow');
      }
    });

    // Check for common collections
    const collections = [...new Set(indexes.indexes.map(idx => idx.collectionGroup))];
    const expectedCollections = [
      'transactions', 'products', 'invoices', 'orders', 
      'parties', 'categories', 'users', 'suppliers'
    ];
    
    log(`\n📊 Index coverage for collections:`, 'blue');
    expectedCollections.forEach(collection => {
      const hasIndexes = collections.includes(collection);
      if (hasIndexes) {
        const count = indexes.indexes.filter(idx => idx.collectionGroup === collection).length;
        log(`  ✅ ${collection}: ${count} indexes`, 'green');
      } else {
        log(`  ⚠️  ${collection}: No indexes defined`, 'yellow');
      }
    });

  } else {
    log('❌ No indexes array found', 'red');
    isValid = false;
  }

  return isValid;
}

function validateFirestoreRules() {
  log('\n🔒 Validating firestore.rules...', 'cyan');
  
  if (!validateFileExists('./firestore.rules', 'Firestore rules file')) {
    return false;
  }

  try {
    const rules = fs.readFileSync('./firestore.rules', 'utf8');
    let isValid = true;

    // Check for basic structure
    if (!rules.includes("rules_version = '2'")) {
      log('❌ Missing rules_version declaration', 'red');
      isValid = false;
    } else {
      log("✅ Rules version '2' found", 'green');
    }

    if (!rules.includes('service cloud.firestore')) {
      log('❌ Missing service declaration', 'red');
      isValid = false;
    } else {
      log('✅ Service declaration found', 'green');
    }

    // Check for helper functions
    const helperFunctions = [
      'isAuthenticated()',
      'isOwner(',
      'isAdmin()',
      'isManager()',
      'isValidUser()'
    ];

    log('\n🔧 Helper functions:', 'blue');
    helperFunctions.forEach(func => {
      if (rules.includes(func)) {
        log(`  ✅ ${func}`, 'green');
      } else {
        log(`  ⚠️  ${func} not found`, 'yellow');
      }
    });

    // Check for collection rules
    const collections = [
      'users', 'products', 'categories', 'parties', 'suppliers',
      'invoices', 'purchaseInvoices', 'orders', 'transactions',
      'accounts', 'quickLinks', 'reports', 'auditLogs', 'notifications'
    ];

    log('\n📁 Collection rules coverage:', 'blue');
    collections.forEach(collection => {
      if (rules.includes(`match /${collection}/`)) {
        log(`  ✅ ${collection}`, 'green');
      } else {
        log(`  ⚠️  ${collection} rules not found`, 'yellow');
      }
    });

    // Check for default deny rule
    if (rules.includes('match /{document=**}') && rules.includes('allow read, write: if false')) {
      log('✅ Default deny rule found', 'green');
    } else {
      log('⚠️  Default deny rule not found or incorrect', 'yellow');
    }

    return isValid;

  } catch (error) {
    log(`❌ Error reading firestore.rules: ${error.message}`, 'red');
    return false;
  }
}

function validatePackageJson() {
  log('\n📦 Validating package.json dependencies...', 'cyan');
  
  const packageJson = validateJSON('./package.json', 'package.json');
  if (!packageJson) return false;

  const requiredDeps = {
    'firebase': 'Firebase SDK',
    '@mui/material': 'Material-UI components',
    'next': 'Next.js framework'
  };

  let isValid = true;

  log('\n🔗 Required dependencies:', 'blue');
  Object.entries(requiredDeps).forEach(([dep, description]) => {
    const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    if (version) {
      log(`  ✅ ${dep} (${version}) - ${description}`, 'green');
    } else {
      log(`  ❌ ${dep} - ${description}`, 'red');
      isValid = false;
    }
  });

  return isValid;
}

function generateReport() {
  log('\n📋 Validation Summary:', 'magenta');
  log('=' .repeat(50), 'magenta');

  const results = {
    firebaseJson: validateFirebaseJson(),
    firestoreIndexes: validateFirestoreIndexes(),
    firestoreRules: validateFirestoreRules(),
    packageJson: validatePackageJson()
  };

  const allValid = Object.values(results).every(result => result);

  log('\n🎯 Final Results:', 'cyan');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`  ${status} ${test}`, color);
  });

  if (allValid) {
    log('\n🎉 All validations passed! Your Firebase configuration is ready for deployment.', 'green');
    log('\nNext steps:', 'blue');
    log('  1. Run: firebase login', 'white');
    log('  2. Run: firebase use --add (select your project)', 'white');
    log('  3. Run: ./firebase-deploy.sh', 'white');
  } else {
    log('\n⚠️  Some validations failed. Please fix the issues before deployment.', 'yellow');
    log('\nFor help, refer to FIREBASE_SETUP.md', 'blue');
  }

  return allValid;
}

function main() {
  log('🔥 Firebase Configuration Validator for GST Project', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  // Check if we're in the right directory
  if (!fs.existsSync('./package.json')) {
    log('❌ package.json not found. Please run this script from the project root directory.', 'red');
    process.exit(1);
  }

  const isValid = generateReport();
  process.exit(isValid ? 0 : 1);
}

// Run the validator
if (require.main === module) {
  main();
}

module.exports = {
  validateFirebaseJson,
  validateFirestoreIndexes,
  validateFirestoreRules,
  validatePackageJson
};