import { jsPDF } from 'jspdf';

declare global {
  namespace jsPDF {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
      lastAutoTable: {
        finalY: number;
        table?: any;
        pageNumber?: number;
        pageCount?: number;
        settings?: any;
        doc?: jsPDF;
      };
    }
  }
}

// This ensures the file is treated as a module
export {};