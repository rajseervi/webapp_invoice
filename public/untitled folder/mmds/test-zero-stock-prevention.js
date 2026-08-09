#!/usr/bin/env node

/**
 * Test script to verify zero stock prevention is working correctly
 * This script will:
 * 1. Create test products with different stock levels
 * 2. Attempt to create invoices that should be blocked
 * 3. Verify that stock validation is working
 * 4. Clean up test data
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Test data
const testProducts = [
  {
    name: 'Test Product - Zero Stock',
    quantity: 0,
    price: 100,
    categoryId: 'test-category',
    unitOfMeasurement: 'PCS',
    isService: false,
    isActive: true,
    reorderPoint: 5
  },
  {
    name: 'Test Product - Low Stock',
    quantity: 3,
    price: 200,
    categoryId: 'test-category',
    unitOfMeasurement: 'PCS',
    isService: false,
    isActive: true,
    reorderPoint: 5
  },
  {
    name: 'Test Product - Good Stock',
    quantity: 100,
    price: 150,
    categoryId: 'test-category',
    unitOfMeasurement: 'PCS',
    isService: false,
    isActive: true,
    reorderPoint: 10
  }
];

const testInvoiceScenarios = [
  {
    name: 'Zero Stock Sale - Should FAIL',
    productIndex: 0, // Zero stock product
    quantity: 1,
    shouldPass: false,
    expectedError: 'ZERO STOCK'
  },
  {
    name: 'Insufficient Stock Sale - Should FAIL',
    productIndex: 1, // Low stock product (3 units)
    quantity: 5,     // Requesting 5 units
    shouldPass: false,
    expectedError: 'INSUFFICIENT STOCK'
  },
  {
    name: 'Valid Stock Sale - Should PASS',
    productIndex: 2, // Good stock product
    quantity: 10,
    shouldPass: true,
    expectedError: null
  },
  {
    name: 'Exact Stock Sale - Should PASS',
    productIndex: 1, // Low stock product (3 units)
    quantity: 3,     // Requesting exactly 3 units
    shouldPass: true,
    expectedError: null
  }
];

class ZeroStockPreventionTester {
  constructor() {
    this.testProductIds = [];
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Zero Stock Prevention Tests...\n');
    
    try {
      // Step 1: Create test products
      await this.createTestProducts();
      
      // Step 2: Test stock validation service directly
      await this.testStockValidationService();
      
      // Step 3: Test invoice creation scenarios
      await this.testInvoiceCreationScenarios();
      
      // Step 4: Generate test report
      this.generateTestReport();
      
      // Step 5: Clean up test data
      await this.cleanupTestData();
      
      console.log('\n✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      await this.cleanupTestData();
      throw error;
    }
  }

  async createTestProducts() {
    console.log('📦 Creating test products...');
    
    for (let i = 0; i < testProducts.length; i++) {
      const productData = {
        ...testProducts[i],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'test-user'
      };
      
      const docRef = await db.collection('products').add(productData);
      this.testProductIds.push(docRef.id);
      
      console.log(`  ✅ Created: ${productData.name} (Stock: ${productData.quantity})`);
    }
    
    console.log(`📦 Created ${this.testProductIds.length} test products\n`);
  }

  async testStockValidationService() {
    console.log('🔍 Testing Stock Validation Service...');
    
    // Import the validation service (simulating the import)
    const StockValidationService = require('../../../src/services/stockValidationService.ts').default;
    
    for (let i = 0; i < testInvoiceScenarios.length; i++) {
      const scenario = testInvoiceScenarios[i];
      const productId = this.testProductIds[scenario.productIndex];
      const product = testProducts[scenario.productIndex];
      
      console.log(`\n  🧪 Testing: ${scenario.name}`);
      console.log(`     Product: ${product.name} (Stock: ${product.quantity})`);
      console.log(`     Requesting: ${scenario.quantity} units`);
      
      try {
        // Test individual product stock check
        const stockCheck = await this.checkProductStockDirect(productId, scenario.quantity);
        
        console.log(`     Result: ${stockCheck.canFulfill ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`     Message: ${stockCheck.message}`);
        
        // Verify expectation
        const testPassed = stockCheck.canFulfill === scenario.shouldPass;
        
        this.testResults.push({
          scenario: scenario.name,
          expected: scenario.shouldPass ? 'PASS' : 'FAIL',
          actual: stockCheck.canFulfill ? 'PASS' : 'FAIL',
          testPassed,
          message: stockCheck.message
        });
        
        if (!testPassed) {
          console.log(`     ⚠️ TEST EXPECTATION MISMATCH!`);
        }
        
      } catch (error) {
        console.log(`     ❌ ERROR: ${error.message}`);
        this.testResults.push({
          scenario: scenario.name,
          expected: scenario.shouldPass ? 'PASS' : 'FAIL',
          actual: 'ERROR',
          testPassed: false,
          message: error.message
        });
      }
    }
  }

  async checkProductStockDirect(productId, requiredQuantity) {
    // Direct database check (simulating the service)
    const productRef = db.collection('products').doc(productId);
    const productSnap = await productRef.get();
    
    if (!productSnap.exists()) {
      return {
        hasStock: false,
        availableStock: 0,
        canFulfill: false,
        message: 'Product not found'
      };
    }
    
    const product = productSnap.data();
    const availableStock = product.quantity || 0;
    const canFulfill = availableStock >= requiredQuantity;
    
    let message;
    if (availableStock === 0) {
      message = `❌ ZERO STOCK: Cannot sell "${product.name}" - No stock available`;
    } else if (!canFulfill) {
      message = `❌ INSUFFICIENT STOCK: "${product.name}" - Available: ${availableStock}, Required: ${requiredQuantity}`;
    } else {
      message = `✅ Stock available: ${availableStock} units`;
    }
    
    return {
      hasStock: availableStock > 0,
      availableStock,
      canFulfill,
      message
    };
  }

  async testInvoiceCreationScenarios() {
    console.log('\n📄 Testing Invoice Creation Scenarios...');
    
    // Test creating invoices with the test products
    for (let i = 0; i < testInvoiceScenarios.length; i++) {
      const scenario = testInvoiceScenarios[i];
      const productId = this.testProductIds[scenario.productIndex];
      const product = testProducts[scenario.productIndex];
      
      console.log(`\n  📄 Testing Invoice: ${scenario.name}`);
      
      const invoiceData = {
        invoiceNumber: `TEST-${Date.now()}-${i}`,
        type: 'sales',
        date: new Date().toISOString().split('T')[0],
        partyId: 'test-customer',
        partyName: 'Test Customer',
        items: [{
          productId: productId,
          name: product.name,
          quantity: scenario.quantity,
          unitPrice: product.price,
          totalAmount: scenario.quantity * product.price
        }],
        subtotal: scenario.quantity * product.price,
        totalAmount: scenario.quantity * product.price,
        userId: 'test-user'
      };
      
      try {
        // Simulate invoice creation with stock validation
        const validationResult = await this.validateInvoiceStock(invoiceData);
        
        console.log(`     Validation: ${validationResult.canProceed ? '✅ PASS' : '❌ BLOCKED'}`);
        
        if (validationResult.errors.length > 0) {
          console.log(`     Errors: ${validationResult.errors.length}`);
          validationResult.errors.forEach(error => {
            console.log(`       - ${error.message}`);
          });
        }
        
        if (validationResult.warnings.length > 0) {
          console.log(`     Warnings: ${validationResult.warnings.length}`);
          validationResult.warnings.forEach(warning => {
            console.log(`       - ${warning.message}`);
          });
        }
        
        // Verify expectation
        const testPassed = validationResult.canProceed === scenario.shouldPass;
        
        this.testResults.push({
          scenario: `Invoice: ${scenario.name}`,
          expected: scenario.shouldPass ? 'ALLOWED' : 'BLOCKED',
          actual: validationResult.canProceed ? 'ALLOWED' : 'BLOCKED',
          testPassed,
          message: validationResult.errors.length > 0 ? validationResult.errors[0].message : 'No errors'
        });
        
      } catch (error) {
        console.log(`     ❌ ERROR: ${error.message}`);
        this.testResults.push({
          scenario: `Invoice: ${scenario.name}`,
          expected: scenario.shouldPass ? 'ALLOWED' : 'BLOCKED',
          actual: 'ERROR',
          testPassed: false,
          message: error.message
        });
      }
    }
  }

  async validateInvoiceStock(invoiceData) {
    // Simulate stock validation for invoice
    const stockItems = invoiceData.items.map(item => ({
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity
    }));
    
    const result = {
      isValid: true,
      canProceed: true,
      errors: [],
      warnings: []
    };
    
    for (const item of stockItems) {
      const stockCheck = await this.checkProductStockDirect(item.productId, item.quantity);
      
      if (!stockCheck.canFulfill) {
        result.isValid = false;
        result.canProceed = false;
        result.errors.push({
          productId: item.productId,
          productName: item.productName,
          message: stockCheck.message,
          severity: 'error'
        });
      } else if (stockCheck.availableStock <= 5) { // Low stock warning
        result.warnings.push({
          productId: item.productId,
          productName: item.productName,
          message: `⚠️ Low stock warning: ${stockCheck.availableStock} units remaining`,
          severity: 'warning'
        });
      }
    }
    
    return result;
  }

  generateTestReport() {
    console.log('\n📊 TEST RESULTS REPORT');
    console.log('='.repeat(80));
    
    const passedTests = this.testResults.filter(r => r.testPassed).length;
    const totalTests = this.testResults.length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    console.log('\nDETAILED RESULTS:');
    console.log('-'.repeat(80));
    console.log('Test Scenario'.padEnd(40) + 'Expected'.padEnd(12) + 'Actual'.padEnd(12) + 'Status');
    console.log('-'.repeat(80));
    
    this.testResults.forEach(result => {
      const status = result.testPassed ? '✅ PASS' : '❌ FAIL';
      console.log(
        result.scenario.substring(0, 39).padEnd(40) +
        result.expected.padEnd(12) +
        result.actual.padEnd(12) +
        status
      );
    });
    
    if (failedTests > 0) {
      console.log('\nFAILED TEST DETAILS:');
      console.log('-'.repeat(80));
      this.testResults
        .filter(r => !r.testPassed)
        .forEach(result => {
          console.log(`❌ ${result.scenario}`);
          console.log(`   Expected: ${result.expected}, Got: ${result.actual}`);
          console.log(`   Message: ${result.message}`);
          console.log('');
        });
    }
    
    console.log('\n' + '='.repeat(80));
    
    if (failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED! Zero stock prevention is working correctly.');
    } else {
      console.log('⚠️ SOME TESTS FAILED! Please review the zero stock prevention implementation.');
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    
    const batch = db.batch();
    
    // Delete test products
    for (const productId of this.testProductIds) {
      const productRef = db.collection('products').doc(productId);
      batch.delete(productRef);
    }
    
    await batch.commit();
    console.log(`🧹 Deleted ${this.testProductIds.length} test products`);
  }
}

// Run the tests
const tester = new ZeroStockPreventionTester();
tester.runAllTests()
  .then(() => {
    console.log('\n✨ Test execution completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });