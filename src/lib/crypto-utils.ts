// Image to PDF protection utilities
import { PDFDocument } from 'pdf-lib';

/**
 * Convert an image to a password-protected PDF
 * Uses QPDF for native PDF password protection
 */
export async function protectImageAsPDF(file: File, password: string): Promise<Blob> {
  // First, create a PDF with the image embedded
  const pdfDoc = await PDFDocument.create();
  
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

  // Add a page with the image dimensions
  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  // Save the unprotected PDF
  const pdfBytes = await pdfDoc.save();
  
  // Now encrypt the PDF using QPDF
  return new Promise((resolve, reject) => {
    const QPDF = (window as any).QPDF;
    
    if (!QPDF) {
      reject(new Error('QPDF library not loaded. Please refresh the page.'));
      return;
    }

    QPDF.path = `${import.meta.env.BASE_URL}qpdf/`;

    QPDF.encrypt({
      logger: () => {},
      arrayBuffer: pdfBytes.buffer,
      userPassword: password,
      ownerPassword: password,
      keyLength: 256,
      callback: (err: Error | null, result: ArrayBuffer) => {
        if (err) {
          reject(new Error('Failed to protect image. Please try again.'));
        } else if (result) {
          resolve(new Blob([new Uint8Array(result)], { type: 'application/pdf' }));
        }
      }
    });
  });
}

/**
 * Load an image from a File object
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif|heic|heif|avif)$/i.test(file.name);
}

/**
 * Check if a file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Get protected file name
 * PDFs keep original name
 * Images become PDFs with .pdf extension
 */
export function getProtectedFileName(originalName: string, fileType: 'pdf' | 'image'): string {
  if (fileType === 'pdf') {
    return originalName;
  }
  // Images become password-protected PDFs
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  return `${baseName}.pdf`;
}
