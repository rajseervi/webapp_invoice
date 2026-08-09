#!/usr/bin/env node

/**
 * Dynamic Index Analyzer and Generator
 * Analyzes existing pages and components to automatically generate required indexes
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Analyze source code to extract Firestore query patterns
class FirestoreQueryAnalyzer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.queryPatterns = new Map();
    this.collections = new Set();
    this.pageQueries = new Map();
  }

  // Analyze all source files
  async analyzeProject() {
    console.log('🔍 Analyzing project structure and Firestore queries...\n');

    // Find all TypeScript/JavaScript files
    const sourcePatterns = [
      `${this.projectRoot}/src/**/*.{ts,tsx,js,jsx}`,
      `${this.projectRoot}/src/app/**/*.{ts,tsx,js,jsx}`,
      `${this.projectRoot}/src/components/**/*.{ts,tsx,js,jsx}`,
      `${this.projectRoot}/src/services/**/*.{ts,tsx,js,jsx}`,
    ];

    const files = [];
    for (const pattern of sourcePatterns) {
      const matches = glob.sync(pattern);
      files.push(...matches);
    }

    console.log(`📁 Found ${files.length} source files to analyze`);

    // Analyze each file
    for (const file of files) {
      await this.analyzeFile(file);
    }

    console.log(`📊 Analysis complete:`);
    console.log(`   • ${this.collections.size} collections identified`);
    console.log(`   • ${this.queryPatterns.size} unique query patterns found`);
    console.log(`   • ${this.pageQueries.size} page-specific patterns detected\n`);

    return {
      collections: Array.from(this.collections),
      queryPatterns: Object.fromEntries(this.queryPatterns),
      pageQueries: Object.fromEntries(this.pageQueries)
    };
  }

  // Analyze individual file for Firestore patterns
  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.projectRoot, filePath);

      // Extract query patterns using regex
      this.extractQueryPatterns(content, relativePath);
      this.extractCollections(content, relativePath);
      
      // If it's a page component, track its specific patterns
      if (this.isPageComponent(filePath)) {
        this.extractPagePatterns(content, relativePath);
      }

    } catch (error) {
      console.warn(`⚠️  Could not analyze ${filePath}: ${error.message}`);
    }
  }

  // Extract Firestore query patterns
  extractQueryPatterns(content, filePath) {
    const patterns = [
      // collection().where().orderBy() patterns
      /collection\(['"`]([^'"`]+)['"`]\)\s*\.where\(['"`]([^'"`]+)['"`],\s*['"`]([^'"`]+)['"`],\s*([^)]+)\)\s*(?:\.orderBy\(['"`]([^'"`]+)['"`],?\s*['"`]?([^'"`)]*)['"`]?\))?/g,
      
      // query().where().orderBy() patterns
      /query\([^)]+\)\s*\.where\(['"`]([^'"`]+)['"`],\s*['"`]([^'"`]+)['"`],\s*([^)]+)\)\s*(?:\.orderBy\(['"`]([^'"`]+)['"`],?\s*['"`]?([^'"`)]*)['"`]?\))?/g,
      
      // doc() patterns
      /collection\(['"`]([^'"`]+)['"`]\)\s*\.doc\(/g,
      
      // Direct collection references
      /collection\(['"`]([^'"`]+)['"`]\)/g,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const collection = match[1];
        if (collection) {
          this.collections.add(collection);
          
          const whereField = match[2];
          const whereOperator = match[3];
          const orderField = match[5];
          const orderDirection = match[6] || 'asc';

          if (whereField && whereOperator) {
            const key = `${collection}_${whereField}_${whereOperator}_${orderField || ''}_${orderDirection}`;
            if (!this.queryPatterns.has(key)) {
              this.queryPatterns.set(key, {
                collection,
                whereField,
                whereOperator,
                orderField,
                orderDirection,
                usedIn: [filePath]
              });
            } else {
              this.queryPatterns.get(key).usedIn.push(filePath);
            }
          }
        }
      }
    });
  }

  // Extract collection names
  extractCollections(content, filePath) {
    const collectionRegex = /['"`]([a-zA-Z][a-zA-Z0-9_]*)["`']\s*(?:collection|Collection)/g;
    let match;
    while ((match = collectionRegex.exec(content)) !== null) {
      this.collections.add(match[1]);
    }

    // Also look for collection constants
    const constantRegex = /const\s+([A-Z_]+)\s*=\s*['"`]([^'"`]+)['"`]/g;
    while ((match = constantRegex.exec(content)) !== null) {
      if (match[1].includes('COLLECTION') || match[1].includes('TABLE')) {
        this.collections.add(match[2]);
      }
    }
  }

  // Extract page-specific patterns
  extractPagePatterns(content, filePath) {
    const pageRoute = this.getPageRoute(filePath);
    if (!pageRoute) return;

    // Look for specific query patterns in page components
    const pagePatterns = [];
    
    // useEffect patterns that likely contain queries
    const useEffectRegex = /useEffect\s*\(\s*\(\s*\)\s*=>\s*{([^}]+)}/g;
    let match;
    while ((match = useEffectRegex.exec(content)) !== null) {
      const effectContent = match[1];
      // Analyze queries within useEffect
      this.extractQueryPatterns(effectContent, filePath);
    }

    // Service calls that might indicate data requirements
    const serviceCallRegex = /(\w+Service)\.\w+\(/g;
    while ((match = serviceCallRegex.exec(content)) !== null) {
      const service = match[1];
      const collection = this.inferCollectionFromService(service);
      if (collection) {
        this.collections.add(collection);
      }
    }

    this.pageQueries.set(pageRoute, pagePatterns);
  }

  // Determine if file is a page component
  isPageComponent(filePath) {
    return filePath.includes('/app/') && filePath.endsWith('page.tsx');
  }

  // Get page route from file path
  getPageRoute(filePath) {
    const appIndex = filePath.indexOf('/app/');
    if (appIndex === -1) return null;
    
    const routePath = filePath.substring(appIndex + 5); // +5 for '/app/'
    return '/' + routePath
      .replace(/\/page\.(tsx|ts|jsx|js)$/, '')
      .replace(/\/\[([^\]]+)\]/g, '/:$1')
      .replace(/^\//, '');
  }

  // Infer collection name from service name
  inferCollectionFromService(serviceName) {
    const serviceToCollection = {
      'productService': 'products',
      'partyService': 'parties',
      'invoiceService': 'invoices',
      'purchaseService': 'purchases',
      'orderService': 'orders',
      'categoryService': 'categories',
      'inventoryService': 'inventory',
      'stockService': 'inventory',
      'transactionService': 'transactions',
      'userService': 'users',
      'reportService': 'reports',
      'settingsService': 'settings',
      'backupService': 'backups',
    };
    
    return serviceToCollection[serviceName] || serviceName.replace('Service', '').toLowerCase() + 's';
  }
}

// Generate indexes based on analysis
class SmartIndexGenerator {
  constructor(analysisResults) {
    this.collections = analysisResults.collections;
    this.queryPatterns = analysisResults.queryPatterns;
    this.pageQueries = analysisResults.pageQueries;
  }

  // Generate all necessary indexes
  generateIndexes() {
    const indexes = [];

    console.log('⚡ Generating smart indexes based on code analysis...\n');

    // Generate indexes from detected query patterns
    Object.values(this.queryPatterns).forEach(pattern => {
      const index = this.createIndexFromPattern(pattern);
      if (index && !this.isDuplicate(index, indexes)) {
        indexes.push(index);
      }
    });

    // Add essential indexes for each collection
    this.collections.forEach(collection => {
      const essentialIndexes = this.generateEssentialIndexes(collection);
      essentialIndexes.forEach(index => {
        if (!this.isDuplicate(index, indexes)) {
          indexes.push(index);
        }
      });
    });

    // Add performance optimization indexes
    const optimizationIndexes = this.generateOptimizationIndexes();
    optimizationIndexes.forEach(index => {
      if (!this.isDuplicate(index, indexes)) {
        indexes.push(index);
      }
    });

    console.log(`✨ Generated ${indexes.length} smart indexes\n`);

    return { indexes };
  }

  // Create index from detected pattern
  createIndexFromPattern(pattern) {
    const fields = [];

    // Add where field
    if (pattern.whereField) {
      fields.push({
        fieldPath: pattern.whereField,
        order: 'ASCENDING'
      });
    }

    // Add order field if different from where field
    if (pattern.orderField && pattern.orderField !== pattern.whereField) {
      fields.push({
        fieldPath: pattern.orderField,
        order: pattern.orderDirection === 'desc' ? 'DESCENDING' : 'ASCENDING'
      });
    }

    if (fields.length > 0) {
      return {
        collectionGroup: pattern.collection,
        queryScope: 'COLLECTION',
        fields
      };
    }

    return null;
  }

  // Generate essential indexes for collection
  generateEssentialIndexes(collection) {
    const indexes = [];
    
    // Common patterns for all collections
    const commonPatterns = [
      { fields: ['createdAt'], order: 'DESCENDING' },
      { fields: ['updatedAt'], order: 'DESCENDING' },
    ];

    // Collection-specific patterns
    const specificPatterns = this.getCollectionSpecificPatterns(collection);

    [...commonPatterns, ...specificPatterns].forEach(pattern => {
      const fields = pattern.fields.map(field => ({
        fieldPath: typeof field === 'string' ? field : field.name,
        order: typeof field === 'string' ? (pattern.order || 'ASCENDING') : (field.order || 'ASCENDING')
      }));

      indexes.push({
        collectionGroup: collection,
        queryScope: 'COLLECTION',
        fields
      });
    });

    return indexes;
  }

  // Get collection-specific index patterns
  getCollectionSpecificPatterns(collection) {
    const patterns = {
      products: [
        { fields: ['isActive', 'name'] },
        { fields: ['categoryId', 'isActive'] },
        { fields: ['quantity', 'minStockLevel'] },
        { fields: ['isActive', 'price'] },
      ],
      parties: [
        { fields: ['isActive', 'name'] },
        { fields: ['customerType', 'isActive'] },
        { fields: ['supplierType', 'isActive'] },
      ],
      invoices: [
        { fields: ['userId', 'createdAt'], orders: ['ASCENDING', 'DESCENDING'] },
        { fields: ['partyId', 'status'] },
        { fields: ['status', 'createdAt'], orders: ['ASCENDING', 'DESCENDING'] },
        { fields: ['paymentStatus', 'dueDate'] },
      ],
      purchases: [
        { fields: ['userId', 'createdAt'], orders: ['ASCENDING', 'DESCENDING'] },
        { fields: ['supplierId', 'status'] },
        { fields: ['status', 'createdAt'], orders: ['ASCENDING', 'DESCENDING'] },
      ],
      orders: [
        { fields: ['userId', 'createdAt'], orders: ['ASCENDING', 'DESCENDING'] },
        { fields: ['customerId', 'status'] },
        { fields: ['status', 'priority'] },
      ],
      categories: [
        { fields: ['isActive', 'sortOrder'] },
        { fields: ['parentId', 'isActive'] },
      ],
      inventory: [
        { fields: ['productId', 'lastUpdated'], orders: ['ASCENDING', 'DESCENDING'] },
        { fields: ['quantity', 'minStockLevel'] },
      ],
      transactions: [
        { fields: ['partyId', 'createdAt'], orders: ['ASCENDING', 'DESCENDING'] },
        { fields: ['type', 'status'] },
      ],
    };

    return patterns[collection] || [];
  }

  // Generate performance optimization indexes
  generateOptimizationIndexes() {
    const indexes = [];

    // Add text search support
    this.collections.forEach(collection => {
      if (this.needsTextSearch(collection)) {
        indexes.push({
          collectionGroup: collection,
          queryScope: 'COLLECTION',
          fields: [
            { fieldPath: 'searchTerms', arrayConfig: 'CONTAINS' },
            { fieldPath: 'isActive', order: 'ASCENDING' },
            { fieldPath: 'createdAt', order: 'DESCENDING' }
          ]
        });
      }
    });

    return indexes;
  }

  // Check if collection needs text search
  needsTextSearch(collection) {
    const textSearchCollections = ['products', 'parties', 'invoices', 'purchases', 'orders'];
    return textSearchCollections.includes(collection);
  }

  // Check for duplicate indexes
  isDuplicate(index, existingIndexes) {
    return existingIndexes.some(existing => 
      existing.collectionGroup === index.collectionGroup &&
      JSON.stringify(existing.fields) === JSON.stringify(index.fields)
    );
  }
}

// Main execution function
async function main() {
  try {
    console.log('🤖 Smart Firestore Index Generator');
    console.log('==================================\n');

    const projectRoot = path.resolve(__dirname, '..');
    console.log(`📂 Project root: ${projectRoot}\n`);

    // Step 1: Analyze project
    const analyzer = new FirestoreQueryAnalyzer(projectRoot);
    const analysisResults = await analyzer.analyzeProject();

    // Step 2: Generate indexes
    const generator = new SmartIndexGenerator(analysisResults);
    const indexData = generator.generateIndexes();

    // Step 3: Save results
    const outputDir = path.join(projectRoot, 'generated-indexes');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save index file
    const indexPath = path.join(outputDir, 'smart-indexes.json');
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));

    // Save analysis report
    const analysisPath = path.join(outputDir, 'analysis-report.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysisResults, null, 2));

    // Generate deployment script
    const deployScript = `#!/bin/bash
echo "🚀 Deploying smart-generated Firestore indexes..."

# Backup existing indexes
if [ -f "firestore.indexes.json" ]; then
    cp firestore.indexes.json firestore.indexes.json.backup
    echo "📋 Existing indexes backed up"
fi

# Copy new indexes
cp ${indexPath} firestore.indexes.json

# Deploy to Firebase
firebase deploy --only firestore:indexes

echo "✅ Smart indexes deployed successfully!"
echo "📊 Total indexes: ${indexData.indexes.length}"
echo "🔍 Collections covered: ${analysisResults.collections.join(', ')}"
`;

    const deployPath = path.join(outputDir, 'deploy-smart-indexes.sh');
    fs.writeFileSync(deployPath, deployScript);
    fs.chmodSync(deployPath, '755');

    // Print summary
    console.log('🎉 Smart index generation completed!');
    console.log('===================================');
    console.log(`📈 Analysis Results:`);
    console.log(`   • Collections found: ${analysisResults.collections.length}`);
    console.log(`   • Query patterns detected: ${Object.keys(analysisResults.queryPatterns).length}`);
    console.log(`   • Page-specific patterns: ${Object.keys(analysisResults.pageQueries).length}`);
    console.log(`\n📊 Generated Indexes:`);
    console.log(`   • Total indexes: ${indexData.indexes.length}`);
    console.log(`   • Collections covered: ${analysisResults.collections.join(', ')}`);
    console.log(`\n📁 Output Files:`);
    console.log(`   • ${indexPath}`);
    console.log(`   • ${analysisPath}`);
    console.log(`   • ${deployPath}`);
    console.log(`\n🚀 Next Steps:`);
    console.log(`   1. Review generated indexes`);
    console.log(`   2. Run: ${deployPath}`);
    console.log(`   3. Monitor performance in Firebase Console`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { FirestoreQueryAnalyzer, SmartIndexGenerator };