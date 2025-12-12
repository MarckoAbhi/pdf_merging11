import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Unlock, ShieldCheck, KeyRound } from 'lucide-react';
import JSZip from 'jszip';
import { Layout } from '@/components/layout/Layout';
import { FileDropzone } from '@/components/pdf/FileDropzone';
import { PasswordInput } from '@/components/pdf/PasswordInput';
import { ProcessingStatus } from '@/components/pdf/ProcessingStatus';
import { Button } from '@/components/ui/button';
import { ProcessedPDF, decryptPDF, downloadBlob, getPDFInfo } from '@/lib/pdf-utils';
import { useToast } from '@/hooks/use-toast';

const UnlockPage = () => {
  const [files, setFiles] = useState<ProcessedPDF[]>([]);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const handleUnlock = useCallback(async () => {
    if (!password) {
      toast({
        title: 'Password required',
        description: 'Please enter the PDF password.',
        variant: 'destructive',
      });
      return;
    }

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
        // Try to decrypt the PDF
        const decryptedBlob = await decryptPDF(
          updatedFiles[i].originalFile,
          password
        );

        // Get info from decrypted PDF
        const decryptedFile = new File([decryptedBlob], updatedFiles[i].name, { type: 'application/pdf' });
        const info = await getPDFInfo(decryptedFile);

        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'success',
          processedBlob: decryptedBlob,
          pageCount: info.pageCount,
        };
      } catch (error) {
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to unlock PDF',
        };
      }

      setFiles([...updatedFiles]);
    }

    setIsProcessing(false);
    setIsComplete(true);

    const successCount = updatedFiles.filter((f) => f.status === 'success').length;
    if (successCount > 0) {
      toast({
        title: 'Unlock complete',
        description: `Successfully unlocked ${successCount} file${successCount > 1 ? 's' : ''}.`,
      });
    }
  }, [files, password, toast]);

  const handleDownload = useCallback((file: ProcessedPDF) => {
    if (file.processedBlob) {
      const newName = file.name.replace('.pdf', '_unlocked.pdf');
      downloadBlob(file.processedBlob, newName);
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const successFiles = files.filter((f) => f.status === 'success' && f.processedBlob);
    
    if (successFiles.length === 0) return;

    const zip = new JSZip();
    
    for (const file of successFiles) {
      if (file.processedBlob) {
        const newName = file.name.replace('.pdf', '_unlocked.pdf');
        zip.file(newName, file.processedBlob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'unlocked_pdfs.zip');
  }, [files]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setPassword('');
    setIsComplete(false);
  }, []);

  const canUnlock = files.length > 0 && password && !isProcessing;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-accent text-accent-foreground mb-4">
              <Unlock className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Unlock PDF Files
            </h1>
            <p className="text-muted-foreground">
              Remove password protection from your PDF documents
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
                  <h2 className="font-semibold text-foreground mb-4">1. Upload Protected PDFs</h2>
                  <FileDropzone files={files} onFilesChange={setFiles} />
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="font-semibold text-foreground mb-4">2. Enter Password</h2>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    label="PDF Password"
                    placeholder="Enter the current password"
                  />
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Secure & Private</p>
                    <p className="text-muted-foreground">
                      Files are processed locally in your browser. We never see your password or documents.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleUnlock}
                  disabled={!canUnlock}
                  className="w-full h-14 text-lg gap-2 gradient-accent text-accent-foreground"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                      Unlocking...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5" />
                      Unlock {files.length > 0 ? `${files.length} PDF${files.length > 1 ? 's' : ''}` : 'PDFs'}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="font-semibold text-foreground mb-4">Download Unlocked Files</h2>
                  <ProcessingStatus
                    files={files}
                    onDownload={handleDownload}
                    onDownloadAll={handleDownloadAll}
                    actionLabel="unlocked"
                  />
                </div>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-12"
                >
                  Unlock More PDFs
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default UnlockPage;
