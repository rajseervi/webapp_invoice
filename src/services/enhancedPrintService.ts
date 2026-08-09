import { Invoice } from '@/types/invoice_no_gst';
import { getPrintingPreferences } from './settingsService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface PrintSettings {
  template: 'modern' | 'classic' | 'minimal' | 'thermal' | 'dualapp';
  paperSize: 'A4' | 'A5' | 'Letter' | 'Thermal';
  orientation: 'portrait' | 'landscape';
  includeHeader: boolean;
  includeFooter: boolean;
  showWatermark: boolean;
  copies: number;
  colorMode: 'color' | 'grayscale' | 'blackwhite';
}

export interface PrintOptions {
  action: 'print' | 'preview' | 'download';
  autoprint?: boolean;
  filename?: string;
}

export class EnhancedPrintService {
  private static readonly DEFAULT_SETTINGS: PrintSettings = {
    template: 'modern',
    paperSize: 'A4',
    orientation: 'portrait',
    includeHeader: true,
    includeFooter: true,
    showWatermark: false,
    copies: 2,
    colorMode: 'color'
  };

  /**
   * Get printing settings with user preferences
   * @param userId User ID to fetch preferences for
   * @param overrides Optional settings to override defaults
   * @returns Merged print settings
   */
  static async getPrintingSettings(userId?: string, overrides: Partial<PrintSettings> = {}): Promise<PrintSettings> {
    let userPreferences = this.DEFAULT_SETTINGS;
    
    if (userId) {
      try {
        const printingPrefs = await getPrintingPreferences(userId);
        userPreferences = {
          template: printingPrefs.template,
          paperSize: printingPrefs.paperSize,
          orientation: printingPrefs.orientation,
          includeHeader: printingPrefs.includeHeader,
          includeFooter: printingPrefs.includeFooter,
          showWatermark: printingPrefs.showWatermark,
          copies: printingPrefs.defaultCopies,
          colorMode: printingPrefs.colorMode
        };
      } catch (error) {
        console.warn('Failed to load user printing preferences, using defaults:', error);
      }
    }
    
    return { ...userPreferences, ...overrides };
  }

