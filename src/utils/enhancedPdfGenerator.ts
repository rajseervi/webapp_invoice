import jsPDF from 'jspdf';
import { format } from 'date-fns';

// Import autoTable plugin directly
let autoTablePlugin: any = null;

const loadAutoTable = async () => {
  if (!autoTablePlugin && typeof window !== 'undefined') {
    try {
      // Try multiple import strategies
      if (!autoTablePlugin) {
        const autoTableModule = await import('jspdf-autotable');
        autoTablePlugin = autoTableModule.default || autoTableModule;
      }
      
      // Ensure the plugin is applied to jsPDF
      if (autoTablePlugin && typeof autoTablePlugin === 'function') {
        autoTablePlugin(jsPDF);
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to load jspdf-autotable:', error);
      return false;
    }
  }
  return autoTablePlugin !== null;
};

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  hsn?: string;
  tax?: number;
  gstRate?: number;
  productName?: string;
  unitPrice?: number;
  totalAmount?: number;
}

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
  items: InvoiceItem[];
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

interface PdfOptions {
  template?: 'classic' | 'modern' | 'minimal' | 'thermal';
  showQRCode?: boolean;
  showCompanyLogo?: boolean;
  showBankDetails?: boolean;
  showTermsAndConditions?: boolean;
  showSignature?: boolean;
  paperSize?: 'A4' | 'A5' | 'thermal';
  fontSize?: 'small' | 'medium' | 'large';
  colorScheme?: 'color' | 'grayscale' | 'blackwhite';
  includeWatermark?: boolean;
  watermarkText?: string;
}

export class EnhancedPdfGenerator {
  private doc: jsPDF;
  private options: Required<PdfOptions>;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private yPos: number = 20;

