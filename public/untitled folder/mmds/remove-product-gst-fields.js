#!/usr/bin/env node

/**
 * Migration script to remove GST-related fields from all products
 * This script will remove gstRate, gstExempt, cessRate, hsnCode, and sacCode fields from all product documents
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeProductGstFields() {
  try {
    console.log('🚀 Starting migration to remove GST fields from products...');
    
    // Get all products
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();
    
    if (snapshot.empty) {
      console.log('📝 No products found.');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} products to process.`);
    
    const batch = db.batch();
    let processedCount = 0;
    let updatedCount = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      processedCount++;
      
      // Check if the product has any GST-related fields
      const hasGstFields = data.hasOwnProperty('gstRate') || 
                          data.hasOwnProperty('gstExempt') || 
                          data.hasOwnProperty('cessRate') || 
                          data.hasOwnProperty('hsnCode') || 
                          data.hasOwnProperty('sacCode');
      
      if (hasGstFields) {
        console.log(`🔄 Removing GST fields from product: ${data.name}`);
        
        // Remove the GST-related fields
        const updateData = {
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Add field deletions
        if (data.hasOwnProperty('gstRate')) {
          updateData.gstRate = admin.firestore.FieldValue.delete();
        }
        if (data.hasOwnProperty('gstExempt')) {
          updateData.gstExempt = admin.firestore.FieldValue.delete();
        }
        if (data.hasOwnProperty('cessRate')) {
          updateData.cessRate = admin.firestore.FieldValue.delete();
        }
        if (data.hasOwnProperty('hsnCode')) {
          updateData.hsnCode = admin.firestore.FieldValue.delete();
        }
        if (data.hasOwnProperty('sacCode')) {
          updateData.sacCode = admin.firestore.FieldValue.delete();
        }
        
        batch.update(doc.ref, updateData);
        updatedCount++;
      } else {
        console.log(`✅ Product "${data.name}" already has no GST fields.`);
      }
    });
    
    if (updatedCount > 0) {
      console.log(`💾 Committing batch update for ${updatedCount} products...`);
      await batch.commit();
      console.log('✅ Batch update completed successfully!');
    } else {
      console.log('ℹ️  No products needed updating.');
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`   Total products processed: ${processedCount}`);
    console.log(`   Products updated: ${updatedCount}`);
    console.log(`   Products unchanged: ${processedCount - updatedCount}`);
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Run the migration
removeProductGstFields()
  .then(() => {
    console.log('✨ Migration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });