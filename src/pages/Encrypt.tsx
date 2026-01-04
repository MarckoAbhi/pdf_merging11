import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, AlertTriangle, FileText, Image } from 'lucide-react';
import JSZip from 'jszip';
import { Layout } from '@/components/layout/Layout';
import { UniversalFileDropzone } from '@/components/pdf/UniversalFileDropzone';
import { PasswordInput } from '@/components/pdf/PasswordInput';
import { Button } from '@/components/ui/button';
import { ProcessedPDF, downloadBlob, encryptPDF } from '@/lib/pdf-utils';
import { encryptFile, isPDFFile, isImageFile, getEncryptedFileName } from '@/lib/crypto-utils';
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
        description: 'Please enter a password to encrypt your files.',
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
        description: 'Please upload at least one file.',
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
        const file = updatedFiles[i].originalFile;
        let encryptedBlob: Blob;
        let encryptedName: string;

        if (isPDFFile(file)) {
          // Use QPDF for PDF encryption (native password protection)
          encryptedBlob = await encryptPDF(file, password);
          encryptedName = file.name;
        } else if (isImageFile(file)) {
          // Use AES-256-GCM for image encryption
          encryptedBlob = await encryptFile(file, password);
          encryptedName = getEncryptedFileName(file.name, 'image');
        } else {
          throw new Error('Unsupported file type');
        }

        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'success',
          processedBlob: encryptedBlob,
          name: encryptedName,
        };
      } catch (error) {
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to encrypt file',
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
      downloadBlob(file.processedBlob, file.name);
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const successFiles = files.filter((f) => f.status === 'success' && f.processedBlob);
    
    if (successFiles.length === 0) return;

    if (successFiles.length === 1) {
      handleDownload(successFiles[0]);
      return;
    }

    const zip = new JSZip();
    
    for (const file of successFiles) {
      if (file.processedBlob) {
        zip.file(file.name, file.processedBlob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'encrypted_files.zip');
  }, [files, handleDownload]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setPassword('');
    setConfirmPassword('');
    setIsComplete(false);
  }, []);

  const getFileIcon = (file: ProcessedPDF) => {
    if (isImageFile(file.originalFile)) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const canEncrypt = files.length > 0 && password && password === confirmPassword && !isProcessing;
  const successFiles = files.filter((f) => f.status === 'success');
  const pdfCount = files.filter(f => isPDFFile(f.originalFile)).length;
  const imageCount = files.filter(f => isImageFile(f.originalFile)).length;

  const getButtonText = () => {
    if (files.length === 0) return 'Encrypt Files';
    const parts = [];
    if (pdfCount > 0) parts.push(`${pdfCount} PDF${pdfCount > 1 ? 's' : ''}`);
    if (imageCount > 0) parts.push(`${imageCount} image${imageCount > 1 ? 's' : ''}`);
    return `Encrypt ${parts.join(' & ')}`;
  };

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
              Encrypt Files
            </h1>
            <p className="text-muted-foreground">
              Protect your PDFs and images with password encryption
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
                  <h2 className="font-semibold text-foreground mb-4">1. Upload Files</h2>
                  <UniversalFileDropzone 
                    files={files} 
                    onFilesChange={setFiles}
                    acceptedTypes="all"
                  />
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
                    <p className="font-medium text-foreground">Secure Encryption</p>
                    <p className="text-muted-foreground">
                      PDFs use native password protection. Images are encrypted with AES-256-GCM.
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
                      {getButtonText()}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="font-semibold text-foreground mb-4">Download Encrypted Files</h2>
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center justify-between p-4 rounded-xl border ${
                          file.status === 'success'
                            ? 'bg-success/5 border-success/20'
                            : 'bg-destructive/5 border-destructive/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {getFileIcon(file)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {file.status === 'success' ? 'Password protected' : file.error}
                            </p>
                          </div>
                        </div>
                        {file.status === 'success' && (
                          <Button size="sm" onClick={() => handleDownload(file)}>
                            Download
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {successFiles.length > 1 && (
                      <Button
                        onClick={handleDownloadAll}
                        className="w-full h-12 gap-2 gradient-primary text-primary-foreground"
                      >
                        Download All as ZIP
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Remember your password</p>
                    <p className="text-muted-foreground">
                      You'll need the password to access these files. We don't store passwords, so make sure to save it securely.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-12"
                >
                  Encrypt More Files
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