"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
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
  Snackbar
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { collection, getDocs, orderBy, query, deleteDoc, doc, limit, startAfter, getCountFromServer } from 'firebase/firestore';
import { db } from '@/firebase/config';

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
  
  // Fetch total count of invoices
  const fetchTotalCount = async () => {
    try {
      const coll = collection(db, 'invoices');
      const snapshot = await getCountFromServer(coll);
      setTotalCount(snapshot.data().count);
    } catch (error) {
      console.error('Error fetching total count:', error);
    }
  };
  
  // Fetch invoices with pagination
  const fetchInvoices = async (reset = false) => {
    try {
      setLoading(true);
      
      // If we're resetting or on the first page, start from the beginning
      let invoicesQuery;
      if (reset || isFirstPage) {
        invoicesQuery = query(
          collection(db, 'invoices'),
          orderBy('createdAt', 'desc'),
          limit(rowsPerPage)
        );
        setIsFirstPage(true);
      } else {
        // For subsequent pages, start after the last document from the previous page
        invoicesQuery = query(
          collection(db, 'invoices'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(rowsPerPage)
        );
      }
      
      const snapshot = await getDocs(invoicesQuery);
      
      // Store the last visible document for pagination
      const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);
      
      const invoicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Invoice));
      
      setInvoices(invoicesList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchTotalCount();
    fetchInvoices(true);
  }, []);
  
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Invoices</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => router.push('/invoices/new')}
          >
            New Invoice
          </Button>
        </Box>
        
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