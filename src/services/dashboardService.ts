"use client";

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DashboardLayout, WidgetConfig } from '@/types/dashboard';

const COLLECTION_NAME = 'dashboardLayouts';

export class DashboardService {
  // Get all dashboard layouts for a user
  static async getUserLayouts(userId: string): Promise<DashboardLayout[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        widgets: doc.data().widgets?.map((widget: any) => ({
          ...widget,
          createdAt: widget.createdAt?.toDate() || new Date(),
          updatedAt: widget.updatedAt?.toDate() || new Date(),
        })) || []
      })) as DashboardLayout[];
    } catch (error) {
      console.error('Error fetching user layouts:', error);
      throw error;
    }
  }

  // Get a specific dashboard layout
  static async getLayout(layoutId: string): Promise<DashboardLayout | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, layoutId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          widgets: data.widgets?.map((widget: any) => ({
            ...widget,
            createdAt: widget.createdAt?.toDate() || new Date(),
            updatedAt: widget.updatedAt?.toDate() || new Date(),
          })) || []
        } as DashboardLayout;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching layout:', error);
      throw error;
    }
  }

  // Create a new dashboard layout
  static async createLayout(
    userId: string, 
    name: string, 
    widgets: WidgetConfig[] = [],
    isDefault: boolean = false
  ): Promise<string> {
    try {
      const layoutData = {
        userId,
        name,
        widgets: widgets.map(widget => ({
          ...widget,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })),
        isDefault,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), layoutData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating layout:', error);
      throw error;
    }
  }

  // Update an existing dashboard layout
  static async updateLayout(layoutId: string, updates: Partial<DashboardLayout>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, layoutId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Handle widgets array if provided
      if (updates.widgets) {
        updateData.widgets = updates.widgets.map(widget => ({
          ...widget,
          updatedAt: serverTimestamp()
        }));
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating layout:', error);
      throw error;
    }
  }

  // Delete a dashboard layout
  static async deleteLayout(layoutId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, layoutId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting layout:', error);
      throw error;
    }
  }

  // Add a widget to a layout
  static async addWidget(layoutId: string, widget: WidgetConfig): Promise<void> {
    try {
      const layout = await this.getLayout(layoutId);
      if (!layout) throw new Error('Layout not found');

      const updatedWidgets = [
        ...layout.widgets,
        {
          ...widget,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await this.updateLayout(layoutId, { widgets: updatedWidgets });
    } catch (error) {
      console.error('Error adding widget:', error);
      throw error;
    }
  }

  // Update a widget in a layout
  static async updateWidget(layoutId: string, widgetId: string, updates: Partial<WidgetConfig>): Promise<void> {
    try {
      const layout = await this.getLayout(layoutId);
      if (!layout) throw new Error('Layout not found');

      const updatedWidgets = layout.widgets.map(widget => 
        widget.id === widgetId 
          ? { ...widget, ...updates, updatedAt: new Date() }
          : widget
      );

      await this.updateLayout(layoutId, { widgets: updatedWidgets });
    } catch (error) {
      console.error('Error updating widget:', error);
      throw error;
    }
  }

  // Remove a widget from a layout
  static async removeWidget(layoutId: string, widgetId: string): Promise<void> {
    try {
      const layout = await this.getLayout(layoutId);
      if (!layout) throw new Error('Layout not found');

      const updatedWidgets = layout.widgets.filter(widget => widget.id !== widgetId);
      await this.updateLayout(layoutId, { widgets: updatedWidgets });
    } catch (error) {
      console.error('Error removing widget:', error);
      throw error;
    }
  }

  // Get default layout for a user
  static async getDefaultLayout(userId: string): Promise<DashboardLayout | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('isDefault', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        widgets: data.widgets?.map((widget: any) => ({
          ...widget,
          createdAt: widget.createdAt?.toDate() || new Date(),
          updatedAt: widget.updatedAt?.toDate() || new Date(),
        })) || []
      } as DashboardLayout;
    } catch (error) {
      console.error('Error fetching default layout:', error);
      throw error;
    }
  }

  // Set a layout as default
  static async setDefaultLayout(userId: string, layoutId: string): Promise<void> {
    try {
      // First, remove default flag from all user layouts
      const userLayouts = await this.getUserLayouts(userId);
      
      for (const layout of userLayouts) {
        if (layout.isDefault) {
          await this.updateLayout(layout.id, { isDefault: false });
        }
      }

      // Then set the specified layout as default
      await this.updateLayout(layoutId, { isDefault: true });
    } catch (error) {
      console.error('Error setting default layout:', error);
      throw error;
    }
  }

  // Create a default dashboard layout for new users
  static async createDefaultLayout(userId: string): Promise<string> {
    const defaultWidgets: WidgetConfig[] = [
      {
        id: 'widget-1',
        type: 'stats-card',
        title: 'Monthly Revenue',
        position: { x: 20, y: 20, width: 300, height: 150 },
        config: {
          title: 'Monthly Revenue',
          value: '₹2,45,000',
          change: '+12.5%',
          changeType: 'positive',
          icon: 'money',
          showIcon: true,
          showChange: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'widget-2',
        type: 'stats-card',
        title: 'Total Orders',
        position: { x: 340, y: 20, width: 300, height: 150 },
        config: {
          title: 'Total Orders',
          value: '324',
          change: '+5.2%',
          changeType: 'positive',
          icon: 'cart',
          showIcon: true,
          showChange: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'widget-3',
        type: 'chart-line',
        title: 'Revenue Trend',
        position: { x: 20, y: 190, width: 620, height: 300 },
        config: {
          title: 'Revenue Trend',
          showLegend: true,
          showGrid: true,
          dataSource: 'sample'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'widget-4',
        type: 'recent-orders',
        title: 'Recent Orders',
        position: { x: 660, y: 20, width: 350, height: 470 },
        config: {
          title: 'Recent Orders',
          maxItems: 5,
          showRefresh: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return await this.createLayout(userId, 'Default Dashboard', defaultWidgets, true);
  }
}