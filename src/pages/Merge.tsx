import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Layers, GripVertical, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { FileDropzone } from '@/components/pdf/FileDropzone';
import { Button } from '@/components/ui/button';
import { ProcessedPDF, mergePDFs, downloadBlob, getPDFInfo, formatFileSize } from '@/lib/pdf-utils';
import { useToast } from '@/hooks/use-toast';

const Merge = () => {
  const [files, setFiles] = useState<ProcessedPDF[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleMerge = useCallback(async () => {
    if (files.length < 2) {
      toast({
        title: 'Not enough files',
        description: 'Please upload at least 2 PDF files to merge.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const originalFiles = files.map((f) => f.originalFile);
      const blob = await mergePDFs(originalFiles);
      setMergedBlob(blob);

      toast({
        title: 'Merge complete',
        description: `Successfully merged ${files.length} PDF files.`,
      });
    } catch (error) {
      toast({
        title: 'Merge failed',
        description: error instanceof Error ? error.message : 'Failed to merge PDFs',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [files, toast]);

  const handleDownload = useCallback(() => {
    if (mergedBlob) {
      downloadBlob(mergedBlob, 'merged.pdf');
    }
  }, [mergedBlob]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setMergedBlob(null);
  }, []);

  const moveFile = useCallback((index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= files.length) return;
    
    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
    setFiles(newFiles);
  }, [files]);

  const removeFile = useCallback((index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  }, [files]);

  const canMerge = files.length >= 2 && !isProcessing;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-primary-foreground mb-4 shadow-glow">
              <Layers className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Merge PDF Files
            </h1>
            <p className="text-muted-foreground">
              Combine multiple PDFs into a single document
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {!mergedBlob ? (
              <>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="font-semibold text-foreground mb-4">1. Upload PDFs</h2>
                  <FileDropzone 
                    files={files} 
                    onFilesChange={setFiles} 
                    multiple 
                    maxFiles={20} 
                  />
                </div>

                {files.length > 0 && (
                  <div className="p-6 rounded-2xl bg-card border border-border">
                    <h2 className="font-semibold text-foreground mb-4">2. Arrange Order</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag to reorder or use the arrows. Files will be merged in this order.
                    </p>
                    
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <motion.div
                          key={file.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border"
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.originalFile.size)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => moveFile(index, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => moveFile(index, 'down')}
                              disabled={index === files.length - 1}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeFile(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleMerge}
                  disabled={!canMerge}
                  className="w-full h-14 text-lg gap-2 gradient-primary text-primary-foreground shadow-glow"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <Layers className="w-5 h-5" />
                      Merge {files.length} PDF{files.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="p-6 rounded-2xl bg-card border border-border text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-4">
                    <Layers className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    PDFs Merged Successfully!
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {files.length} files have been combined into one PDF.
                  </p>
                  <Button
                    onClick={handleDownload}
                    className="h-12 px-8 text-lg gap-2 gradient-primary text-primary-foreground shadow-glow"
                  >
                    Download Merged PDF
                  </Button>
                </div>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-12"
                >
                  Merge More PDFs
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Merge;
