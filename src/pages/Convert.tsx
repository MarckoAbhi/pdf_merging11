import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileOutput, ShieldCheck, Image, FileText, Upload, ArrowRightLeft } from 'lucide-react';
import JSZip from 'jszip';
import { Layout } from '@/components/layout/Layout';
import { FileDropzone } from '@/components/pdf/FileDropzone';
import { ProcessingStatus } from '@/components/pdf/ProcessingStatus';
import { Button } from '@/components/ui/button';
import { ProcessedPDF, downloadBlob, getPDFInfo, convertPDFToImages, convertImagesToPDF, generateFileId } from '@/lib/pdf-utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageFile {
  id: string;
  name: string;
  file: File;
  preview: string;
}

const Convert = () => {
  const [conversionMode, setConversionMode] = useState<'pdf-to-image' | 'image-to-pdf'>('pdf-to-image');
  
  // PDF to Image state
  const [pdfFiles, setPdfFiles] = useState<ProcessedPDF[]>([]);
  const [outputFormat, setOutputFormat] = useState('png');
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [isPdfComplete, setIsPdfComplete] = useState(false);
  const [convertedImages, setConvertedImages] = useState<{ name: string; blob: Blob }[]>([]);
  
  // Image to PDF state
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [isImageComplete, setIsImageComplete] = useState(false);
  const [convertedPdf, setConvertedPdf] = useState<Blob | null>(null);
  
  const { toast } = useToast();

  // PDF to Image conversion
  const handlePdfToImage = useCallback(async () => {
    if (pdfFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please upload at least one PDF file.',
        variant: 'destructive',
      });
      return;
    }

    setIsPdfProcessing(true);
    setIsPdfComplete(false);
    setConvertedImages([]);

    const updatedFiles = [...pdfFiles];
    const allImages: { name: string; blob: Blob }[] = [];

    for (let i = 0; i < updatedFiles.length; i++) {
      updatedFiles[i] = { ...updatedFiles[i], status: 'processing' };
      setPdfFiles([...updatedFiles]);

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

      setPdfFiles([...updatedFiles]);
    }

    setConvertedImages(allImages);
    setIsPdfProcessing(false);
    setIsPdfComplete(true);

    const successCount = updatedFiles.filter((f) => f.status === 'success').length;
    if (successCount > 0) {
      toast({
        title: 'Conversion complete',
        description: `Successfully converted ${successCount} file${successCount > 1 ? 's' : ''} to ${allImages.length} images.`,
      });
    }
  }, [pdfFiles, outputFormat, toast]);

  // Image to PDF conversion
  const handleImageToPdf = useCallback(async () => {
    if (imageFiles.length === 0) {
      toast({
        title: 'No images selected',
        description: 'Please upload at least one image.',
        variant: 'destructive',
      });
      return;
    }

    setIsImageProcessing(true);
    setIsImageComplete(false);

    try {
      const files = imageFiles.map(img => img.file);
      const pdfBlob = await convertImagesToPDF(files);
      setConvertedPdf(pdfBlob);
      setIsImageComplete(true);
      
      toast({
        title: 'Conversion complete',
        description: `Successfully converted ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} to PDF.`,
      });
    } catch (error) {
      toast({
        title: 'Conversion failed',
        description: error instanceof Error ? error.message : 'Failed to convert images',
        variant: 'destructive',
      });
    }

    setIsImageProcessing(false);
  }, [imageFiles, toast]);

  const handleDownloadAll = useCallback(async () => {
    if (convertedImages.length === 0) return;

    const zip = new JSZip();
    
    for (const image of convertedImages) {
      zip.file(image.name, image.blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `converted_images_${outputFormat}.zip`);
  }, [convertedImages, outputFormat]);

  const handleDownloadPdf = useCallback(() => {
    if (!convertedPdf) return;
    downloadBlob(convertedPdf, 'images_combined.pdf');
  }, [convertedPdf]);

  const handlePdfReset = useCallback(() => {
    setPdfFiles([]);
    setOutputFormat('png');
    setIsPdfComplete(false);
    setConvertedImages([]);
  }, []);

  const handleImageReset = useCallback(() => {
    imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
    setImageFiles([]);
    setIsImageComplete(false);
    setConvertedPdf(null);
  }, [imageFiles]);

  const handleImageDrop = useCallback((acceptedFiles: File[]) => {
    const validImages = acceptedFiles.filter(file => 
      file.type.startsWith('image/')
    );

    const newImages: ImageFile[] = validImages.map(file => ({
      id: generateFileId(),
      name: file.name,
      file,
      preview: URL.createObjectURL(file),
    }));

    setImageFiles(prev => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImageFiles(prev => {
      const toRemove = prev.find(img => img.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.preview);
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const canConvertPdf = pdfFiles.length > 0 && !isPdfProcessing;
  const canConvertImage = imageFiles.length > 0 && !isImageProcessing;

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
              <ArrowRightLeft className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Convert Files
            </h1>
            <p className="text-muted-foreground">
              Convert between PDF and image formats
            </p>
          </motion.div>

          <Tabs value={conversionMode} onValueChange={(v) => setConversionMode(v as 'pdf-to-image' | 'image-to-pdf')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="pdf-to-image" className="gap-2">
                <FileText className="w-4 h-4" />
                PDF to Image
              </TabsTrigger>
              <TabsTrigger value="image-to-pdf" className="gap-2">
                <Image className="w-4 h-4" />
                Image to PDF
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdf-to-image">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                {!isPdfComplete ? (
                  <>
                    <div className="p-6 rounded-2xl bg-card border border-border">
                      <h2 className="font-semibold text-foreground mb-4">1. Upload PDFs</h2>
                      <FileDropzone files={pdfFiles} onFilesChange={setPdfFiles} />
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
                      onClick={handlePdfToImage}
                      disabled={!canConvertPdf}
                      className="w-full h-14 text-lg gap-2 gradient-primary text-primary-foreground shadow-glow"
                    >
                      {isPdfProcessing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <FileOutput className="w-5 h-5" />
                          Convert {pdfFiles.length > 0 ? `${pdfFiles.length} PDF${pdfFiles.length > 1 ? 's' : ''}` : 'PDFs'}
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
                      onClick={handlePdfReset}
                      variant="outline"
                      className="w-full h-12"
                    >
                      Convert More PDFs
                    </Button>
                  </>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="image-to-pdf">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                {!isImageComplete ? (
                  <>
                    <div className="p-6 rounded-2xl bg-card border border-border">
                      <h2 className="font-semibold text-foreground mb-4">1. Upload Images</h2>
                      <div
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = Array.from(e.dataTransfer.files);
                          handleImageDrop(files);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => document.getElementById('image-input')?.click()}
                        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                      >
                        <input
                          id="image-input"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleImageDrop(Array.from(e.target.files));
                            }
                          }}
                        />
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-foreground font-medium mb-1">
                          Drop images here or click to browse
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports JPG, PNG, GIF, WebP, and more
                        </p>
                      </div>

                      {imageFiles.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {imageFiles.map((img) => (
                            <div key={img.id} className="relative group">
                              <img
                                src={img.preview}
                                alt={img.name}
                                className="w-full h-24 object-cover rounded-lg border border-border"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(img.id);
                                }}
                                className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <p className="text-xs text-muted-foreground truncate mt-1">{img.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">Original Quality Preserved</p>
                        <p className="text-muted-foreground">
                          Images are embedded at their original resolution. Each image becomes one PDF page.
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleImageToPdf}
                      disabled={!canConvertImage}
                      className="w-full h-14 text-lg gap-2 gradient-primary text-primary-foreground shadow-glow"
                    >
                      {isImageProcessing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          Convert {imageFiles.length > 0 ? `${imageFiles.length} Image${imageFiles.length > 1 ? 's' : ''}` : 'Images'} to PDF
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="p-6 rounded-2xl bg-card border border-border">
                      <h2 className="font-semibold text-foreground mb-4">Download Your PDF</h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success/20">
                              <FileText className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">PDF Created Successfully</p>
                              <p className="text-sm text-muted-foreground">{imageFiles.length} page{imageFiles.length > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={handleDownloadPdf}
                          className="w-full h-12 gap-2 gradient-primary text-primary-foreground"
                        >
                          <FileOutput className="w-5 h-5" />
                          Download PDF
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handleImageReset}
                      variant="outline"
                      className="w-full h-12"
                    >
                      Convert More Images
                    </Button>
                  </>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Convert;