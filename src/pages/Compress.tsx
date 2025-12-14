import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Minimize2, ShieldCheck, AlertTriangle } from 'lucide-react';
import JSZip from 'jszip';
import { Layout } from '@/components/layout/Layout';
import { FileDropzone } from '@/components/pdf/FileDropzone';
import { ProcessingStatus } from '@/components/pdf/ProcessingStatus';
import { Button } from '@/components/ui/button';
import { ProcessedPDF, downloadBlob, getPDFInfo, compressPDF } from '@/lib/pdf-utils';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const Compress = () => {
  const [files, setFiles] = useState<ProcessedPDF[]>([]);
  const [quality, setQuality] = useState([70]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const handleCompress = useCallback(async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please upload at least one PDF file.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setIsComplete(false);

    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      updatedFiles[i] = { ...updatedFiles[i], status: 'processing' };
      setFiles([...updatedFiles]);

      try {
        const info = await getPDFInfo(updatedFiles[i].originalFile);
        const compressedBlob = await compressPDF(updatedFiles[i].originalFile, quality[0]);

        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'success',
          processedBlob: compressedBlob,
          pageCount: info.pageCount,
        };
      } catch (error) {
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to compress PDF',
        };
      }

      setFiles([...updatedFiles]);
    }

    setIsProcessing(false);
    setIsComplete(true);

    const successCount = updatedFiles.filter((f) => f.status === 'success').length;
    if (successCount > 0) {
      toast({
        title: 'Compression complete',
        description: `Successfully compressed ${successCount} file${successCount > 1 ? 's' : ''}.`,
      });
    }
  }, [files, quality, toast]);

  const handleDownload = useCallback((file: ProcessedPDF) => {
    if (file.processedBlob) {
      const newName = file.name.replace('.pdf', '_compressed.pdf');
      downloadBlob(file.processedBlob, newName);
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const successFiles = files.filter((f) => f.status === 'success' && f.processedBlob);
    
    if (successFiles.length === 0) return;

    const zip = new JSZip();
    
    for (const file of successFiles) {
      if (file.processedBlob) {
        const newName = file.name.replace('.pdf', '_compressed.pdf');
        zip.file(newName, file.processedBlob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'compressed_pdfs.zip');
  }, [files]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setQuality([70]);
    setIsComplete(false);
  }, []);

  const canCompress = files.length > 0 && !isProcessing;

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
              <Minimize2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Compress PDF Files
            </h1>
            <p className="text-muted-foreground">
              Reduce PDF file size while maintaining quality
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {!isComplete ? (
              <>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="font-semibold text-foreground mb-4">1. Upload PDFs</h2>
                  <FileDropzone files={files} onFilesChange={setFiles} />
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="font-semibold text-foreground mb-4">2. Set Compression Quality</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Quality: {quality[0]}%</Label>
                      <span className="text-sm text-muted-foreground">
                        {quality[0] > 80 ? 'High quality' : quality[0] > 50 ? 'Medium quality' : 'Maximum compression'}
                      </span>
                    </div>
                    <Slider
                      value={quality}
                      onValueChange={setQuality}
                      min={20}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower quality = smaller file size. Higher quality = better image clarity.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Smart Compression</p>
                    <p className="text-muted-foreground">
                      Our algorithm optimizes images and removes redundant data while preserving readability.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleCompress}
                  disabled={!canCompress}
                  className="w-full h-14 text-lg gap-2 gradient-primary text-primary-foreground shadow-glow"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Minimize2 className="w-5 h-5" />
                      Compress {files.length > 0 ? `${files.length} PDF${files.length > 1 ? 's' : ''}` : 'PDFs'}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="font-semibold text-foreground mb-4">Download Compressed Files</h2>
                  <ProcessingStatus
                    files={files}
                    onDownload={handleDownload}
                    onDownloadAll={handleDownloadAll}
                    actionLabel="compressed"
                  />
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
                  <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Compression Complete</p>
                    <p className="text-muted-foreground">
                      Your files have been optimized for smaller size.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-12"
                >
                  Compress More PDFs
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Compress;
