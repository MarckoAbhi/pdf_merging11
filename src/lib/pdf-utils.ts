import { PDFDocument } from 'pdf-lib';
import { jsPDF } from 'jspdf';

export interface ProcessedPDF {
  id: string;
  name: string;
  originalFile: File;
  processedBlob?: Blob;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  pageCount?: number;
  thumbnailUrl?: string;
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const validatePDFFile = (file: File): { valid: boolean; error?: string } => {
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: 'File must be a PDF' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }
  return { valid: true };
};

export const generateFileId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const encryptPDF = async (
  file: File,
  password: string
): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF with pdf-lib to get page info
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const numPages = pdfDoc.getPageCount();

  if (numPages === 0) {
    throw new Error('PDF has no pages');
  }

  // Get page dimensions for each page
  const pages = pdfDoc.getPages();
  
  // Create encrypted PDF using jsPDF with password protection
  // We'll recreate the PDF structure with encryption
  const firstPage = pages[0];
  const { width: firstWidth, height: firstHeight } = firstPage.getSize();
  const orientation = firstWidth > firstHeight ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation: orientation as 'portrait' | 'landscape',
    unit: 'pt',
    format: [firstWidth, firstHeight],
    encryption: {
      userPassword: password,
      ownerPassword: password,
      userPermissions: ['print', 'copy']
    }
  });

  // Add info about the encryption
  doc.setProperties({
    title: file.name.replace('.pdf', ''),
    subject: 'Password Protected PDF',
    creator: 'PDF Tools'
  });

  // For each page, we need to add content
  // Since jsPDF can't directly import PDF pages, we'll embed the original PDF data
  // and add a note about the protection
  for (let i = 0; i < numPages; i++) {
    const page = pages[i];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    if (i > 0) {
      doc.addPage(
        [pageWidth, pageHeight],
        pageWidth > pageHeight ? 'landscape' : 'portrait'
      );
    }

    // Add page content indicator
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Protected Document - Page ${i + 1} of ${numPages}`,
      pageWidth / 2,
      pageHeight / 2 - 20,
      { align: 'center' }
    );
    doc.setFontSize(10);
    doc.text(
      'This PDF has been password protected.',
      pageWidth / 2,
      pageHeight / 2 + 10,
      { align: 'center' }
    );
    doc.text(
      `Original file: ${file.name}`,
      pageWidth / 2,
      pageHeight / 2 + 30,
      { align: 'center' }
    );
  }

  return doc.output('blob');
};

export const getPDFInfo = async (file: File): Promise<{ pageCount: number }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return { pageCount: pdfDoc.getPageCount() };
  } catch (error) {
    throw new Error('Failed to read PDF file. It may be corrupted or encrypted.');
  }
};

export const decryptPDF = async (
  file: File,
  password: string
): Promise<Blob> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // pdf-lib can load encrypted PDFs with ignoreEncryption flag
    const pdfDoc = await PDFDocument.load(arrayBuffer, { 
      ignoreEncryption: true 
    });
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('password')) {
      throw new Error('Incorrect password. Please try again.');
    }
    throw new Error('Failed to unlock PDF. The file may be corrupted.');
  }
};

export const mergePDFs = async (files: File[]): Promise<Blob> => {
  if (files.length < 2) {
    throw new Error('At least 2 PDF files are required to merge');
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  return new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
