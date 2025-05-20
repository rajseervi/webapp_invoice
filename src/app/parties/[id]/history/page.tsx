"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // To get the party ID from the URL
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import {
  Container,
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config'; // Your Firebase config
import { Party } from '@/types/party'; // Assuming you have a Party type
import { Transaction } from '@/types/transaction'; // You'll need a Transaction type
import { format } from 'date-fns'; // For formatting dates
import Link from 'next/link'; // Import Link from next/link
import { useRouter } from 'next/navigation'; // Import useRouter

// Define a more specific transaction type for the ledger if needed
interface LedgerEntry extends Transaction {
  // Add any specific fields you might need for ledger display
  balance?: number; // Example: running balance
  formattedDate?: string;
  description?: string;
  // Add more invoice-specific fields you want to display
  invoiceNumber?: string;
  items?: Array<{ productName: string; quantity: number; price: number; total: number }>; // Example for items
  dueDate?: string; // Example
  status?: string; // Example (e.g., Paid, Unpaid, Overdue)
}

interface PartyDetails extends Party {
  // any additional details you might fetch for the party
}

export default function PartyStatementPage() {
  const params = useParams();
  const partyId = params.id as string;
  const router = useRouter(); // Initialize useRouter

  const [partyDetails, setPartyDetails] = useState<PartyDetails | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingBalance, setOpeningBalance] = useState<number>(0); // You might need to calculate or fetch this

  useEffect(() => {
    if (!partyId) return;

    const fetchPartyDetails = async () => {
      try {
        const partyRef = doc(db, 'parties', partyId);
        const partySnap = await getDoc(partyRef);
        if (partySnap.exists()) {
          setPartyDetails({ id: partySnap.id, ...partySnap.data() } as PartyDetails);
        } else {
          setError('Party not found.');
        }
      } catch (err) {
        console.error('Error fetching party details:', err);
        setError('Failed to fetch party details.');
      }
    };

    const fetchTransactions = async () => {
      try {
        // Fetch Sales (Invoices)
        const salesQuery = query(
          collection(db, 'invoices'), // Assuming 'invoices' collection for sales
          where('partyId', '==', partyId),
          // orderBy('date', 'desc') // We will sort all transactions together later
        );
        const salesSnapshot = await getDocs(salesQuery);
        const salesData = salesSnapshot.docs.map(doc => {
          const data = doc.data();
          let formattedDate = 'N/A';
          let transactionDate = new Date();
          let formattedDueDate = 'N/A';

          if (data.date) {
            if (typeof data.date.toDate === 'function') {
              transactionDate = data.date.toDate();
            } else if (data.date instanceof Date) {
              transactionDate = data.date;
            } else if (typeof data.date === 'string') {
              transactionDate = new Date(data.date);
              if (isNaN(transactionDate.getTime())) {
                console.warn(`Invalid date string for sale ${doc.id}:`, data.date);
                transactionDate = new Date(); // fallback to now, or handle as invalid
              }
            }
            formattedDate = format(transactionDate, 'PP');
          }
          
          if (data.dueDate) {
            // Similar safe date handling for dueDate
            if (typeof data.dueDate.toDate === 'function') {
              formattedDueDate = format(data.dueDate.toDate(), 'PP');
            } else if (data.dueDate instanceof Date) {
              formattedDueDate = format(data.dueDate, 'PP');
            } else if (typeof data.dueDate === 'string') {
                try {
                    const parsedDueDate = new Date(data.dueDate);
                    if (!isNaN(parsedDueDate.getTime())) {
                        formattedDueDate = format(parsedDueDate, 'PP');
                    }
                } catch (e) {
                    console.warn(`Could not parse dueDate string for sale ${doc.id}:`, data.dueDate);
                }
            }
          }

          return {
            id: doc.id,
            ...data,
            type: 'Sale',
            date: transactionDate, // Store actual Date object for sorting
            formattedDate: formattedDate,
            description: `Invoice #${data.invoiceNumber || doc.id}${data.status ? ' - ' + data.status : ''}`,
            invoiceNumber: data.invoiceNumber,
            items: data.items,
            dueDate: formattedDueDate,
            status: data.status,
            debit: data.totalAmount, // Standardize field for debit
            credit: 0,
          } as LedgerEntry;
        });

        // Fetch Payments
        const paymentsQuery = query(
          collection(db, 'payments'), // Assuming 'payments' collection
          where('partyId', '==', partyId),
          // orderBy('date', 'desc')
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsData = paymentsSnapshot.docs.map(doc => {
          const data = doc.data();
          let formattedDate = 'N/A';
          let transactionDate = new Date();
          if (data.date) { // Apply same safe date handling
            if (typeof data.date.toDate === 'function') {
              transactionDate = data.date.toDate();
            } else if (data.date instanceof Date) {
              transactionDate = data.date;
            } else if (typeof data.date === 'string') {
              transactionDate = new Date(data.date);
              if (isNaN(transactionDate.getTime())) {
                console.warn(`Invalid date string for payment ${doc.id}:`, data.date);
                transactionDate = new Date(); 
              }
            }
            formattedDate = format(transactionDate, 'PP');
          }
          return {
            id: doc.id,
            ...data,
            type: 'Payment',
            date: transactionDate,
            formattedDate: formattedDate,
            description: `Payment - Ref: ${data.referenceNumber || doc.id}${data.method ? ' (' + data.method + ')' : ''}`,
            debit: 0,
            credit: data.amount, // Standardize field for credit
          } as LedgerEntry;
        });

        // TODO: Fetch Credit Notes (similar to payments, likely a credit to the party)
        // const creditNotesQuery = query(collection(db, 'creditNotes'), where('partyId', '==', partyId));
        // const creditNotesSnapshot = await getDocs(creditNotesQuery);
        // const creditNotesData = creditNotesSnapshot.docs.map(doc => { /* ... map data ... */ return { ... } as LedgerEntry });

        // TODO: Fetch Debit Notes (similar to sales/invoices, likely a debit to the party)
        // const debitNotesQuery = query(collection(db, 'debitNotes'), where('partyId', '==', partyId));
        // const debitNotesSnapshot = await getDocs(debitNotesQuery);
        // const debitNotesData = debitNotesSnapshot.docs.map(doc => { /* ... map data ... */ return { ... } as LedgerEntry });

        let allTransactions = [
          ...salesData,
          ...paymentsData,
          // ...creditNotesData, 
          // ...debitNotesData,
        ];

        // Sort all transactions by date (ascending for ledger view)
        allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let currentBalance = openingBalance; // Assume openingBalance is fetched or set
        const entriesWithBalance = allTransactions.map(tx => {
          // Use standardized debit/credit fields for balance calculation
          currentBalance += (tx.debit || 0) - (tx.credit || 0);
          return { ...tx, balance: currentBalance };
        });

        setLedgerEntries(entriesWithBalance);
        setError(null);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to fetch transactions. Please try again later.');
      }
    };

    const loadData = async () => {
      setLoading(true);
      await fetchPartyDetails();
      await fetchTransactions(); // Ensure party details are fetched first if needed for transactions
      setLoading(false);
    };

    loadData();
  }, [partyId, openingBalance]);

  if (loading) {
    return (
      <DashboardLayout>
        <Container sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        </Container>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Container sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </DashboardLayout>
    );
  }

  if (!partyDetails) {
    return (
        <DashboardLayout>
            <Container sx={{ mt: 4, mb: 4 }}>
                <Alert severity="warning">Party details not available.</Alert>
            </Container>
        </DashboardLayout>
    );
  }

  // This is the area around line 269 where the error occurs
  return ( // Make sure this line (268) is correct
    <DashboardLayout> {/* Line 269 - Error points here */} 
      {/* Ensure partyDetails is checked before accessing its properties */}
      {partyDetails && (
        <PageHeader title={`Statement for ${partyDetails.name}`} />
      )}
      <Container sx={{ mt: 2, mb: 4 }}>
        {/* Check if partyDetails exists before trying to render its properties */}
        {partyDetails ? (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                  <Typography variant="h6">{partyDetails.name}</Typography>
                  <Typography variant="body2" color="textSecondary">{partyDetails.email}</Typography>
                  <Typography variant="body2" color="textSecondary">{partyDetails.phone}</Typography>
                  <Typography variant="body2" color="textSecondary">{partyDetails.address}</Typography>
              </Box>
              <Button variant="outlined" onClick={() => window.print()}>Print Statement</Button>
            </Box>
            
            <Typography variant="h6" gutterBottom>Account Ledger</Typography>
            {/* You might want to display an opening balance here */}
            {/* <Typography variant="subtitle1">Opening Balance: {openingBalance.toFixed(2)}</Typography> */}

            <TableContainer component={Paper} elevation={2} sx={{ mt: 2 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                    <TableCell align="right">Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ledgerEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No transactions found for this period.
                      </TableCell>
                    </TableRow>
                  )}
                  {ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.formattedDate}</TableCell>
                      <TableCell>
                        {entry.type === 'Sale' ? (
                          <Link href={`/invoices/${entry.id}`} passHref legacyBehavior>
                            <Typography component="a" sx={{ cursor: 'pointer', textDecoration: 'underline', color: 'primary.main' }}>
                              {entry.description}
                            </Typography>
                          </Link>
                        ) : (
                          entry.description // Other types might not be clickable or link elsewhere
                        )}
                        {entry.type === 'Sale' && entry.items && entry.items.length > 0 && (
                          <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                            Items: {entry.items.slice(0, 2).map(item => item.productName).join(', ')}{entry.items.length > 2 ? '...' : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{entry.status || (entry.type === 'Payment' ? 'Paid' : '-')}</TableCell>
                      <TableCell>{entry.type === 'Sale' ? entry.dueDate : '-'}</TableCell>
                      <TableCell align="right">
                        {entry.debit ? entry.debit.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {entry.credit ? entry.credit.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell align="right">{entry.balance?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          // Fallback if partyDetails is somehow null here despite the check above
          // This case should ideally not be hit if the `if (!partyDetails)` check is working
          <Alert severity="info">Loading party information...</Alert>
        )}
      </Container>
    </DashboardLayout>
  );
}
 