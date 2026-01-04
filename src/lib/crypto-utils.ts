// Encryption utilities using Web Crypto API (AES-GCM)

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 100000;

/**
 * Derives an AES-GCM key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts any file (images, etc.) using AES-256-GCM
 * Output format: [magic(4)] + [salt(16)] + [iv(12)] + [encrypted data]
 */
export async function encryptFile(file: File, password: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Derive key from password
  const key = await deriveKey(password, salt);
  
  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );
  
  // Magic bytes to identify our encrypted files: "ENCF" (Encrypted File)
  const magic = new Uint8Array([0x45, 0x4E, 0x43, 0x46]);
  
  // Combine: magic + salt + iv + encrypted data
  const result = new Uint8Array(4 + SALT_LENGTH + IV_LENGTH + encryptedData.byteLength);
  result.set(magic, 0);
  result.set(salt, 4);
  result.set(iv, 4 + SALT_LENGTH);
  result.set(new Uint8Array(encryptedData), 4 + SALT_LENGTH + IV_LENGTH);
  
  return new Blob([result], { type: 'application/octet-stream' });
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
 * Get encrypted file extension
 */
export function getEncryptedFileName(originalName: string, fileType: 'pdf' | 'image'): string {
  // Keep original filename for both PDFs and images
  return originalName;
}
