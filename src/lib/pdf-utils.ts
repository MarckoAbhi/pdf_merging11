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

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

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
  
  // Quick validation - just check PDF header
  const header = new Uint8Array(arrayBuffer.slice(0, 5));
  const headerStr = String.fromCharCode(...header);
  if (!headerStr.startsWith('%PDF')) {
    throw new Error('Invalid PDF file');
  }

  // Use QPDF for fast native encryption (no page rendering needed)
  return new Promise((resolve, reject) => {
    const QPDF = (window as any).QPDF;
    
    if (!QPDF) {
      reject(new Error('QPDF library not loaded. Please refresh the page.'));
      return;
    }

    // Set the path for QPDF worker files (works on GitHub Pages subpaths)
    QPDF.path = `${import.meta.env.BASE_URL}qpdf/`;

    QPDF.encrypt({
      logger: () => {}, // Suppress debug output
      arrayBuffer: arrayBuffer,
      userPassword: password,
      ownerPassword: password,
      keyLength: 256,
      callback: (err: Error | null, result: ArrayBuffer) => {
        if (err) {
          reject(new Error('Failed to encrypt PDF. File may be corrupted.'));
        } else if (result) {
          resolve(new Blob([new Uint8Array(result)], { type: 'application/pdf' }));
        }
      }
    });
  });
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
  
  // For higher quality (>40%), use pdf-lib optimization which preserves text quality
  // For lower quality, use aggressive image-based compression
  if (quality > 40) {
    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      // Save with object streams enabled for better compression
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      
      const compressedBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      
      // If compression didn't help much, try image-based approach
      if (compressedBlob.size >= file.size * 0.95) {
        return await compressPDFWithImages(arrayBuffer, quality);
      }
      
      return compressedBlob;
    } catch {
      // Fallback to image-based compression
      return await compressPDFWithImages(arrayBuffer, quality);
    }
  }
  
  // For aggressive compression (quality <= 40%), always use image-based
  return await compressPDFWithImages(arrayBuffer, quality);
};

const compressPDFWithImages = async (arrayBuffer: ArrayBuffer, quality: number): Promise<Blob> => {
  const pdfjsLib = await loadPdfJs();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  // Lower scale for better compression - quality 100 = 1.0, quality 10 = 0.3
  const scale = Math.max(0.3, Math.min(1.0, quality / 100));
  
  // JPEG quality - more aggressive compression
  const jpegQuality = Math.max(0.2, Math.min(0.8, (quality / 100) * 0.8));

  const firstPage = await pdfDocument.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1 });
  const orientation = firstViewport.width > firstViewport.height ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation: orientation as 'portrait' | 'landscape',
    unit: 'pt',
    format: [firstViewport.width, firstViewport.height],
    compress: true,
  });

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const originalViewport = page.getViewport({ scale: 1 });
    const renderViewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Could not create canvas context');
    
    canvas.width = renderViewport.width;
    canvas.height = renderViewport.height;

    await page.render({ canvasContext: context, viewport: renderViewport }).promise;

    // Use blob instead of dataURL for smaller size
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
        'image/jpeg',
        jpegQuality
      );
    });
    
    const imgArrayBuffer = await blob.arrayBuffer();
    const imgData = new Uint8Array(imgArrayBuffer);
    
    if (pageNum > 1) {
      doc.addPage(
        [originalViewport.width, originalViewport.height],
        originalViewport.width > originalViewport.height ? 'landscape' : 'portrait'
      );
    }

    doc.addImage(imgData, 'JPEG', 0, 0, originalViewport.width, originalViewport.height);
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

export const convertImagesToPDF = async (files: File[]): Promise<Blob> => {
  if (files.length === 0) {
    throw new Error('No images provided');
  }

  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    let image;
    const mimeType = file.type.toLowerCase();
    
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      image = await pdfDoc.embedJpg(bytes);
    } else if (mimeType === 'image/png') {
      image = await pdfDoc.embedPng(bytes);
    } else {
      // For other formats, convert to PNG using canvas
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');
      ctx.drawImage(img, 0, 0);
      
      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to convert image'))),
          'image/png'
        );
      });
      
      const pngBuffer = await pngBlob.arrayBuffer();
      image = await pdfDoc.embedPng(new Uint8Array(pngBuffer));
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
};

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const convertEpubToPDF = async (file: File): Promise<Blob> => {
  const ePub = (await import('epubjs')).default;
  const arrayBuffer = await file.arrayBuffer();
  const book = ePub(arrayBuffer);
  
  await book.ready;
  
  const spine = book.spine as any;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - 2 * margin;
  const lineHeight = 16;
  const fontSize = 12;
  
  doc.setFontSize(fontSize);
  
  let currentY = margin;
  let isFirstPage = true;
  
  // Get all spine items
  const spineItems: any[] = [];
  spine.each((item: any) => {
    spineItems.push(item);
  });
  
  for (const item of spineItems) {
    try {
      const contents = await item.load(book.load.bind(book));
      const doc_content = contents.document || contents;
      
      // Extract text content
      const textContent = doc_content.body?.textContent || doc_content.textContent || '';
      const lines = textContent.split(/\n+/).filter((line: string) => line.trim());
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Word wrap the text
        const words = trimmedLine.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = doc.getTextWidth(testLine);
          
          if (textWidth > contentWidth) {
            if (currentLine) {
              // Check if we need a new page
              if (currentY + lineHeight > pageHeight - margin) {
                doc.addPage();
                currentY = margin;
              }
              doc.text(currentLine, margin, currentY);
              currentY += lineHeight;
            }
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        // Print remaining text
        if (currentLine) {
          if (currentY + lineHeight > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }
          doc.text(currentLine, margin, currentY);
          currentY += lineHeight;
        }
        
        // Add small spacing between paragraphs
        currentY += lineHeight * 0.5;
      }
    } catch (e) {
      console.warn('Failed to load chapter:', e);
    }
  }
  
  book.destroy();
  
  return doc.output('blob');
};
