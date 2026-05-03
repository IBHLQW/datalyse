import { jsPDF } from 'jspdf';
import { UserOptions } from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

declare module 'jspdf-autotable' {
  export interface UserOptions {
    head?: any[][];
    body?: any[][];
    foot?: any[][];
    startY?: number;
    margin?: any;
    pageBreak?: 'auto' | 'avoid' | 'always';
    rowPageBreak?: 'auto' | 'avoid';
    tableWidth?: 'auto' | 'wrap' | number;
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableLineColor?: any;
    tableLineWidth?: number;
    styles?: any;
    headStyles?: any;
    bodyStyles?: any;
    footStyles?: any;
    alternateRowStyles?: any;
    columnStyles?: any;
    theme?: 'striped' | 'grid' | 'plain';
    useCss?: boolean;
    html?: string | HTMLTableElement;
    didParseCell?: (data: any) => void;
    willDrawCell?: (data: any) => void;
    didDrawCell?: (data: any) => void;
    didDrawPage?: (data: any) => void;
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): void;
}

declare module 'xlsx';
declare module 'file-saver';
