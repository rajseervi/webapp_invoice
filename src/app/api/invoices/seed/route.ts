import { NextRequest, NextResponse } from 'next/server';
import { serverDb as db } from '@/lib/server-firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const sampleInvoices = [
      {
        invoiceNumber: 'INV-2024-001',
        partyName: 'Acme Corporation',
        partyId: 'party-1',
        totalAmount: 45000,
        total: 45000,
        status: 'Paid',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
        items: 3,
        taxAmount: 7200,
        discountAmount: 0,
        notes: 'Professional services rendered',
        paymentMethod: 'Bank Transfer',
      },
      {
        invoiceNumber: 'INV-2024-002',
        partyName: 'Tech Solutions Ltd',
        partyId: 'party-2',
        totalAmount: 32500,
        total: 32500,
        status: 'Pending',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date()),
        items: 2,
        taxAmount: 5200,
        discountAmount: 2000,
        notes: 'Software development services',
        paymentMethod: null,
      },
      {
        invoiceNumber: 'INV-2024-003',
        partyName: 'Global Exports Inc',
        partyId: 'party-3',
        totalAmount: 58750,
        total: 58750,
        status: 'Overdue',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        items: 5,
        taxAmount: 9400,
        discountAmount: 0,
        notes: 'Consulting and advisory services',
      },
      {
        invoiceNumber: 'INV-2024-004',
        partyName: 'Premium Retail Group',
        partyId: 'party-4',
        totalAmount: 27300,
        total: 27300,
        status: 'Paid',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
        items: 4,
        taxAmount: 4368,
        discountAmount: 1500,
        notes: 'Retail supply and services',
        paymentMethod: 'Check',
      },
      {
        invoiceNumber: 'INV-2024-005',
        partyName: 'Digital Services Co',
        partyId: 'party-5',
        totalAmount: 19800,
        total: 19800,
        status: 'Pending',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date()),
        items: 2,
        taxAmount: 3168,
        discountAmount: 0,
        notes: 'Digital marketing services',
      },
      {
        invoiceNumber: 'INV-2024-006',
        partyName: 'Innovation Labs',
        partyId: 'party-6',
        totalAmount: 52000,
        total: 52000,
        status: 'Paid',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
        items: 4,
        taxAmount: 8320,
        discountAmount: 1000,
        notes: 'R&D project services',
        paymentMethod: 'Bank Transfer',
      },
      {
        invoiceNumber: 'INV-2024-007',
        partyName: 'Urban Trading Co',
        partyId: 'party-7',
        totalAmount: 35600,
        total: 35600,
        status: 'Pending',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
        items: 3,
        taxAmount: 5696,
        discountAmount: 0,
        notes: 'Commercial supplies',
      },
      {
        invoiceNumber: 'INV-2024-008',
        partyName: 'Summit Enterprises',
        partyId: 'party-8',
        totalAmount: 48300,
        total: 48300,
        status: 'Paid',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)),
        items: 5,
        taxAmount: 7728,
        discountAmount: 2500,
        notes: 'Enterprise solutions',
        paymentMethod: 'Cheque',
      },
      {
        invoiceNumber: 'INV-2024-009',
        partyName: 'Nexus Group Ltd',
        partyId: 'party-9',
        totalAmount: 41200,
        total: 41200,
        status: 'Pending',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
        items: 3,
        taxAmount: 6592,
        discountAmount: 0,
        notes: 'Consulting and support',
      },
      {
        invoiceNumber: 'INV-2024-010',
        partyName: 'Phoenix Ventures',
        partyId: 'party-10',
        totalAmount: 29500,
        total: 29500,
        status: 'Paid',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)),
        updatedAt: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
        items: 2,
        taxAmount: 4720,
        discountAmount: 1500,
        notes: 'Professional services',
        paymentMethod: 'Bank Transfer',
      }
    ];

    const invoicesRef = collection(db, 'invoices');
    const results = [];

    console.log('[Seed Invoices] Starting to insert', sampleInvoices.length, 'invoices');

    for (const invoice of sampleInvoices) {
      try {
        const docRef = await addDoc(invoicesRef, invoice);
        results.push({
          id: docRef.id,
          invoiceNumber: invoice.invoiceNumber,
          status: 'created'
        });
        console.log('[Seed Invoices] Created invoice:', invoice.invoiceNumber, 'with ID:', docRef.id);
      } catch (err: any) {
        console.error('[Seed Invoices] Error creating invoice:', invoice.invoiceNumber, err.message);
        results.push({
          invoiceNumber: invoice.invoiceNumber,
          status: 'failed',
          error: err.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'created').length;
    const failureCount = results.filter(r => r.status === 'failed').length;

    console.log(`[Seed Invoices] Completed: ${successCount} created, ${failureCount} failed`);

    return NextResponse.json({
      success: successCount > 0,
      message: `Seeded ${successCount} invoices into database`,
      results,
      summary: {
        total: sampleInvoices.length,
        created: successCount,
        failed: failureCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Seed Invoices] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed invoices',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
