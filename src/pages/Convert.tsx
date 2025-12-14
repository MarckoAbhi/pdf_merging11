import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileOutput, ShieldCheck, Image, FileText } from 'lucide-react';
import JSZip from 'jszip';
import { Layout } from '@/components/layout/Layout';
import { FileDropzone } from '@/components/pdf/FileDropzone';
import { ProcessingStatus } from '@/components/pdf/ProcessingStatus';
import { Button } from '@/components/ui/button';
import { ProcessedPDF, downloadBlob, getPDFInfo, convertPDFToImages } from '@/lib/pdf-utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const Convert = () => {
  const [files, setFiles] = useState<ProcessedPDF[]>([]);
  const [outputFormat, setOutputFormat] = useState('png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [convertedImages, setConvertedImages] = useState<{ name: string; blob: Blob }[]>([]);
  const { toast } = useToast();

  const handleConvert = useCallback(async () => {
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
    setConvertedImages([]);

    const updatedFiles = [...files];
    const allImages: { name: string; blob: Blob }[] = [];

    for (let i = 0; i < updatedFiles.length; i++) {
      updatedFiles[i] = { ...updatedFiles[i], status: 'processing' };
      setFiles([...updatedFiles]);

      try {
        const info = await getPDFInfo(updatedFiles[i].originalFile);
        const images = await convertPDFToImages(updatedFiles[i].originalFile, outputFormat as 'png' | 'jpeg');
        
        images.forEach((blob, pageIndex) => {
          const baseName = updatedFiles[i].name.replace('.pdf', '');
          allImages.push({
            name: `${baseName}_page_${pageIndex + 1}.${outputFormat}`,
            blob,
          });
        });

        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'success',
          pageCount: info.pageCount,
        };
      } catch (error) {
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to convert PDF',
        };
      }

      setFiles([...updatedFiles]);
    }

    setConvertedImages(allImages);
    setIsProcessing(false);
    setIsComplete(true);

    const successCount = updatedFiles.filter((f) => f.status === 'success').length;
    if (successCount > 0) {
      toast({
        title: 'Conversion complete',
        description: `Successfully converted ${successCount} file${successCount > 1 ? 's' : ''} to ${allImages.length} images.`,
      });
    }
  }, [files, outputFormat, toast]);

  const handleDownloadAll = useCallback(async () => {
    if (convertedImages.length === 0) return;

    const zip = new JSZip();
    
    for (const image of convertedImages) {
      zip.file(image.name, image.blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `converted_images_${outputFormat}.zip`);
  }, [convertedImages, outputFormat]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setOutputFormat('png');
    setIsComplete(false);
    setConvertedImages([]);
  }, []);

  const canConvert = files.length > 0 && !isProcessing;

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
              <FileOutput className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Convert PDF to Images
            </h1>
            <p className="text-muted-foreground">
              Convert PDF pages to high-quality images
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
                  <h2 className="font-semibold text-foreground mb-4">2. Choose Output Format</h2>
                  <div className="space-y-3">
                    <Label>Image Format</Label>
                    <Select value={outputFormat} onValueChange={setOutputFormat}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">
                          <div className="flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            PNG (Lossless, larger file)
                          </div>
                        </SelectItem>
                        <SelectItem value="jpeg">
                          <div className="flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            JPEG (Compressed, smaller file)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">High Quality Conversion</p>
                    <p className="text-muted-foreground">
                      Each page is converted to a high-resolution image at 2x scale for crisp results.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleConvert}
                  disabled={!canConvert}
                  className="w-full h-14 text-lg gap-2 gradient-primary text-primary-foreground shadow-glow"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <FileOutput className="w-5 h-5" />
                      Convert {files.length > 0 ? `${files.length} PDF${files.length > 1 ? 's' : ''}` : 'PDFs'}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="font-semibold text-foreground mb-4">Download Converted Images</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/20">
                          <Image className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{convertedImages.length} Images Created</p>
                          <p className="text-sm text-muted-foreground">Format: {outputFormat.toUpperCase()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleDownloadAll}
                      className="w-full h-12 gap-2 gradient-primary text-primary-foreground"
                    >
                      <FileOutput className="w-5 h-5" />
                      Download All as ZIP
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-12"
                >
                  Convert More PDFs
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Convert;
