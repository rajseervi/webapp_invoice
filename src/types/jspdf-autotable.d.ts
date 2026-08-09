import { jsPDF } from 'jspdf';

interface AutoTableOptions {
  startY?: number;
  head?: any[][];
  body?: any[][];
  foot?: any[][];
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  styles?: {
    fontSize?: number;
    cellPadding?: number;
    overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    fillColor?: number[] | string | false;
    textColor?: number[] | string;
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
    lineColor?: number[] | string;
    lineWidth?: number;
  };
  headStyles?: {
    fontSize?: number;
    cellPadding?: number;
    overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    fillColor?: number[] | string | false;
    textColor?: number[] | string;
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
    lineColor?: number[] | string;
    lineWidth?: number;
  };
  bodyStyles?: {
    fontSize?: number;
    cellPadding?: number;
    overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    fillColor?: number[] | string | false;
    textColor?: number[] | string;
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
    lineColor?: number[] | string;
    lineWidth?: number;
  };
  footStyles?: {
    fontSize?: number;
    cellPadding?: number;
    overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    fillColor?: number[] | string | false;
    textColor?: number[] | string;
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
    lineColor?: number[] | string;
    lineWidth?: number;
  };
  columnStyles?: {
    [key: number]: {
      cellWidth?: number | 'auto' | 'wrap';
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
      fontSize?: number;
      cellPadding?: number;
      overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
      fillColor?: number[] | string | false;
      textColor?: number[] | string;
      fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
      lineColor?: number[] | string;
      lineWidth?: number;
    };
  };
  theme?: 'striped' | 'grid' | 'plain';
  tableWidth?: 'auto' | 'wrap' | number;
  showHead?: 'everyPage' | 'firstPage' | 'never';
  showFoot?: 'everyPage' | 'lastPage' | 'never';
  pageBreak?: 'auto' | 'avoid' | 'always';
  pageBreakBefore?: (hookData: any) => boolean;
  didDrawPage?: (hookData: any) => void;
  didDrawCell?: (hookData: any) => void;
  willDrawCell?: (hookData: any) => boolean | void;
  didParseCell?: (hookData: any) => void;
  willDrawPage?: (hookData: any) => void;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
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