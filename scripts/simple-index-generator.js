#!/usr/bin/env node

/**
 * Simple Index Generator for All App Pages
 * Creates essential Firestore indexes based on existing app structure
 */

const fs = require('fs');
const path = require('path');

// Define all collections and their essential index patterns
const ESSENTIAL_INDEXES = {
  // Products Collection
  products: [
    // Basic queries
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'name', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'updatedAt', order: 'DESCENDING' }] },
    
    // Category-based queries
    { fields: [{ fieldPath: 'categoryId', order: 'ASCENDING' }, { fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'name', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'categoryId', order: 'ASCENDING' }, { fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'price', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'categoryId', order: 'ASCENDING' }, { fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    
    // Stock-based queries
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'quantity', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'quantity', order: 'ASCENDING' }, { fieldPath: 'minStockLevel', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'quantity', order: 'ASCENDING' }, { fieldPath: 'minStockLevel', order: 'ASCENDING' }] },
    
    // Search support
    { fields: [{ fieldPath: 'searchTerms', arrayConfig: 'CONTAINS' }, { fieldPath: 'isActive', order: 'ASCENDING' }] },
    
    // Price queries
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'price', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'price', order: 'DESCENDING' }] },
  ],

  // Parties Collection
  parties: [
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'name', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'customerType', order: 'ASCENDING' }, { fieldPath: 'isActive', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'supplierType', order: 'ASCENDING' }, { fieldPath: 'isActive', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'city', order: 'ASCENDING' }, { fieldPath: 'isActive', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'state', order: 'ASCENDING' }, { fieldPath: 'isActive', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'searchTerms', arrayConfig: 'CONTAINS' }, { fieldPath: 'isActive', order: 'ASCENDING' }] },
  ],

  // Invoices Collection
  invoices: [
    // User-based queries
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    
    // Party-based queries
    { fields: [{ fieldPath: 'partyId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'partyId', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    
    // Status queries
    { fields: [{ fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'paymentStatus', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'paymentStatus', order: 'ASCENDING' }, { fieldPath: 'dueDate', order: 'ASCENDING' }] },
    
    // Date-based queries
    { fields: [{ fieldPath: 'date', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'dueDate', order: 'ASCENDING' }, { fieldPath: 'paymentStatus', order: 'ASCENDING' }] },
    
    // Amount-based queries
    { fields: [{ fieldPath: 'totalAmount', order: 'DESCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'balanceAmount', order: 'DESCENDING' }, { fieldPath: 'paymentStatus', order: 'ASCENDING' }] },
  ],

  // Purchases Collection
  purchases: [
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'supplierId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'supplierId', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'receivedStatus', order: 'ASCENDING' }, { fieldPath: 'deliveryDate', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'paymentStatus', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'date', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }] },
  ],

  // Orders Collection
  orders: [
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'customerId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'priority', order: 'DESCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'orderDate', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'deliveryDate', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'customerId', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'orderDate', order: 'ASCENDING' }] },
  ],

  // Categories Collection
  categories: [
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'name', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'sortOrder', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'parentId', order: 'ASCENDING' }, { fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'sortOrder', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'parentId', order: 'ASCENDING' }, { fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'name', order: 'ASCENDING' }] },
  ],

  // Inventory Collection
  inventory: [
    { fields: [{ fieldPath: 'productId', order: 'ASCENDING' }, { fieldPath: 'lastUpdated', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'quantity', order: 'ASCENDING' }, { fieldPath: 'minStockLevel', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'availableQuantity', order: 'ASCENDING' }, { fieldPath: 'reorderLevel', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'location', order: 'ASCENDING' }, { fieldPath: 'productId', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'expiryDate', order: 'ASCENDING' }, { fieldPath: 'productId', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'productId', order: 'ASCENDING' }, { fieldPath: 'location', order: 'ASCENDING' }, { fieldPath: 'batchNumber', order: 'ASCENDING' }] },
  ],

  // Stock Movements Collection
  stockMovements: [
    { fields: [{ fieldPath: 'productId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'movementType', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'referenceType', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'referenceId', order: 'ASCENDING' }, { fieldPath: 'referenceType', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'productId', order: 'ASCENDING' }, { fieldPath: 'movementType', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  ],

  // Transactions Collection
  transactions: [
    { fields: [{ fieldPath: 'partyId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'type', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'paymentMethod', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'partyId', order: 'ASCENDING' }, { fieldPath: 'type', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'amount', order: 'DESCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }] },
  ],

  // Users Collection
  users: [
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'role', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'role', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'lastLoginAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'email', order: 'ASCENDING' }, { fieldPath: 'isActive', order: 'ASCENDING' }] },
  ],

  // Reports Collection
  reports: [
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'generatedAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'reportType', order: 'ASCENDING' }, { fieldPath: 'generatedAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'generatedAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'reportType', order: 'ASCENDING' }, { fieldPath: 'generatedAt', order: 'DESCENDING' }] },
  ],

  // Settings Collection
  settings: [
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'category', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'category', order: 'ASCENDING' }, { fieldPath: 'key', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'category', order: 'ASCENDING' }, { fieldPath: 'key', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'category', order: 'ASCENDING' }] },
  ],

  // Notifications Collection
  notifications: [
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'isRead', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'type', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'priority', order: 'DESCENDING' }, { fieldPath: 'isRead', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  ]
};

