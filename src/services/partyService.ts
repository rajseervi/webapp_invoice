import { db } from '@/firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { Party, PartyFormData } from '@/types/party';
import { cleanPartyData } from '@/utils/firestoreUtils';

export const partyService = {
  async createParty(partyData: PartyFormData) {
    try {

      // Clean the data to remove undefined values
      const cleanData = cleanPartyData({
        ...partyData,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const docRef = await addDoc(collection(db, 'parties'), cleanData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating party:', error);
      throw error;
    }
  },

  async getAllParties() {
    try {
      const q = query(collection(db, 'parties'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Party[];
    } catch (error) {
      console.error('Error fetching parties:', error);
      throw error;
    }
  },

  async getPartiesByUser(userId: string) {
    try {
      const q = query(
        collection(db, 'parties'), 
        where('userId', '==', userId),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Party[];
    } catch (error) {
      console.error('Error fetching parties by user:', error);
      throw error;
    }
  },

  async getActiveParties(userId?: string) {
    try {
      let q;
      if (userId) {
        q = query(
          collection(db, 'parties'), 
          where('userId', '==', userId),
          where('isActive', '==', true),
          orderBy('name', 'asc')
        );
      } else {
        q = query(
          collection(db, 'parties'), 
          where('isActive', '==', true),
          orderBy('name', 'asc')
        );
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Party[];
    } catch (error) {
      console.error('Error fetching active parties:', error);
      throw error;
    }
  },

  async getPartiesByBusinessType(businessType: 'B2B' | 'B2C' | 'Supplier' | 'Customer', userId?: string) {
    try {
      let q;
      if (userId) {
        q = query(
          collection(db, 'parties'), 
          where('userId', '==', userId),
          where('businessType', '==', businessType),
          where('isActive', '==', true),
          orderBy('name', 'asc')
        );
      } else {
        q = query(
          collection(db, 'parties'), 
          where('businessType', '==', businessType),
          where('isActive', '==', true),
          orderBy('name', 'asc')
        );
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Party[];
    } catch (error) {
      console.error('Error fetching parties by business type:', error);
      throw error;
    }
  },

  async getParty(id: string) {
    try {
      const docRef = doc(db, 'parties', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Party;
      }
      throw new Error('Party not found');
    } catch (error) {
      console.error('Error fetching party:', error);
      throw error;
    }
  },

  async updateParty(id: string, data: Partial<PartyFormData>) {
    try {
      // Clean the data to remove undefined values
      const cleanData = cleanPartyData({
        ...data,
        updatedAt: serverTimestamp()
      });

      const docRef = doc(db, 'parties', id);
      await updateDoc(docRef, cleanData);
    } catch (error) {
      console.error('Error updating party:', error);
      throw error;
    }
  },

  async deleteParty(id: string) {
    try {
      const docRef = doc(db, 'parties', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting party:', error);
      throw error;
    }
  },

  async deactivateParty(id: string) {
    try {
      const docRef = doc(db, 'parties', id);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deactivating party:', error);
      throw error;
    }
  },

  async activateParty(id: string) {
    try {
      const docRef = doc(db, 'parties', id);
      await updateDoc(docRef, {
        isActive: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error activating party:', error);
      throw error;
    }
  },

  async searchParties(searchTerm: string, userId?: string) {
    try {
      const parties = userId ? await this.getPartiesByUser(userId) : await this.getAllParties();
      const searchLower = searchTerm.toLowerCase();
      
      return parties.filter(party => 
        party.name.toLowerCase().includes(searchLower) ||
        (party.email && party.email.toLowerCase().includes(searchLower)) ||
        (party.phone && party.phone.includes(searchTerm)) ||
        (party.contactPerson && party.contactPerson.toLowerCase().includes(searchLower)) ||
        (party.panNumber && party.panNumber.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error('Error searching parties:', error);
      throw error;
    }
  },

  async getPartyStatistics(userId?: string) {
    try {
      const parties = userId ? await this.getPartiesByUser(userId) : await this.getAllParties();
      
      return {
        total: parties.length,
        active: parties.filter(p => p.isActive !== false).length,
        inactive: parties.filter(p => p.isActive === false).length,
        businessTypes: {
          B2B: parties.filter(p => p.businessType === 'B2B').length,
          B2C: parties.filter(p => p.businessType === 'B2C').length,
          Supplier: parties.filter(p => p.businessType === 'Supplier').length,
          Customer: parties.filter(p => p.businessType === 'Customer').length
        },
        totalOutstanding: parties.reduce((sum, p) => sum + (p.outstandingBalance || 0), 0),
        totalCreditLimit: parties.reduce((sum, p) => sum + (p.creditLimit || 0), 0)
      };
    } catch (error) {
      console.error('Error getting party statistics:', error);
      throw error;
    }
  }
};