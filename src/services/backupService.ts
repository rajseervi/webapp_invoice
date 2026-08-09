import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch, 
  query, 
  where,
  orderBy,
  limit,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { executeWithRetry } from '@/utils/firestoreHelpers';

// Define all collections to backup
export const BACKUP_COLLECTIONS = [
  'categories',
  'invoices',
  'ledger_accounts',
  'orders',
  'parties',
  'permissionTemplates',
  'products',
  'purchase_invoices',
  'settings',
  'suppliers',
  'transactions',
  'users'
] as const;

export type BackupCollection = typeof BACKUP_COLLECTIONS[number];

export interface BackupMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  collections: BackupCollection[];
  totalDocuments: number;
  fileSize: number;
  version: string;
  isAutoBackup: boolean;
}

export interface BackupData {
  metadata: BackupMetadata;
  data: Record<BackupCollection, any[]>;
}

export interface BackupProgress {
  collection: string;
  processed: number;
  total: number;
  percentage: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

export interface RestoreProgress {
  collection: string;
  processed: number;
  total: number;
  percentage: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

export class BackupService {
  private static instance: BackupService;
  
  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Remove undefined fields from an object to prevent Firestore errors
   */
  private removeUndefinedFields(obj: any): any {
    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          // Recursively clean nested objects
          const cleanedNested = this.removeUndefinedFields(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned;
  }

  /**
   * Create a full backup of all specified collections
   */
  async createBackup(
    name: string,
    userId: string,
    description?: string,
    collections: BackupCollection[] = [...BACKUP_COLLECTIONS],
    onProgress?: (progress: BackupProgress) => void
  ): Promise<BackupData> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const backupData: BackupData = {
      metadata: {
        id: backupId,
        name,
        description: description || undefined, // Ensure it's either string or undefined
        createdAt: new Date().toISOString(),
        createdBy: userId,
        collections,
        totalDocuments: 0,
        fileSize: 0,
        version: '1.0.0',
        isAutoBackup: false
      },
      data: {} as Record<BackupCollection, any[]>
    };

    let totalDocuments = 0;

    try {
      // Process each collection
      for (const collectionName of collections) {
        onProgress?.({
          collection: collectionName,
          processed: 0,
          total: 0,
          percentage: 0,
          status: 'processing',
          message: `Starting backup of ${collectionName}...`
        });

        try {
          const documents = await this.backupCollection(collectionName, userId);
          backupData.data[collectionName] = documents;
          totalDocuments += documents.length;

          onProgress?.({
            collection: collectionName,
            processed: documents.length,
            total: documents.length,
            percentage: 100,
            status: 'completed',
            message: `Backed up ${documents.length} documents from ${collectionName}`
          });
        } catch (error: any) {
          console.error(`Error backing up collection ${collectionName}:`, error);
          onProgress?.({
            collection: collectionName,
            processed: 0,
            total: 0,
            percentage: 0,
            status: 'error',
            message: `Failed to backup ${collectionName}: ${error.message}`
          });
          
          // Continue with other collections even if one fails
          backupData.data[collectionName] = [];
        }
      }

      // Update metadata
      backupData.metadata.totalDocuments = totalDocuments;
      backupData.metadata.fileSize = this.calculateDataSize(backupData);

      // Save backup metadata to Firestore
      await this.saveBackupMetadata(backupData.metadata);

      return backupData;
    } catch (error: any) {
      console.error('Error creating backup:', error);
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  /**
   * Backup a specific collection
   */
  private async backupCollection(collectionName: string, userId?: string): Promise<any[]> {
    try {
      return await executeWithRetry(async () => {
        let collectionRef = collection(db, collectionName);
        let q = query(collectionRef);

        // Add user filter for user-specific collections
        if (userId && this.isUserSpecificCollection(collectionName)) {
          q = query(collectionRef, where('userId', '==', userId));
        }

        // Add ordering for consistent backups
        try {
          q = query(q, orderBy('createdAt', 'desc'));
        } catch {
          // If createdAt doesn't exist, try updatedAt
          try {
            q = query(q, orderBy('updatedAt', 'desc'));
          } catch {
            // If neither exists, use the query without ordering
          }
        }

        const snapshot = await getDocs(q);
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to ISO strings for JSON serialization
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
        }));

        return documents;
      }, 3);
    } catch (error) {
      console.error(`Error backing up collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Restore data from backup
   */
  async restoreBackup(
    backupData: BackupData,
    userId: string,
    options: {
      overwriteExisting?: boolean;
      collectionsToRestore?: BackupCollection[];
      createBackupBeforeRestore?: boolean;
    } = {},
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<void> {
    const {
      overwriteExisting = false,
      collectionsToRestore = [...BACKUP_COLLECTIONS],
      createBackupBeforeRestore = true
    } = options;

    try {
      // Create backup before restore if requested
      if (createBackupBeforeRestore) {
        onProgress?.({
          collection: 'pre-restore-backup',
          processed: 0,
          total: 1,
          percentage: 0,
          status: 'processing',
          message: 'Creating backup before restore...'
        });

        await this.createBackup(
          `Pre-restore backup ${new Date().toISOString()}`,
          userId,
          'Automatic backup created before restore operation'
        );

        onProgress?.({
          collection: 'pre-restore-backup',
          processed: 1,
          total: 1,
          percentage: 100,
          status: 'completed',
          message: 'Pre-restore backup completed'
        });
      }

      // Restore each collection
      for (const collectionName of collectionsToRestore) {
        if (!backupData.data[collectionName]) {
          onProgress?.({
            collection: collectionName,
            processed: 0,
            total: 0,
            percentage: 100,
            status: 'completed',
            message: `No data found for ${collectionName}, skipping...`
          });
          continue;
        }

        const documents = backupData.data[collectionName];
        
        onProgress?.({
          collection: collectionName,
          processed: 0,
          total: documents.length,
          percentage: 0,
          status: 'processing',
          message: `Starting restore of ${collectionName}...`
        });

        try {
          await this.restoreCollection(
            collectionName,
            documents,
            overwriteExisting,
            (processed) => {
              onProgress?.({
                collection: collectionName,
                processed,
                total: documents.length,
                percentage: Math.round((processed / documents.length) * 100),
                status: 'processing',
                message: `Restoring ${collectionName}: ${processed}/${documents.length}`
              });
            }
          );

          onProgress?.({
            collection: collectionName,
            processed: documents.length,
            total: documents.length,
            percentage: 100,
            status: 'completed',
            message: `Restored ${documents.length} documents to ${collectionName}`
          });
        } catch (error: any) {
          console.error(`Error restoring collection ${collectionName}:`, error);
          onProgress?.({
            collection: collectionName,
            processed: 0,
            total: documents.length,
            percentage: 0,
            status: 'error',
            message: `Failed to restore ${collectionName}: ${error.message}`
          });
        }
      }
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      throw new Error(`Failed to restore backup: ${error.message}`);
    }
  }

  /**
   * Restore a specific collection
   */
  private async restoreCollection(
    collectionName: string,
    documents: any[],
    overwriteExisting: boolean,
    onProgress?: (processed: number) => void
  ): Promise<void> {
    const batchSize = 500; // Firestore batch limit
    let processed = 0;

    try {
      // Process documents in batches
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocuments = documents.slice(i, i + batchSize);

        for (const docData of batchDocuments) {
          const { id, ...data } = docData;
          const docRef = doc(db, collectionName, id);

          // Clean data to remove undefined values
          const cleanData = this.removeUndefinedFields(data);

          // Convert ISO strings back to Firestore timestamps
          if (cleanData.createdAt && typeof cleanData.createdAt === 'string') {
            cleanData.createdAt = new Date(cleanData.createdAt);
          }
          if (cleanData.updatedAt && typeof cleanData.updatedAt === 'string') {
            cleanData.updatedAt = new Date(cleanData.updatedAt);
          }

          if (overwriteExisting) {
            batch.set(docRef, cleanData);
          } else {
            // Only set if document doesn't exist
            batch.set(docRef, cleanData, { merge: false });
          }
        }

        await batch.commit();
        processed += batchDocuments.length;
        onProgress?.(processed);
      }
    } catch (error) {
      console.error(`Error restoring collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get list of available backups
   */
  async getBackupList(userId?: string): Promise<BackupMetadata[]> {
    try {
      let q = query(collection(db, 'backups'), orderBy('createdAt', 'desc'));
      
      if (userId) {
        q = query(collection(db, 'backups'), where('createdBy', '==', userId), orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BackupMetadata[];
    } catch (error: any) {
      console.error('Error getting backup list:', error);
      throw new Error(`Failed to get backup list: ${error.message}`);
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'backups', backupId));
    } catch (error: any) {
      console.error('Error deleting backup:', error);
      throw new Error(`Failed to delete backup: ${error.message}`);
    }
  }

  /**
   * Export backup data to JSON file
   */
  exportToFile(backupData: BackupData, filename?: string): void {
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = filename || `backup_${backupData.metadata.name}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(link.href);
  }

  /**
   * Recreate full backup data from metadata and export it
   */
  async recreateAndExportBackup(
    metadata: BackupMetadata,
    userId: string,
    onProgress?: (progress: BackupProgress) => void
  ): Promise<void> {
    try {
      // Recreate the backup data by fetching current data from collections
      const backupData: BackupData = {
        metadata: {
          ...metadata,
          // Update metadata for export
          id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${metadata.name} (Export)`,
          createdAt: new Date().toISOString(),
          description: `Exported backup based on: ${metadata.name}`
        },
        data: {} as Record<BackupCollection, any[]>
      };

      let totalDocuments = 0;

      // Process each collection from the original backup
      for (const collectionName of metadata.collections) {
        onProgress?.({
          collection: collectionName,
          processed: 0,
          total: 0,
          percentage: 0,
          status: 'processing',
          message: `Exporting ${collectionName}...`
        });

        try {
          const documents = await this.backupCollection(collectionName, userId);
          backupData.data[collectionName] = documents;
          totalDocuments += documents.length;

          onProgress?.({
            collection: collectionName,
            processed: documents.length,
            total: documents.length,
            percentage: 100,
            status: 'completed',
            message: `Exported ${documents.length} documents from ${collectionName}`
          });
        } catch (error: any) {
          console.error(`Error exporting collection ${collectionName}:`, error);
          onProgress?.({
            collection: collectionName,
            processed: 0,
            total: 0,
            percentage: 0,
            status: 'error',
            message: `Failed to export ${collectionName}: ${error.message}`
          });
          
          // Continue with other collections even if one fails
          backupData.data[collectionName] = [];
        }
      }

      // Update metadata
      backupData.metadata.totalDocuments = totalDocuments;
      backupData.metadata.fileSize = this.calculateDataSize(backupData);

      // Export to file
      this.exportToFile(backupData, `export_${metadata.name}_${new Date().toISOString().split('T')[0]}.json`);
    } catch (error: any) {
      console.error('Error recreating and exporting backup:', error);
      throw new Error(`Failed to export backup: ${error.message}`);
    }
  }

