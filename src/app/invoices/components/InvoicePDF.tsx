"use client";
import React from 'react';
import { Button, Box, Tooltip } from '@mui/material';
import { Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';
// Import the autotable plugin correctly
import autoTable from 'jspdf-autotable';

import { Invoice } from '@/types/invoice';

interface InvoicePDFProps {
  invoice: Invoice;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => {
  const generatePDF = () => {
    // Create a new jsPDF instance
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(24);
    doc.text('Tax Invoice', doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    // Add company details
    doc.setFontSize(16);
    doc.text(invoice.companyName || 'Company Name', 20, 30);
    doc.setFontSize(10);
    doc.text(invoice.companyAddress || '', 20, 35);
    doc.text(`Phone: ${invoice.companyPhone || ''}`, 20, 40);
    
    // Add invoice details and customer info in two columns
    doc.setFontSize(10);
    doc.text('Bill To:', 20, 50);
    doc.text(invoice.partyName, 20, 55);
    if (invoice.partyAddress) {
      doc.text(invoice.partyAddress, 20, 60);
    }
    if (invoice.partyPhone) {
      doc.text(`Contact No: ${invoice.partyPhone}`, 20, 65);
    }

    doc.text('Invoice Details:', doc.internal.pageSize.width - 80, 50);
    doc.text(`No: ${invoice.invoiceNumber}`, doc.internal.pageSize.width - 80, 55);
    doc.text(`Date: ${invoice.date}`, doc.internal.pageSize.width - 80, 60);
    
    // Add table
    const tableColumn = ["#", "Item name", "Quantity", "Price/Unit(₹)", "Discount(%)", "Amount(₹)"];
    const tableRows = invoice.items.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.quantity.toString(),
      item.price.toFixed(2),
      item.discount > 0 ? 
        `${item.discount}${item.discountType && item.discountType !== 'none' ? ` (${item.discountType})` : ''}` : 
        '0',
      item.finalPrice.toFixed(2)
    ]);
    
    // Use autoTable correctly
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 98, 255], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { left: 20, right: 20 }
    });
    
    // Get the last page's Y position
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    
    // Add summary with better styling
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(110, finalY + 5, 190, finalY + 5);
    
    doc.text('Subtotal:', 130, finalY + 10);
    doc.text(`₹${invoice.subtotal.toFixed(2)}`, 170, finalY + 10, { align: 'right' });
    
    doc.text('Discount:', 130, finalY + 15);
    doc.text(`₹${invoice.discount.toFixed(2)}`, 170, finalY + 15, { align: 'right' });
    
    doc.setFillColor(240, 240, 240);
    doc.rect(110, finalY + 20, 80, 10, 'F');
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', 130, finalY + 27);
    doc.text(`₹${invoice.total.toFixed(2)}`, 170, finalY + 27, { align: 'right' });
    doc.setFont(undefined, 'normal');
    
    // Add amount in words
    if (invoice.amountInWords) {
      doc.text('Invoice Amount in Words:', 20, finalY + 40);
      doc.text(invoice.amountInWords, 20, finalY + 45);
    }

    // Add received and balance
    doc.text('Received:', 20, finalY + 55);
    doc.text('₹0.00', 60, finalY + 55);
    doc.text('Balance:', 20, finalY + 60);
    doc.text(`₹${invoice.total.toFixed(2)}`, 60, finalY + 60);
    doc.text('You Saved:', 20, finalY + 65);
    doc.text(`₹${invoice.discount.toFixed(2)}`, 60, finalY + 65);

    // Add terms and conditions
    doc.text('Terms & Conditions:', 20, finalY + 80);
    doc.text('Thanks for doing business with us!', 20, finalY + 85);

    // Add authorized signatory
    doc.text('For ' + (invoice.companyName || 'Company Name') + ':', doc.internal.pageSize.width - 80, finalY + 80);
    doc.text('Authorized Signatory', doc.internal.pageSize.width - 80, finalY + 100);
    
    // Save the PDF
    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  };

  const printPDF = () => {
    generatePDF();
    // This would typically open the PDF in a new window for printing
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="Download as PDF">
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={generatePDF}
          size="small"
        >
          Download
        </Button>
      </Tooltip>
      
      <Tooltip title="Print invoice">
        <Button
          variant="outlined"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={printPDF}
          size="small"
        >
          Print
        </Button>
      </Tooltip>
    </Box>
  );
};

export default InvoicePDF;