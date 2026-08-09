import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';

/**
 * Aggregation Service — replaces full collection scans with pre-computed counts.
 * 
 * COST SAVING: Instead of reading ALL documents to count them (expensive),
 * we maintain a single small document with computed counts.
 * 
 * Typical cost reduction for count operations: 100x+ (1 read vs 100+ reads)
 * 
 * Usage:
 * - After creating/deleting a product → updateProductCount()
 * - After creating/deleting a party → updatePartyCount()
 * - After creating/deleting an invoice → updateInvoiceCount()
 * - Dashboard reads → getAggregatedStats() (1 read instead of 1000+)
 */

const AGGREGATION_DOC_ID = 'main';
const AGGREGATION_PATH = `aggregations/${AGGREGATION_DOC_ID}`;

export interface AggregatedStats {
  products: {
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    totalValue: number;
    lastUpdated: string;
  };
  parties: {
    total: number;
    active: number;
    totalOutstanding: number;
    totalCreditLimit: number;
    lastUpdated: string;
  };
  invoices: {
    total: number;
    totalRevenue: number;
    thisMonthRevenue: number;
    thisMonthCount: number;
    lastUpdated: string;
  };
  metadata: {
    updatedAt: string;
    version: number;
  };
}

// Default empty stats
const emptyStats: AggregatedStats = {
  products: {
    total: 0,
    active: 0,
    inactive: 0,
    lowStock: 0,
    totalValue: 0,
    lastUpdated: new Date().toISOString(),
  },
  parties: {
    total: 0,
    active: 0,
    totalOutstanding: 0,
    totalCreditLimit: 0,
    lastUpdated: new Date().toISOString(),
  },
  invoices: {
    total: 0,
    totalRevenue: 0,
    thisMonthRevenue: 0,
    thisMonthCount: 0,
    lastUpdated: new Date().toISOString(),
  },
  metadata: {
    updatedAt: new Date().toISOString(),
    version: 1,
  },
};

