import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize, generateFileId, ProcessedPDF } from '@/lib/pdf-utils';
import { isImageFile, isPDFFile } from '@/lib/crypto-utils';
import { Button } from '@/components/ui/button';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

interface UniversalFileDropzoneProps {
  files: ProcessedPDF[];
  onFilesChange: (files: ProcessedPDF[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  acceptedTypes?: 'all' | 'pdf' | 'image';
}

const validateFile = (file: File, acceptedTypes: 'all' | 'pdf' | 'image'): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File "${file.name}" exceeds 500MB limit` };
  }
  
  const isPdf = isPDFFile(file);
  const isImage = isImageFile(file);
  
  if (acceptedTypes === 'pdf' && !isPdf) {
    return { valid: false, error: `File "${file.name}" is not a PDF` };
  }
  
  if (acceptedTypes === 'image' && !isImage) {
    return { valid: false, error: `File "${file.name}" is not an image` };
  }
  
  if (acceptedTypes === 'all' && !isPdf && !isImage) {
    return { valid: false, error: `File "${file.name}" is not a supported format (PDF or image)` };
  }
  
  return { valid: true };
};

export const UniversalFileDropzone = ({
  files,
  onFilesChange,
  multiple = true,
  maxFiles = 10,
  acceptedTypes = 'all',
}: UniversalFileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAcceptString = () => {
    switch (acceptedTypes) {
      case 'pdf':
        return '.pdf,application/pdf';
      case 'image':
        return 'image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.ico,.tiff,.tif,.heic,.heif,.avif';
      default:
        return '.pdf,application/pdf,image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.ico,.tiff,.tif,.heic,.heif,.avif';
    }
  };

  const getDropzoneText = () => {
    switch (acceptedTypes) {
      case 'pdf':
        return { drag: 'Drop your PDFs here', idle: 'Drag & drop PDFs here' };
      case 'image':
        return { drag: 'Drop your images here', idle: 'Drag & drop images here' };
      default:
        return { drag: 'Drop your files here', idle: 'Drag & drop PDFs or images here' };
    }
  };

  const handleFiles = useCallback((fileList: FileList) => {
    setError(null);
    const newFiles: ProcessedPDF[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      if (files.length + newFiles.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        break;
      }
      
      const file = fileList[i];
      const validation = validateFile(file, acceptedTypes);
      
      if (validation.valid) {
        newFiles.push({
          id: generateFileId(),
          name: file.name,
          originalFile: file,
          status: 'pending',
        });
      } else {
        setError(validation.error || 'Invalid file');
      }
    }
    
    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  }, [files, onFilesChange, maxFiles, acceptedTypes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((id: string) => {
    onFilesChange(files.filter(f => f.id !== id));
  }, [files, onFilesChange]);

  const getFileIcon = (file: ProcessedPDF) => {
    if (isImageFile(file.originalFile)) {
      return <Image className="w-5 h-5 text-primary" />;
    }
    return <FileText className="w-5 h-5 text-primary" />;
  };

  const text = getDropzoneText();

  return (
    <div className="space-y-4">
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer',
          'hover:border-primary/50 hover:bg-primary/5',
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-border bg-card/50'
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="file"
          accept={getAcceptString()}
          multiple={multiple}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            animate={{ y: isDragging ? -5 : 0 }}
            className={cn(
              'p-4 rounded-2xl transition-colors',
              isDragging ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            )}
          >
            <Upload className="w-8 h-8" />
          </motion.div>
          
          <div>
            <p className="text-lg font-semibold text-foreground">
              {isDragging ? text.drag : text.idle}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse • Max 500MB per file
            </p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                  file.status === 'error'
                    ? 'bg-destructive/5 border-destructive/20'
                    : file.status === 'success'
                    ? 'bg-success/5 border-success/20'
                    : 'bg-card border-border'
                )}
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  {getFileIcon(file)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.originalFile.size)}
                    {isImageFile(file.originalFile) && ' • Image'}
                    {isPDFFile(file.originalFile) && ' • PDF'}
                  </p>
                </div>

                {file.status === 'processing' && (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
