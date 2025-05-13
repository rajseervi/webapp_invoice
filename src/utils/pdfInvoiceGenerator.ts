import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  hsn?: string;
  tax?: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  dueDate?: Date;
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
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  notes?: string;
  terms?: string;
  paymentDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
}

export const generateClassicInvoicePDF = (data: InvoiceData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPos = margin;

  // Helper function for text alignment
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    doc.text(text, x, y, options);
  };

  // Add company logo and header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  addText('INVOICE', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Company details (left side)
  doc.setFont('helvetica', 'bold');
  addText('From:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  addText(data.company.name, margin, yPos);
  yPos += 5;
  const companyAddressLines = data.company.address.split('\n');
  companyAddressLines.forEach(line => {
    addText(line, margin, yPos);
    yPos += 5;
  });
  if (data.company.gstin) {
    addText(`GSTIN: ${data.company.gstin}`, margin, yPos);
    yPos += 5;
  }
  if (data.company.phone) {
    addText(`Phone: ${data.company.phone}`, margin, yPos);
    yPos += 5;
  }
  if (data.company.email) {
    addText(`Email: ${data.company.email}`, margin, yPos);
    yPos += 5;
  }

  // Invoice details (right side)
  const rightColumnX = pageWidth - margin - 60;
  let rightColumnY = 35;
  
  doc.setFont('helvetica', 'bold');
  addText('Invoice Details:', rightColumnX, rightColumnY);
  doc.setFont('helvetica', 'normal');
  rightColumnY += 7;
  addText(`Invoice No: ${data.invoiceNumber}`, rightColumnX, rightColumnY);
  rightColumnY += 7;
  addText(`Date: ${format(data.date, 'dd/MM/yyyy')}`, rightColumnX, rightColumnY);
  if (data.dueDate) {
    rightColumnY += 7;
    addText(`Due Date: ${format(data.dueDate, 'dd/MM/yyyy')}`, rightColumnX, rightColumnY);
  }

  // Bill to section
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  addText('Bill To:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  addText(data.customer.name, margin, yPos);
  yPos += 5;
  const customerAddressLines = data.customer.address.split('\n');
  customerAddressLines.forEach(line => {
    addText(line, margin, yPos);
    yPos += 5;
  });
  if (data.customer.gstin) {
    addText(`GSTIN: ${data.customer.gstin}`, margin, yPos);
    yPos += 5;
  }

  // Items table
  yPos += 10;
  const tableColumns = [
    { header: 'Description', dataKey: 'description' },
    { header: 'HSN', dataKey: 'hsn' },
    { header: 'Qty', dataKey: 'quantity' },
    { header: 'Rate', dataKey: 'rate' },
    { header: 'Amount', dataKey: 'amount' }
  ];

  const tableRows = data.items.map(item => ({
    description: item.description,
    hsn: item.hsn || '',
    quantity: item.quantity.toString(),
    rate: item.rate.toFixed(2),
    amount: item.amount.toFixed(2)
  }));

  doc.autoTable({
    startY: yPos,
    head: [tableColumns.map(col => col.header)],
    body: tableRows.map(row => tableColumns.map(col => row[col.dataKey as keyof typeof row])),
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [70, 70, 70] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 }
    }
  });

  // Calculate new Y position after table
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Summary section (right aligned)
  const summaryX = pageWidth - margin - 80;
  doc.setFont('helvetica', 'normal');
  addText(`Subtotal: ${data.subtotal.toFixed(2)}`, summaryX, yPos);
  yPos += 7;

  if (data.tax) {
    addText(`Tax (${data.tax}%): ${(data.subtotal * data.tax / 100).toFixed(2)}`, summaryX, yPos);
    yPos += 7;
  }

  if (data.discount) {
    addText(`Discount: ${data.discount.toFixed(2)}`, summaryX, yPos);
    yPos += 7;
  }

  doc.setFont('helvetica', 'bold');
  addText(`Total: ${data.total.toFixed(2)}`, summaryX, yPos);
  yPos += 15;

  // Payment details
  if (data.paymentDetails) {
    doc.setFont('helvetica', 'bold');
    addText('Payment Details:', margin, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    if (data.paymentDetails.bankName) {
      addText(`Bank Name: ${data.paymentDetails.bankName}`, margin, yPos);
      yPos += 5;
    }
    if (data.paymentDetails.accountNumber) {
      addText(`Account Number: ${data.paymentDetails.accountNumber}`, margin, yPos);
      yPos += 5;
    }
    if (data.paymentDetails.ifscCode) {
      addText(`IFSC Code: ${data.paymentDetails.ifscCode}`, margin, yPos);
      yPos += 5;
    }
  }

  // Terms and notes
  if (data.terms) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    addText('Terms & Conditions:', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const termsLines = data.terms.split('\n');
    termsLines.forEach(line => {
      addText(line, margin, yPos);
      yPos += 5;
    });
  }

  if (data.notes) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    addText('Notes:', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const notesLines = data.notes.split('\n');
    notesLines.forEach(line => {
      addText(line, margin, yPos);
      yPos += 5;
    });
  }

  return doc;
};