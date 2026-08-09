import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface LedgerTransaction {
  id?: string;
  date: string;
  description: string;
  reference?: string;
  debitAmount?: number;
  creditAmount?: number;
  balance?: number;
  type?: 'debit' | 'credit';
  amount?: number;
}

interface Party {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
}

interface LedgerPrintViewProps {
  open: boolean;
  onClose: () => void;
  partyName: string;
  party?: Party;
  transactions: LedgerTransaction[];
  loading?: boolean;
  onPrint?: () => void;
}

export default function LedgerPrintView({
  open,
  onClose,
  partyName,
  party,
  transactions,
  loading = false,
  onPrint,
}: LedgerPrintViewProps) {
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [printing, setPrinting] = useState(false);

  const filteredTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    return txDate >= new Date(startDate) && txDate <= new Date(endDate);
  });

  const calculateTotals = () => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        const debit = tx.debitAmount || (tx.type === 'debit' ? tx.amount || 0 : 0);
        const credit = tx.creditAmount || (tx.type === 'credit' ? tx.amount || 0 : 0);
        return {
          totalDebit: acc.totalDebit + debit,
          totalCredit: acc.totalCredit + credit,
          balance: acc.totalDebit + debit - (acc.totalCredit + credit),
        };
      },
      { totalDebit: 0, totalCredit: 0, balance: 0 }
    );
  };

  const totals = calculateTotals();

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const printContent = document.getElementById('ledger-print-content');
      if (!printContent) return;

      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Ledger_${partyName.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`;
      pdf.save(fileName);

      if (onPrint) onPrint();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintWindow = () => {
    const printContent = document.getElementById('ledger-print-content');
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Ledger Print</title>');
    printWindow.document.write(`
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        * {
          box-sizing: border-box;
        }
        .container {
          max-width: 210mm;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
        }
        .company-name {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
          color: #333;
        }
        .period-info {
          font-size: 12px;
          color: #666;
          margin: 10px 0;
        }
        .party-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
          font-size: 12px;
        }
        .party-details, .period-dates {
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 3px;
        }
        .detail-label {
          font-weight: bold;
          color: #333;
          margin-bottom: 3px;
        }
        .detail-value {
          color: #555;
          margin-bottom: 5px;
          word-break: break-word;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 11px;
        }
        th {
          background-color: #f5f5f5;
          color: #333;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #333;
          font-weight: 600;
          border-top: 1px solid #333;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #ddd;
          color: #555;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        tr:hover {
          background-color: #f0f0f0;
        }
        .amount-cell {
          text-align: right;
          font-family: 'Courier New', monospace;
        }
        .totals-row {
          font-weight: 600;
          background-color: #f5f5f5;
          border-top: 2px solid #333;
          border-bottom: 2px solid #333;
        }
        .totals-row td {
          border-bottom: 2px solid #333;
          padding: 12px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 10px;
          color: #999;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .container {
            page-break-inside: avoid;
          }
        }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={600}>
          Ledger Print Preview
        </Typography>
        <Box
          component="button"
          onClick={onClose}
          sx={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            color: '#999',
            '&:hover': { color: '#333' },
          }}
        >
          <CloseIcon />
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: '600px', overflow: 'auto' }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
            Select Date Range
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box id="ledger-print-content">
            <Box sx={{ fontFamily: 'monospace', fontSize: '12px', p: 2, bgcolor: '#fff' }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #333', pb: 2 }}>
                <Typography
                  sx={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#333',
                    fontFamily: 'monospace',
                  }}
                >
                  LEDGER ACCOUNT
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#666', mt: 0.5 }}>
                  Ledger Report
                </Typography>
              </Box>

              {/* Party & Period Info */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Box sx={{ border: '1px solid #ddd', p: 1.5, borderRadius: '3px' }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: '#333', mb: 0.5 }}>
                      ACCOUNT
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#555', mb: 0.3 }}>
                      {partyName}
                    </Typography>
                    {party?.address && (
                      <Typography sx={{ fontSize: '10px', color: '#666', mb: 0.2 }}>
                        {party.address}
                      </Typography>
                    )}
                    {party?.phone && (
                      <Typography sx={{ fontSize: '10px', color: '#666', mb: 0.2 }}>
                        Ph: {party.phone}
                      </Typography>
                    )}
                    {party?.gstNumber && (
                      <Typography sx={{ fontSize: '10px', color: '#666' }}>
                        GSTIN: {party.gstNumber}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ border: '1px solid #ddd', p: 1.5, borderRadius: '3px' }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: '#333', mb: 0.5 }}>
                      PERIOD
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#555', mb: 0.5 }}>
                      From: {format(new Date(startDate), 'dd-MMM-yyyy')}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#555' }}>
                      To: {format(new Date(endDate), 'dd-MMM-yyyy')}
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: '#999', mt: 0.5 }}>
                      Total Transactions: {filteredTransactions.length}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Transactions Table */}
              <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 'none', border: '1px solid #ddd' }}>
                <Table sx={{ fontSize: '11px' }}>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow sx={{ borderBottom: '2px solid #333' }}>
                      <TableCell sx={{ py: 1, px: 1.5, fontWeight: 'bold', fontSize: '11px' }}>
                        Date
                      </TableCell>
                      <TableCell sx={{ py: 1, px: 1.5, fontWeight: 'bold', fontSize: '11px' }}>
                        Description
                      </TableCell>
                      <TableCell sx={{ py: 1, px: 1.5, fontWeight: 'bold', fontSize: '11px' }}>
                        Reference
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ py: 1, px: 1.5, fontWeight: 'bold', fontSize: '11px' }}
                      >
                        Debit (₹)
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ py: 1, px: 1.5, fontWeight: 'bold', fontSize: '11px' }}
                      >
                        Credit (₹)
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ py: 1, px: 1.5, fontWeight: 'bold', fontSize: '11px' }}
                      >
                        Balance (₹)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ textAlign: 'center', py: 2, color: '#999' }}>
                          No transactions found for the selected period
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {filteredTransactions.map((tx, index) => (
                          <TableRow
                            key={tx.id || index}
                            sx={{
                              borderBottom: '1px solid #ddd',
                              '&:nth-of-type(even)': { bgcolor: '#f9f9f9' },
                            }}
                          >
                            <TableCell sx={{ py: 0.8, px: 1.5, fontSize: '10px' }}>
                              {format(new Date(tx.date), 'dd-MMM-yy')}
                            </TableCell>
                            <TableCell sx={{ py: 0.8, px: 1.5, fontSize: '10px' }}>
                              {tx.description}
                            </TableCell>
                            <TableCell sx={{ py: 0.8, px: 1.5, fontSize: '10px' }}>
                              {tx.reference || '-'}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                py: 0.8,
                                px: 1.5,
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                color: (tx.debitAmount || 0) > 0 ? '#d32f2f' : '#555',
                              }}
                            >
                              {(tx.debitAmount || (tx.type === 'debit' ? tx.amount || 0 : 0)).toFixed(2)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                py: 0.8,
                                px: 1.5,
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                color: (tx.creditAmount || 0) > 0 ? '#388e3c' : '#555',
                              }}
                            >
                              {(tx.creditAmount || (tx.type === 'credit' ? tx.amount || 0 : 0)).toFixed(2)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                py: 0.8,
                                px: 1.5,
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                fontWeight: '500',
                              }}
                            >
                              {(tx.balance || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow
                          sx={{
                            backgroundColor: '#f5f5f5',
                            borderTop: '2px solid #333',
                            borderBottom: '2px solid #333',
                            fontWeight: 'bold',
                          }}
                        >
                          <TableCell colSpan={3} sx={{ py: 1, px: 1.5, fontSize: '11px', fontWeight: 'bold' }}>
                            TOTAL
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              py: 1,
                              px: 1.5,
                              fontSize: '11px',
                              fontWeight: 'bold',
                              fontFamily: 'monospace',
                            }}
                          >
                            {totals.totalDebit.toFixed(2)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              py: 1,
                              px: 1.5,
                              fontSize: '11px',
                              fontWeight: 'bold',
                              fontFamily: 'monospace',
                            }}
                          >
                            {totals.totalCredit.toFixed(2)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              py: 1,
                              px: 1.5,
                              fontSize: '11px',
                              fontWeight: 'bold',
                              fontFamily: 'monospace',
                            }}
                          >
                            {totals.balance.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Footer */}
              <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: '1px solid #ddd' }}>
                <Typography sx={{ fontSize: '9px', color: '#999' }}>
                  Generated on {format(new Date(), 'dd-MMM-yyyy HH:mm:ss')}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ gap: 1, p: 2 }}>
        <Button onClick={onClose} variant="outlined" startIcon={<CloseIcon />}>
          Close
        </Button>
        <Button
          onClick={handlePrintWindow}
          variant="contained"
          color="info"
          startIcon={<PrintIcon />}
          disabled={printing || filteredTransactions.length === 0}
        >
          {printing ? 'Processing...' : 'Print'}
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          disabled={printing || filteredTransactions.length === 0}
        >
          {printing ? 'Processing...' : 'Download PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
