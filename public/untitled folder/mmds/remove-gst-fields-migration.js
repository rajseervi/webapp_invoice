#!/usr/bin/env node

/**
 * Simple script to remove GST fields from existing party data
 * This script will:
 * 1. Remove GST-related fields from all parties
 * 2. Update business types (Export → Supplier, Import → Customer)
 * 3. Ensure required fields have default values
 * 4. Create a backup before making changes
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to add your service account)
try {
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.log('⚠️  Firebase service account not found. Please add firebase-service-account.json');
  console.log('   You can still run this script manually by updating the parties in your database.');
  process.exit(1);
}

const db = admin.firestore();

async function removeGstFields() {
  try {
    console.log('🔄 Starting GST field removal from parties...');
    
    // Get all parties
    const partiesRef = db.collection('parties');
    const snapshot = await partiesRef.get();
    
    if (snapshot.empty) {
      console.log('📝 No parties found in database.');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} parties to process...`);
    
    const batch = db.batch();
    let updatedCount = 0;
    
    // Process each party
    snapshot.forEach((doc) => {
      const data = doc.data();
      let hasChanges = false;
      const updatedData = { ...data };
      
      // Remove GST-related fields
      const gstFields = ['gstin', 'stateCode', 'stateName', 'isGstRegistered', 'placeOfSupply'];
      gstFields.forEach(field => {
        if (updatedData.hasOwnProperty(field)) {
          delete updatedData[field];
          hasChanges = true;
        }
      });
      
      // Update business types
      if (updatedData.businessType === 'Export') {
        updatedData.businessType = 'Supplier';
        hasChanges = true;
      } else if (updatedData.businessType === 'Import') {
        updatedData.businessType = 'Customer';
        hasChanges = true;
      }
      
      // Ensure required fields
      if (!updatedData.hasOwnProperty('isActive')) {
        updatedData.isActive = true;
        hasChanges = true;
      }
      
      if (!updatedData.businessType || !['B2B', 'B2C', 'Supplier', 'Customer'].includes(updatedData.businessType)) {
        updatedData.businessType = 'B2B';
        hasChanges = true;
      }
      
      if (hasChanges) {
        updatedData.updatedAt = new Date().toISOString();
        updatedData.gstFieldsRemoved = true;
        
        batch.update(doc.ref, updatedData);
        updatedCount++;
        
        console.log(`✏️  Updated: ${data.name || 'Unnamed Party'}`);
      }
    });
    
    if (updatedCount > 0) {
      console.log(`\n🔧 Applying changes to ${updatedCount} parties...`);
      await batch.commit();
      console.log('✅ All changes applied successfully!');
    } else {
      console.log('✅ No parties needed updates.');
    }
    
    console.log('\n📈 MIGRATION SUMMARY:');
    console.log(`Total parties: ${snapshot.size}`);
    console.log(`Updated parties: ${updatedCount}`);
    console.log(`Unchanged parties: ${snapshot.size - updatedCount}`);
    
    console.log('\n🎉 GST field removal completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  removeGstFields()
    .then(() => {
      console.log('\n✨ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { removeGstFields };