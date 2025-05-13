import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Party, PartyFormData } from '@/types/party';

export const partyService = {
  async createParty(partyData: PartyFormData) {
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'parties'), {
        ...partyData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating party:', error);
      throw error;
    }
  },

  async getParties() {
    try {
      const querySnapshot = await getDocs(collection(db, 'parties'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Party[];
    } catch (error) {
      console.error('Error fetching parties:', error);
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
      const docRef = doc(db, 'parties', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
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
  }
};