// Generate indexes
function generateIndexes() {
  const indexes = [];
  
  console.log('🚀 Generating essential indexes for all collections...\n');

  Object.entries(ESSENTIAL_INDEXES).forEach(([collection, patterns]) => {
    console.log(`📋 Processing ${collection}...`);
    
    patterns.forEach(pattern => {
      indexes.push({
        collectionGroup: collection,
        queryScope: 'COLLECTION',
        fields: pattern.fields
      });
    });
    
    console.log(`   ✅ Added ${patterns.length} indexes for ${collection}`);
  });

  console.log(`\n✨ Total indexes generated: ${indexes.length}`);
  return { indexes };
}

// Create deployment utilities
function createDeploymentFiles(indexData, outputDir) {
  // Create main indexes file
  const indexPath = path.join(outputDir, 'firestore.indexes.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));

  // Create deployment script
  const deployScript = `#!/bin/bash

echo "🚀 Deploying Essential Firestore Indexes"
echo "========================================"

# Backup existing indexes
if [ -f "firestore.indexes.json" ]; then
    echo "📋 Backing up existing indexes..."
    cp firestore.indexes.json firestore.indexes.json.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copy new indexes
echo "📁 Installing new indexes..."
cp ${indexPath} firestore.indexes.json

# Show what will be deployed
echo "📊 About to deploy ${indexData.indexes.length} indexes covering:"
echo "   • Products: ${ESSENTIAL_INDEXES.products.length} indexes"
echo "   • Parties: ${ESSENTIAL_INDEXES.parties.length} indexes"
echo "   • Invoices: ${ESSENTIAL_INDEXES.invoices.length} indexes"
echo "   • Purchases: ${ESSENTIAL_INDEXES.purchases.length} indexes"
echo "   • Orders: ${ESSENTIAL_INDEXES.orders.length} indexes"
echo "   • Categories: ${ESSENTIAL_INDEXES.categories.length} indexes"
echo "   • Inventory: ${ESSENTIAL_INDEXES.inventory.length} indexes"
echo "   • And more..."

# Confirm deployment
read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo "✅ Indexes deployed successfully!"
    echo "🔗 View in Firebase Console: https://console.firebase.google.com/"
    echo "📈 Monitor query performance in the Firestore section"
else
    echo "❌ Deployment failed! Check Firebase CLI setup and authentication"
    exit 1
fi
`;

  const deployPath = path.join(outputDir, 'deploy-indexes.sh');
  fs.writeFileSync(deployPath, deployScript);
  fs.chmodSync(deployPath, '755');

  // Create validation script
  const validateScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Firestore Indexes...');

try {
  const indexData = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8'));
  
  console.log('📊 Index Summary:');
  console.log('================');
  console.log(\`Total indexes: \${indexData.indexes.length}\`);
  
  const collectionCounts = {};
  indexData.indexes.forEach(index => {
    collectionCounts[index.collectionGroup] = (collectionCounts[index.collectionGroup] || 0) + 1;
  });
  
  console.log('\\nIndexes by collection:');
  Object.entries(collectionCounts).forEach(([collection, count]) => {
    console.log(\`   \${collection}: \${count}\`);
  });
  
  // Validate structure
  let hasErrors = false;
  indexData.indexes.forEach((index, i) => {
    if (!index.collectionGroup) {
      console.error(\`❌ Index \${i}: Missing collectionGroup\`);
      hasErrors = true;
    }
    if (!index.fields || index.fields.length === 0) {
      console.error(\`❌ Index \${i}: Missing or empty fields\`);
      hasErrors = true;
    }
  });
  
  if (hasErrors) {
    console.error('❌ Validation failed! Fix errors before deployment.');
    process.exit(1);
  } else {
    console.log('\\n✅ All indexes are valid!');
    console.log('🚀 Ready for deployment with: ./deploy-indexes.sh');
  }
  
} catch (error) {
  console.error('❌ Error reading indexes file:', error.message);
  process.exit(1);
}
`;

  const validatePath = path.join(outputDir, 'validate-indexes.js');
  fs.writeFileSync(validatePath, validateScript);
  fs.chmodSync(validatePath, '755');

  return { indexPath, deployPath, validatePath };
}

// Create usage documentation
function createDocumentation(outputDir) {
  const docsContent = `# Firestore Index Documentation

## Overview
This directory contains automatically generated Firestore indexes for optimal query performance across all application pages.

## Generated Files

### \`firestore.indexes.json\`
The main index configuration file that should be deployed to Firebase.

### \`deploy-indexes.sh\`
Deployment script that:
- Backs up existing indexes
- Deploys new indexes to Firebase
- Provides deployment confirmation

### \`validate-indexes.js\`
Validation script that checks index structure and provides summary.

## Collections Covered

${Object.entries(ESSENTIAL_INDEXES).map(([collection, patterns]) => 
  `### ${collection} (${patterns.length} indexes)
Essential indexes for:
- Listing with filters and sorting
- User-specific queries
- Status-based filtering
- Date range queries
- Text search support (where applicable)
`).join('\n')}

## Usage

1. **Validate indexes:**
   \`\`\`bash
   ./validate-indexes.js
   \`\`\`

2. **Deploy to Firebase:**
   \`\`\`bash
   ./deploy-indexes.sh
   \`\`\`

3. **Monitor performance:**
   - Firebase Console → Firestore → Usage tab
   - Check for slow queries
   - Monitor index usage

## Index Types Included

1. **Basic Filters:** isActive, status, type fields
2. **User Queries:** userId-based filtering with sorting
3. **Relationship Queries:** Foreign key relationships (partyId, productId, etc.)
4. **Date Queries:** createdAt, updatedAt with DESC ordering
5. **Amount Queries:** price, totalAmount with DESC ordering
6. **Search Support:** searchTerms array-contains indexes
7. **Status Combinations:** Multi-field status queries

## Performance Notes

- All indexes are optimized for common query patterns
- Array-contains indexes support text search
- Composite indexes reduce query complexity
- Proper field ordering minimizes index size

## Maintenance

Re-run the index generator when:
- Adding new collections
- Changing query patterns
- Adding new filter combinations
- Optimizing slow queries

Generated on: ${new Date().toISOString()}
`;

  const docsPath = path.join(outputDir, 'README.md');
  fs.writeFileSync(docsPath, docsContent);
  return docsPath;
}

// Main function
function main() {
  try {
    console.log('🔥 Simple Firestore Index Generator');
    console.log('==================================\n');

    // Generate indexes
    const indexData = generateIndexes();

    // Create output directory
    const projectRoot = path.resolve(__dirname, '..');
    const outputDir = path.join(projectRoot, 'generated-indexes');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create files
    const files = createDeploymentFiles(indexData, outputDir);
    const docsPath = createDocumentation(outputDir);

    // Print success message
    console.log('\n🎉 Index generation completed!');
    console.log('=============================');
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`📊 Total indexes: ${indexData.indexes.length}`);
    console.log(`🏷️  Collections: ${Object.keys(ESSENTIAL_INDEXES).length}`);
    console.log(`\n📋 Generated files:`);
    console.log(`   • ${path.basename(files.indexPath)} - Main indexes file`);
    console.log(`   • ${path.basename(files.deployPath)} - Deployment script`);
    console.log(`   • ${path.basename(files.validatePath)} - Validation script`);
    console.log(`   • ${path.basename(docsPath)} - Documentation`);
    console.log(`\n🚀 Quick start:`);
    console.log(`   cd ${outputDir}`);
    console.log(`   ./validate-indexes.js`);
    console.log(`   ./deploy-indexes.sh`);

  } catch (error) {
    console.error('❌ Error generating indexes:', error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { generateIndexes, ESSENTIAL_INDEXES };

// Run if called directly
if (require.main === module) {
  main();
}