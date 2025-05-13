"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Card,
  CardContent,
  Breadcrumbs,
  Link as MuiLink,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { transactionService } from '@/services/transactionService';
import { partyService } from '@/services/partyService';
import { Transaction } from '@/types/transaction';
import { Party } from '@/types/party';
import { formatDate } from '@/utils/dateUtils';

interface TransactionDetailPageProps {
  params: {
    id: string;
  };
}

export default function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { id } = params;
  const router = useRouter();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch transaction
        const transactionData = await transactionService.getTransaction(id);
        setTransaction(transactionData);
        
        // Fetch party details
        if (transactionData.partyId) {
          const partyData = await partyService.getParty(transactionData.partyId);
          setParty(partyData);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching transaction details:', err);
        setError('Failed to load transaction details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchTransactionDetails();
    }
  }, [id]);
  
  const handleEdit = () => {
    router.push(`/accounting/transactions/${id}/edit`);
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    try {
      setLoading(true);
      await transactionService.deleteTransaction(id);
      router.push('/accounting/transactions');
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError('Failed to delete transaction. Please try again.');
      setLoading(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Transaction Details
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <MuiLink 
                underline="hover" 
                color="inherit" 
                href="/accounting"
                sx={{ cursor: 'pointer' }}
              >
                Accounting
              </MuiLink>
              <MuiLink 
                underline="hover" 
                color="inherit" 
                href="/accounting/transactions"
                sx={{ cursor: 'pointer' }}
              >
                Transactions
              </MuiLink>
              <Typography color="text.primary">Transaction #{id.substring(0, 8)}</Typography>
            </Breadcrumbs>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ mr: 1 }}
            >
              Print
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : transaction ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Transaction Information
                  </Typography>
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDelete}
                      size="small"
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <TableContainer>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" sx={{ width: '30%', fontWeight: 600 }}>
                          Transaction ID
                        </TableCell>
                        <TableCell>
                          {transaction.id}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 600 }}>
                          Transaction Type
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={transaction.type === 'debit' ? 'Debit (Receive)' : 'Credit (Pay)'} 
                            color={transaction.type === 'debit' ? 'success' : 'primary'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 600 }}>
                          Amount
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body1" 
                            fontWeight={600}
                            color={transaction.type === 'debit' ? 'success.main' : 'primary.main'}
                          >
                            ₹{transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 600 }}>
                          Date
                        </TableCell>
                        <TableCell>
                          {formatDate(transaction.date)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 600 }}>
                          Description
                        </TableCell>
                        <TableCell>
                          {transaction.description}
                        </TableCell>
                      </TableRow>
                      {transaction.reference && (
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 600 }}>
                            Reference
                          </TableCell>
                          <TableCell>
                            {transaction.reference}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 600 }}>
                          Created At
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 600 }}>
                          Last Updated
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.updatedAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Party Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {party ? (
                    <>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {party.name}
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Contact Information
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {party.email}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {party.phone}
                        </Typography>
                      </Box>
                      
                      {party.address && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Address
                          </Typography>
                          <Typography variant="body1">
                            {party.address}
                          </Typography>
                        </Box>
                      )}
                      
                      {party.gstin && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            GSTIN
                          </Typography>
                          <Typography variant="body1">
                            {party.gstin}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Outstanding Balance
                        </Typography>
                        <Typography 
                          variant="body1" 
                          fontWeight={600}
                          color={
                            party.outstandingBalance && party.outstandingBalance > 0 
                              ? 'error.main' 
                              : party.outstandingBalance && party.outstandingBalance < 0 
                                ? 'success.main' 
                                : 'text.primary'
                          }
                        >
                          ₹{party.outstandingBalance 
                            ? Math.abs(party.outstandingBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 })
                            : '0.00'
                          }
                          {party.outstandingBalance ? (
                            party.outstandingBalance > 0 
                              ? ' (Receivable)' 
                              : ' (Payable)'
                          ) : ''}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 3 }}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => router.push(`/accounting/statements/party-bills?partyId=${party.id}`)}
                        >
                          View Party Statement
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Party information not available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Transaction Help
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body2" paragraph>
                    <strong>Debit (Receive):</strong> Money received from the party. This increases the amount they owe you.
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    <strong>Credit (Pay):</strong> Money paid to the party. This decreases the amount they owe you.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Transaction not found
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/accounting/transactions')}
              sx={{ mt: 2 }}
            >
              Back to Transactions
            </Button>
          </Box>
        )}
      </Container>
    </DashboardLayout>
  );
}