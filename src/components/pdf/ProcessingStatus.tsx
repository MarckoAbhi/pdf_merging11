import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Download, FileText } from 'lucide-react';
import { ProcessedPDF, formatFileSize, downloadBlob } from '@/lib/pdf-utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProcessingStatusProps {
  files: ProcessedPDF[];
  onDownload: (file: ProcessedPDF) => void;
  onDownloadAll?: () => void;
  actionLabel?: string;
}

export const ProcessingStatus = ({
  files,
  onDownload,
  onDownloadAll,
  actionLabel = 'protected',
}: ProcessingStatusProps) => {
  const successFiles = files.filter((f) => f.status === 'success');
  const hasMultipleSuccess = successFiles.length > 1;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border transition-all',
              file.status === 'success' && 'bg-success/5 border-success/30',
              file.status === 'error' && 'bg-destructive/5 border-destructive/30',
              file.status === 'processing' && 'bg-primary/5 border-primary/30',
              file.status === 'pending' && 'bg-card border-border'
            )}
          >
            <div
              className={cn(
                'p-2 rounded-lg',
                file.status === 'success' && 'bg-success/20',
                file.status === 'error' && 'bg-destructive/20',
                file.status === 'processing' && 'bg-primary/20',
                file.status === 'pending' && 'bg-secondary'
              )}
            >
              {file.status === 'success' && (
                <CheckCircle className="w-5 h-5 text-success" />
              )}
              {file.status === 'error' && (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              {file.status === 'processing' && (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              )}
              {file.status === 'pending' && (
                <FileText className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {file.status === 'success' && `Successfully ${actionLabel}`}
                {file.status === 'error' && (file.error || 'Processing failed')}
                {file.status === 'processing' && 'Processing...'}
                {file.status === 'pending' && formatFileSize(file.originalFile.size)}
              </p>
            </div>

            {file.status === 'success' && file.processedBlob && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => onDownload(file)}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      {hasMultipleSuccess && onDownloadAll && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            onClick={onDownloadAll}
            className="gap-2 gradient-primary text-primary-foreground"
          >
            <Download className="w-4 h-4" />
            Download All as ZIP
          </Button>
        </motion.div>
      )}
    </div>
  );
};
