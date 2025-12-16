// General file utilities for all file types

export interface ProcessedFile {
  id: string;
  name: string;
  originalFile: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  processedBlob?: Blob;
  error?: string;
  type: string;
}

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File "${file.name}" exceeds 500MB limit` };
  }
  return { valid: true };
};

export const generateFileId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const getEncryptedFileName = (originalName: string): string => {
  // User request: keep the original filename (no added suffix like .enc)
  return originalName;
};

export const encryptFile = async (file: File, password: string): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  
  // Generate a key from the password
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Generate a random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Store file metadata
  const metadata = {
    originalName: file.name,
    originalType: file.type,
    originalSize: file.size,
  };
  const metadataStr = JSON.stringify(metadata);
  const metadataBytes = encoder.encode(metadataStr);
  const metadataLength = new Uint32Array([metadataBytes.length]);
  
  // Combine: metadataLength (4 bytes) + metadata + salt (16 bytes) + iv (12 bytes) + encrypted data
  const combined = new Uint8Array(
    4 + metadataBytes.length + salt.length + iv.length + encryptedData.byteLength
  );
  
  let offset = 0;
  combined.set(new Uint8Array(metadataLength.buffer), offset);
  offset += 4;
  combined.set(metadataBytes, offset);
  offset += metadataBytes.length;
  combined.set(salt, offset);
  offset += salt.length;
  combined.set(iv, offset);
  offset += iv.length;
  combined.set(new Uint8Array(encryptedData), offset);
  
  return new Blob([combined], { type: 'application/octet-stream' });
};

export const decryptFile = async (file: File, password: string): Promise<{ blob: Blob; originalName: string; originalType: string }> => {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  
  // Extract metadata length
  const metadataLength = new Uint32Array(data.slice(0, 4).buffer)[0];
  
  // Extract metadata
  const decoder = new TextDecoder();
  const metadataBytes = data.slice(4, 4 + metadataLength);
  const metadata = JSON.parse(decoder.decode(metadataBytes));
  
  let offset = 4 + metadataLength;
  
  // Extract salt and IV
  const salt = data.slice(offset, offset + 16);
  offset += 16;
  const iv = data.slice(offset, offset + 12);
  offset += 12;
  
  // Extract encrypted data
  const encryptedData = data.slice(offset);
  
  // Derive key from password
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  try {
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    
    return {
      blob: new Blob([decryptedData], { type: metadata.originalType || 'application/octet-stream' }),
      originalName: metadata.originalName,
      originalType: metadata.originalType,
    };
  } catch {
    throw new Error('Incorrect password or corrupted file');
  }
};
