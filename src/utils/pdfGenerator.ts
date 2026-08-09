import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PdfOptions {
  template?: 'classic' | 'modern' | 'thermal' | 'minimal';
  paperSize?: 'A4' | 'A5' | 'Letter' | 'Thermal';
  colorMode?: 'color' | 'grayscale';
  includeHeaders?: boolean;
  includeFooters?: boolean;
  copies?: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  partyName: string;
  partyAddress?: string;
  partyPhone?: string;
  partyEmail?: string;
  partyGstin?: string;
  items: any[];
  subtotal: number;
  total: number;
  totalTaxAmount?: number;
  discount?: number;
  notes?: string;
  terms?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyGstin?: string;
}

export const downloadClassicTemplatePdf = async (
  invoice: InvoiceData,
  filename: string,
  options: PdfOptions = {}
): Promise<void> => {
  const {
    template = 'classic',
    paperSize = 'A4',
    colorMode = 'color',
    includeHeaders = true,
    includeFooters = true,
    copies = 1
  } = options;

  try {
    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: paperSize === 'Thermal' ? [80, 200] : paperSize,
    });

    if (template === 'thermal') {
      generateThermalReceipt(doc, invoice, options);
    } else if (template === 'modern') {
      generateModernInvoice(doc, invoice, options);
    } else if (template === 'minimal') {
      generateMinimalInvoice(doc, invoice, options);
    } else {
      generateClassicInvoice(doc, invoice, options);
    }

    // Download the PDF
    doc.save(filename);
  } catch (error) {
    console.error(`Error generating PDF with template '${template}':`, error);
    throw new Error(`Failed to generate PDF with template '${template}'`);
  }
};

const generateClassicInvoice = (doc: jsPDF, invoice: InvoiceData, options: PdfOptions) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors
  const primaryColor = options.colorMode === 'color' ? [41, 128, 185] : [80, 80, 80];
  const secondaryColor = options.colorMode === 'color' ? [52, 73, 94] : [120, 120, 120];
  
  let yPosition = 20;

  // Header
  if (options.includeHeaders) {
    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    doc.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Company info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    if (invoice.companyName) {
      doc.text(invoice.companyName, 20, yPosition);
      yPosition += 6;
    }
    if (invoice.companyAddress) {
      doc.text(invoice.companyAddress, 20, yPosition);
      yPosition += 6;
    }
    if (invoice.companyPhone || invoice.companyEmail) {
      doc.text(`${invoice.companyPhone || ''} ${invoice.companyEmail || ''}`, 20, yPosition);
      yPosition += 6;
    }
    if (invoice.companyGstin) {
      doc.text(`GSTIN: ${invoice.companyGstin}`, 20, yPosition);
      yPosition += 10;
    }
  }

  // Invoice details
  const invoiceDetailsY = yPosition;
  doc.setFontSize(10);
  doc.setTextColor(...secondaryColor);
  doc.text('Invoice Number:', pageWidth - 80, invoiceDetailsY);
  doc.text('Date:', pageWidth - 80, invoiceDetailsY + 6);
  
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.invoiceNumber, pageWidth - 40, invoiceDetailsY);
  doc.text(invoice.date, pageWidth - 40, invoiceDetailsY + 6);

  yPosition += 20;

  // Bill to section
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Bill To:', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.partyName, 20, yPosition);
  yPosition += 6;
  
  if (invoice.partyAddress) {
    doc.text(invoice.partyAddress, 20, yPosition);
    yPosition += 6;
  }
  
  if (invoice.partyPhone) {
    doc.text(`Phone: ${invoice.partyPhone}`, 20, yPosition);
    yPosition += 6;
  }
  
  if (invoice.partyGstin) {
    doc.text(`GSTIN: ${invoice.partyGstin}`, 20, yPosition);
    yPosition += 6;
  }

  yPosition += 10;

  // Items table
  const tableColumns = ['Description', 'Qty', 'Rate', 'Amount'];
  const tableRows = invoice.items.map(item => [
    item.description || item.name || 'Item',
    (item.quantity || 1).toString(),
    `₹${(item.rate || item.price || 0).toFixed(2)}`,
    `₹${((item.quantity || 1) * (item.rate || item.price || 0)).toFixed(2)}`
  ]);

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: yPosition,
    theme: 'grid',
    headStyles: {
      fillColor: options.colorMode === 'color' ? [41, 128, 185] : [100, 100, 100],
      textColor: 255,
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  // Get the final Y position after the table
  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  const totalsX = pageWidth - 80;
  doc.setFontSize(10);
  
  if (invoice.discount && invoice.discount > 0) {
    doc.text('Subtotal:', totalsX, yPosition);
    doc.text(`₹${(invoice.subtotal + invoice.discount).toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 6;
    
    doc.text('Discount:', totalsX, yPosition);
    doc.text(`-₹${invoice.discount.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 6;
  }
  
  if (invoice.totalTaxAmount && invoice.totalTaxAmount > 0) {
    doc.text('Tax Amount:', totalsX, yPosition);
    doc.text(`₹${invoice.totalTaxAmount.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 6;
  }

  // Total
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Total:', totalsX, yPosition);
  doc.text(`₹${invoice.total.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });

  // Footer
  if (options.includeFooters) {
    yPosition = pageHeight - 30;
    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    
    if (invoice.terms) {
      doc.text('Terms & Conditions:', 20, yPosition);
      yPosition += 4;
      doc.text(invoice.terms, 20, yPosition);
      yPosition += 8;
    }
    
    if (invoice.notes) {
      doc.text('Notes:', 20, yPosition);
      yPosition += 4;
      doc.text(invoice.notes, 20, yPosition);
    }
  }
};

const generateThermalReceipt = (doc: jsPDF, invoice: InvoiceData, options: PdfOptions) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 10;
  
  // Center everything for thermal receipt
  doc.setFontSize(12);
  doc.text(invoice.companyName || 'BUSINESS NAME', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;
  
  doc.setFontSize(8);
  if (invoice.companyAddress) {
    doc.text(invoice.companyAddress, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
  }
  
  doc.text('--------------------------------', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;
  
  // Invoice info
  doc.text(`Invoice: ${invoice.invoiceNumber}`, 5, yPosition);
  yPosition += 5;
  doc.text(`Date: ${invoice.date}`, 5, yPosition);
  yPosition += 5;
  doc.text(`Customer: ${invoice.partyName}`, 5, yPosition);
  yPosition += 8;
  
  doc.text('--------------------------------', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  
  // Items
  invoice.items.forEach(item => {
    const name = ((item.description || item.name) || 'Item').substring(0, 20);
    const qty = item.quantity || 1;
    const rate = item.rate || item.price || 0;
    const amount = qty * rate;
    
    doc.text(name, 5, yPosition);
    yPosition += 4;
    doc.text(`${qty} x ₹${rate.toFixed(2)} = ₹${amount.toFixed(2)}`, 5, yPosition);
    yPosition += 6;
  });
  
  doc.text('--------------------------------', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  
  // Total
  doc.setFontSize(10);
  doc.text(`TOTAL: ₹${invoice.total.toFixed(2)}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  
  doc.setFontSize(8);
  doc.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
};

const generateModernInvoice = (doc: jsPDF, invoice: InvoiceData, options: PdfOptions) => {
  // Similar structure but with modern styling
  generateClassicInvoice(doc, invoice, options);
};

const generateMinimalInvoice = (doc: jsPDF, invoice: InvoiceData, options: PdfOptions) => {
  // Minimal version with less styling
  generateClassicInvoice(doc, invoice, {
    ...options,
    includeHeaders: true,
    includeFooters: false,
  });
};