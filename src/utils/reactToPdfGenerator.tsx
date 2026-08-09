import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ClassicInvoiceTemplate from '@/components/invoices/templates/ClassicInvoiceTemplate';

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
    date: typeof data.date === 'string' ? data.date : data.date.toISOString(),
    dueDate: data.dueDate ? (typeof data.dueDate === 'string' ? data.dueDate : data.dueDate.toISOString()) : undefined,
    
    // Customer Information (mapped from customer object)
    partyId: data.customer?.name || '',
    partyName: data.customer?.name || '',
    partyAddress: data.customer?.address || '',
    partyEmail: data.customer?.email || '',
    partyPhone: data.customer?.phone || '',
    
    // Invoice Items (mapped to match InvoiceItem interface)
    items: data.items.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      productId: Math.random().toString(36).substr(2, 9),
      productName: item.productName || item.description || '',
      name: item.productName || item.description || '',
      description: item.description || item.productName || '',
      quantity: item.quantity,
      unitOfMeasurement: 'pcs',
      price: item.rate || item.unitPrice || 0,
      discount: 0,
      discountType: 'none' as const,
      finalPrice: item.rate || item.unitPrice || 0,
      totalAmount: item.amount || item.totalAmount || 0,
      category: '',
      isService: false
    })),
    
    // Financial Details
    subtotal: data.subtotal,
    totalDiscount: data.discount || 0,
    totalAmount: data.grandTotal || data.total,
    
    // Payment Information
    paymentStatus: (data.paymentStatus as any) || 'pending',
    paidAmount: (data.grandTotal || data.total) - (data.balanceAmount || 0),
    balanceAmount: data.balanceAmount || 0,
    paymentTerms: data.terms || '',
    
    // Additional Information
    notes: data.notes || '',
    attachments: [],
    
    // System Fields
    type: (data.type as any) || 'sales',
    status: (data.status as any) || 'confirmed',
    stockUpdated: false,
    
    // Audit Fields
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: '',
    updatedBy: '',
    userId: ''
  };
};

export const generateClassicInvoicePdf = async (invoiceData: InvoiceData): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '210mm';
    container.style.background = 'white';
    container.style.padding = '0';
    container.style.margin = '0';
    
    document.body.appendChild(container);

    try {
      // Convert data to classic format
      const classicData = convertToClassicFormat(invoiceData);
      
      // Create root and render the component
      const root = createRoot(container);
      
      root.render(
        React.createElement(ClassicInvoiceTemplate, {
          invoice: classicData,
          settings: {},
          previewMode: false
        })
      );

      // Wait for the component to render
      setTimeout(() => {
        html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794, // A4 width in pixels at 96 DPI
          height: 1123, // A4 height in pixels at 96 DPI
          scrollX: 0,
          scrollY: 0,
        }).then(canvas => {
          // Clean up
          root.unmount();
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }

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
          root.unmount();
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
          reject(error);
        });
      }, 1000); // Wait 1 second for rendering to complete

    } catch (error) {
      // Clean up on error
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      reject(error);
    }
  });
};

export const downloadClassicInvoicePdf = async (invoiceData: InvoiceData, filename?: string): Promise<void> => {
  try {
    const blob = await generateClassicInvoicePdf(invoiceData);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `invoice-${invoiceData.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading classic invoice PDF:', error);
    throw error;
  }
};