  constructor(options: PdfOptions = {}) {
    this.options = {
      template: options.template || 'classic',
      showQRCode: options.showQRCode ?? true,
      showCompanyLogo: options.showCompanyLogo ?? true,
      showBankDetails: options.showBankDetails ?? true,
      showTermsAndConditions: options.showTermsAndConditions ?? true,
      showSignature: options.showSignature ?? true,
      paperSize: options.paperSize || 'A4',
      fontSize: options.fontSize || 'medium',
      colorScheme: options.colorScheme || 'color',
      includeWatermark: options.includeWatermark ?? false,
      watermarkText: options.watermarkText || 'INVOICE'
    };

    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: this.options.paperSize === 'thermal' ? [80, 200] : this.options.paperSize
    });

    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.yPos = this.margin;
  }

  private getFontSize(size: 'small' | 'medium' | 'large'): number {
    const sizes = {
      small: { title: 18, header: 12, body: 8, small: 7 },
      medium: { title: 22, header: 14, body: 10, small: 8 },
      large: { title: 26, header: 16, body: 12, small: 10 }
    };
    return sizes[size].body;
  }

  private addText(text: string, x: number, y: number, options: any = {}) {
    this.doc.text(text, x, y, options);
  }

  private formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd/MM/yyyy');
    } catch {
      return String(date);
    }
  }

  private formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private addWatermark() {
    if (!this.options.includeWatermark) return;

    this.doc.saveGraphicsState();
    this.doc.setGState(new this.doc.GState({ opacity: 0.1 }));
    this.doc.setFontSize(60);
    this.doc.setTextColor(128, 128, 128);
    
    const centerX = this.pageWidth / 2;
    const centerY = this.pageHeight / 2;
    
    this.doc.text(this.options.watermarkText, centerX, centerY, {
      align: 'center',
      angle: 45
    });
    
    this.doc.restoreGraphicsState();
  }

  private addHeader(data: InvoiceData) {
    // Add watermark first (behind content)
    this.addWatermark();

    // Invoice title
    this.doc.setFontSize(this.getFontSize(this.options.fontSize) + 12);
    this.doc.setFont('helvetica', 'bold');
    
    if (this.options.colorScheme === 'color') {
      this.doc.setTextColor(41, 128, 185); // Blue color
    } else {
      this.doc.setTextColor(0, 0, 0);
    }
    
    this.addText('INVOICE', this.pageWidth / 2, this.yPos, { align: 'center' });
    this.yPos += 15;

    // Reset color and font
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(this.getFontSize(this.options.fontSize));
  }

  private addCompanyDetails(data: InvoiceData) {
    const startY = this.yPos;
    
    // Company details (left side)
    this.doc.setFont('helvetica', 'bold');
    this.addText('From:', this.margin, this.yPos);
    this.doc.setFont('helvetica', 'normal');
    this.yPos += 5;
    
    this.addText(data.company.name, this.margin, this.yPos);
    this.yPos += 5;
    
    const companyAddressLines = data.company.address.split('\n');
    companyAddressLines.forEach(line => {
      this.addText(line, this.margin, this.yPos);
      this.yPos += 5;
    });
    
    if (data.company.gstin) {
      this.addText(`GSTIN: ${data.company.gstin}`, this.margin, this.yPos);
      this.yPos += 5;
    }
    
    if (data.company.phone) {
      this.addText(`Phone: ${data.company.phone}`, this.margin, this.yPos);
      this.yPos += 5;
    }
    
    if (data.company.email) {
      this.addText(`Email: ${data.company.email}`, this.margin, this.yPos);
      this.yPos += 5;
    }

    // Invoice details (right side)
    const rightColumnX = this.pageWidth - this.margin - 60;
    let rightColumnY = startY;
    
    this.doc.setFont('helvetica', 'bold');
    this.addText('Invoice Details:', rightColumnX, rightColumnY);
    this.doc.setFont('helvetica', 'normal');
    rightColumnY += 7;
    
    this.addText(`Invoice No: ${data.invoiceNumber}`, rightColumnX, rightColumnY);
    rightColumnY += 7;
    
    this.addText(`Date: ${this.formatDate(data.date)}`, rightColumnX, rightColumnY);
    
    if (data.dueDate) {
      rightColumnY += 7;
      this.addText(`Due Date: ${this.formatDate(data.dueDate)}`, rightColumnX, rightColumnY);
    }

    if (data.type) {
      rightColumnY += 7;
      this.addText(`Type: ${data.type}`, rightColumnX, rightColumnY);
    }

    if (data.status) {
      rightColumnY += 7;
      this.addText(`Status: ${data.status}`, rightColumnX, rightColumnY);
    }

    this.yPos += 10;
  }

  private addCustomerDetails(data: InvoiceData) {
    this.doc.setFont('helvetica', 'bold');
    this.addText('Bill To:', this.margin, this.yPos);
    this.doc.setFont('helvetica', 'normal');
    this.yPos += 5;
    
    this.addText(data.customer.name, this.margin, this.yPos);
    this.yPos += 5;
    
    const customerAddressLines = data.customer.address.split('\n');
    customerAddressLines.forEach(line => {
      this.addText(line, this.margin, this.yPos);
      this.yPos += 5;
    });
    
    if (data.customer.gstin) {
      this.addText(`GSTIN: ${data.customer.gstin}`, this.margin, this.yPos);
      this.yPos += 5;
    }

    if (data.customer.phone) {
      this.addText(`Phone: ${data.customer.phone}`, this.margin, this.yPos);
      this.yPos += 5;
    }

    this.yPos += 10;
  }

  private addItemsTable(data: InvoiceData) {
    const columns = data.isGstInvoice 
      ? [
          { header: 'Description', dataKey: 'description', width: 60 },
          { header: 'HSN', dataKey: 'hsn', width: 25 },
          { header: 'Qty', dataKey: 'quantity', width: 20 },
          { header: 'Rate', dataKey: 'rate', width: 30 },
          { header: 'GST%', dataKey: 'gstRate', width: 20 },
          { header: 'Amount', dataKey: 'amount', width: 35 }
        ]
      : [
          { header: 'Description', dataKey: 'description', width: 80 },
          { header: 'HSN', dataKey: 'hsn', width: 30 },
          { header: 'Qty', dataKey: 'quantity', width: 25 },
          { header: 'Rate', dataKey: 'rate', width: 35 },
          { header: 'Amount', dataKey: 'amount', width: 40 }
        ];

    const tableRows = data.items.map(item => {
      const baseRow = {
        description: item.description || item.productName || '',
        hsn: item.hsn || '',
        quantity: item.quantity?.toString() || '0',
        rate: this.formatCurrency(item.rate || item.unitPrice || 0),
        amount: this.formatCurrency(item.amount || item.totalAmount || 0)
      };

      if (data.isGstInvoice) {
        return {
          ...baseRow,
          gstRate: item.gstRate ? `${item.gstRate}%` : '0%'
        };
      }

      return baseRow;
    });

    // Use enhanced table implementation
    this.addEnhancedTable(columns, tableRows);
  }

  private addEnhancedTable(columns: any[], tableRows: any[]) {
    const tableStartY = this.yPos;
    const rowHeight = 8;
    const headerHeight = 10;
    const cellPadding = 2;
    
    // Calculate column positions
    let currentX = this.margin;
    const columnPositions = columns.map(col => {
      const pos = currentX;
      currentX += col.width;
      return { ...col, x: pos };
    });
    
    const tableWidth = currentX - this.margin;
    
    // Draw table border
    this.doc.setLineWidth(0.5);
    this.doc.setDrawColor(0, 0, 0);
    
    // Header background
    if (this.options.colorScheme === 'color') {
      this.doc.setFillColor(41, 128, 185); // Blue
    } else {
      this.doc.setFillColor(70, 70, 70); // Gray
    }
    
    this.doc.rect(this.margin, this.yPos, tableWidth, headerHeight, 'F');
    
    // Header text
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(this.getFontSize(this.options.fontSize) - 1);
    this.doc.setTextColor(255, 255, 255); // White text
    
    columnPositions.forEach(col => {
      const textX = col.x + cellPadding;
      const textY = this.yPos + headerHeight - 2;
      this.addText(col.header, textX, textY);
    });
    
    // Reset text color
    this.doc.setTextColor(0, 0, 0);
    this.yPos += headerHeight;
    
    // Table rows
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(this.getFontSize(this.options.fontSize) - 1);
    
    tableRows.forEach((row, rowIndex) => {
      const isEvenRow = rowIndex % 2 === 0;
      
      // Alternate row background
      if (isEvenRow && this.options.colorScheme !== 'blackwhite') {
        this.doc.setFillColor(248, 249, 250); // Light gray
        this.doc.rect(this.margin, this.yPos, tableWidth, rowHeight, 'F');
      }
      
      // Row data
      columnPositions.forEach(col => {
        const value = row[col.dataKey] || '';
        const textX = col.x + cellPadding;
        const textY = this.yPos + rowHeight - 2;
        
        // Handle text wrapping for long descriptions
        if (col.dataKey === 'description' && value.length > 30) {
          const wrappedText = this.wrapText(value, col.width - cellPadding * 2);
          wrappedText.forEach((line, lineIndex) => {
            this.addText(line, textX, textY + (lineIndex * 4));
          });
        } else {
          // Align numbers to the right
          if (col.dataKey === 'quantity' || col.dataKey === 'rate' || col.dataKey === 'amount' || col.dataKey === 'gstRate') {
            this.addText(String(value), col.x + col.width - cellPadding, textY, { align: 'right' });
          } else {
            this.addText(String(value), textX, textY);
          }
        }
      });
      
      this.yPos += rowHeight;
    });
    
    // Draw table borders
    this.doc.setLineWidth(0.3);
    
    // Outer border
    this.doc.rect(this.margin, tableStartY, tableWidth, this.yPos - tableStartY);
    
    // Vertical lines
    columnPositions.forEach((col, index) => {
      if (index > 0) {
        this.doc.line(col.x, tableStartY, col.x, this.yPos);
      }
    });
    
    // Horizontal line after header
    this.doc.line(this.margin, tableStartY + headerHeight, this.margin + tableWidth, tableStartY + headerHeight);
    
    this.yPos += 10;
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = this.doc.getTextWidth(testLine);
      
      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  private addSimpleTable(data: InvoiceData, columns: any[], tableRows: any[]) {
    // Fallback simple table implementation
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(this.getFontSize(this.options.fontSize) - 1);
    
    let xPos = this.margin;
    const colWidth = (this.pageWidth - 2 * this.margin) / columns.length;
    
    columns.forEach((col, index) => {
      this.addText(col.header, xPos + (index * colWidth), this.yPos);
    });
    
    this.yPos += 7;
    
    // Draw line under header
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.yPos, this.pageWidth - this.margin, this.yPos);
    this.yPos += 5;
    
    // Body
    this.doc.setFont('helvetica', 'normal');
    tableRows.forEach(row => {
      columns.forEach((col, index) => {
        const value = row[col.dataKey] || '';
        this.addText(String(value), xPos + (index * colWidth), this.yPos);
      });
      this.yPos += 6;
    });
    
    this.yPos += 10;
  }

  private addSummary(data: InvoiceData) {
    const summaryX = this.pageWidth - this.margin - 80;
    
    this.doc.setFont('helvetica', 'normal');
    this.addText(`Subtotal: ${this.formatCurrency(data.subtotal)}`, summaryX, this.yPos);
    this.yPos += 7;

    if (data.totalTaxAmount && data.totalTaxAmount > 0) {
      this.addText(`Tax Amount: ${this.formatCurrency(data.totalTaxAmount)}`, summaryX, this.yPos);
      this.yPos += 7;
    } else if (data.tax && data.tax > 0) {
      const taxAmount = data.subtotal * data.tax / 100;
      this.addText(`Tax (${data.tax}%): ${this.formatCurrency(taxAmount)}`, summaryX, this.yPos);
      this.yPos += 7;
    }

    if (data.discount && data.discount > 0) {
      this.addText(`Discount: ${this.formatCurrency(data.discount)}`, summaryX, this.yPos);
      this.yPos += 7;
    }

    // Draw a line above total
    this.doc.setLineWidth(0.5);
    this.doc.line(summaryX, this.yPos, this.pageWidth - this.margin, this.yPos);
    this.yPos += 5;

    this.doc.setFont('helvetica', 'bold');
    const totalAmount = data.grandTotal || data.total;
    this.addText(`Total: ${this.formatCurrency(totalAmount)}`, summaryX, this.yPos);
    
    if (data.balanceAmount !== undefined && data.balanceAmount !== totalAmount) {
      this.yPos += 7;
      this.addText(`Balance: ${this.formatCurrency(data.balanceAmount)}`, summaryX, this.yPos);
    }

    this.yPos += 15;
  }

  private addPaymentDetails(data: InvoiceData) {
    if (!this.options.showBankDetails || !data.paymentDetails) return;

    this.doc.setFont('helvetica', 'bold');
    this.addText('Payment Details:', this.margin, this.yPos);
    this.yPos += 7;
    
    this.doc.setFont('helvetica', 'normal');
    
    if (data.paymentDetails.bankName) {
      this.addText(`Bank Name: ${data.paymentDetails.bankName}`, this.margin, this.yPos);
      this.yPos += 5;
    }
    
    if (data.paymentDetails.accountNumber) {
      this.addText(`Account Number: ${data.paymentDetails.accountNumber}`, this.margin, this.yPos);
      this.yPos += 5;
    }
    
    if (data.paymentDetails.ifscCode) {
      this.addText(`IFSC Code: ${data.paymentDetails.ifscCode}`, this.margin, this.yPos);
      this.yPos += 5;
    }

    this.yPos += 10;
  }

  private addTermsAndNotes(data: InvoiceData) {
    if (this.options.showTermsAndConditions && data.terms) {
      this.doc.setFont('helvetica', 'bold');
      this.addText('Terms & Conditions:', this.margin, this.yPos);
      this.yPos += 5;
      
      this.doc.setFont('helvetica', 'normal');
      const termsLines = data.terms.split('\n');
      termsLines.forEach(line => {
        this.addText(line, this.margin, this.yPos);
        this.yPos += 5;
      });
      
      this.yPos += 5;
    }

    if (data.notes) {
      this.doc.setFont('helvetica', 'bold');
      this.addText('Notes:', this.margin, this.yPos);
      this.yPos += 5;
      
      this.doc.setFont('helvetica', 'normal');
      const notesLines = data.notes.split('\n');
      notesLines.forEach(line => {
        this.addText(line, this.margin, this.yPos);
        this.yPos += 5;
      });
    }
  }

  private addSignature() {
    if (!this.options.showSignature) return;

    const signatureY = this.pageHeight - 40;
    this.doc.setFont('helvetica', 'normal');
    this.addText('Authorized Signature:', this.pageWidth - this.margin - 60, signatureY);
    
    // Add a line for signature
    this.doc.setLineWidth(0.5);
    this.doc.line(this.pageWidth - this.margin - 60, signatureY + 15, this.pageWidth - this.margin, signatureY + 15);
  }

  public async generatePDF(data: InvoiceData): Promise<jsPDF> {
    // Ensure autoTable is loaded before generating PDF
    await loadAutoTable();
    
    this.addHeader(data);
    this.addCompanyDetails(data);
    this.addCustomerDetails(data);
    this.addItemsTable(data);
    this.addSummary(data);
    this.addPaymentDetails(data);
    this.addTermsAndNotes(data);
    this.addSignature();

    return this.doc;
  }

  public async generateBlob(data: InvoiceData): Promise<Blob> {
    const doc = await this.generatePDF(data);
    return doc.output('blob');
  }

  public async generateDataURL(data: InvoiceData): Promise<string> {
    const doc = await this.generatePDF(data);
    return doc.output('dataurlstring');
  }

  public async downloadPDF(data: InvoiceData, filename?: string): Promise<void> {
    const doc = await this.generatePDF(data);
    const fileName = filename || `invoice-${data.invoiceNumber}.pdf`;
    doc.save(fileName);
  }
}

// Utility functions for easy use
export const generateInvoicePDF = async (data: InvoiceData, options?: PdfOptions): Promise<jsPDF> => {
  const generator = new EnhancedPdfGenerator(options);
  return generator.generatePDF(data);
};

export const generateInvoiceBlob = async (data: InvoiceData, options?: PdfOptions): Promise<Blob> => {
  const generator = new EnhancedPdfGenerator(options);
  return generator.generateBlob(data);
};

export const downloadInvoicePDF = async (data: InvoiceData, filename?: string, options?: PdfOptions): Promise<void> => {
  const generator = new EnhancedPdfGenerator(options);
  return generator.downloadPDF(data, filename);
};

export const generateInvoiceDataURL = async (data: InvoiceData, options?: PdfOptions): Promise<string> => {
  const generator = new EnhancedPdfGenerator(options);
  return generator.generateDataURL(data);
};