import { SimplePartyService } from '@/services/simplePartyService';
import { transactionService } from '@/services/transactionService';
import { db } from '@/firebase/config';
import { collection, addDoc } from 'firebase/firestore';

export async function seedTestData() {
  console.log('🌱 Seeding test data...');

  try {
    // Create sample parties
    const sampleParties = [
      {
        name: 'ABC Electronics Pvt Ltd',
        businessType: 'Supplier' as const,
        contactPerson: 'Rajesh Kumar',
        email: 'rajesh@abcelectronics.com',
        phone: '+91 9876543210',
        address: '123 Electronics Street, Mumbai, Maharashtra 400001',
        panNumber: 'ABCDE1234F',
        creditLimit: 500000,
        outstandingBalance: 25000,
        paymentTerms: 'Net 30',
        isActive: true,
        tags: ['electronics', 'supplier'],
        preferredCategories: ['Electronics', 'Components']
      },
      {
        name: 'XYZ Customer Solutions',
        businessType: 'Customer' as const,
        contactPerson: 'Priya Sharma',
        email: 'priya@xyzcustomer.com',
        phone: '+91 8765432109',
        address: '456 Business Avenue, Bangalore, Karnataka 560001',
        panNumber: 'XYZAB5678C',
        creditLimit: 300000,
        outstandingBalance: -15000, // Customer owes us money
        paymentTerms: 'Net 45',
        isActive: true,
        tags: ['customer', 'b2b'],
        preferredCategories: ['Services', 'Consulting']
      },
      {
        name: 'PQR Trading Company',
        businessType: 'B2B' as const,
        contactPerson: 'Amit Patel',
        email: 'amit@pqrtrading.com',
        phone: '+91 7654321098',
        address: '789 Trade Center, Delhi, Delhi 110001',
        panNumber: 'PQRST9012G',
        creditLimit: 200000,
        outstandingBalance: 5000,
        paymentTerms: 'Net 15',
        isActive: true,
        tags: ['trading', 'wholesale'],
        preferredCategories: ['Trading', 'Wholesale']
      }
    ];

    const createdParties = [];
    for (const partyData of sampleParties) {
      const partyId = await SimplePartyService.createParty(partyData);
      createdParties.push({ id: partyId, ...partyData });
      console.log(`✅ Created party: ${partyData.name}`);
    }

    // Create sample transactions
    const sampleTransactions = [
      {
        partyId: createdParties[0].id,
        type: 'credit',
        amount: 50000,
        description: 'Payment received from ABC Electronics',
        category: 'Payment',
        date: '2024-01-15',
        userId: 'test-user'
      },
      {
        partyId: createdParties[1].id,
        type: 'debit',
        amount: 25000,
        description: 'Invoice payment to XYZ Customer',
        category: 'Invoice',
        date: '2024-01-20',
        userId: 'test-user'
      },
      {
        partyId: createdParties[2].id,
        type: 'credit',
        amount: 15000,
        description: 'Purchase from PQR Trading',
        category: 'Purchase',
        date: '2024-01-25',
        userId: 'test-user'
      }
    ];

    for (const transactionData of sampleTransactions) {
      await transactionService.createTransaction(transactionData);
      console.log(`✅ Created transaction: ${transactionData.description}`);
    }

    // Create sample invoices
    const sampleInvoices = [
      {
        partyId: createdParties[1].id,
        type: 'sales',
        invoiceNumber: 'INV-2024-001',
        date: '2024-01-10',
        totalAmount: 75000,
        items: [
          {
            name: 'Consulting Services',
            quantity: 1,
            rate: 75000,
            amount: 75000
          }
        ],
        status: 'paid'
      },
      {
        partyId: createdParties[0].id,
        type: 'purchase',
        invoiceNumber: 'PINV-2024-001',
        date: '2024-01-12',
        totalAmount: 45000,
        items: [
          {
            name: 'Electronic Components',
            quantity: 100,
            rate: 450,
            amount: 45000
          }
        ],
        status: 'pending'
      }
    ];

    for (const invoiceData of sampleInvoices) {
      await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ Created invoice: ${invoiceData.invoiceNumber}`);
    }

    console.log('🎉 Test data seeding completed!');
    return {
      success: true,
      partiesCreated: createdParties.length,
      transactionsCreated: sampleTransactions.length,
      invoicesCreated: sampleInvoices.length
    };

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}