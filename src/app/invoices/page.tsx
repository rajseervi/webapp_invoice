"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box, 
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { collection, getDocs, orderBy, query, deleteDoc, doc, limit, startAfter, getCountFromServer, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import InvoicePrintButton from './components/InvoicePrintButton';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import PageHeader from '@/components/PageHeader/PageHeader';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  partyName: string;
  total: number;
  createdAt: any;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { userId, canViewAllData } = useCurrentUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isFirstPage, setIsFirstPage] = useState(true);
  
  // Fetch total count of invoices based on user role
  const fetchTotalCount = async () => {
    try {
      const coll = collection(db, 'invoices');
      let countQuery;
      
      try {
        if (canViewAllData()) {
          // Admin can see all invoices
          countQuery = coll;
        } else if (userId) {
          // Non-admin users can only see their own invoices
          countQuery = query(coll, where('userId', '==', userId));
        } else {
          // Fallback if no userId is available
          countQuery = coll;
        }
        
        const snapshot = await getCountFromServer(countQuery);
        setTotalCount(snapshot.data().count);
      } catch (queryError) {
        console.error('Error with count query:', queryError);
        // Fallback to getting all documents and counting them
        const fallbackQuery = collection(db, 'invoices');
        const snapshot = await getCountFromServer(fallbackQuery);
        setTotalCount(snapshot.data().count);
      }
    } catch (error) {
      console.error('Error fetching total count:', error);
      setTotalCount(0); // Set a default value
    }
  };
  
  // Fetch invoices with pagination
  const fetchInvoices = async (reset = false) => {
    try {
      setLoading(true);
      
      // If we're resetting or on the first page, start from the beginning
      let invoicesQuery;
      const invoicesRef = collection(db, 'invoices');
      
      if (reset || isFirstPage) {
        try {
          if (canViewAllData()) {
            // Admin can see all invoices
            invoicesQuery = query(
              invoicesRef,
              orderBy('createdAt', 'desc'),
              limit(rowsPerPage)
            );
          } else if (userId) {
            // Non-admin users can only see their own invoices
            // First try with the composite index
            try {
              invoicesQuery = query(
                invoicesRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(rowsPerPage)
              );
            } catch (indexError) {
              console.error('Index error, falling back to simpler query:', indexError);
              // This fallback won't be needed once the index is created
              invoicesQuery = query(
                invoicesRef,
                where('userId', '==', userId),
                limit(rowsPerPage)
              );
            }
          } else {
            // Fallback if no userId is available
            invoicesQuery = query(
              invoicesRef,
              orderBy('createdAt', 'desc'),
              limit(rowsPerPage)
            );
          }
        } catch (queryError) {
          console.error('Error creating query:', queryError);
          // Ultimate fallback - just get some invoices
          invoicesQuery = query(
            invoicesRef,
            limit(rowsPerPage)
          );
        }
        setIsFirstPage(true);
      } else {
        // For subsequent pages, start after the last document from the previous page
        try {
          if (canViewAllData()) {
            // Admin can see all invoices
            invoicesQuery = query(
              invoicesRef,
              orderBy('createdAt', 'desc'),
              startAfter(lastVisible),
              limit(rowsPerPage)
            );
          } else if (userId) {
            // Non-admin users can only see their own invoices
            try {
              invoicesQuery = query(
                invoicesRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                startAfter(lastVisible),
                limit(rowsPerPage)
              );
            } catch (indexError) {
              console.error('Index error on pagination, falling back to simpler query:', indexError);
              // If composite index doesn't exist, fall back to a simpler query
              invoicesQuery = query(
                invoicesRef,
                where('userId', '==', userId),
                limit(rowsPerPage)
              );
            }
          } else {
            // Fallback if no userId is available
            invoicesQuery = query(
              invoicesRef,
              orderBy('createdAt', 'desc'),
              startAfter(lastVisible),
              limit(rowsPerPage)
            );
          }
        } catch (queryError) {
          console.error('Error creating pagination query:', queryError);
          // Ultimate fallback - just get some invoices
          invoicesQuery = query(
            invoicesRef,
            limit(rowsPerPage)
          );
        }
      }
      
      try {
        const snapshot = await getDocs(invoicesQuery);
        
        // Store the last visible document for pagination
        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
        setLastVisible(lastVisibleDoc);
        
        const invoicesList = snapshot.docs.map(doc => {
          try {
            const data = doc.data();
            
            // Handle different date formats and missing fields
            let formattedDate;
            try {
              if (data.date) {
                formattedDate = data.date;
              } else if (data.createdAt) {
                if (data.createdAt.toDate) {
                  // Firestore Timestamp
                  formattedDate = data.createdAt.toDate().toISOString().split('T')[0];
                } else if (typeof data.createdAt === 'string') {
                  // ISO string
                  formattedDate = data.createdAt.split('T')[0];
                } else {
                  // Unknown format
                  formattedDate = new Date().toISOString().split('T')[0];
                }
              } else {
                formattedDate = new Date().toISOString().split('T')[0];
              }
            } catch (dateError) {
              console.error('Error formatting date:', dateError);
              formattedDate = new Date().toISOString().split('T')[0];
            }
            
            // Handle createdAt for sorting
            let createdAtValue;
            try {
              if (data.createdAt) {
                if (data.createdAt.toDate) {
                  createdAtValue = data.createdAt.toDate().toISOString();
                } else if (typeof data.createdAt === 'string') {
                  createdAtValue = data.createdAt;
                } else {
                  createdAtValue = new Date().toISOString();
                }
              } else {
                createdAtValue = new Date().toISOString();
              }
            } catch (createdAtError) {
              console.error('Error formatting createdAt:', createdAtError);
              createdAtValue = new Date().toISOString();
            }
            
            // Ensure all required fields are present with proper validation
            const processedInvoice = {
              id: doc.id,
              invoiceNumber: data.invoiceNumber || `INV-${doc.id.substring(0, 6)}`,
              date: formattedDate,
              partyName: data.partyName || 'Unknown Party',
              total: typeof data.total === 'number' ? data.total : 
                     typeof data.totalAmount === 'number' ? data.totalAmount : 0,
              createdAt: createdAtValue
            };
            
            // Validate the processed invoice data
            if (!processedInvoice.invoiceNumber || !processedInvoice.date) {
              throw new Error(`Invalid invoice data for document ${doc.id}`);
            }
            
            return processedInvoice as Invoice;
          } catch (docError) {
            console.error('Error processing invoice document:', docError);
            // Log the specific error and provide more context
            console.error(`Error processing invoice ${doc.id}:`, docError);
            
            // Return a default invoice object with error indication
            return {
              id: doc.id,
              invoiceNumber: `INV-${doc.id.substring(0, 6)} (Error)`,
              date: new Date().toISOString().split('T')[0],
              partyName: `Error: ${docError.message || 'Invalid Data'}`,
              total: 0,
              createdAt: new Date().toISOString()
            } as Invoice;
          }
        });
        
        if (invoicesList.length === 0 && !reset && !isFirstPage) {
          // If we got no results on a page after the first, go back to first page
          setIsFirstPage(true);
          fetchInvoices(true);
          return;
        }
        
        setInvoices(invoicesList);
      } catch (docError) {
        console.error('Error processing documents:', docError);
        setError('Error processing invoice data. Please try again.');
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch and refetch when userId changes
  useEffect(() => {
    fetchTotalCount();
    fetchInvoices(true);
  }, [userId]);
  
  // Fetch data when page or rowsPerPage changes
  useEffect(() => {
    if (page === 0) {
      fetchInvoices(true);
    } else {
      fetchInvoices(false);
    }
  }, [page, rowsPerPage]);

  const handleEditInvoice = (invoice: Invoice) => {
    router.push(`/invoices/${invoice.id}/edit`);
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInvoice) return;

    try {
      setLoading(true);
      const invoiceRef = doc(db, 'invoices', selectedInvoice.id);
      await deleteDoc(invoiceRef);

      // Refresh the data after deletion
      fetchTotalCount();
      fetchInvoices(true);
      setPage(0); // Reset to first page
      
      setSuccessMessage('Invoice deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    // If going forward, use the current lastVisible
    // If going backward to page 0, reset and fetch from beginning
    if (newPage > page) {
      setIsFirstPage(false);
    } else if (newPage === 0) {
      setIsFirstPage(true);
    }
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page
    setIsFirstPage(true);
  };
  
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title="Invoices"
          subtitle="Manage all your customer invoices"
          action={
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => router.push('/invoices/new')}
            >
              New Invoice
            </Button>
          }
        />
        
        <Paper sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice Number</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Party</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No invoices found</TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell>{invoice.partyName}</TableCell>
                        <TableCell align="right">
                          {typeof invoice.total === 'number' 
                            ? `₹${invoice.total.toFixed(2)}` 
                            : '₹0.00'}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Button 
                              size="small" 
                              onClick={() => router.push(`/invoices/${invoice.id}`)}
                            >
                              View
                            </Button>
                            <InvoicePrintButton 
                              invoiceId={invoice.id} 
                              invoiceNumber={invoice.invoiceNumber} 
                            />
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditInvoice(invoice)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(invoice)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {!loading && (
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: '1px solid rgba(224, 224, 224, 1)' }}
            />
          )}
        </Paper>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Invoice</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete invoice {selectedInvoice?.invoiceNumber}? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Message */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage(null)}
        >
          <Alert
            onClose={() => setSuccessMessage(null)}
            severity="success"
            sx={{ width: '100%' }}
          >
            {successMessage}
          </Alert>
        </Snackbar>

        {/* Error Message */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </DashboardLayout>
  );
}