import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, AlertCircle, Image, FileText, Archive, Presentation, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFile, formatFileSize, generateFileId, ProcessedFile } from '@/lib/file-utils';
import { Button } from '@/components/ui/button';

interface GeneralFileDropzoneProps {
  files: ProcessedFile[];
  onFilesChange: (files: ProcessedFile[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  acceptedTypes?: string;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) {
    return Image;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
    return Archive;
  }
  if (['ppt', 'pptx', 'odp'].includes(ext || '')) {
    return Presentation;
  }
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext || '')) {
    return FileSpreadsheet;
  }
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext || '')) {
    return FileText;
  }
  return File;
};

export const GeneralFileDropzone = ({
  files,
  onFilesChange,
  multiple = true,
  maxFiles = 20,
  acceptedTypes,
}: GeneralFileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((fileList: FileList) => {
    setError(null);
    const newFiles: ProcessedFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      if (files.length + newFiles.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        break;
      }
      
      const file = fileList[i];
      const validation = validateFile(file);
      
      if (validation.valid) {
        newFiles.push({
          id: generateFileId(),
          name: file.name,
          originalFile: file,
          status: 'pending',
          type: file.type,
        });
      } else {
        setError(validation.error || 'Invalid file');
      }
    }
    
    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  }, [files, onFilesChange, maxFiles]);

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
          accept={acceptedTypes}
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
              {isDragging ? 'Drop your files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Images, PDFs, Docs, PPT, ZIP, and more • Max 500MB per file
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
            {files.map((file) => {
              const Icon = getFileIcon(file.name);
              return (
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
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.originalFile.size)}
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
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
