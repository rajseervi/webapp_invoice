import { db } from '@/firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  where, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { Party, PartyFormData, PartyFilters, PartyStatistics } from '@/types/party_no_gst';

export interface PartyUpdateData {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  panNumber?: string;
  businessType?: 'B2B' | 'B2C' | 'Supplier' | 'Customer';
  isActive?: boolean;
  creditLimit?: number;
  outstandingBalance?: number;
  paymentTerms?: string;
  notes?: string;
  tags?: string[];
  preferredCategories?: string[];
}

export class SimplePartyService {
  private static readonly PARTIES_COLLECTION = 'parties';

  /**
   * Create a new party
   */
  static async createParty(partyData: PartyFormData): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      const party: Omit<Party, 'id'> = {
        ...partyData,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.PARTIES_COLLECTION), party);
      return docRef.id;
    } catch (error) {
      console.error('Error creating party:', error);
      throw error;
    }
  }

  /**
   * Get parties with filtering
   */
  static async getParties(
    filters: PartyFilters = {},
    userId?: string
  ): Promise<Party[]> {
    try {
      let q = query(collection(db, this.PARTIES_COLLECTION));

      // Apply basic filters
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      if (filters.businessType) {
        q = query(q, where('businessType', '==', filters.businessType));
      }

      if (filters.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      // Add sorting
      q = query(q, orderBy('name', 'asc'));

      const querySnapshot = await getDocs(q);
      let parties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Party[];

      // Apply client-side filters for complex conditions
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        parties = parties.filter(party =>
          party.name.toLowerCase().includes(searchTerm) ||
          party.contactPerson?.toLowerCase().includes(searchTerm) ||
          party.email?.toLowerCase().includes(searchTerm) ||
          party.phone?.toLowerCase().includes(searchTerm) ||
          party.address?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        parties = parties.filter(party =>
          party.tags?.some(tag => filters.tags!.includes(tag))
        );
      }

      if (filters.creditLimitFrom !== undefined || filters.creditLimitTo !== undefined) {
        parties = parties.filter(party => {
          const creditLimit = party.creditLimit || 0;
          if (filters.creditLimitFrom !== undefined && creditLimit < filters.creditLimitFrom) return false;
          if (filters.creditLimitTo !== undefined && creditLimit > filters.creditLimitTo) return false;
          return true;
        });
      }

      if (filters.outstandingBalanceFrom !== undefined || filters.outstandingBalanceTo !== undefined) {
        parties = parties.filter(party => {
          const balance = party.outstandingBalance || 0;
          if (filters.outstandingBalanceFrom !== undefined && balance < filters.outstandingBalanceFrom) return false;
          if (filters.outstandingBalanceTo !== undefined && balance > filters.outstandingBalanceTo) return false;
          return true;
        });
      }

      return parties;
    } catch (error) {
      console.error('Error fetching parties:', error);
      return [];
    }
  }

  /**
   * Get party by ID
   */
  static async getPartyById(partyId: string): Promise<Party | null> {
    try {
      const docRef = doc(db, this.PARTIES_COLLECTION, partyId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Party;
    } catch (error) {
      console.error('Error fetching party:', error);
      return null;
    }
  }

  /**
   * Update party
   */
  static async updateParty(
    partyId: string,
    updates: PartyUpdateData
  ): Promise<void> {
    try {
      const partyRef = doc(db, this.PARTIES_COLLECTION, partyId);
      
      await updateDoc(partyRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating party:', error);
      throw error;
    }
  }

  /**
   * Delete party
   */
  static async deleteParty(partyId: string): Promise<void> {
    try {
      const partyRef = doc(db, this.PARTIES_COLLECTION, partyId);
      await deleteDoc(partyRef);
    } catch (error) {
      console.error('Error deleting party:', error);
      throw error;
    }
  }

  /**
   * Search parties by name, phone, or email
   */
  static async searchParties(
    searchTerm: string,
    limitResults: number = 20,
    userId?: string
  ): Promise<Party[]> {
    try {
      const filters: PartyFilters = {
        searchTerm,
        isActive: true
      };
      
      const parties = await this.getParties(filters, userId);
      return parties.slice(0, limitResults);
    } catch (error) {
      console.error('Error searching parties:', error);
      return [];
    }
  }

  /**
   * Get parties by business type
   */
  static async getPartiesByType(
    businessType: 'B2B' | 'B2C' | 'Supplier' | 'Customer',
    userId?: string
  ): Promise<Party[]> {
    try {
      const filters: PartyFilters = {
        businessType,
        isActive: true
      };
      
      return await this.getParties(filters, userId);
    } catch (error) {
      console.error('Error getting parties by type:', error);
      return [];
    }
  }

  /**
   * Update outstanding balance
   */
  static async updateOutstandingBalance(
    partyId: string,
    newBalance: number
  ): Promise<void> {
    try {
      await this.updateParty(partyId, { outstandingBalance: newBalance });
    } catch (error) {
      console.error('Error updating outstanding balance:', error);
      throw error;
    }
  }

  /**
   * Adjust outstanding balance (add/subtract)
   */
  static async adjustOutstandingBalance(
    partyId: string,
    adjustment: number
  ): Promise<void> {
    try {
      const party = await this.getPartyById(partyId);
      if (!party) {
        throw new Error('Party not found');
      }

      const newBalance = (party.outstandingBalance || 0) + adjustment;
      await this.updateOutstandingBalance(partyId, newBalance);
    } catch (error) {
      console.error('Error adjusting outstanding balance:', error);
      throw error;
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
      const totalOutstanding = parties.reduce((sum, p) => sum + (p.outstandingBalance || 0), 0);
      const totalCreditLimit = parties.reduce((sum, p) => sum + (p.creditLimit || 0), 0);

      // Business type breakdown
      const businessTypeBreakdown = {
        B2B: parties.filter(p => p.businessType === 'B2B').length,
        B2C: parties.filter(p => p.businessType === 'B2C').length,
        Supplier: parties.filter(p => p.businessType === 'Supplier').length,
        Customer: parties.filter(p => p.businessType === 'Customer').length
      };

      // Top parties by outstanding balance
      const topParties = parties
        .filter(p => (p.outstandingBalance || 0) > 0)
        .sort((a, b) => (b.outstandingBalance || 0) - (a.outstandingBalance || 0))
        .slice(0, 10)
        .map(party => ({
          partyId: party.id || '',
          partyName: party.name,
          totalTransactions: 0, // This would need to be calculated from invoices
          totalAmount: 0, // This would need to be calculated from invoices
          outstandingBalance: party.outstandingBalance || 0
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
        businessTypeBreakdown: {
          B2B: 0,
          B2C: 0,
          Supplier: 0,
          Customer: 0
        },
        topParties: []
      };
    }
  }

  /**
   * Bulk update parties
   */
  static async bulkUpdateParties(
    updates: Array<{ partyId: string; data: PartyUpdateData }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const batch = writeBatch(db);
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    try {
      const now = new Date().toISOString();

      for (const update of updates) {
        try {
          const partyRef = doc(db, this.PARTIES_COLLECTION, update.partyId);
          batch.update(partyRef, {
            ...update.data,
            updatedAt: now
          });
          success++;
        } catch (error) {
          failed++;
          errors.push(`Party ${update.partyId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      await batch.commit();

      return { success, failed, errors };
    } catch (error) {
      console.error('Error in bulk update:', error);
      return { 
        success: 0, 
        failed: updates.length, 
        errors: [error instanceof Error ? error.message : 'Bulk update failed'] 
      };
    }
  }

  /**
   * Validate unique email
   */
  static async validateUniqueEmail(
    email: string,
    userId: string,
    excludePartyId?: string
  ): Promise<{ isUnique: boolean; message: string }> {
    try {
      if (!email) {
        return { isUnique: true, message: '' };
      }

      const parties = await this.getParties({}, userId);
      const existingParty = parties.find(party => 
        party.email?.toLowerCase() === email.toLowerCase() && 
        party.id !== excludePartyId
      );

      if (existingParty) {
        return {
          isUnique: false,
          message: `Email already exists for party: ${existingParty.name}`
        };
      }

      return { isUnique: true, message: '' };
    } catch (error) {
      console.error('Error validating unique email:', error);
      return { isUnique: true, message: '' };
    }
  }

  /**
   * Validate unique phone
   */
  static async validateUniquePhone(
    phone: string,
    userId: string,
    excludePartyId?: string
  ): Promise<{ isUnique: boolean; message: string }> {
    try {
      if (!phone) {
        return { isUnique: true, message: '' };
      }

      const parties = await this.getParties({}, userId);
      const existingParty = parties.find(party => 
        party.phone === phone && 
        party.id !== excludePartyId
      );

      if (existingParty) {
        return {
          isUnique: false,
          message: `Phone number already exists for party: ${existingParty.name}`
        };
      }

      return { isUnique: true, message: '' };
    } catch (error) {
      console.error('Error validating unique phone:', error);
      return { isUnique: true, message: '' };
    }
  }
}

export default SimplePartyService;