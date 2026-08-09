import jsPDF from 'jspdf';
import { format } from 'date-fns';

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
    website?: string;
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
    accountHolder?: string;
  };
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  isGstInvoice?: boolean;
  type?: string;
  status?: string;
  paymentStatus?: string;
  totalTaxAmount?: number;
  balanceAmount?: number;
}

export class ClassicTemplatePdfGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 15;
  private yPos: number = 15;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'A4'
    });

    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.yPos = this.margin;
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

  private addText(text: string, x: number, y: number, options: any = {}) {
    this.doc.text(text, x, y, options);
  }

  private drawBorder() {
    // Draw main border
    this.doc.setLineWidth(1);
    this.doc.rect(this.margin, this.margin, this.pageWidth - 2 * this.margin, this.pageHeight - 2 * this.margin);
  }

  private addHeader(data: InvoiceData) {
    // Original for Recipient text (top right)
    this.doc.setFontSize(8);
    this.doc.setFont('times', 'italic');
    this.addText('(Original for Recipient)', this.pageWidth - this.margin - 40, this.yPos + 5);
    
    this.yPos += 10;

    // Company Name (centered, large, bold)
    this.doc.setFontSize(20);
    this.doc.setFont('times', 'bold');
    const companyName = data.company?.name || 'COMPANY NAME';
    this.addText(companyName.toUpperCase(), this.pageWidth / 2, this.yPos, { align: 'center' });
    this.yPos += 8;

    // Company Address
    this.doc.setFontSize(10);
    this.doc.setFont('times', 'normal');
    const address = data.company?.address || 'Complete Business Address with PIN Code';
    this.addText(address, this.pageWidth / 2, this.yPos, { align: 'center' });
    this.yPos += 6;

    // Contact Details
    this.doc.setFontSize(9);
    const phone = data.company?.phone ? `Phone: ${data.company.phone}` : 'Phone: +91-XXXXXXXXXX';
    const email = data.company?.email ? `Email: ${data.company.email}` : 'Email: info@company.com';
    const website = data.company?.website ? `Website: ${data.company.website}` : 'Website: www.company.com';
    const contactLine = `${phone} | ${email} | ${website}`;
    this.addText(contactLine, this.pageWidth / 2, this.yPos, { align: 'center' });
    this.yPos += 8;

    // Invoice Title
    this.doc.setFontSize(14);
    this.doc.setFont('times', 'bold');
    this.addText('PERFORMA INVOICE', this.pageWidth / 2, this.yPos, { align: 'center' });
    
    // Underline the title
    const titleWidth = this.doc.getTextWidth('PERFORMA INVOICE');
    const titleX = (this.pageWidth - titleWidth) / 2;
    this.doc.line(titleX, this.yPos + 1, titleX + titleWidth, this.yPos + 1);
    this.yPos += 10;

    // Double line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin + 5, this.yPos, this.pageWidth - this.margin - 5, this.yPos);
    this.doc.line(this.margin + 5, this.yPos + 2, this.pageWidth - this.margin - 5, this.yPos + 2);
    this.yPos += 8;
  }

  private addInvoiceAndCustomerDetails(data: InvoiceData) {
    const leftColumnX = this.margin + 5;
    const rightColumnX = this.pageWidth / 2 + 5;
    const columnWidth = (this.pageWidth / 2) - 15;
    const sectionHeight = 35;

    // Draw boxes for both sections
    this.doc.setLineWidth(0.5);
    this.doc.rect(leftColumnX, this.yPos, columnWidth, sectionHeight);
    this.doc.rect(rightColumnX, this.yPos, columnWidth, sectionHeight);

    const startY = this.yPos;

    // Invoice Information (Left)
    this.doc.setFontSize(9);
    this.doc.setFont('times', 'bold');
    this.addText('Invoice Information:', leftColumnX + 2, this.yPos + 5);
    
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(8);
    this.yPos += 8;
    this.addText(`Invoice No.: ${data.invoiceNumber}`, leftColumnX + 2, this.yPos);
    this.yPos += 4;
    this.addText(`Invoice Date: ${this.formatDate(data.date)}`, leftColumnX + 2, this.yPos);
    this.yPos += 4;
    const dueDate = data.dueDate ? this.formatDate(data.dueDate) : this.formatDate(new Date(new Date(data.date).getTime() + 30 * 24 * 60 * 60 * 1000));
    this.addText(`Due Date: ${dueDate}`, leftColumnX + 2, this.yPos);
    this.yPos += 4;
    this.addText('Payment Mode: Cash/Online', leftColumnX + 2, this.yPos);

    // Customer Information (Right)
    this.yPos = startY;
    this.doc.setFontSize(9);
    this.doc.setFont('times', 'bold');
    this.addText('Bill To:', rightColumnX + 2, this.yPos + 5);
    
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(8);
    this.yPos += 8;
    this.addText(data.customer.name, rightColumnX + 2, this.yPos);
    this.yPos += 4;
    
    // Split address into multiple lines if needed
    const addressLines = data.customer.address.split('\n');
    addressLines.forEach(line => {
      this.addText(line, rightColumnX + 2, this.yPos);
      this.yPos += 4;
    });
    
    if (data.customer.phone) {
      this.addText(`Phone: ${data.customer.phone}`, rightColumnX + 2, this.yPos);
      this.yPos += 4;
    }

    this.yPos = startY + sectionHeight + 5;
  }

  private addItemsTable(data: InvoiceData) {
    const tableStartY = this.yPos;
    const tableWidth = this.pageWidth - 2 * this.margin - 10;
    const tableX = this.margin + 5;
    
    // Define columns
    const columns = [
      { header: 'S.No.', width: 15 },
      { header: 'Description', width: 80 },
      { header: 'HSN', width: 25 },
      { header: 'Qty', width: 20 },
      { header: 'Rate', width: 25 },
      { header: 'Amount', width: 30 }
    ];

    let currentX = tableX;
    const rowHeight = 8;
    const headerHeight = 10;

    // Draw table header
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(tableX, this.yPos, tableWidth, headerHeight, 'F');
    
    this.doc.setLineWidth(0.5);
    this.doc.rect(tableX, this.yPos, tableWidth, headerHeight);

    // Header text
    this.doc.setFontSize(9);
    this.doc.setFont('times', 'bold');
    
    columns.forEach(col => {
      this.addText(col.header, currentX + col.width / 2, this.yPos + 7, { align: 'center' });
      if (currentX > tableX) {
        this.doc.line(currentX, this.yPos, currentX, this.yPos + headerHeight);
      }
      currentX += col.width;
    });

    this.yPos += headerHeight;

    // Table rows
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(8);

    data.items.forEach((item, index) => {
      currentX = tableX;
      
      // Draw row border
      this.doc.rect(tableX, this.yPos, tableWidth, rowHeight);
      
      // Row data
      const rowData = [
        (index + 1).toString(),
        item.description || item.productName || '',
        item.hsn || '',
        item.quantity.toString(),
        this.formatCurrency(item.rate || item.unitPrice || 0),
        this.formatCurrency(item.amount || item.totalAmount || 0)
      ];

      columns.forEach((col, colIndex) => {
        const value = rowData[colIndex];
        const textX = colIndex === 0 || colIndex >= 3 ? currentX + col.width / 2 : currentX + 2;
        const align = colIndex === 0 || colIndex >= 3 ? 'center' : 'left';
        
        this.addText(value, textX, this.yPos + 6, { align });
        
        if (currentX > tableX) {
          this.doc.line(currentX, this.yPos, currentX, this.yPos + rowHeight);
        }
        currentX += col.width;
      });

      this.yPos += rowHeight;
    });

    this.yPos += 5;
  }

  private addTotalsSection(data: InvoiceData) {
    const rightAlign = this.pageWidth - this.margin - 5;
    const labelX = rightAlign - 60;

    this.doc.setFontSize(9);
    this.doc.setFont('times', 'normal');

    // Subtotal
    this.addText('Subtotal:', labelX, this.yPos);
    this.addText(this.formatCurrency(data.subtotal), rightAlign, this.yPos, { align: 'right' });
    this.yPos += 6;

    // Tax
    if (data.totalTaxAmount && data.totalTaxAmount > 0) {
      this.addText('Tax Amount:', labelX, this.yPos);
      this.addText(this.formatCurrency(data.totalTaxAmount), rightAlign, this.yPos, { align: 'right' });
      this.yPos += 6;
    }

    // Discount
    if (data.discount && data.discount > 0) {
      this.addText('Discount:', labelX, this.yPos);
      this.addText(`-${this.formatCurrency(data.discount)}`, rightAlign, this.yPos, { align: 'right' });
      this.yPos += 6;
    }

    // Line above total
    this.doc.setLineWidth(0.5);
    this.doc.line(labelX, this.yPos, rightAlign, this.yPos);
    this.yPos += 3;

    // Grand Total
    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(10);
    this.addText('Grand Total:', labelX, this.yPos);
    this.addText(this.formatCurrency(data.grandTotal || data.total), rightAlign, this.yPos, { align: 'right' });
    this.yPos += 10;
  }

  private addAmountInWords(data: InvoiceData) {
    const amount = data.grandTotal || data.total;
    const amountInWords = this.numberToWords(amount);
    
    // Draw box for amount in words
    const boxHeight = 15;
    this.doc.setFillColor(249, 249, 249);
    this.doc.rect(this.margin + 5, this.yPos, this.pageWidth - 2 * this.margin - 10, boxHeight, 'F');
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin + 5, this.yPos, this.pageWidth - 2 * this.margin - 10, boxHeight);

    this.doc.setFontSize(9);
    this.doc.setFont('times', 'bold');
    this.addText('Amount in Words:', this.margin + 8, this.yPos + 5);
    
    this.doc.setFont('times', 'normal');
    this.addText(amountInWords, this.margin + 8, this.yPos + 10);
    
    this.yPos += boxHeight + 10;
  }

  private addTermsAndNotes(data: InvoiceData) {
    if (data.terms || data.notes) {
      const boxHeight = 25;
      this.doc.setLineWidth(0.5);
      this.doc.rect(this.margin + 5, this.yPos, this.pageWidth - 2 * this.margin - 10, boxHeight);

      this.doc.setFontSize(8);
      this.doc.setFont('times', 'bold');
      this.addText('Terms & Conditions / Notes:', this.margin + 8, this.yPos + 5);
      
      this.doc.setFont('times', 'normal');
      const content = data.terms || data.notes || '';
      const lines = content.split('\n');
      let lineY = this.yPos + 10;
      
      lines.forEach(line => {
        this.addText(line, this.margin + 8, lineY);
        lineY += 4;
      });

      this.yPos += boxHeight + 10;
    }
  }

  private addPaymentInformation(data: InvoiceData) {
    const paymentBoxHeight = 30;
    const colWidth = (this.pageWidth - 2 * this.margin) / 2;
    
    // Draw box
    this.doc.setLineWidth(0.5);
    this.doc.setDrawColor(0);
    this.doc.rect(this.margin, this.yPos, this.pageWidth - 2 * this.margin, paymentBoxHeight);
    
    // Header
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.addText('PAYMENT INFORMATION', this.margin + 3, this.yPos + 4);
    
    // Vertical divider between columns
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin + colWidth, this.yPos, this.margin + colWidth, this.yPos + paymentBoxHeight);
    
    // Left Column - Bank Name & Account Number
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.addText('Bank Name:', this.margin + 5, this.yPos + 10);
    this.doc.setFont('helvetica', 'normal');
    this.addText(data.bankName || 'N/A', this.margin + 30, this.yPos + 10);
    
    this.doc.setFont('helvetica', 'bold');
    this.addText('Account No:', this.margin + 5, this.yPos + 17);
    this.doc.setFont('helvetica', 'normal');
    this.addText(data.accountNumber || 'N/A', this.margin + 30, this.yPos + 17);
    
    // Right Column - IFSC Code & Account Holder
    this.doc.setFont('helvetica', 'bold');
    this.addText('IFSC Code:', this.margin + colWidth + 5, this.yPos + 10);
    this.doc.setFont('helvetica', 'normal');
    this.addText(data.ifscCode || 'N/A', this.margin + colWidth + 30, this.yPos + 10);
    
    this.doc.setFont('helvetica', 'bold');
    this.addText('A/C Holder:', this.margin + colWidth + 5, this.yPos + 17);
    this.doc.setFont('helvetica', 'normal');
    this.addText(data.accountHolder || 'N/A', this.margin + colWidth + 30, this.yPos + 17);
    
    this.yPos += paymentBoxHeight + 8;
  }

  private addSignature() {
    const signatureY = this.yPos;
    const signatureBoxHeight = 25;
    const thirdWidth = (this.pageWidth - 2 * this.margin) / 3;
    
    // Top border for signature section
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, signatureY, this.pageWidth - this.margin, signatureY);
    
    // Receiver's Signature Section - Left
    let xPos = this.margin;
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.addText("RECEIVER'S SIGNATURE", xPos + 5, signatureY + 4);
    
    // Signature box
    this.doc.setLineWidth(0.5);
    this.doc.rect(xPos, signatureY + 8, thirdWidth - 10, signatureBoxHeight);
    
    // Name and Date fields
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.addText('Name: _________________', xPos, signatureY + 36);
    this.addText('Date: _________________', xPos, signatureY + 41);
    
    // Proprietor's Signature Section - Middle
    xPos = this.margin + thirdWidth;
    
    // Vertical divider
    this.doc.setLineWidth(0.5);
    this.doc.line(xPos, signatureY, xPos, signatureY + 45);
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.addText("PROPRIETOR'S SIGNATURE", xPos + 5, signatureY + 4);
    
    // Signature box
    this.doc.setLineWidth(0.5);
    this.doc.rect(xPos, signatureY + 8, thirdWidth - 10, signatureBoxHeight);
    
    // Name and Date fields
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.addText('Name: _________________', xPos, signatureY + 36);
    this.addText('Date: _________________', xPos, signatureY + 41);
    
    // Company Stamp Section - Right
    xPos = this.margin + 2 * thirdWidth;
    
    // Vertical divider
    this.doc.setLineWidth(0.5);
    this.doc.line(xPos, signatureY, xPos, signatureY + 45);
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.addText('COMPANY STAMP', xPos + (thirdWidth / 2) - 10, signatureY + 4, { align: 'center' });
    
    // Dashed border for stamp box
    const stampBoxX = xPos + 5;
    const stampBoxWidth = thirdWidth - 10;
    const stampBoxHeight = 30;
    
    // Draw dashed rectangle for stamp
    this.doc.setDrawColor(100, 100, 100);
    this.doc.setLineDash([2, 2]);
    this.doc.rect(stampBoxX, signatureY + 8, stampBoxWidth, stampBoxHeight);
    this.doc.setLineDash([]);
    
    // Add placeholder text
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    this.addText('[Place Stamp Here]', stampBoxX + stampBoxWidth / 2, signatureY + 8 + stampBoxHeight / 2, { align: 'center' });
    this.doc.setTextColor(0, 0, 0);
  }

  private numberToWords(amount: number): string {
    if (amount === 0) return 'Zero Rupees Only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertHundreds = (num: number): string => {
      let result = '';
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        return result;
      }
      if (num > 0) {
        result += ones[num] + ' ';
      }
      return result;
    };

    let rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let result = '';

    if (rupees >= 10000000) {
      result += convertHundreds(Math.floor(rupees / 10000000)) + 'Crore ';
      rupees %= 10000000;
    }
    if (rupees >= 100000) {
      result += convertHundreds(Math.floor(rupees / 100000)) + 'Lakh ';
      rupees %= 100000;
    }
    if (rupees >= 1000) {
      result += convertHundreds(Math.floor(rupees / 1000)) + 'Thousand ';
      rupees %= 1000;
    }
    if (rupees > 0) {
      result += convertHundreds(rupees);
    }

    result += 'Rupees ';

    if (paise > 0) {
      result += 'and ' + convertHundreds(paise) + 'Paise ';
    }

    result += 'Only';
    return result.trim();
  }

  public generatePDF(data: InvoiceData): jsPDF {
    this.drawBorder();
    this.addHeader(data);
    this.addInvoiceAndCustomerDetails(data);
    this.addItemsTable(data);
    this.addTotalsSection(data);
    this.addAmountInWords(data);
    this.addTermsAndNotes(data);
    this.addPaymentInformation(data);
    this.addSignature();

    return this.doc;
  }

  public generateBlob(data: InvoiceData): Blob {
    const doc = this.generatePDF(data);
    return doc.output('blob');
  }

  public downloadPDF(data: InvoiceData, filename?: string): void {
    const doc = this.generatePDF(data);
    const fileName = filename || `invoice-${data.invoiceNumber}.pdf`;
    doc.save(fileName);
  }
}

// Utility functions
export const generateClassicTemplateBlob = async (data: InvoiceData): Promise<Blob> => {
  const generator = new ClassicTemplatePdfGenerator();
  return generator.generateBlob(data);
};

export const downloadClassicTemplatePdf = async (data: InvoiceData, filename?: string): Promise<void> => {
  const generator = new ClassicTemplatePdfGenerator();
  generator.downloadPDF(data, filename);
};