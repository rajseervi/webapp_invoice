import { db } from '@/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { Party, PartyFormData, PartyFilters, PartyStatistics } from '@/types/party_no_gst';
import { sanitizeForFirestore } from '@/utils/firestoreUtils';

export interface PartySearchOptions {
  searchTerm?: string;
  businessType?: 'B2B' | 'B2C' | 'Supplier' | 'Customer';
  isActive?: boolean;
  tags?: string[];
  limitCount?: number;
}

export class PartyNoGstService {
  private static readonly PARTIES_COLLECTION = 'parties_no_gst';

  /**
   * Create a new party
   */
  static async createParty(
    partyData: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      const sanitizedData = sanitizeForFirestore({
        ...partyData,
        isActive: partyData.isActive ?? true,
        createdAt: now,
        updatedAt: now,
        outstandingBalance: partyData.outstandingBalance ?? 0,
        creditLimit: partyData.creditLimit ?? 0,
        tags: partyData.tags ?? [],
        preferredCategories: partyData.preferredCategories ?? []
      });

      const partyRef = await addDoc(collection(db, this.PARTIES_COLLECTION), sanitizedData);
      return partyRef.id;

    } catch (error) {
      console.error('Error creating party:', error);
      throw new Error(`Failed to create party: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update party
   */
  static async updateParty(
    partyId: string,
    updates: Partial<Party>
  ): Promise<void> {
    try {
      const partyRef = doc(db, this.PARTIES_COLLECTION, partyId);
      
      // Remove id and system fields from updates
      const { id, createdAt, createdBy, ...updateData } = updates;
      
      const sanitizedUpdates = sanitizeForFirestore({
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      await updateDoc(partyRef, sanitizedUpdates);

    } catch (error) {
      console.error('Error updating party:', error);
      throw new Error(`Failed to update party: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete party (soft delete by deactivating)
   */
  static async deleteParty(partyId: string, hardDelete: boolean = false): Promise<void> {
    try {
      const partyRef = doc(db, this.PARTIES_COLLECTION, partyId);
      
      if (hardDelete) {
        await deleteDoc(partyRef);
      } else {
        // Soft delete - just deactivate
        await updateDoc(partyRef, {
          isActive: false,
          updatedAt: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error deleting party:', error);
      throw new Error(`Failed to delete party: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get party by ID
   */
  static async getPartyById(partyId: string): Promise<Party | null> {
    try {
      const partyRef = doc(db, this.PARTIES_COLLECTION, partyId);
      const partySnap = await getDoc(partyRef);

      if (!partySnap.exists()) {
        return null;
      }

      return { id: partySnap.id, ...partySnap.data() } as Party;

    } catch (error) {
      console.error('Error fetching party:', error);
      return null;
    }
  }

  /**
   * Get all parties with filters
   */
  static async getParties(
    filters: PartyFilters = {},
    userId?: string
  ): Promise<Party[]> {
    try {
      let q = query(collection(db, this.PARTIES_COLLECTION));

      // Filter by user if provided
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      // Filter by business type
      if (filters.businessType) {
        q = query(q, where('businessType', '==', filters.businessType));
      }

      // Filter by active status
      if (filters.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      // Add ordering
      q = query(q, orderBy('name', 'asc'));

      const querySnapshot = await getDocs(q);
      let parties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Party[];

      // Apply client-side filters
      parties = this.applyClientSideFilters(parties, filters);

      return parties;

    } catch (error) {
      console.error('Error fetching parties:', error);
      return [];
    }
  }

  /**
   * Apply client-side filters
   */
  private static applyClientSideFilters(parties: Party[], filters: PartyFilters): Party[] {
    let filteredParties = [...parties];

    // Search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredParties = filteredParties.filter(party =>
        party.name.toLowerCase().includes(searchTerm) ||
        (party.email && party.email.toLowerCase().includes(searchTerm)) ||
        (party.phone && party.phone.includes(searchTerm)) ||
        (party.contactPerson && party.contactPerson.toLowerCase().includes(searchTerm)) ||
        (party.panNumber && party.panNumber.toLowerCase().includes(searchTerm)) ||
        (party.address && party.address.toLowerCase().includes(searchTerm))
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filteredParties = filteredParties.filter(party =>
        party.tags && party.tags.some(tag => filters.tags!.includes(tag))
      );
    }

    // Credit limit range filter
    if (filters.creditLimitFrom !== undefined) {
      filteredParties = filteredParties.filter(party =>
        (party.creditLimit ?? 0) >= filters.creditLimitFrom!
      );
    }

    if (filters.creditLimitTo !== undefined) {
      filteredParties = filteredParties.filter(party =>
        (party.creditLimit ?? 0) <= filters.creditLimitTo!
      );
    }

    // Outstanding balance range filter
    if (filters.outstandingBalanceFrom !== undefined) {
      filteredParties = filteredParties.filter(party =>
        (party.outstandingBalance ?? 0) >= filters.outstandingBalanceFrom!
      );
    }

    if (filters.outstandingBalanceTo !== undefined) {
      filteredParties = filteredParties.filter(party =>
        (party.outstandingBalance ?? 0) <= filters.outstandingBalanceTo!
      );
    }

    return filteredParties;
  }

  /**
   * Get active parties
   */
  static async getActiveParties(userId?: string): Promise<Party[]> {
    return this.getParties({ isActive: true }, userId);
  }

  /**
   * Get parties by business type
   */
  static async getPartiesByBusinessType(
    businessType: 'B2B' | 'B2C' | 'Supplier' | 'Customer',
    userId?: string
  ): Promise<Party[]> {
    return this.getParties({ businessType, isActive: true }, userId);
  }

  /**
   * Search parties with advanced options
   */
  static async searchParties(
    options: PartySearchOptions,
    userId?: string
  ): Promise<Party[]> {
    try {
      let q = query(collection(db, this.PARTIES_COLLECTION));

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      if (options.businessType) {
        q = query(q, where('businessType', '==', options.businessType));
      }

      if (options.isActive !== undefined) {
        q = query(q, where('isActive', '==', options.isActive));
      }

      q = query(q, orderBy('name', 'asc'));

      if (options.limitCount) {
        q = query(q, limit(options.limitCount));
      }

      const querySnapshot = await getDocs(q);
      let parties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Party[];

      // Apply search term filter
      if (options.searchTerm) {
        const searchTerm = options.searchTerm.toLowerCase();
        parties = parties.filter(party =>
          party.name.toLowerCase().includes(searchTerm) ||
          (party.email && party.email.toLowerCase().includes(searchTerm)) ||
          (party.contactPerson && party.contactPerson.toLowerCase().includes(searchTerm))
        );
      }

      // Apply tags filter
      if (options.tags && options.tags.length > 0) {
        parties = parties.filter(party =>
          party.tags && party.tags.some(tag => options.tags!.includes(tag))
        );
      }

      return parties;

    } catch (error) {
      console.error('Error searching parties:', error);
      return [];
    }
  }

  /**
   * Get party statistics
   */
  static async getPartyStatistics(userId?: string): Promise<PartyStatistics> {
    try {
      const parties = await this.getParties({}, userId);
      
      const totalParties = parties.length;
      const activeParties = parties.filter(p => p.isActive).length;
      const inactiveParties = totalParties - activeParties;
      const totalOutstanding = parties.reduce((sum, p) => sum + (p.outstandingBalance ?? 0), 0);
      const totalCreditLimit = parties.reduce((sum, p) => sum + (p.creditLimit ?? 0), 0);

      const businessTypeBreakdown = {
        B2B: parties.filter(p => p.businessType === 'B2B').length,
        B2C: parties.filter(p => p.businessType === 'B2C').length,
        Supplier: parties.filter(p => p.businessType === 'Supplier').length,
        Customer: parties.filter(p => p.businessType === 'Customer').length
      };

      // Get top parties by outstanding balance
      const topParties = parties
        .filter(p => p.outstandingBalance && p.outstandingBalance > 0)
        .sort((a, b) => (b.outstandingBalance ?? 0) - (a.outstandingBalance ?? 0))
        .slice(0, 10)
        .map(party => ({
          partyId: party.id!,
          partyName: party.name,
          totalTransactions: 0, // This would need to be calculated from transaction data
          totalAmount: 0, // This would need to be calculated from transaction data
          outstandingBalance: party.outstandingBalance ?? 0
        }));

      return {
        totalParties,
        activeParties,
        inactiveParties,
        totalOutstanding,
        totalCreditLimit,
        businessTypeBreakdown,
        topParties
      };

    } catch (error) {
      console.error('Error getting party statistics:', error);
      return {
        totalParties: 0,
        activeParties: 0,
        inactiveParties: 0,
        totalOutstanding: 0,
        totalCreditLimit: 0,
        businessTypeBreakdown: { B2B: 0, B2C: 0, Supplier: 0, Customer: 0 },
        topParties: []
      };
    }
  }

  /**
   * Activate party
   */
  static async activateParty(partyId: string): Promise<void> {
    try {
      const partyRef = doc(db, this.PARTIES_COLLECTION, partyId);
      await updateDoc(partyRef, {
        isActive: true,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error activating party:', error);
      throw new Error(`Failed to activate party: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deactivate party
   */
  static async deactivateParty(partyId: string): Promise<void> {
    try {
      const partyRef = doc(db, this.PARTIES_COLLECTION, partyId);
      await updateDoc(partyRef, {
        isActive: false,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deactivating party:', error);
      throw new Error(`Failed to deactivate party: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update party outstanding balance
   */
  static async updateOutstandingBalance(
    partyId: string, 
    amount: number, 
    operation: 'add' | 'subtract' | 'set' = 'set'
  ): Promise<void> {
    try {
      const party = await this.getPartyById(partyId);
      if (!party) {
        throw new Error('Party not found');
      }

      let newBalance: number;
      const currentBalance = party.outstandingBalance ?? 0;

      switch (operation) {
        case 'add':
          newBalance = currentBalance + amount;
          break;
        case 'subtract':
          newBalance = currentBalance - amount;
          break;
        case 'set':
        default:
          newBalance = amount;
          break;
      }

      await this.updateParty(partyId, { outstandingBalance: newBalance });

    } catch (error) {
      console.error('Error updating outstanding balance:', error);
      throw new Error(`Failed to update outstanding balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Bulk operations
   */
  static async bulkUpdateParties(updates: Array<{ id: string; data: Partial<Party> }>): Promise<void> {
    try {
      const batch = writeBatch(db);

      updates.forEach(({ id, data }) => {
        const partyRef = doc(db, this.PARTIES_COLLECTION, id);
        const { id: _, createdAt, createdBy, ...updateData } = data;
        
        const sanitizedData = sanitizeForFirestore({
          ...updateData,
          updatedAt: new Date().toISOString()
        });

        batch.update(partyRef, sanitizedData);
      });

      await batch.commit();

    } catch (error) {
      console.error('Error in bulk update:', error);
      throw new Error(`Failed to bulk update parties: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate party data
   */
  static validatePartyData(partyData: Partial<Party>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Required fields validation
    if (!partyData.name || partyData.name.trim().length === 0) {
      errors.push('Party name is required');
    }

    if (!partyData.businessType) {
      errors.push('Business type is required');
    }

    // Email validation
    if (partyData.email && !this.isValidEmail(partyData.email)) {
      errors.push('Invalid email format');
    }

    // Phone validation
    if (partyData.phone && !this.isValidPhone(partyData.phone)) {
      errors.push('Invalid phone number format');
    }

    // PAN validation
    if (partyData.panNumber && !this.isValidPAN(partyData.panNumber)) {
      errors.push('Invalid PAN format');
    }

    // Credit limit validation
    if (partyData.creditLimit !== undefined && partyData.creditLimit < 0) {
      errors.push('Credit limit cannot be negative');
    }

    // Outstanding balance validation
    if (partyData.outstandingBalance !== undefined && partyData.outstandingBalance < 0) {
      errors.push('Outstanding balance cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Validate PAN format
   */
  private static isValidPAN(pan: string): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  }

  /**
   * Export parties to JSON
   */
  static async exportParties(userId?: string): Promise<Party[]> {
    try {
      const parties = await this.getParties({}, userId);
      return parties.map(party => ({
        ...party,
        // Ensure dates are properly formatted for export
        createdAt: party.createdAt,
        updatedAt: party.updatedAt
      }));
    } catch (error) {
      console.error('Error exporting parties:', error);
      throw new Error(`Failed to export parties: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import parties from JSON
   */
  static async importParties(parties: Omit<Party, 'id'>[], userId?: string): Promise<string[]> {
    try {
      const createdIds: string[] = [];

      for (const partyData of parties) {
        const validation = this.validatePartyData(partyData);
        if (!validation.isValid) {
          console.warn(`Skipping invalid party ${partyData.name}:`, validation.errors);
          continue;
        }

        const partyWithUser = userId ? { ...partyData, userId } : partyData;
        const id = await this.createParty(partyWithUser);
        createdIds.push(id);
      }

      return createdIds;

    } catch (error) {
      console.error('Error importing parties:', error);
      throw new Error(`Failed to import parties: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default PartyNoGstService;