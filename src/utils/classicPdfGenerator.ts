import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { renderToString } from 'react-dom/server';
import React from 'react';

interface InvoiceData {
  id?: string;
  invoiceNumber: string;
  date: Date | string;
  dueDate?: Date | string;
  company: {
    name: string;
    address: string;
    gstin?: string;
    phone?: string;
    email?: string;
  };
  customer: {
    name: string;
    address: string;
    gstin?: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    description?: string;
    productName?: string;
    quantity: number;
    rate?: number;
    unitPrice?: number;
    amount?: number;
    totalAmount?: number;
    hsn?: string;
    gstRate?: number;
  }>;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  grandTotal?: number;
  notes?: string;
  terms?: string;
  paymentDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  isGstInvoice?: boolean;
  type?: string;
  status?: string;
  paymentStatus?: string;
  totalTaxAmount?: number;
  balanceAmount?: number;
}

// Convert invoice data to the format expected by ClassicInvoiceTemplate
const convertToClassicFormat = (data: InvoiceData) => {
  return {
    id: data.id,
    invoiceNumber: data.invoiceNumber,
    date: data.date,
    dueDate: data.dueDate,
    customerName: data.customer.name,
    customerAddress: data.customer.address,
    customerGstin: data.customer.gstin,
    customerPhone: data.customer.phone,
    customerEmail: data.customer.email,
    items: data.items.map(item => ({
      description: item.description || item.productName || '',
      quantity: item.quantity,
      rate: item.rate || item.unitPrice || 0,
      amount: item.amount || item.totalAmount || 0,
      hsn: item.hsn,
      gstRate: item.gstRate
    })),
    subtotal: data.subtotal,
    tax: data.tax,
    discount: data.discount,
    total: data.total,
    grandTotal: data.grandTotal || data.total,
    notes: data.notes,
    terms: data.terms,
    paymentDetails: data.paymentDetails,
    isGstInvoice: data.isGstInvoice,
    type: data.type,
    status: data.status,
    paymentStatus: data.paymentStatus,
    totalTaxAmount: data.totalTaxAmount,
    balanceAmount: data.balanceAmount
  };
};

export const generateClassicPdfFromHtml = async (htmlContent: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '210mm';
    container.style.background = 'white';
    
    document.body.appendChild(container);

    // Use html2canvas to capture the content
    html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
    }).then(canvas => {
      // Clean up
      document.body.removeChild(container);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
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

      const blob = pdf.output('blob');
      resolve(blob);
    }).catch(error => {
      // Clean up on error
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      reject(error);
    });
  });
};

export const generateClassicPdfBlob = async (invoiceData: InvoiceData): Promise<Blob> => {
  try {
    // We'll need to render the ClassicInvoiceTemplate component to HTML
    // For now, let's create a simple HTML template that mimics the classic style
    const classicData = convertToClassicFormat(invoiceData);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${classicData.invoiceNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 5mm 10mm 15mm 10mm;
          }
          
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
          }
          
          .invoice-container {
            max-width: 210mm;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 15px;
            background: white;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 5px;
          }
          
          .invoice-title {
            font-size: 16px;
            font-weight: bold;
            text-decoration: underline;
            margin: 10px 0;
          }
          
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          
          .invoice-info, .customer-info {
            border: 1px solid #000;
            padding: 10px;
            width: 48%;
          }
          
          .section-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 8px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          
          .items-table th,
          .items-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          
          .items-table th {
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          
          .number-cell {
            text-align: right;
          }
          
          .total-section {
            margin-top: 20px;
            text-align: right;
          }
          
          .total-row {
            margin: 5px 0;
          }
          
          .grand-total {
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid #000;
            padding-top: 5px;
          }
          
          .terms-section {
            margin-top: 30px;
            border: 1px solid #000;
            padding: 10px;
          }
          
          .signature-section {
            margin-top: 30px;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-name">${classicData.customerName || 'COMPANY NAME'}</div>
            <div style="font-size: 12px; margin: 5px 0;">Complete Business Address</div>
            <div class="invoice-title">INVOICE</div>
          </div>
          
          <div class="invoice-details">
            <div class="invoice-info">
              <div class="section-title">Invoice Information:</div>
              <div><strong>Invoice No.:</strong> ${classicData.invoiceNumber}</div>
              <div><strong>Date:</strong> ${new Date(classicData.date).toLocaleDateString('en-IN')}</div>
              <div><strong>Due Date:</strong> ${classicData.dueDate ? new Date(classicData.dueDate).toLocaleDateString('en-IN') : 'N/A'}</div>
            </div>
            
            <div class="customer-info">
              <div class="section-title">Bill To:</div>
              <div><strong>${classicData.customerName}</strong></div>
              <div>${classicData.customerAddress}</div>
              ${classicData.customerGstin ? `<div>GSTIN: ${classicData.customerGstin}</div>` : ''}
              ${classicData.customerPhone ? `<div>Phone: ${classicData.customerPhone}</div>` : ''}
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate</th>
                ${classicData.isGstInvoice ? '<th>GST%</th>' : ''}
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${classicData.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td class="number-cell">${item.hsn || ''}</td>
                  <td class="number-cell">${item.quantity}</td>
                  <td class="number-cell">₹${item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  ${classicData.isGstInvoice ? `<td class="number-cell">${item.gstRate || 0}%</td>` : ''}
                  <td class="number-cell">₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-row">Subtotal: ₹${classicData.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            ${classicData.totalTaxAmount ? `<div class="total-row">Tax: ₹${classicData.totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>` : ''}
            ${classicData.discount ? `<div class="total-row">Discount: ₹${classicData.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>` : ''}
            <div class="total-row grand-total">Total: ₹${classicData.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          
          ${classicData.terms ? `
            <div class="terms-section">
              <div class="section-title">Terms & Conditions:</div>
              <div>${classicData.terms}</div>
            </div>
          ` : ''}
          
          ${classicData.notes ? `
            <div class="terms-section">
              <div class="section-title">Notes:</div>
              <div>${classicData.notes}</div>
            </div>
          ` : ''}
          
          <div class="signature-section">
            <div style="margin-top: 50px;">
              <div>Authorized Signature</div>
              <div style="border-top: 1px solid #000; width: 200px; margin-left: auto; margin-top: 20px;"></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await generateClassicPdfFromHtml(htmlContent);
  } catch (error) {
    console.error('Error generating classic PDF:', error);
    throw error;
  }
};

export const downloadClassicPdf = async (invoiceData: InvoiceData, filename?: string): Promise<void> => {
  try {
    const blob = await generateClassicPdfBlob(invoiceData);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `invoice-${invoiceData.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading classic PDF:', error);
    throw error;
  }
};