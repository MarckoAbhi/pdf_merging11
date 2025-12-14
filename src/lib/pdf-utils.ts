import { PDFDocument } from 'pdf-lib';
import { jsPDF } from 'jspdf';

// Dynamically import pdfjs-dist to avoid top-level await issues
const loadPdfJs = async () => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  return pdfjsLib;
};

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
  
  // Load PDF.js dynamically
  const pdfjsLib = await loadPdfJs();
  
  // Load PDF with pdf.js for rendering
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  if (numPages === 0) {
    throw new Error('PDF has no pages');
  }

  // Get first page to determine initial dimensions
  const firstPage = await pdfDocument.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 2 }); // Higher scale for quality
  const orientation = firstViewport.width > firstViewport.height ? 'landscape' : 'portrait';

  // Create encrypted PDF using jsPDF
  const doc = new jsPDF({
    orientation: orientation as 'portrait' | 'landscape',
    unit: 'pt',
    format: [firstViewport.width / 2, firstViewport.height / 2],
    encryption: {
      userPassword: password,
      ownerPassword: password,
      userPermissions: ['print', 'copy']
    }
  });

  // Render each page to canvas and add to jsPDF
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    
    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not create canvas context');
    }
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Add new page if not first
    if (pageNum > 1) {
      doc.addPage(
        [viewport.width / 2, viewport.height / 2],
        viewport.width > viewport.height ? 'landscape' : 'portrait'
      );
    }

    // Add image to PDF (scaled back to original size)
    doc.addImage(
      imgData,
      'JPEG',
      0,
      0,
      viewport.width / 2,
      viewport.height / 2
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

export const compressPDF = async (file: File, quality: number): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  
  const pdfjsLib = await loadPdfJs();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  if (numPages === 0) {
    throw new Error('PDF has no pages');
  }

  const firstPage = await pdfDocument.getPage(1);
  const scale = quality > 70 ? 1.5 : quality > 40 ? 1.2 : 1;
  const firstViewport = firstPage.getViewport({ scale });
  const orientation = firstViewport.width > firstViewport.height ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation: orientation as 'portrait' | 'landscape',
    unit: 'pt',
    format: [firstViewport.width / scale, firstViewport.height / scale],
    compress: true,
  });

  const jpegQuality = quality / 100;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Could not create canvas context');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const imgData = canvas.toDataURL('image/jpeg', jpegQuality);
    
    if (pageNum > 1) {
      doc.addPage(
        [viewport.width / scale, viewport.height / scale],
        viewport.width > viewport.height ? 'landscape' : 'portrait'
      );
    }

    doc.addImage(imgData, 'JPEG', 0, 0, viewport.width / scale, viewport.height / scale);
  }

  return doc.output('blob');
};

export const convertPDFToImages = async (file: File, format: 'png' | 'jpeg'): Promise<Blob[]> => {
  const arrayBuffer = await file.arrayBuffer();
  
  const pdfjsLib = await loadPdfJs();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  const images: Blob[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Could not create canvas context');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to create image'))),
        `image/${format}`,
        format === 'jpeg' ? 0.92 : undefined
      );
    });

    images.push(blob);
  }

  return images;
};
