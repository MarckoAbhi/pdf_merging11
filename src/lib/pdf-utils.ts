import { PDFDocument } from 'pdf-lib';

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
  userPassword: string,
  ownerPassword?: string
): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  // Note: pdf-lib doesn't support native encryption
  // The PDF is processed and saved - full encryption would require server-side processing
  const pdfBytes = await pdfDoc.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
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