  /**
   * Import backup data from JSON file
   */
  async importFromFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const backupData = JSON.parse(event.target?.result as string) as BackupData;
          
          // Validate backup data structure
          if (!this.validateBackupData(backupData)) {
            reject(new Error('Invalid backup file format'));
            return;
          }
          
          resolve(backupData);
        } catch (error) {
          reject(new Error('Failed to parse backup file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read backup file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Create automatic backup
   */
  async createAutoBackup(userId: string): Promise<BackupData> {
    const name = `Auto Backup ${new Date().toISOString()}`;
    const description = 'Automatic backup created by system';
    
    const backup = await this.createBackup(name, userId, description);
    backup.metadata.isAutoBackup = true;
    
    // Update metadata in Firestore
    await this.saveBackupMetadata(backup.metadata);
    
    return backup;
  }

  /**
   * Clean up old automatic backups
   */
  async cleanupOldBackups(userId: string, keepCount: number = 10): Promise<void> {
    try {
      const q = query(
        collection(db, 'backups'),
        where('createdBy', '==', userId),
        where('isAutoBackup', '==', true),
        orderBy('createdAt', 'desc'),
        limit(100) // Get more than we need to find old ones
      );

      const snapshot = await getDocs(q);
      const backups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Delete backups beyond the keep count
      const backupsToDelete = backups.slice(keepCount);
      
      for (const backup of backupsToDelete) {
        await this.deleteBackup(backup.id);
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  /**
   * Validate backup data structure
   */
  private validateBackupData(data: any): data is BackupData {
    return (
      data &&
      data.metadata &&
      data.data &&
      typeof data.metadata.id === 'string' &&
      typeof data.metadata.name === 'string' &&
      typeof data.metadata.createdAt === 'string' &&
      typeof data.metadata.createdBy === 'string' &&
      Array.isArray(data.metadata.collections) &&
      typeof data.data === 'object'
    );
  }

  /**
   * Calculate approximate data size
   */
  private calculateDataSize(data: BackupData): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Check if collection is user-specific
   */
  private isUserSpecificCollection(collectionName: string): boolean {
    const globalCollections = ['permissionTemplates', 'settings'];
    return !globalCollections.includes(collectionName);
  }

  /**
   * Save backup metadata to Firestore
   */
  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    try {
      // Filter out undefined values to prevent Firestore errors
      const cleanMetadata = this.removeUndefinedFields({
        ...metadata,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await setDoc(doc(db, 'backups', metadata.id), cleanMetadata);
    } catch (error: any) {
      console.error('Error saving backup metadata:', error);
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(userId?: string): Promise<{
    totalBackups: number;
    totalSize: number;
    lastBackup?: string;
    autoBackupsCount: number;
    manualBackupsCount: number;
  }> {
    try {
      const backups = await this.getBackupList(userId);
      
      const stats = {
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, backup) => sum + backup.fileSize, 0),
        lastBackup: backups.length > 0 ? backups[0].createdAt : undefined,
        autoBackupsCount: backups.filter(b => b.isAutoBackup).length,
        manualBackupsCount: backups.filter(b => !b.isAutoBackup).length
      };
      
      return stats;
    } catch (error: any) {
      console.error('Error getting backup stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const backupService = BackupService.getInstance();