export const aggregationService = {
  /**
   * Get all aggregated stats — 1 document read.
   * This replaces 5+ collection queries in the dashboard.
   */
  async getStats(): Promise<AggregatedStats> {
    try {
      const docRef = doc(db, AGGREGATION_PATH);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Initialize if not exists
        await setDoc(docRef, emptyStats);
        return emptyStats;
      }

      return docSnap.data() as AggregatedStats;
    } catch (error) {
      console.error('Error getting aggregated stats:', error);
      return emptyStats;
    }
  },

  /**
   * Ensures the aggregation document exists.
   * Called once on app startup.
   */
  async initializeIfNeeded(): Promise<void> {
    try {
      const docRef = doc(db, AGGREGATION_PATH);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, emptyStats);
      }
    } catch (error) {
      console.error('Error initializing aggregation doc:', error);
    }
  },

  /**
   * Increment/decrement product count.
   * Uses transaction for atomicity.
   */
  async updateProductCount(delta: {
    total?: number;
    active?: number;
    inactive?: number;
    lowStock?: number;
    totalValue?: number;
  }): Promise<void> {
    try {
      const docRef = doc(db, AGGREGATION_PATH);

      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        const current = docSnap.exists()
          ? (docSnap.data() as AggregatedStats)
          : { ...emptyStats };

        if (delta.total !== undefined) current.products.total += delta.total;
        if (delta.active !== undefined) current.products.active += delta.active;
        if (delta.inactive !== undefined) current.products.inactive += delta.inactive;
        if (delta.lowStock !== undefined) current.products.lowStock += delta.lowStock;
        if (delta.totalValue !== undefined) current.products.totalValue += delta.totalValue;

        current.products.lastUpdated = new Date().toISOString();
        current.metadata.updatedAt = new Date().toISOString();
        current.metadata.version += 1;

        transaction.set(docRef, current, { merge: false });
      });
    } catch (error) {
      console.error('Error updating product count:', error);
    }
  },

  /**
   * Increment/decrement party count.
   */
  async updatePartyCount(delta: {
    total?: number;
    active?: number;
    totalOutstanding?: number;
    totalCreditLimit?: number;
  }): Promise<void> {
    try {
      const docRef = doc(db, AGGREGATION_PATH);

      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        const current = docSnap.exists()
          ? (docSnap.data() as AggregatedStats)
          : { ...emptyStats };

        if (delta.total !== undefined) current.parties.total += delta.total;
        if (delta.active !== undefined) current.parties.active += delta.active;
        if (delta.totalOutstanding !== undefined) current.parties.totalOutstanding += delta.totalOutstanding;
        if (delta.totalCreditLimit !== undefined) current.parties.totalCreditLimit += delta.totalCreditLimit;

        current.parties.lastUpdated = new Date().toISOString();
        current.metadata.updatedAt = new Date().toISOString();
        current.metadata.version += 1;

        transaction.set(docRef, current, { merge: false });
      });
    } catch (error) {
      console.error('Error updating party count:', error);
    }
  },

  /**
   * Increment/decrement invoice count and revenue.
   */
  async updateInvoiceCount(delta: {
    total?: number;
    totalRevenue?: number;
    thisMonthRevenue?: number;
    thisMonthCount?: number;
  }): Promise<void> {
    try {
      const docRef = doc(db, AGGREGATION_PATH);

      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        const current = docSnap.exists()
          ? (docSnap.data() as AggregatedStats)
          : { ...emptyStats };

        if (delta.total !== undefined) current.invoices.total += delta.total;
        if (delta.totalRevenue !== undefined) current.invoices.totalRevenue += delta.totalRevenue;
        if (delta.thisMonthRevenue !== undefined) current.invoices.thisMonthRevenue += delta.thisMonthRevenue;
        if (delta.thisMonthCount !== undefined) current.invoices.thisMonthCount += delta.thisMonthCount;

        current.invoices.lastUpdated = new Date().toISOString();
        current.metadata.updatedAt = new Date().toISOString();
        current.metadata.version += 1;

        transaction.set(docRef, current, { merge: false });
      });
    } catch (error) {
      console.error('Error updating invoice count:', error);
    }
  },

  /**
   * Full recalculation — run periodically or after bulk imports.
   * Reads all collections once and updates the aggregated doc.
   * Use sparingly (e.g., after import or weekly cron).
   */
  async fullRecalculation(): Promise<void> {
    try {
      // Dynamically import to avoid circular deps
      const [{ getCountFromServer }, { collection, query, where, getDocs }] = await Promise.all([
        import('firebase/firestore'),
        import('firebase/firestore'),
      ]);

      const [
        productsCountSnap,
        activeProductsSnap,
        lowStockSnap,
        partiesCountSnap,
        activePartiesSnap,
        invoicesCountSnap,
        thisMonthInvoicesSnap,
      ] = await Promise.all([
        // Product counts
        getCountFromServer(query(collection(db, 'products'))),
        getCountFromServer(query(collection(db, 'products'), where('isActive', '==', true))),
        getDocs(query(
          collection(db, 'products'),
          where('isActive', '==', true),
          where('quantity', '<=', 10),
        )),
        // Party counts
        getCountFromServer(query(collection(db, 'parties'))),
        getCountFromServer(query(collection(db, 'parties'), where('isActive', '==', true))),
        // Invoice counts
        getCountFromServer(query(collection(db, 'invoices'))),
        getDocs(query(
          collection(db, 'invoices'),
          where('createdAt', '>=', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        )),
      ]);

      const now = new Date().toISOString();

      const newStats: AggregatedStats = {
        products: {
          total: productsCountSnap.data().count,
          active: activeProductsSnap.data().count,
          inactive: productsCountSnap.data().count - activeProductsSnap.data().count,
          lowStock: lowStockSnap.docs.length,
          totalValue: 0, // Would need product values scan
          lastUpdated: now,
        },
        parties: {
          total: partiesCountSnap.data().count,
          active: activePartiesSnap.data().count,
          totalOutstanding: 0,
          totalCreditLimit: 0,
          lastUpdated: now,
        },
        invoices: {
          total: invoicesCountSnap.data().count,
          totalRevenue: 0,
          thisMonthRevenue: 0,
          thisMonthCount: thisMonthInvoicesSnap.docs.length,
          lastUpdated: now,
        },
        metadata: {
          updatedAt: now,
          version: 1,
        },
      };

      await setDoc(doc(db, AGGREGATION_PATH), newStats);
    } catch (error) {
      console.error('Error in full recalculation:', error);
    }
  },
};
