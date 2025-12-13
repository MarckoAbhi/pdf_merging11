import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import JSZip from 'jszip';
import { Layout } from '@/components/layout/Layout';
import { FileDropzone } from '@/components/pdf/FileDropzone';
import { PasswordInput } from '@/components/pdf/PasswordInput';
import { ProcessingStatus } from '@/components/pdf/ProcessingStatus';
import { Button } from '@/components/ui/button';
import { ProcessedPDF, encryptPDF, downloadBlob, getPDFInfo } from '@/lib/pdf-utils';
import { useToast } from '@/hooks/use-toast';

const Encrypt = () => {
  const [files, setFiles] = useState<ProcessedPDF[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const handleEncrypt = useCallback(async () => {
    if (!password) {
      toast({
        title: 'Password required',
        description: 'Please enter a password to encrypt your PDFs.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
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
        // Get PDF info first
        const info = await getPDFInfo(updatedFiles[i].originalFile);
        
        // Encrypt the PDF
        const encryptedBlob = await encryptPDF(
          updatedFiles[i].originalFile,
          password
        );

        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'success',
          processedBlob: encryptedBlob,
          pageCount: info.pageCount,
        };
      } catch (error) {
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to encrypt PDF',
        };
      }

      setFiles([...updatedFiles]);
    }

    setIsProcessing(false);
    setIsComplete(true);

    const successCount = updatedFiles.filter((f) => f.status === 'success').length;
    if (successCount > 0) {
      toast({
        title: 'Encryption complete',
        description: `Successfully encrypted ${successCount} file${successCount > 1 ? 's' : ''}.`,
      });
    }
  }, [files, password, confirmPassword, toast]);

  const handleDownload = useCallback((file: ProcessedPDF) => {
    if (file.processedBlob) {
      const newName = file.name.replace('.pdf', '_protected.pdf');
      downloadBlob(file.processedBlob, newName);
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const successFiles = files.filter((f) => f.status === 'success' && f.processedBlob);
    
    if (successFiles.length === 0) return;

    const zip = new JSZip();
    
    for (const file of successFiles) {
      if (file.processedBlob) {
        const newName = file.name.replace('.pdf', '_protected.pdf');
        zip.file(newName, file.processedBlob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'protected_pdfs.zip');
  }, [files]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setPassword('');
    setConfirmPassword('');
    setIsComplete(false);
  }, []);

  const canEncrypt = files.length > 0 && password && password === confirmPassword && !isProcessing;

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
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Encrypt PDF Files
            </h1>
            <p className="text-muted-foreground">
              Add password protection to your PDF documents
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
                  <h2 className="font-semibold text-foreground mb-4">2. Set Password</h2>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    label="Encryption Password"
                    placeholder="Enter a strong password"
                    showStrength
                    confirmPassword
                    confirmValue={confirmPassword}
                    onConfirmChange={setConfirmPassword}
                  />
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">AES-256 Encryption</p>
                    <p className="text-muted-foreground">
                      Your PDFs are encrypted with military-grade security. Files are processed securely and never stored.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleEncrypt}
                  disabled={!canEncrypt}
                  className="w-full h-14 text-lg gap-2 gradient-primary text-primary-foreground shadow-glow"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Encrypting...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Encrypt {files.length > 0 ? `${files.length} PDF${files.length > 1 ? 's' : ''}` : 'PDFs'}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="font-semibold text-foreground mb-4">Download Protected Files</h2>
                  <ProcessingStatus
                    files={files}
                    onDownload={handleDownload}
                    onDownloadAll={handleDownloadAll}
                    actionLabel="protected"
                  />
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Remember your password</p>
                    <p className="text-muted-foreground">
                      You'll need the password to open these files. We don't store passwords, so make sure to save it securely.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-12"
                >
                  Encrypt More PDFs
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Encrypt;
