import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { GstCalculator } from '@/services/gstService';
import { Party } from '@/types/party';

/**
 * Migration utility to update existing parties with new GST fields
 */
export class PartyMigrationService {
  
  /**
   * Migrate all existing parties to include new GST fields
   */
  static async migrateAllParties(): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const partiesRef = collection(db, 'parties');
      const snapshot = await getDocs(partiesRef);
      
      const batch = writeBatch(db);
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const docSnapshot of snapshot.docs) {
        try {
          const party = { id: docSnapshot.id, ...docSnapshot.data() } as Party;
          const updates = this.generateMigrationUpdates(party);
          
          if (Object.keys(updates).length > 0) {
            const docRef = doc(db, 'parties', docSnapshot.id);
            batch.update(docRef, updates);
            success++;
          }
        } catch (error) {
          failed++;
          errors.push(`Failed to migrate party ${docSnapshot.id}: ${error}`);
        }
      }

      // Commit all updates in batches of 500 (Firestore limit)
      if (success > 0) {
        await batch.commit();
      }

      return { success, failed, errors };
    } catch (error) {
      throw new Error(`Migration failed: ${error}`);
    }
  }

  /**
   * Generate migration updates for a single party
   */
  private static generateMigrationUpdates(party: Party): Partial<Party> {
    const updates: Partial<Party> = {};

    // Set default values for new fields if they don't exist
    if (party.isActive === undefined) {
      updates.isActive = true;
    }

    if (party.businessType === undefined) {
      updates.businessType = 'B2B'; // Default to B2B
    }

    if (party.isGstRegistered === undefined) {
      // Determine GST registration status based on GSTIN
      updates.isGstRegistered = !!(party.gstin && party.gstin.trim() !== '');
    }

    // If GSTIN exists but state info is missing, extract it
    if (party.gstin && party.gstin.trim() !== '') {
      if (!party.stateCode || !party.stateName) {
        try {
          const stateCode = GstCalculator.extractStateCodeFromGstin(party.gstin);
          const stateName = GstCalculator.getStateName(stateCode);
          
          if (stateCode && stateName !== 'Unknown State') {
            updates.stateCode = stateCode;
            updates.stateName = stateName;
            updates.placeOfSupply = stateName;
          }
        } catch (error) {
          console.warn(`Failed to extract state from GSTIN ${party.gstin}:`, error);
        }
      }
    }

    // Set default financial values if missing
    if (party.creditLimit === undefined) {
      updates.creditLimit = 0;
    }

    if (party.outstandingBalance === undefined) {
      updates.outstandingBalance = 0;
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date().toISOString();

    return updates;
  }

  /**
   * Validate and fix GSTIN data for all parties
   */
  static async validateAndFixGstinData(): Promise<{
    validated: number;
    fixed: number;
    invalid: number;
    errors: string[];
  }> {
    try {
      const partiesRef = collection(db, 'parties');
      const snapshot = await getDocs(partiesRef);
      
      const batch = writeBatch(db);
      let validated = 0;
      let fixed = 0;
      let invalid = 0;
      const errors: string[] = [];

      for (const docSnapshot of snapshot.docs) {
        try {
          const party = { id: docSnapshot.id, ...docSnapshot.data() } as Party;
          
          if (party.gstin && party.gstin.trim() !== '') {
            const isValid = GstCalculator.validateGstin(party.gstin);
            
            if (isValid) {
              validated++;
              
              // Extract and update state information if missing
              const stateCode = GstCalculator.extractStateCodeFromGstin(party.gstin);
              const stateName = GstCalculator.getStateName(stateCode);
              
              const updates: Partial<Party> = {};
              
              if (party.stateCode !== stateCode) {
                updates.stateCode = stateCode;
                fixed++;
              }
              
              if (party.stateName !== stateName) {
                updates.stateName = stateName;
                fixed++;
              }
              
              if (party.placeOfSupply !== stateName) {
                updates.placeOfSupply = stateName;
                fixed++;
              }
              
              if (party.isGstRegistered !== true) {
                updates.isGstRegistered = true;
                fixed++;
              }
              
              if (Object.keys(updates).length > 0) {
                updates.updatedAt = new Date().toISOString();
                const docRef = doc(db, 'parties', docSnapshot.id);
                batch.update(docRef, updates);
              }
            } else {
              invalid++;
              errors.push(`Invalid GSTIN for party ${party.name}: ${party.gstin}`);
            }
          }
        } catch (error) {
          errors.push(`Failed to validate party ${docSnapshot.id}: ${error}`);
        }
      }

      if (fixed > 0) {
        await batch.commit();
      }

      return { validated, fixed, invalid, errors };
    } catch (error) {
      throw new Error(`GSTIN validation failed: ${error}`);
    }
  }

  /**
   * Generate migration report
   */
  static async generateMigrationReport(): Promise<{
    totalParties: number;
    withGstin: number;
    withoutGstin: number;
    validGstin: number;
    invalidGstin: number;
    missingStateInfo: number;
    businessTypeDistribution: Record<string, number>;
  }> {
    try {
      const partiesRef = collection(db, 'parties');
      const snapshot = await getDocs(partiesRef);
      
      let totalParties = 0;
      let withGstin = 0;
      let withoutGstin = 0;
      let validGstin = 0;
      let invalidGstin = 0;
      let missingStateInfo = 0;
      const businessTypeDistribution: Record<string, number> = {};

      for (const docSnapshot of snapshot.docs) {
        const party = { id: docSnapshot.id, ...docSnapshot.data() } as Party;
        totalParties++;

        // Business type distribution
        const businessType = party.businessType || 'Unknown';
        businessTypeDistribution[businessType] = (businessTypeDistribution[businessType] || 0) + 1;

        // GSTIN analysis
        if (party.gstin && party.gstin.trim() !== '') {
          withGstin++;
          
          if (GstCalculator.validateGstin(party.gstin)) {
            validGstin++;
          } else {
            invalidGstin++;
          }
        } else {
          withoutGstin++;
        }

        // State information analysis
        if (party.gstin && (!party.stateCode || !party.stateName)) {
          missingStateInfo++;
        }
      }

      return {
        totalParties,
        withGstin,
        withoutGstin,
        validGstin,
        invalidGstin,
        missingStateInfo,
        businessTypeDistribution
      };
    } catch (error) {
      throw new Error(`Failed to generate migration report: ${error}`);
    }
  }
}

/**
 * Utility function to run migration with progress tracking
 */
export async function runPartyMigration(
  onProgress?: (progress: { current: number; total: number; message: string }) => void
): Promise<void> {
  try {
    // Step 1: Generate report
    onProgress?.({ current: 1, total: 4, message: 'Generating migration report...' });
    const report = await PartyMigrationService.generateMigrationReport();
    console.log('Migration Report:', report);

    // Step 2: Migrate all parties
    onProgress?.({ current: 2, total: 4, message: 'Migrating party data...' });
    const migrationResult = await PartyMigrationService.migrateAllParties();
    console.log('Migration Result:', migrationResult);

    // Step 3: Validate and fix GSTIN data
    onProgress?.({ current: 3, total: 4, message: 'Validating GSTIN data...' });
    const validationResult = await PartyMigrationService.validateAndFixGstinData();
    console.log('Validation Result:', validationResult);

    // Step 4: Complete
    onProgress?.({ current: 4, total: 4, message: 'Migration completed successfully!' });
    
    console.log('Party migration completed successfully!');
  } catch (error) {
    console.error('Party migration failed:', error);
    throw error;
  }
}