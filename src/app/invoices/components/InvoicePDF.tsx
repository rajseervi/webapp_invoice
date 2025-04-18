"use client";
import React from 'react';
import { Button, Box, Tooltip } from '@mui/material';
import { Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';
// Import the autotable plugin correctly
import autoTable from 'jspdf-autotable';

import { Invoice } from '@/types/invoice';
import { TemplateType } from './TemplateSwitcher';
import { useTemplate } from '@/contexts/TemplateContext';

interface InvoicePDFProps {
  invoice: Invoice;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => {
  // Get the current template from context
  const { template } = useTemplate();
  
  const generatePDF = (forPrinting = false) => {
    // Create a new jsPDF instance
    const doc = new jsPDF();
    
    // Apply template-specific styling
    applyTemplateStyle(doc, template);
    
    // Generate PDF content based on the selected template
    if (template === 'modern') {
      generateModernPDF(doc, invoice);
    } else if (template === 'classic') {
      generateClassicPDF(doc, invoice);
    } else {
      generateMinimalistPDF(doc, invoice);
    }
    
    if (forPrinting) {
      // Open PDF in a new window for printing
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Clean up the URL object after printing
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
        };
      }
    } else {
      // Save the PDF
      doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    }
  };

  // Apply styling based on the selected template
  const applyTemplateStyle = (doc: jsPDF, templateType: TemplateType) => {
    // Set default font
    doc.setFont('helvetica');
    
    // Add custom fonts if needed
    // Note: jsPDF supports adding custom fonts, but for simplicity we're using the built-in fonts
    
    // Apply template-specific styling
    switch (templateType) {
      case 'modern':
        // Modern template uses blue accent colors
        doc.setDrawColor(41, 98, 255);
        // Set line width for consistent styling
        doc.setLineWidth(0.5);
        break;
      case 'classic':
        // Classic template uses more traditional styling
        doc.setDrawColor(0, 0, 0);
        // Set line width for consistent styling
        doc.setLineWidth(0.7);
        break;
      case 'minimalist':
        // Minimalist template uses subtle gray tones
        doc.setDrawColor(150, 150, 150);
        // Set line width for consistent styling
        doc.setLineWidth(0.3);
        break;
    }
    
    // Set default text color
    doc.setTextColor(0, 0, 0);
  };

  // Generate PDF with Modern template styling
  const generateModernPDF = (doc: jsPDF, invoice: Invoice) => {
    // Set page margins and dimensions
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add a full-width colored header band
    doc.setFillColor(41, 98, 255);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Add a diagonal accent element for modern design
    doc.setFillColor(65, 115, 255);
    doc.setDrawColor(65, 115, 255);
    doc.setLineWidth(0);
    
    // Create a polygon for the diagonal accent
    const points = [
      [pageWidth - 80, 0],
      [pageWidth, 0],
      [pageWidth, 80],
      [pageWidth - 80, 0]
    ];
    
    // Draw the polygon
    doc.triangle(
      points[0][0], points[0][1],
      points[1][0], points[1][1],
      points[2][0], points[2][1],
      'F'
    );
    
    // Add invoice title with modern typography
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', margin, 28);
    
    // Add invoice number on the header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${invoice.invoiceNumber}`, margin, 38);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Create a two-column layout for company and client info
    const colWidth = (contentWidth - 15) / 2; // 15px gap between columns
    const leftColX = margin;
    const rightColX = margin + colWidth + 15;
    
    // Add company details with modern styling
    let yPos = 60;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 120);
    doc.text('FROM', leftColX, yPos);
    
    yPos += 8;
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.companyName || 'Company Name', leftColX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    // Format address with proper line spacing
    yPos += 8;
    doc.setFontSize(9);
    const companyAddress = invoice.companyAddress || '';
    const addressLines = companyAddress.split(', ');
    addressLines.forEach(line => {
      doc.text(line, leftColX, yPos);
      yPos += 5;
    });
    
    doc.text(`Phone: ${invoice.companyPhone || ''}`, leftColX, yPos + 2);
    
    // Add client info in the right column
    yPos = 60;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 120);
    doc.text('BILL TO', rightColX, yPos);
    
    yPos += 8;
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.partyName, rightColX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    // Client address and contact with proper spacing
    yPos += 8;
    doc.setFontSize(9);
    if (invoice.partyAddress) {
      const addressLines = invoice.partyAddress.split(', ');
      addressLines.forEach(line => {
        doc.text(line, rightColX, yPos);
        yPos += 5;
      });
    }
    
    if (invoice.partyPhone) {
      doc.text(`Phone: ${invoice.partyPhone}`, rightColX, yPos + 2);
    }
    
    // Add invoice details in a modern box
    const detailsY = 105;
    
    // Add a horizontal separator
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(1);
    doc.line(margin, detailsY, pageWidth - margin, detailsY);
    
    // Create a row of invoice details
    const detailsBoxes = [
      { label: 'INVOICE NUMBER', value: invoice.invoiceNumber },
      { label: 'DATE', value: invoice.date },
      { label: 'DUE DATE', value: '15 days from issue' }
    ];
    
    const detailBoxWidth = contentWidth / detailsBoxes.length;
    
    detailsBoxes.forEach((detail, index) => {
      const boxX = margin + (index * detailBoxWidth);
      const boxY = detailsY + 5;
      
      // Label
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 120);
      doc.text(detail.label, boxX, boxY);
      
      // Value
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'bold');
      doc.text(detail.value, boxX, boxY + 10);
      doc.setFont('helvetica', 'normal');
    });
    
    // Add a section title for items with modern styling
    const itemsY = detailsY + 30;
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, itemsY, contentWidth, 10, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 98, 255);
    doc.text('INVOICE ITEMS', margin + 5, itemsY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Add table with items - completely redesigned modern styling
    const tableColumn = ["#", "Item Description", "Qty", "Unit Price (₹)", "Discount", "Amount (₹)"];
    const tableRows = invoice.items.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.quantity.toString(),
      item.price.toFixed(2),
      item.discount > 0 ? 
        `${item.discount}%` : 
        '-',
      item.finalPrice.toFixed(2)
    ]);
    
    // Use autoTable with completely redesigned modern styling
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: itemsY + 15,
      theme: 'plain',
      styles: { 
        fontSize: 9, 
        cellPadding: { top: 8, right: 5, bottom: 8, left: 5 },
        lineColor: [230, 230, 230],
        lineWidth: 0.1,
        font: 'helvetica',
        valign: 'middle',
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [41, 98, 255], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
        fontSize: 10,
        cellPadding: { top: 10, right: 5, bottom: 10, left: 5 },
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15, fontStyle: 'normal' },
        1: { halign: 'left', fontStyle: 'normal', cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 25, fontStyle: 'normal' },
        3: { halign: 'right', cellWidth: 35, fontStyle: 'normal' },
        4: { halign: 'center', cellWidth: 30, fontStyle: 'normal' },
        5: { halign: 'right', cellWidth: 35, fontStyle: 'bold', textColor: [41, 98, 255] }
      },
      alternateRowStyles: { fillColor: [248, 250, 255] },
      margin: { left: margin, right: margin },
      // Add a footer to the table with total items
      foot: [['', '', '', '', 'Total Items:', `${invoice.items.length}`]],
      footStyles: {
        fontSize: 9,
        fontStyle: 'bold',
        fillColor: [245, 247, 250],
        textColor: [100, 100, 120],
        halign: 'right'
      },
      // Add a border to the entire table
      didDrawPage: (data) => {
        // Add a border around the entire table
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.rect(data.settings.margin.left, itemsY + 15, 
                 pageWidth - (margin * 2), 
                 data.table.height);
      }
    });
    
    // Get the last page's Y position
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Add a modern summary section
    const summaryY = finalY + 20;
    
    // Add a horizontal separator
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(1);
    doc.line(margin, summaryY, pageWidth - margin, summaryY);
    
    // Create a two-column layout for summary and payment info
    const summaryColWidth = (contentWidth - 15) / 2; // 15px gap between columns
    
    // Right column for summary
    const summaryBoxX = margin + summaryColWidth + 15;
    
    // Add summary title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 98, 255);
    doc.text('INVOICE SUMMARY', summaryBoxX, summaryY + 15);
    doc.setFont('helvetica', 'normal');
    
    // Create a modern summary table
    const summaryData = [
      ['Subtotal:', `₹${invoice.subtotal.toFixed(2)}`],
      ['Discount:', `₹${invoice.discount.toFixed(2)}`],
      ['Total:', `₹${invoice.total.toFixed(2)}`]
    ];
    
    // Draw summary table with modern styling
    let summaryRowY = summaryY + 25;
    const summaryRowHeight = 20;
    const summaryValueX = pageWidth - margin;
    
    summaryData.forEach((row, index) => {
      // For the total row, add special styling
      if (index === summaryData.length - 1) {
        // Add a separator line
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.line(summaryBoxX, summaryRowY - 5, summaryValueX, summaryRowY - 5);
        
        // Add total with enhanced styling
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(41, 98, 255);
        doc.text(row[0], summaryBoxX, summaryRowY + 10);
        doc.text(row[1], summaryValueX, summaryRowY + 10, { align: 'right' });
      } else {
        // Regular summary rows
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 120);
        doc.text(row[0], summaryBoxX, summaryRowY);
        doc.setTextColor(60, 60, 60);
        doc.text(row[1], summaryValueX, summaryRowY, { align: 'right' });
      }
      
      summaryRowY += summaryRowHeight;
    });
    
    // Left column for payment info
    const paymentInfoX = margin;
    
    // Add payment info title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 98, 255);
    doc.text('PAYMENT INFORMATION', paymentInfoX, summaryY + 15);
    doc.setFont('helvetica', 'normal');
    
    // Add payment details
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text('Due Date:', paymentInfoX, summaryY + 30);
    doc.setFont('helvetica', 'bold');
    doc.text('Within 15 days of invoice date', paymentInfoX + 50, summaryY + 30);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Payment Method:', paymentInfoX, summaryY + 45);
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Transfer', paymentInfoX + 50, summaryY + 45);
    doc.setFont('helvetica', 'normal');
    
    // Add amount in words if available
    if (invoice.amountInWords) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 120);
      doc.text('Amount in Words:', paymentInfoX, summaryY + 60);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'italic');
      doc.text(invoice.amountInWords, paymentInfoX, summaryY + 70);
      doc.setFont('helvetica', 'normal');
    }
    
    // Add a QR code placeholder for digital verification
    const qrX = paymentInfoX;
    const qrY = summaryY + 80;
    const qrSize = 40;
    
    // Draw QR code placeholder with modern styling
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(41, 98, 255);
    doc.setLineWidth(0.5);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 3, 3, 'FD');
    
    // Add QR code label
    doc.setFontSize(8);
    doc.setTextColor(41, 98, 255);
    doc.text('Scan for digital verification', qrX + qrSize/2, qrY + qrSize + 8, { align: 'center' });
    
    // Add a modern footer
    const footerY = Math.max(summaryRowY + 30, qrY + qrSize + 20);
    
    // Add a full-width colored footer band
    doc.setFillColor(41, 98, 255);
    doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
    
    // Add a diagonal accent element for modern design in the footer
    doc.setFillColor(65, 115, 255);
    doc.triangle(
      0, pageHeight - 25,
      80, pageHeight,
      0, pageHeight,
      'F'
    );
    
    // Thank you message
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Add page number at the bottom
    doc.setFontSize(8);
    doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    
    // Add signature area with improved styling
    const signatureY = footerY - 20;
    
    // Add a signature box
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.roundedRect(summaryBoxX, signatureY, summaryColWidth, 60, 3, 3, 'S');
    
    // Add signature title
    doc.setTextColor(100, 100, 120);
    doc.setFontSize(9);
    doc.text('FOR ' + (invoice.companyName || 'COMPANY NAME'), summaryBoxX + 10, signatureY + 15);
    
    // Add signature line
    doc.setDrawColor(41, 98, 255);
    doc.setLineWidth(0.5);
    doc.line(summaryBoxX + 10, signatureY + 40, summaryBoxX + summaryColWidth - 10, signatureY + 40);
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.text('Authorized Signatory', summaryBoxX + 10, signatureY + 50);
  };

  // Generate PDF with Classic template styling
  const generateClassicPDF = (doc: jsPDF, invoice: Invoice) => {
    // Set page margins and dimensions
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add a classic border around the entire page
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.rect(margin / 2, margin / 2, pageWidth - margin, pageHeight - margin);
    
    // Add an inner border for a more elegant look
    doc.setLineWidth(0.3);
    doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));
    
    // Add elegant header with classic styling
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', pageWidth / 2, margin + 15, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    
    // Add decorative ornamental line
    const lineY = margin + 20;
    doc.setLineWidth(0.7);
    doc.line(margin + 30, lineY, pageWidth - margin - 30, lineY);
    
    // Add small decorative elements at the ends of the line
    doc.setLineWidth(0.5);
    doc.line(margin + 30, lineY - 3, margin + 30, lineY + 3);
    doc.line(pageWidth - margin - 30, lineY - 3, pageWidth - margin - 30, lineY + 3);
    
    // Create a two-column layout for company and client info
    const colWidth = (contentWidth - 20) / 2; // 20px gap between columns
    const leftColX = margin + 10;
    const rightColX = margin + colWidth + 30;
    
    // Add company details with elegant typography
    let yPos = margin + 35;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.companyName || 'Company Name', leftColX, yPos);
    doc.setFont('helvetica', 'normal');
    
    // Format address with proper line spacing
    yPos += 8;
    doc.setFontSize(10);
    const companyAddress = invoice.companyAddress || '';
    const addressLines = companyAddress.split(', ');
    addressLines.forEach(line => {
      doc.text(line, leftColX, yPos);
      yPos += 5;
    });
    
    doc.text(`Phone: ${invoice.companyPhone || ''}`, leftColX, yPos + 2);
    
    // Add invoice details in a formal box on the right
    const boxY = margin + 35;
    
    // Draw a border for the invoice details
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(rightColX, boxY, colWidth, 40);
    
    // Add inner lines for a more formal look
    doc.setLineWidth(0.3);
    doc.line(rightColX, boxY + 20, rightColX + colWidth, boxY + 20);
    
    // Invoice number with elegant styling
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE NUMBER', rightColX + 5, boxY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(invoice.invoiceNumber, rightColX + colWidth - 5, boxY + 10, { align: 'right' });
    
    // Date with elegant styling
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE', rightColX + 5, boxY + 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(invoice.date, rightColX + colWidth - 5, boxY + 30, { align: 'right' });
    
    // Add a section divider
    const dividerY = margin + 85;
    doc.setLineWidth(0.7);
    doc.line(margin + 10, dividerY, pageWidth - margin - 10, dividerY);
    
    // Add billing information section
    const billingY = dividerY + 15;
    
    // Add a formal box for billing information
    doc.setLineWidth(0.5);
    doc.rect(leftColX, billingY, colWidth, 40);
    
    // Add billing title
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', leftColX + 5, billingY + 10);
    
    // Add client name with elegant styling
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.partyName, leftColX + 5, billingY + 20);
    doc.setFont('helvetica', 'normal');
    
    // Format client address with proper spacing
    let clientYPos = billingY + 25;
    if (invoice.partyAddress) {
      doc.setFontSize(9);
      const addressLines = invoice.partyAddress.split(', ');
      addressLines.forEach(line => {
        doc.text(line, leftColX + 5, clientYPos);
        clientYPos += 5;
      });
    }
    
    // Add payment information in a formal box
    doc.setLineWidth(0.5);
    doc.rect(rightColX, billingY, colWidth, 40);
    
    // Add payment title
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', rightColX + 5, billingY + 10);
    doc.setFont('helvetica', 'normal');
    
    // Add payment details
    doc.setFontSize(9);
    doc.text('Due Date:', rightColX + 5, billingY + 20);
    doc.text('30 days from issue', rightColX + colWidth - 5, billingY + 20, { align: 'right' });
    
    doc.text('Payment Method:', rightColX + 5, billingY + 30);
    doc.text('Bank Transfer', rightColX + colWidth - 5, billingY + 30, { align: 'right' });
    
    // Add a section title for items with classic styling
    const itemsY = billingY + 55;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE ITEMS', pageWidth / 2, itemsY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    
    // Add decorative line under the title
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 40, itemsY + 3, pageWidth / 2 + 40, itemsY + 3);
    
    // Add table with items - elegant classic styling
    const tableColumn = ["No.", "Description", "Quantity", "Unit Price (₹)", "Discount (%)", "Amount (₹)"];
    const tableRows = invoice.items.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.quantity.toString(),
      item.price.toFixed(2),
      item.discount > 0 ? 
        `${item.discount}%` : 
        '-',
      item.finalPrice.toFixed(2)
    ]);
    
    // Use autoTable with elegant classic styling
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: itemsY + 10,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        font: 'helvetica',
        valign: 'middle',
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [0, 0, 0], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9,
        cellPadding: { top: 8, right: 4, bottom: 8, left: 4 }
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', fontStyle: 'normal', cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: margin + 10, right: margin + 10 },
      // Add a footer to the table with elegant styling
      foot: [['', '', '', '', 'Total Items:', `${invoice.items.length}`]],
      footStyles: {
        fontSize: 9,
        fontStyle: 'bold',
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        halign: 'right'
      },
      // Add a border around the entire table
      didDrawPage: (data) => {
        // Add a border around the entire table
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(
          data.settings.margin.left, 
          itemsY + 10, 
          pageWidth - (margin + 10) * 2, 
          data.table.height
        );
      }
    });
    
    // Get the last page's Y position
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Add summary section with elegant styling
    const summaryY = finalY + 20;
    
    // Add a section divider
    doc.setLineWidth(0.7);
    doc.line(margin + 10, summaryY, pageWidth - margin - 10, summaryY);
    
    // Create a two-column layout for summary and notes
    const summaryColWidth = (contentWidth - 20) / 2; // 20px gap between columns
    
    // Right column for summary
    const summaryBoxX = margin + colWidth + 30;
    
    // Add a formal box for the summary
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(summaryBoxX, summaryY + 10, colWidth, 70);
    
    // Add summary title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE SUMMARY', summaryBoxX + colWidth/2, summaryY + 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    
    // Add inner lines for a more formal look
    doc.setLineWidth(0.3);
    doc.line(summaryBoxX, summaryY + 25, summaryBoxX + colWidth, summaryY + 25);
    doc.line(summaryBoxX, summaryY + 40, summaryBoxX + colWidth, summaryY + 40);
    doc.line(summaryBoxX, summaryY + 55, summaryBoxX + colWidth, summaryY + 55);
    
    // Summary labels and values with elegant styling
    doc.setFontSize(9);
    doc.text('Subtotal:', summaryBoxX + 10, summaryY + 35);
    doc.text(`₹${invoice.subtotal.toFixed(2)}`, summaryBoxX + colWidth - 10, summaryY + 35, { align: 'right' });
    
    doc.text('Discount:', summaryBoxX + 10, summaryY + 50);
    doc.text(`₹${invoice.discount.toFixed(2)}`, summaryBoxX + colWidth - 10, summaryY + 50, { align: 'right' });
    
    // Total amount with elegant styling
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', summaryBoxX + 10, summaryY + 65);
    doc.text(`₹${invoice.total.toFixed(2)}`, summaryBoxX + colWidth - 10, summaryY + 65, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    // Left column for notes and terms
    const notesBoxX = margin + 10;
    
    // Add amount in words with elegant styling
    if (invoice.amountInWords) {
      // Add a formal box for amount in words
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(notesBoxX, summaryY + 10, colWidth, 30);
      
      // Add title
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('AMOUNT IN WORDS', notesBoxX + 5, summaryY + 20);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text(invoice.amountInWords, notesBoxX + 5, summaryY + 30);
      doc.setFont('helvetica', 'normal');
    }
    
    // Add terms and conditions with elegant styling
    const termsY = summaryY + (invoice.amountInWords ? 50 : 10);
    
    // Add a formal box for terms
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(notesBoxX, termsY, colWidth, 50);
    
    // Add title
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS & CONDITIONS', notesBoxX + 5, termsY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('1. Payment is due within 30 days of invoice date.', notesBoxX + 5, termsY + 20);
    doc.text('2. Please include the invoice number on your payment.', notesBoxX + 5, termsY + 28);
    doc.text('3. This is a computer-generated invoice and does not', notesBoxX + 5, termsY + 36);
    doc.text('    require a signature.', notesBoxX + 5, termsY + 44);
    
    // Add a formal footer
    const footerY = termsY + 60;
    
    // Add a section divider before footer
    doc.setLineWidth(0.7);
    doc.line(margin + 10, footerY, pageWidth - margin - 10, footerY);
    
    // Create a two-column layout for signature and QR code
    const signatureX = pageWidth - margin - colWidth;
    
    // Add signature area with elegant styling
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('For ' + (invoice.companyName || 'Company Name') + ':', signatureX, footerY + 15);
    doc.setFont('helvetica', 'normal');
    
    // Add signature box
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(signatureX, footerY + 20, colWidth / 2, 30);
    
    // Add signature line
    doc.line(signatureX + 5, footerY + 40, signatureX + (colWidth / 2) - 5, footerY + 40);
    doc.setFontSize(8);
    doc.text('Authorized Signatory', signatureX + 5, footerY + 48);
    
    // Add a QR code placeholder with elegant styling
    const qrX = margin + 10;
    const qrY = footerY + 15;
    const qrSize = 35;
    
    // Draw QR code placeholder with classic styling
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(qrX, qrY, qrSize, qrSize);
    
    // Add inner border for classic look
    doc.setLineWidth(0.3);
    doc.rect(qrX + 2, qrY + 2, qrSize - 4, qrSize - 4);
    
    // Add QR code label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Scan for verification', qrX + qrSize/2, qrY + qrSize + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    
    // Add thank you message
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Thank you for your business!', pageWidth / 2, footerY + 65, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    
    // Add page number at the bottom with elegant styling
    doc.setFontSize(8);
    doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - margin - 5, { align: 'center' });
  };

  // Generate PDF with Minimalist template styling
  const generateMinimalistPDF = (doc: jsPDF, invoice: Invoice) => {
    // Set page margins and dimensions
    const margin = 30; // Larger margins for minimalist style
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add a very subtle background color to the entire page for a premium feel
    doc.setFillColor(252, 252, 252);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Add a minimal top accent bar
    doc.setFillColor(100, 100, 100);
    doc.rect(0, 0, pageWidth, 8, 'F');
    
    // Add header with ultra-clean minimalist styling
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 70, 70);
    doc.text('INVOICE', margin, 40);
    
    // Add invoice number with subtle styling
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`#${invoice.invoiceNumber}`, margin, 52);
    
    // Add date with subtle styling
    doc.text(`Issued: ${invoice.date}`, pageWidth - margin, 52, { align: 'right' });
    
    // Add a minimal separator line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, 60, pageWidth - margin, 60);
    
    // Create a clean two-column layout
    const colWidth = (contentWidth - 30) / 2; // 30px gap between columns
    const leftColX = margin;
    const rightColX = pageWidth - margin - colWidth;
    
    // Company details with clean typography
    let yPos = 80;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('FROM', leftColX, yPos);
    
    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(70, 70, 70);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.companyName || 'Company Name', leftColX, yPos);
    doc.setFont('helvetica', 'normal');
    
    // Format address with proper line spacing
    yPos += 8;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const companyAddress = invoice.companyAddress || '';
    const addressLines = companyAddress.split(', ');
    addressLines.forEach(line => {
      doc.text(line, leftColX, yPos);
      yPos += 5;
    });
    
    doc.text(`Phone: ${invoice.companyPhone || ''}`, leftColX, yPos + 2);
    
    // Client details on the right column
    yPos = 80;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('BILL TO', rightColX, yPos);
    
    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(70, 70, 70);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.partyName, rightColX, yPos);
    doc.setFont('helvetica', 'normal');
    
    // Format client address with proper spacing
    yPos += 8;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    if (invoice.partyAddress) {
      const addressLines = invoice.partyAddress.split(', ');
      addressLines.forEach(line => {
        doc.text(line, rightColX, yPos);
        yPos += 5;
      });
    }
    
    if (invoice.partyPhone) {
      doc.text(`Phone: ${invoice.partyPhone}`, rightColX, yPos + 2);
    }
    
    // Add payment information in a subtle box
    const paymentY = 130;
    
    // Add a very subtle background for payment info
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, paymentY, contentWidth, 25, 2, 2, 'FD');
    
    // Add payment details with minimal styling
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('PAYMENT TERMS', margin + 10, paymentY + 10);
    doc.setTextColor(100, 100, 100);
    doc.text('Due within 15 days', margin + 10, paymentY + 18);
    
    doc.setTextColor(150, 150, 150);
    doc.text('PAYMENT METHOD', margin + contentWidth/3, paymentY + 10);
    doc.setTextColor(100, 100, 100);
    doc.text('Bank Transfer', margin + contentWidth/3, paymentY + 18);
    
    doc.setTextColor(150, 150, 150);
    doc.text('DUE DATE', margin + contentWidth*2/3, paymentY + 10);
    doc.setTextColor(100, 100, 100);
    doc.text('15 days from issue', margin + contentWidth*2/3, paymentY + 18);
    
    // Add a section title for items with minimal styling
    const itemsY = paymentY + 40;
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE ITEMS', margin, itemsY);
    doc.setFont('helvetica', 'normal');
    
    // Add table with items - ultra-clean minimalist styling
    const tableColumn = ["Item", "Qty", "Price", "Discount", "Amount"];
    const tableRows = invoice.items.map((item) => [
      item.name,
      item.quantity.toString(),
      `₹${item.price.toFixed(2)}`,
      item.discount > 0 ? `${item.discount}%` : '-',
      `₹${item.finalPrice.toFixed(2)}`
    ]);
    
    // Use autoTable with ultra-clean minimalist styling
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: itemsY + 10,
      theme: 'plain',
      styles: { 
        fontSize: 9, 
        cellPadding: { top: 10, right: 5, bottom: 10, left: 5 },
        lineColor: [240, 240, 240],
        lineWidth: 0.1,
        font: 'helvetica',
        valign: 'middle',
        overflow: 'linebreak'
      },
      headStyles: { 
        fontStyle: 'bold',
        fillColor: [245, 245, 245],
        textColor: [100, 100, 100],
        fontSize: 9,
        cellPadding: { top: 12, right: 5, bottom: 12, left: 5 }
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 35, fontStyle: 'bold', textColor: [70, 70, 70] }
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: margin, right: margin },
      // Add a subtle horizontal line after each row
      didDrawCell: (data) => {
        if (data.section === 'body' && data.row.index < tableRows.length - 1) {
          const x = data.cell.x;
          const y = data.cell.y + data.cell.height;
          const w = data.table.width;
          doc.setDrawColor(240, 240, 240);
          doc.setLineWidth(0.1);
          doc.line(x, y, x + w, y);
        }
      }
    });
    
    // Get the last page's Y position
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Add a minimal footer with item count
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${invoice.items.length} item${invoice.items.length !== 1 ? 's' : ''}`, 
             pageWidth - margin, finalY + 10, { align: 'right' });
    
    // Add a minimal separator line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, finalY + 20, pageWidth - margin, finalY + 20);
    
    // Add summary with ultra-clean minimalist styling
    const summaryY = finalY + 30;
    
    // Create a clean layout for summary
    const summaryLabelX = pageWidth - margin - 150;
    const summaryValueX = pageWidth - margin;
    
    // Summary labels and values with clean styling
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Subtotal', summaryLabelX, summaryY);
    doc.setTextColor(70, 70, 70);
    doc.text(`₹${invoice.subtotal.toFixed(2)}`, summaryValueX, summaryY, { align: 'right' });
    
    doc.setTextColor(120, 120, 120);
    doc.text('Discount', summaryLabelX, summaryY + 15);
    doc.setTextColor(70, 70, 70);
    doc.text(`₹${invoice.discount.toFixed(2)}`, summaryValueX, summaryY + 15, { align: 'right' });
    
    // Add a separator line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(summaryLabelX, summaryY + 25, summaryValueX, summaryY + 25);
    
    // Total amount with clean styling
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 70, 70);
    doc.text('Total', summaryLabelX, summaryY + 40);
    doc.text(`₹${invoice.total.toFixed(2)}`, summaryValueX, summaryY + 40, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    // Add amount in words if available
    if (invoice.amountInWords) {
      const amountWordsY = summaryY;
      
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text('AMOUNT IN WORDS', margin, amountWordsY);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'italic');
      doc.text(invoice.amountInWords, margin, amountWordsY + 10);
      doc.setFont('helvetica', 'normal');
    }
    
    // Add a QR code placeholder with ultra-minimal styling
    const qrX = margin;
    const qrY = summaryY + (invoice.amountInWords ? 25 : 0);
    const qrSize = 40;
    
    // Draw QR code placeholder with minimal styling
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.rect(qrX, qrY, qrSize, qrSize);
    
    // Add QR code label
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Scan to verify', qrX + qrSize/2, qrY + qrSize + 8, { align: 'center' });
    
    // Add signature area with minimal styling
    const signatureX = pageWidth - margin - 100;
    const signatureY = summaryY + 50;
    
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('AUTHORIZED SIGNATORY', signatureX, signatureY);
    
    // Add a minimal signature line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(signatureX, signatureY + 20, pageWidth - margin, signatureY + 20);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(invoice.companyName || 'Company Name', signatureX, signatureY + 30);
    
    // Add a minimal footer
    const footerY = pageHeight - 40;
    
    // Add a minimal separator line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    // Add thank you message with clean styling
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Thank you for your business', pageWidth / 2, footerY + 15, { align: 'center' });
    
    // Add page number with minimal styling
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };

  const printPDF = () => {
    generatePDF(true);
  };

  // Get template name for display
  const getTemplateDisplayName = () => {
    switch(template) {
      case 'modern': return 'Modern';
      case 'classic': return 'Classic';
      case 'minimalist': return 'Minimalist';
      default: return 'Selected';
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title={`Download as PDF using ${getTemplateDisplayName()} template style`}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={() => generatePDF(false)}
          size="small"
        >
          Download
        </Button>
      </Tooltip>
      
      <Tooltip title={`Print invoice using ${getTemplateDisplayName()} template style`}>
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