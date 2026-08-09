#!/usr/bin/env node

/**
 * Migration script to remove GST rate from all categories
 * This script will remove the defaultGstRate field from all category documents
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeCategoryGstRates() {
  try {
    console.log('🚀 Starting migration to remove GST rates from categories...');
    
    // Get all categories
    const categoriesRef = db.collection('categories');
    const snapshot = await categoriesRef.get();
    
    if (snapshot.empty) {
      console.log('📝 No categories found.');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} categories to process.`);
    
    const batch = db.batch();
    let processedCount = 0;
    let updatedCount = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      processedCount++;
      
      // Check if the category has a defaultGstRate field
      if (data.hasOwnProperty('defaultGstRate')) {
        console.log(`🔄 Removing GST rate from category: ${data.name} (${data.defaultGstRate}%)`);
        
        // Remove the defaultGstRate field
        batch.update(doc.ref, {
          defaultGstRate: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        updatedCount++;
      } else {
        console.log(`✅ Category "${data.name}" already has no GST rate field.`);
      }
    });
    
    if (updatedCount > 0) {
      console.log(`💾 Committing batch update for ${updatedCount} categories...`);
      await batch.commit();
      console.log('✅ Batch update completed successfully!');
    } else {
      console.log('ℹ️  No categories needed updating.');
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`   Total categories processed: ${processedCount}`);
    console.log(`   Categories updated: ${updatedCount}`);
    console.log(`   Categories unchanged: ${processedCount - updatedCount}`);
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Run the migration
removeCategoryGstRates()
  .then(() => {
    console.log('✨ Migration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });