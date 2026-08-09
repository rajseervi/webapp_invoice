import { Invoice } from '@/types/invoice_no_gst';
import { CompanyInfo } from '@/types/company';
import { getCompanyInfo } from '@/services/settingsService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type PdfFormat = 'a4' | 'letter' | 'legal';
export type PdfOrientation = 'portrait' | 'landscape';
export type PdfQuality = 'high' | 'medium' | 'low';
export type ExportFormat = 'pdf' | 'png' | 'jpeg';
export type ActionType = 'download' | 'preview' | 'return-blob' | 'print' | 'email';

export interface WatermarkOptions {
  text: string;
  opacity?: number;
  fontSize?: number;
  color?: string;
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface PdfGenerationOptions {
  // Basic options
  copyLabel?: string;
  filename?: string;
  action?: ActionType;
  
  // Format options
  format?: PdfFormat;
  orientation?: PdfOrientation;
  quality?: PdfQuality;
  exportFormat?: ExportFormat;
  
  // Security options
  password?: string;
  permissions?: {
    printing?: boolean;
    modifying?: boolean;
    copying?: boolean;
    annotating?: boolean;
  };
  
  // Visual enhancements
  watermark?: WatermarkOptions;
  showPageNumbers?: boolean;
  showTimestamp?: boolean;
  customHeader?: string;
  customFooter?: string;
  
  // Technical options
  compress?: boolean;
  embedFonts?: boolean;
  colorProfile?: 'sRGB' | 'CMYK';
  
  // Callback functions
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onSuccess?: (result: any) => void;
  
  // Metadata
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
  };
}

export interface BatchPdfOptions extends PdfGenerationOptions {
  copies?: number;
  copyLabels?: string[];
  generateSeparateFiles?: boolean;
}

export class ClassicInvoicePdfService {
  private static readonly FORMAT_DIMENSIONS = {
    a4: { width: 210, height: 297 },
    letter: { width: 216, height: 279 },
    legal: { width: 216, height: 356 }
  };

  private static readonly QUALITY_SETTINGS = {
    high: { scale: 3, imageQuality: 1.0, compression: false },
    medium: { scale: 2, imageQuality: 0.9, compression: true },
    low: { scale: 1.5, imageQuality: 0.8, compression: true }
  };

  /**
   * Enhanced PDF generation with comprehensive options
   */
  static async generateClassicInvoicePDF(
    invoice: Invoice,
    options: PdfGenerationOptions = {}
  ): Promise<jsPDF | Blob | string | HTMLCanvasElement> {
    const startTime = Date.now();
    
    try {
      // Set defaults
      const opts = this.setDefaultOptions(options);
      
      // Progress callback
      opts.onProgress?.(10);
      
      // Load company info
      const companyInfo = await getCompanyInfo();
      opts.onProgress?.(20);
      
      // Generate content based on export format
      if (opts.exportFormat === 'pdf') {
        return await this.generatePDF(invoice, companyInfo, opts);
      } else {
        return await this.generateImage(invoice, companyInfo, opts);
      }
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('PDF generation failed');
      opts.onError?.(err);
      console.error('PDF Generation Error:', err);
      throw err;
    }
  }

  /**
   * Generate batch PDFs with multiple copies/labels
   */
  static async generateBatchPDFs(
    invoice: Invoice,
    options: BatchPdfOptions = {}
  ): Promise<(jsPDF | Blob | string)[]> {
    const { copies = 1, copyLabels = [], generateSeparateFiles = true } = options;
    
    const results: (jsPDF | Blob | string)[] = [];
    const labels = copyLabels.length > 0 ? copyLabels : 
                  copies > 1 ? ['Original', 'Duplicate', 'Triplicate'].slice(0, copies) : 
                  [options.copyLabel || ''];

    if (generateSeparateFiles) {
      // Generate separate files for each copy
      for (let i = 0; i < Math.max(copies, labels.length); i++) {
        const copyOptions = {
          ...options,
          copyLabel: labels[i] || `Copy ${i + 1}`,
          filename: options.filename ? 
            `${options.filename.replace('.pdf', '')}_${labels[i] || `copy_${i + 1}`}.pdf` :
            undefined,
          onProgress: (progress: number) => options.onProgress?.(((i / copies) * 100) + (progress / copies))
        };
        
        const result = await this.generateClassicInvoicePDF(invoice, copyOptions);
        results.push(result);
      }
    } else {
      // Generate single PDF with multiple pages
      const pdf = await this.generateMultiPagePDF(invoice, labels, options);
      results.push(pdf);
    }

    return results;
  }

  /**
   * Preview PDF in browser
   */
  static async previewPDF(
    invoice: Invoice,
    options: PdfGenerationOptions = {}
  ): Promise<void> {
    const pdf = await this.generateClassicInvoicePDF(invoice, {
      ...options,
      action: 'return-blob'
    }) as Blob;

    const url = URL.createObjectURL(pdf);
    window.open(url, '_blank');
    
    // Cleanup after 1 minute
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /**
   * Send PDF via email (requires backend integration)
   */
  static async emailPDF(
    invoice: Invoice,
    emailOptions: {
      to: string;
      subject?: string;
      body?: string;
    },
    pdfOptions: PdfGenerationOptions = {}
  ): Promise<void> {
    const pdf = await this.generateClassicInvoicePDF(invoice, {
      ...pdfOptions,
      action: 'return-blob'
    }) as Blob;

    // This would typically call your email service
    // For now, we'll create a mailto link with attachment simulation
    const subject = emailOptions.subject || `Invoice ${invoice.invoiceNumber}`;
    const body = emailOptions.body || `Please find attached invoice ${invoice.invoiceNumber}.`;
    
    // Note: Real email functionality would require backend integration
    const mailtoLink = `mailto:${emailOptions.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\nNote: PDF attachment functionality requires backend integration.')}`;
    window.location.href = mailtoLink;
  }

  /**
   * Print PDF directly
   */
  static async printPDF(
    invoice: Invoice,
    options: PdfGenerationOptions = {}
  ): Promise<void> {
    const pdf = await this.generateClassicInvoicePDF(invoice, {
      ...options,
      action: 'return-blob'
    }) as Blob;

    const url = URL.createObjectURL(pdf);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
    
    // Cleanup after printing
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /**
   * Generate PDF with enhanced options
   */
  private static async generatePDF(
    invoice: Invoice,
    companyInfo: CompanyInfo | null,
    options: PdfGenerationOptions
  ): Promise<jsPDF | Blob | string> {
    // Create canvas from HTML
    const canvas = await this.createCanvasFromHTML(invoice, companyInfo, options);
    options.onProgress?.(60);

    // Create PDF with proper dimensions and settings
    const format = this.FORMAT_DIMENSIONS[options.format!];
    const pdf = new jsPDF({
      orientation: options.orientation,
      unit: 'mm',
      format: [format.width, format.height],
      compress: options.compress
    });

    // Add metadata
    if (options.metadata) {
      this.addMetadata(pdf, options.metadata, invoice);
    }

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png', this.QUALITY_SETTINGS[options.quality!].imageQuality);
    const imgWidth = format.width;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Handle pagination if content is taller than page
    if (imgHeight <= format.height) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      let position = 0;
      let pageCount = 1;
      
      while (position < imgHeight) {
        if (pageCount > 1) pdf.addPage();
        
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        
        // Add page numbers if enabled
        if (options.showPageNumbers) {
          this.addPageNumber(pdf, pageCount, Math.ceil(imgHeight / format.height));
        }
        
        // Add watermark if specified
        if (options.watermark) {
          this.addWatermark(pdf, options.watermark, format);
        }
        
        position += format.height;
        pageCount++;
      }
    }

    options.onProgress?.(80);

    // Add security if password is provided
    if (options.password) {
      this.addSecurity(pdf, options.password, options.permissions);
    }

    options.onProgress?.(90);

    // Handle different actions
    const filename = options.filename || `invoice-${invoice.invoiceNumber}.pdf`;
    
    switch (options.action) {
      case 'download':
        pdf.save(filename);
        options.onProgress?.(100);
        options.onSuccess?.(filename);
        return filename;
      case 'return-blob':
        const blob = pdf.output('blob');
        options.onProgress?.(100);
        options.onSuccess?.(blob);
        return blob;
      case 'preview':
      default:
        options.onProgress?.(100);
        options.onSuccess?.(pdf);
        return pdf;
    }
  }

  /**
   * Generate image (PNG/JPEG) format
   */
  private static async generateImage(
    invoice: Invoice,
    companyInfo: CompanyInfo | null,
    options: PdfGenerationOptions
  ): Promise<string | HTMLCanvasElement> {
    const canvas = await this.createCanvasFromHTML(invoice, companyInfo, options);
    options.onProgress?.(80);

    const mimeType = options.exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = this.QUALITY_SETTINGS[options.quality!].imageQuality;

    if (options.action === 'download') {
      const link = document.createElement('a');
      link.download = options.filename || `invoice-${invoice.invoiceNumber}.${options.exportFormat}`;
      link.href = canvas.toDataURL(mimeType, quality);
      link.click();
      
      options.onProgress?.(100);
      options.onSuccess?.(link.download);
      return link.download;
    }

    options.onProgress?.(100);
    options.onSuccess?.(canvas);
    return canvas;
  }

  /**
   * Create canvas from HTML with enhanced options
   */
  private static async createCanvasFromHTML(
    invoice: Invoice,
    companyInfo: CompanyInfo | null,
    options: PdfGenerationOptions
  ): Promise<HTMLCanvasElement> {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = `${this.FORMAT_DIMENSIONS[options.format!].width}mm`;
    tempDiv.style.minHeight = `${this.FORMAT_DIMENSIONS[options.format!].height}mm`;
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = '"Times New Roman", serif';
    tempDiv.innerHTML = this.renderEnhancedInvoiceHTML(invoice, companyInfo, options);
    
    document.body.appendChild(tempDiv);
    
    // Apply enhanced styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = this.getEnhancedPrintStyles(options);
    document.head.appendChild(styleSheet);

    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 500));
    options.onProgress?.(40);

    // Generate canvas with quality settings
    const qualitySettings = this.QUALITY_SETTINGS[options.quality!];
    const canvas = await html2canvas(tempDiv, {
      scale: qualitySettings.scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 30000,
      removeContainer: true,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('[data-temp-invoice]');
        if (clonedElement) {
          (clonedElement as HTMLElement).style.transform = 'scale(1)';
          (clonedElement as HTMLElement).style.transformOrigin = 'top left';
        }
      }
    });
    
    // Cleanup
    document.body.removeChild(tempDiv);
    document.head.removeChild(styleSheet);

    return canvas;
  }

  /**
   * Generate multi-page PDF with different copy labels
   */
  private static async generateMultiPagePDF(
    invoice: Invoice,
    labels: string[],
    options: BatchPdfOptions
  ): Promise<jsPDF | Blob | string> {
    const companyInfo = await getCompanyInfo();
    const format = this.FORMAT_DIMENSIONS[options.format || 'a4'];
    
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: [format.width, format.height],
      compress: options.compress
    });

    for (let i = 0; i < labels.length; i++) {
      if (i > 0) pdf.addPage();
      
      const copyOptions = { ...options, copyLabel: labels[i] };
      const canvas = await this.createCanvasFromHTML(invoice, companyInfo, copyOptions);
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = format.width;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, format.height));
      
      // Add page info
      if (options.showPageNumbers) {
        this.addPageNumber(pdf, i + 1, labels.length);
      }
      
      options.onProgress?.(((i + 1) / labels.length) * 100);
    }

    // Handle final action
    switch (options.action) {
      case 'download':
        const filename = options.filename || `invoice-${invoice.invoiceNumber}-batch.pdf`;
        pdf.save(filename);
        return filename;
      case 'return-blob':
        return pdf.output('blob');
      default:
        return pdf;
    }
  }

  /**
   * Add metadata to PDF
   */
  private static addMetadata(pdf: jsPDF, metadata: NonNullable<PdfGenerationOptions['metadata']>, invoice: Invoice): void {
    const props = {
      title: metadata.title || `Invoice ${invoice.invoiceNumber}`,
      subject: metadata.subject || 'Invoice Document',
      author: metadata.author || 'Invoice System',
      keywords: metadata.keywords?.join(', ') || 'invoice, billing',
      creator: metadata.creator || 'ClassicInvoicePdfService',
      producer: 'jsPDF'
    };

    pdf.setProperties(props);
    pdf.setCreationDate(new Date());
  }

  /**
   * Add watermark to PDF
   */
  private static addWatermark(pdf: jsPDF, watermark: WatermarkOptions, format: { width: number; height: number }): void {
    const { text, opacity = 0.3, fontSize = 50, color = '#cccccc', position = 'center' } = watermark;
    
    pdf.setTextColor(color);
    pdf.setFontSize(fontSize);
    pdf.setGState(pdf.GState({ opacity }));
    
    let x: number, y: number;
    const textWidth = pdf.getTextWidth(text);
    
    switch (position) {
      case 'center':
        x = (format.width - textWidth) / 2;
        y = format.height / 2;
        break;
      case 'top-left':
        x = 20;
        y = 30;
        break;
      case 'top-right':
        x = format.width - textWidth - 20;
        y = 30;
        break;
      case 'bottom-left':
        x = 20;
        y = format.height - 20;
        break;
      case 'bottom-right':
        x = format.width - textWidth - 20;
        y = format.height - 20;
        break;
      default:
        x = (format.width - textWidth) / 2;
        y = format.height / 2;
    }
    
    pdf.text(text, x, y, { angle: 45 });
    pdf.setGState(pdf.GState({ opacity: 1 })); // Reset opacity
  }

  /**
   * Add page numbers
   */
  private static addPageNumber(pdf: jsPDF, current: number, total: number): void {
    const pageText = `Page ${current} of ${total}`;
    pdf.setFontSize(10);
    pdf.setTextColor('#666666');
    pdf.text(pageText, 200, 290, { align: 'right' });
  }

  /**
   * Add security/password protection (Note: jsPDF doesn't support password protection by default)
   */
  private static addSecurity(
    pdf: jsPDF, 
    password: string, 
    permissions?: PdfGenerationOptions['permissions']
  ): void {
    // Note: jsPDF doesn't natively support password protection
    // This would require additional libraries like pdf-lib
    console.warn('Password protection requires additional libraries. Feature not implemented.');
  }

  /**
   * Set default options
   */
  private static setDefaultOptions(options: PdfGenerationOptions): Required<PdfGenerationOptions> {
    return {
      copyLabel: options.copyLabel || '',
      filename: options.filename || '',
      action: options.action || 'download',
      format: options.format || 'a4',
      orientation: options.orientation || 'portrait',
      quality: options.quality || 'high',
      exportFormat: options.exportFormat || 'pdf',
      password: options.password || '',
      permissions: options.permissions || {},
      watermark: options.watermark || null as any,
      showPageNumbers: options.showPageNumbers ?? false,
      showTimestamp: options.showTimestamp ?? false,
      customHeader: options.customHeader || '',
      customFooter: options.customFooter || '',
      compress: options.compress ?? true,
      embedFonts: options.embedFonts ?? true,
      colorProfile: options.colorProfile || 'sRGB',
      onProgress: options.onProgress || (() => {}),
      onError: options.onError || (() => {}),
      onSuccess: options.onSuccess || (() => {}),
      metadata: options.metadata || {}
    };
  }

  /**
   * Render enhanced invoice HTML
   */
  private static renderEnhancedInvoiceHTML(
    invoice: Invoice, 
    companyInfo: CompanyInfo | null, 
    options: PdfGenerationOptions
  ): string {
    const formatCurrency = (value: number | undefined | null): string => {
      return `₹${(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    
    const formatDate = (dateInput: any): string => {
      if (!dateInput) return 'N/A';
      try {
        if (dateInput.toDate) {
          return new Date(dateInput.toDate()).toLocaleDateString('en-IN');
        }
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-IN');
        }
      } catch (e) { /* ignore */ }
      return String(dateInput);
    };
    
    const numberToWords = (amount: number): string => {
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
    };

    // Generate empty rows
    const emptyRows = Math.max(0, 20 - (invoice.items?.length || 0));
    const emptyRowsHtml = Array.from({ length: emptyRows }).map((_, index) => `
      <tr>
        <td style="border: 1px solid #000; height: 22px; font-size: 10px; text-align: center;">&nbsp;</td>
        <td style="border: 1px solid #000; font-size: 10px;">&nbsp;</td>
        <td style="border: 1px solid #000; font-size: 10px; text-align: center;">&nbsp;</td>
        <td style="border: 1px solid #000; font-size: 10px; text-align: center;">&nbsp;</td>
        <td style="border: 1px solid #000; font-size: 10px; text-align: right;">&nbsp;</td>
        <td style="border: 1px solid #000; font-size: 10px; text-align: center;">&nbsp;</td>
        <td style="border: 1px solid #000; font-size: 10px; text-align: right;">&nbsp;</td>
      </tr>
    `).join('');

    return `
      <div data-temp-invoice style="
        max-width: ${this.FORMAT_DIMENSIONS[options.format || 'a4'].width}mm;
        min-height: ${this.FORMAT_DIMENSIONS[options.format || 'a4'].height}mm;
        margin: 0 auto;
        background: white;
        border: 2px solid #000;
        font-family: 'Times New Roman', serif;
        color: #000;
        position: relative;
      ">
        ${options.customHeader ? `<div style="padding: 8px; border-bottom: 1px solid #000; font-size: 10px; text-align: center;">${options.customHeader}</div>` : ''}
        
        <!-- Header -->
        <div style="
          border-bottom: 1px double #000;
          text-align: center;
          padding: 8px 16px;
          position: relative;
        ">
          ${options.copyLabel ? `
            <div style="
              font-style: italic;
              font-size: 10px;
              position: absolute;
              top: 4px;
              right: 6px;
              background: white;
              padding: 0 4px;
            ">
              (${options.copyLabel})
            </div>
          ` : ''}
          
          ${options.showTimestamp ? `
            <div style="
              font-size: 8px;
              position: absolute;
              top: 4px;
              left: 6px;
              background: white;
              padding: 0 4px;
            ">
              Generated: ${new Date().toLocaleString('en-IN')}
            </div>
          ` : ''}
          
          <h1 style="
            font-weight: bold;
            font-size: 32px;
            font-family: 'Times New Roman', serif;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0 0 4px 0;
          ">
            ${companyInfo?.name || 'COMPANY NAME'}
          </h1>
          
          <p style="
            font-size: 12px;
            margin: 0 0 4px 0;
            font-weight: 500;
          ">
            ${companyInfo?.address || 'Complete Business Address with PIN Code'}
          </p>
          
          <p style="
            font-size: 11px;
            margin: 0 0 4px 0;
            line-height: 1.3;
          ">
            ${companyInfo?.phone ? `Phone: ${companyInfo.phone}` : 'Phone: +91-XXXXXXXXXX'} | ${companyInfo?.email ? `Email: ${companyInfo.email}` : 'Email: info@company.com'} | ${companyInfo?.website ? `Website: ${companyInfo.website}` : 'Website: www.company.com'}
          </p>
          
          <h2 style="
            font-weight: bold;
            font-size: 14px;
            text-decoration: underline;
            margin: 8px 0 4px 0;
          ">
            PERFORMA QUOTATION
          </h2>
        </div>

        <!-- Invoice Details -->
        <div style="display: flex; margin: 8px 0;">
          <!-- Bill To -->
          <div style="
            flex: 1;
            border: 1px solid #000;
            margin-right: 4px;
            padding: 8px;
            min-height: 90px;
          ">
            <p style="
              font-weight: bold;
              text-decoration: underline;
              font-size: 11px;
              margin: 0 0 4px 0;
            ">
              Bill To:
            </p>
            <p style="
              font-size: 14px;
              font-weight: bold;
              margin: 0 0 4px 0;
            ">
              ${invoice.partyName || 'N/A'}
            </p>
            ${invoice.partyAddress ? `
              <p style="
                font-size: 12px;
                margin: 0 0 4px 0;
                line-height: 1.2;
              ">
                ${invoice.partyAddress}
              </p>
            ` : ''}
            ${invoice.partyPhone ? `
              <p style="
                font-size: 10px;
                margin: 0;
              ">
                Phone: ${invoice.partyPhone}
              </p>
            ` : ''}
          </div>

          <!-- Quotation Information -->
          <div style="
            flex: 1;
            border: 1px solid #000;
            margin-left: 4px;
            padding: 8px;
            min-height: 90px;
          ">
            <p style="
              font-weight: bold;
              text-decoration: underline;
              font-size: 11px;
              margin: 0 0 8px 0;
            ">
              Quotation Information:
            </p>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: bold;">Quotation No.:</span>
              <span style="font-size: 11px; font-weight: 800;">${invoice.invoiceNumber || 'N/A'}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: bold;">Quotation Date:</span>
              <span style="font-size: 10px;">${formatDate(invoice.date)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: bold;">Due Date:</span>
              <span style="font-size: 10px;">${invoice.dueDate ? formatDate(invoice.dueDate) : formatDate(new Date(new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000))}</span>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table style="
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          border: 1px solid #000;
        ">
          <thead>
            <tr>
              <th style="
                border: 1px solid #000;
                background: #f0f0f0;
                font-weight: bold;
                width: 5%;
                font-size: 10px;
                padding: 4px;
                text-align: center;
              ">S.No.</th>
              <th style="
                border: 1px solid #000;
                background: #f0f0f0;
                font-weight: bold;
                width: 35%;
                font-size: 10px;
                padding: 4px;
                text-align: center;
              ">Description of Goods</th>
              <th style="
                border: 1px solid #000;
                background: #f0f0f0;
                font-weight: bold;
                width: 8%;
                font-size: 10px;
                padding: 4px;
                text-align: center;
              ">Qty</th>
              <th style="
                border: 1px solid #000;
                background: #f0f0f0;
                font-weight: bold;
                width: 6%;
                font-size: 10px;
                padding: 4px;
                text-align: center;
              ">UOM</th>
              <th style="
                border: 1px solid #000;
                background: #f0f0f0;
                font-weight: bold;
                width: 12%;
                font-size: 10px;
                padding: 4px;
                text-align: center;
              ">Rate (₹)</th>
              <th style="
                border: 1px solid #000;
                background: #f0f0f0;
                font-weight: bold;
                width: 8%;
                font-size: 10px;
                padding: 4px;
                text-align: center;
              ">Disc. %</th>
              <th style="
                border: 1px solid #000;
                background: #f0f0f0;
                font-weight: bold;
                width: 18%;
                font-size: 10px;
                padding: 4px;
                text-align: center;
              ">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items?.map((item, index) => `
              <tr>
                <td style="border: 1px solid #000; font-size: 11px; text-align: center; padding: 4px;">
                  ${index + 1}
                </td>
                <td style="border: 1px solid #000; font-size: 11px; padding: 4px;">
                  <div style="font-weight: 500; font-size: 11px;">
                    ${item.name || item.productName || 'N/A'}
                  </div>
                  ${item.description ? `
                    <div style="color: #666; font-size: 10px;">
                      ${item.description}
                    </div>
                  ` : ''}
                </td>
                <td style="border: 1px solid #000; font-size: 11px; text-align: center; padding: 4px;">
                  ${item.quantity}
                </td>
                <td style="border: 1px solid #000; font-size: 11px; text-align: center; padding: 4px;">
                  ${item.unitOfMeasurement || 'PCS'}
                </td>
                <td style="border: 1px solid #000; font-size: 11px; text-align: right; padding: 4px;">
                  ${(item.price || 0).toFixed(2)}
                </td>
                <td style="border: 1px solid #000; font-size: 11px; text-align: center; padding: 4px;">
                  ${item.discount > 0 ? `${item.discount}%` : '0.00'}
                </td>
                <td style="border: 1px solid #000; font-size: 11px; text-align: right; padding: 4px; font-weight: bold;">
                  ${(item.totalAmount || item.finalPrice || 0).toFixed(2)}
                </td>
              </tr>
            `).join('') || ''}
            
            ${emptyRowsHtml}

            <!-- Sub Total -->
            <tr style="background: #f8f8f8;">
              <td colspan="6" style="
                border: 1px solid #000;
                text-align: right;
                font-weight: bold;
                background: #f8f8f8;
                font-size: 12px;
                padding: 4px;
              ">
                Sub Total:
              </td>
              <td style="
                border: 1px solid #000;
                font-weight: bold;
                background: #f8f8f8;
                font-size: 12px;
                text-align: right;
                padding: 4px;
              ">
                ${formatCurrency(invoice.subtotal || invoice.totalAmount || 0)}
              </td>
            </tr>

            <!-- Transport Charges -->
            <tr style="background: #f8f8f8;">
              <td colspan="6" style="
                border: 1px solid #000;
                text-align: right;
                font-weight: bold;
                background: #f8f8f8;
                font-size: 12px;
                padding: 4px;
              ">
                Transport Charge:
              </td>
              <td style="
                border: 1px solid #000;
                font-weight: bold;
                background: #f8f8f8;
                font-size: 12px;
                text-align: right;
                padding: 4px;
              ">
                ${formatCurrency(invoice.transportCharges || 0)}
              </td>
            </tr>

            <!-- Grand Total -->
            <tr style="background: #e8e8e8;">
              <td colspan="6" style="
                border: 2px solid #000;
                text-align: right;
                font-weight: bold;
                font-size: 12px;
                background: #e8e8e8;
                padding: 6px;
              ">
                TOTAL AMOUNT: ${numberToWords(invoice.totalAmount || 0)}
              </td>
              <td style="
                border: 2px solid #000;
                font-weight: bold;
                font-size: 12px;
                background: #e8e8e8;
                text-align: right;
                padding: 6px;
              ">
                ${formatCurrency(invoice.totalAmount || 0)}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Declaration -->
        <div style="
          border: 1px solid #000;
          padding: 12px;
          margin: 8px 0;
        ">
          <p style="
            font-weight: bold;
            text-decoration: underline;
            font-size: 12px;
            margin: 0 0 6px 0;
          ">
            Declaration: 
          </p>
          <p style="
            font-size: 11px;
            line-height: 1.3;
            margin: 0;
          ">
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </p>
        </div>

        <!-- Terms & Conditions -->
        <div style="
          border: 1px solid #000;
          padding: 12px;
          margin: 8px 0;
        ">
          <p style="
            font-weight: bold;
            text-decoration: underline;
            font-size: 12px;
            margin: 0 0 4px 0;
          ">
            Terms & Conditions:
          </p>
          <p style="font-size: 10px; margin: 0 0 4px 0;">
            1. Goods once sold will not be taken back.
          </p>
          <p style="font-size: 10px; margin: 0 0 4px 0;">
            2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.
          </p>
          <p style="font-size: 10px; margin: 0;">
            3. Our risk and responsibility ceases the moment goods leave our premises.
          </p>
        </div>

        <!-- Signatures -->
        <div style="
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
          padding: 12px 0;
        ">
          <div style="text-align: left;">
            <p style="
              font-size: 12px;
              font-weight: bold;
              margin: 0 0 16px 0;
            ">
              Receiver's Signature:
            </p>
            <div style="
              border-bottom: 1px solid #000;
              width: 180px;
            ">&nbsp;</div>
          </div>
          <div style="text-align: right;">
            <p style="
              font-size: 12px;
              font-weight: bold;
              margin: 0 0 16px 0;
            ">
              for ${companyInfo?.name || 'COMPANY NAME'}
            </p>
            <p style="
              font-size: 12px;
              font-weight: bold;
              margin: 0;
            ">
              Authorised Signatory
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="
          text-align: center;
          border-top: 1px solid #000;
          padding: 8px;
          margin-top: 16px;
        ">
          <p style="
            font-size: 10px;
            font-style: italic;
            margin: 0;
          ">
            This is a Computer Generated Invoice
          </p>
          ${options.customFooter ? `<p style="font-size: 8px; margin: 4px 0 0 0;">${options.customFooter}</p>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Enhanced print styles
   */
  private static getEnhancedPrintStyles(options: PdfGenerationOptions): string {
    return `
      @page {
        size: ${options.format?.toUpperCase()} ${options.orientation};
        margin: 0;
      }
      
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box;
      }
      
      [data-temp-invoice] {
        font-family: 'Times New Roman', serif !important;
        color: #000 !important;
        line-height: 1.2 !important;
        width: ${this.FORMAT_DIMENSIONS[options.format || 'a4'].width}mm !important;
        min-height: ${this.FORMAT_DIMENSIONS[options.format || 'a4'].height}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        display: block !important;
        ${options.colorProfile === 'CMYK' ? 'color-profile: cmyk;' : ''}
      }
      
      [data-temp-invoice] table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      
      [data-temp-invoice] td,
      [data-temp-invoice] th {
        border: 1px solid #000 !important;
        padding: 3px 4px !important;
      }
      
      [data-temp-invoice] th {
        background: #f0f0f0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      [data-temp-invoice] .subtotal-row {
        background: #f8f8f8 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      [data-temp-invoice] .total-row {
        background: #e8e8e8 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      ${options.watermark ? `
        [data-temp-invoice]::before {
          content: "${options.watermark.text}";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          font-size: ${options.watermark.fontSize || 50}px;
          color: ${options.watermark.color || '#cccccc'};
          opacity: ${options.watermark.opacity || 0.3};
          z-index: 1000;
          pointer-events: none;
        }
      ` : ''}
    `;
  }
}