  /**
   * Generate PDF for invoice with custom settings
   */
  static async generateInvoicePDF(
    invoice: Invoice,
    settings: Partial<PrintSettings> = {},
    options: PrintOptions = { action: 'preview' },
    userId?: string
  ): Promise<jsPDF | string> {
    const finalSettings = await this.getPrintingSettings(userId, settings);
    
    // Create PDF with appropriate dimensions
    const { width, height } = this.getPaperDimensions(finalSettings.paperSize, finalSettings.orientation);
    const pdf = new jsPDF({
      orientation: finalSettings.orientation,
      unit: 'mm',
      format: finalSettings.paperSize === 'Thermal' ? [80, 200] : finalSettings.paperSize
    });

    // Apply color mode
    if (finalSettings.colorMode === 'grayscale') {
      // Convert to grayscale (simplified approach)
      pdf.setGState(pdf.GState({ 'ca': 0.8 }));
    }

    // Generate content based on template
    switch (finalSettings.template) {
      case 'modern':
        await this.generateModernTemplate(pdf, invoice, finalSettings);
        break;
      case 'classic':
        await this.generateClassicTemplate(pdf, invoice, finalSettings);
        break;
      case 'minimal':
        await this.generateMinimalTemplate(pdf, invoice, finalSettings);
        break;
      case 'thermal':
        await this.generateThermalTemplate(pdf, invoice, finalSettings);
        break;
      case 'dualapp':
        await this.generateDualTemplate(pdf, invoice, finalSettings);
        break;
      default:
        await this.generateModernTemplate(pdf, invoice, finalSettings);
    }

    // Add watermark if enabled
    if (finalSettings.showWatermark) {
      this.addWatermark(pdf, invoice.status || 'DRAFT');
    }

    // Handle different actions
    switch (options.action) {
      case 'download':
        const filename = options.filename || `invoice-${invoice.invoiceNumber}.pdf`;
        pdf.save(filename);
        return filename;
      case 'print':
        if (typeof window !== 'undefined') {
          const pdfBlob = pdf.output('blob');
          const url = URL.createObjectURL(pdfBlob);
          const printWindow = window.open(url);
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
              setTimeout(() => {
                printWindow.close();
                URL.revokeObjectURL(url);
              }, 1000);
            };
          }
        }
        return pdf;
      case 'preview':
      default:
        return pdf;
    }
  }

  /**
   * Get paper dimensions based on size and orientation
   */
  private static getPaperDimensions(paperSize: string, orientation: string) {
    const dimensions = {
      'A4': { width: 210, height: 297 },
      'A5': { width: 148, height: 210 },
      'Letter': { width: 216, height: 279 },
      'Thermal': { width: 80, height: 200 }
    };

    const size = dimensions[paperSize as keyof typeof dimensions] || dimensions.A4;
    
    if (orientation === 'landscape') {
      return { width: size.height, height: size.width };
    }
    
    return size;
  }

  /**
   * Generate modern template
   */
  private static async generateModernTemplate(pdf: jsPDF, invoice: Invoice, settings: PrintSettings) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    if (settings.includeHeader) {
      // Company header with gradient background (simulated)
      pdf.setFillColor(102, 126, 234); // Primary color
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVOICE', 20, 25);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(invoice.invoiceNumber, pageWidth - 20, 25, { align: 'right' });
      
      yPosition = 60;
    }

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    // Invoice details section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Details', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}`, 20, yPosition);
    pdf.text(`Status: ${(invoice.status || 'DRAFT').toUpperCase()}`, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 15;

    // Party details
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill To:', 20, yPosition);
    yPosition += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.partyName || 'N/A', 20, yPosition);
    yPosition += 6;

    if (invoice.partyPhone) {
      pdf.text(`Phone: ${invoice.partyPhone}`, 20, yPosition);
      yPosition += 6;
    }

    if (invoice.partyEmail) {
      pdf.text(`Email: ${invoice.partyEmail}`, 20, yPosition);
      yPosition += 6;
    }

    yPosition += 10;

    // Items table
    if (invoice.items && invoice.items.length > 0) {
      const tableData = invoice.items.map((item, index) => [
        (index + 1).toString(),
        item.name || item.productName || 'N/A',
        (item.quantity || 0).toString(),
        `₹${(item.price || 0).toLocaleString()}`,
        item.discount > 0 ? `${item.discount}${item.discountType === 'percentage' ? '%' : ''}` : '-',
        `₹${(item.totalAmount || item.finalPrice || 0).toLocaleString()}`
      ]);

      (pdf as any).autoTable({
        startY: yPosition,
        head: [['#', 'Product', 'Qty', 'Price', 'Discount', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 60 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 30, halign: 'right' }
        }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 20;
    }

    // Totals section
    const totalsX = pageWidth - 80;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    pdf.text('Subtotal:', totalsX, yPosition);
    pdf.text(`₹${(invoice.subtotal || 0).toLocaleString()}`, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 8;

    if (invoice.totalDiscount && invoice.totalDiscount > 0) {
      pdf.text('Discount:', totalsX, yPosition);
      pdf.text(`₹${invoice.totalDiscount.toLocaleString()}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 8;
    }

    // Total
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(240, 240, 240);
    pdf.rect(totalsX - 5, yPosition - 5, 85, 12, 'F');
    pdf.text('Total:', totalsX, yPosition + 2);
    pdf.text(`₹${(invoice.totalAmount || 0).toLocaleString()}`, pageWidth - 20, yPosition + 2, { align: 'right' });

    // Footer
    if (settings.includeFooter) {
      const footerY = pageHeight - 30;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(128, 128, 128);
      pdf.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
      
      if (invoice.notes) {
        pdf.text(`Notes: ${invoice.notes}`, 20, footerY + 8);
      }
    }
  }

  /**
   * Generate classic template
   */
  private static async generateClassicTemplate(pdf: jsPDF, invoice: Invoice, settings: PrintSettings) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Simple header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Invoice number and date
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Invoice #: ${invoice.invoiceNumber}`, 20, yPosition);
    pdf.text(`Date: ${invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}`, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 20;

    // Simple line separator
    pdf.setLineWidth(0.5);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 15;

    // Party details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill To:', 20, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.partyName || 'N/A', 20, yPosition);
    yPosition += 20;

    // Simple items table
    if (invoice.items && invoice.items.length > 0) {
      const tableData = invoice.items.map((item) => [
        item.name || item.productName || 'N/A',
        (item.quantity || 0).toString(),
        `₹${(item.price || 0).toLocaleString()}`,
        `₹${(item.totalAmount || item.finalPrice || 0).toLocaleString()}`
      ]);

      (pdf as any).autoTable({
        startY: yPosition,
        head: [['Product', 'Qty', 'Price', 'Total']],
        body: tableData,
        theme: 'plain',
        styles: {
          fontSize: 10,
          cellPadding: 3
        }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }

    // Simple total
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total: ₹${(invoice.totalAmount || 0).toLocaleString()}`, pageWidth - 20, yPosition, { align: 'right' });
  }

  /**
   * Generate minimal template
   */
  private static async generateMinimalTemplate(pdf: jsPDF, invoice: Invoice, settings: PrintSettings) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 30;

    // Minimal header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.invoiceNumber, 20, yPosition);
    pdf.text(invoice.date ? new Date(invoice.date).toLocaleDateString() : '', pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 20;

    // Party name
    pdf.setFontSize(12);
    pdf.text(invoice.partyName || 'N/A', 20, yPosition);
    yPosition += 20;

    // Minimal items list
    if (invoice.items && invoice.items.length > 0) {
      pdf.setFontSize(10);
      invoice.items.forEach((item) => {
        const itemText = `${item.name || 'N/A'} × ${item.quantity || 0} = ₹${(item.totalAmount || item.finalPrice || 0).toLocaleString()}`;
        pdf.text(itemText, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Minimal total
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`₹${(invoice.totalAmount || 0).toLocaleString()}`, pageWidth - 20, yPosition, { align: 'right' });
  }

  /**
   * Generate thermal receipt template
   */
  private static async generateThermalTemplate(pdf: jsPDF, invoice: Invoice, settings: PrintSettings) {
    const pageWidth = 80; // 80mm thermal paper
    let yPosition = 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECEIPT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.invoiceNumber, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    pdf.text(invoice.date ? new Date(invoice.date).toLocaleDateString() : '', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Dashed line
    pdf.text('--------------------------------', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // Items
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach((item) => {
        const name = (item.name || 'N/A').substring(0, 20);
        const qty = item.quantity || 0;
        const total = (item.totalAmount || item.finalPrice || 0).toLocaleString();
        
        pdf.text(name, 2, yPosition);
        yPosition += 4;
        pdf.text(`${qty} x ₹${(item.price || 0).toLocaleString()}`, 2, yPosition);
        pdf.text(`₹${total}`, pageWidth - 2, yPosition, { align: 'right' });
        yPosition += 6;
      });
    }

    // Dashed line
    pdf.text('--------------------------------', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // Total
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAL', 2, yPosition);
    pdf.text(`₹${(invoice.totalAmount || 0).toLocaleString()}`, pageWidth - 2, yPosition, { align: 'right' });
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.text('Thank you!', pageWidth / 2, yPosition, { align: 'center' });
  }

  /**
   * Generate dual format template
   */
  private static async generateDualTemplate(pdf: jsPDF, invoice: Invoice, settings: PrintSettings) {
    // This would generate both a detailed invoice and a simple receipt
    // For now, we'll use the modern template
    await this.generateModernTemplate(pdf, invoice, settings);
  }

  /**
   * Add watermark to PDF
   */
  private static addWatermark(pdf: jsPDF, text: string) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setGState(pdf.GState({ 'ca': 0.3 })); // Set transparency
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(50);
    pdf.setFont('helvetica', 'bold');
    
    // Rotate and center the watermark
    pdf.text(text, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });

    // Reset state
    pdf.setGState(pdf.GState({ 'ca': 1 }));
    pdf.setTextColor(0, 0, 0);
  }

  /**
   * Generate print preview HTML
   */
  static generatePrintPreviewHTML(invoice: Invoice, settings: PrintSettings): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber} - Print Preview</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 10mm 15mm 10mm;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              font-size: 11px;
              line-height: 1.2;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print { 
              display: none !important; 
            }
            
            /* Ensure content fits in single page */
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            
            /* Scale down content if needed */
            .invoice-content {
              transform-origin: top left;
              width: 100%;
              max-height: 250mm;
              overflow: hidden;
            }
            
            /* Optimize table spacing */
            .items-table {
              font-size: 9px;
              line-height: 1.1;
            }
            
            .items-table th,
            .items-table td {
              padding: 3px 4px;
              font-size: 9px;
            }
            
            /* Prevent page breaks inside elements */
            .invoice-section {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .header, .totals {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: ${settings.colorMode === 'blackwhite' ? '#000' : '#333'};
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            background: ${settings.colorMode === 'color' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5'};
            color: ${settings.colorMode === 'color' ? 'white' : '#333'};
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .items-table th {
            background-color: ${settings.colorMode === 'color' ? '#667eea' : '#f5f5f5'};
            color: ${settings.colorMode === 'color' ? 'white' : '#333'};
          }
          .totals {
            text-align: right;
            margin-top: 20px;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            font-size: 100px;
            color: rgba(0,0,0,0.1);
            z-index: -1;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        ${settings.showWatermark ? `<div class="watermark">${(invoice.status || 'DRAFT').toUpperCase()}</div>` : ''}
        
        <div class="invoice-content">
          ${settings.includeHeader ? `
            <div class="header invoice-section">
              <h1>INVOICE</h1>
              <p>Invoice Number: ${invoice.invoiceNumber}</p>
            </div>
          ` : ''}

          <div class="invoice-details invoice-section">
            <div>
              <h3>Bill To:</h3>
              <p><strong>${invoice.partyName || 'N/A'}</strong></p>
              ${invoice.partyPhone ? `<p>Phone: ${invoice.partyPhone}</p>` : ''}
              ${invoice.partyEmail ? `<p>Email: ${invoice.partyEmail}</p>` : ''}
            </div>
            <div>
              <p><strong>Date:</strong> ${invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Status:</strong> ${(invoice.status || 'DRAFT').toUpperCase()}</p>
            </div>
          </div>

          ${invoice.items && invoice.items.length > 0 ? `
            <div class="invoice-section">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items.map((item, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${item.name || item.productName || 'N/A'}</td>
                      <td>${item.quantity || 0}</td>
                      <td>₹${(item.price || 0).toLocaleString()}</td>
                      <td>₹${(item.totalAmount || item.finalPrice || 0).toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div class="totals invoice-section">
            <p><strong>Subtotal: ₹${(invoice.subtotal || 0).toLocaleString()}</strong></p>
            ${invoice.totalDiscount && invoice.totalDiscount > 0 ? `<p>Discount: ₹${invoice.totalDiscount.toLocaleString()}</p>` : ''}
            <h3>Total: ₹${(invoice.totalAmount || 0).toLocaleString()}</h3>
          </div>

          ${settings.includeFooter ? `
            <div class="invoice-section" style="margin-top: 20px; text-align: center; color: #666;">
              <p>Thank you for your business!</p>
              ${invoice.notes ? `<p><em>Notes: ${invoice.notes}</em></p>` : ''}
            </div>
          ` : ''}
        </div>

        <div class="no-print" style="margin-top: 40px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print Invoice
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;
  }
}

export default EnhancedPrintService;