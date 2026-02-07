import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Download, RotateCcw, Link2, Link2Off, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UnitType = 'pixels' | 'percent' | 'centimeters' | 'inches';

const Resize = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [quality, setQuality] = useState(90);
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [unit, setUnit] = useState<UnitType>('pixels');
  const [dpi, setDpi] = useState(72);
  const [backgroundColor, setBackgroundColor] = useState<'transparent' | 'white' | 'black'>('transparent');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Convert pixels to other units
  const pixelsToUnit = useCallback((pixels: number, targetUnit: UnitType): number => {
    switch (targetUnit) {
      case 'pixels': return pixels;
      case 'percent': return originalWidth > 0 ? Math.round((pixels / originalWidth) * 100) : 100;
      case 'centimeters': return Math.round((pixels / dpi) * 2.54 * 100) / 100;
      case 'inches': return Math.round((pixels / dpi) * 100) / 100;
      default: return pixels;
    }
  }, [dpi, originalWidth]);

  // Convert units back to pixels
  const unitToPixels = useCallback((value: number, sourceUnit: UnitType): number => {
    switch (sourceUnit) {
      case 'pixels': return Math.round(value);
      case 'percent': return Math.round((value / 100) * originalWidth);
      case 'centimeters': return Math.round((value / 2.54) * dpi);
      case 'inches': return Math.round(value * dpi);
      default: return Math.round(value);
    }
  }, [dpi, originalWidth]);

  // Get display values based on current unit
  const displayWidth = pixelsToUnit(width, unit);
  const displayHeight = pixelsToUnit(height, unit);

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setWidth(img.width);
        setHeight(img.height);
        setAspectRatio(img.width / img.height);
        setImagePreview(e.target?.result as string);
        setResizedImage(null);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    setImageFile(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const handleWidthChange = useCallback((newDisplayWidth: number) => {
    const newPixelWidth = unitToPixels(newDisplayWidth, unit);
    setWidth(newPixelWidth);
    if (maintainAspectRatio && aspectRatio) {
      setHeight(Math.round(newPixelWidth / aspectRatio));
    }
  }, [maintainAspectRatio, aspectRatio, unit, unitToPixels]);

  const handleHeightChange = useCallback((newDisplayHeight: number) => {
    const newPixelHeight = unitToPixels(newDisplayHeight, unit);
    setHeight(newPixelHeight);
    if (maintainAspectRatio && aspectRatio) {
      setWidth(Math.round(newPixelHeight * aspectRatio));
    }
  }, [maintainAspectRatio, aspectRatio, unit, unitToPixels]);

  const handleScaleChange = useCallback((scale: number) => {
    const newWidth = Math.round(originalWidth * (scale / 100));
    const newHeight = Math.round(originalHeight * (scale / 100));
    setWidth(newWidth);
    setHeight(newHeight);
  }, [originalWidth, originalHeight]);

  const currentScale = originalWidth > 0 ? Math.round((width / originalWidth) * 100) : 100;

  const handleResize = useCallback(async () => {
    if (!imagePreview || !canvasRef.current) return;

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = width;
      canvas.height = height;

      const img = new Image();
      img.src = imagePreview;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Fill background if not transparent
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = `image/${outputFormat}`;
      const qualityValue = outputFormat === 'png' ? undefined : quality / 100;
      
      const dataUrl = canvas.toDataURL(mimeType, qualityValue);
      setResizedImage(dataUrl);

      toast({
        title: 'Image resized',
        description: `Resized to ${width}x${height}px`,
      });
    } catch (error) {
      toast({
        title: 'Resize failed',
        description: error instanceof Error ? error.message : 'Failed to resize image',
        variant: 'destructive',
      });
    }

    setIsProcessing(false);
  }, [imagePreview, width, height, outputFormat, quality, backgroundColor, toast]);

  const handleDownload = useCallback(() => {
    if (!resizedImage || !imageFile) return;

    const link = document.createElement('a');
    const baseName = imageFile.name.replace(/\.[^/.]+$/, '');
    link.download = `${baseName}_${width}x${height}.${outputFormat}`;
    link.href = resizedImage;
    link.click();
  }, [resizedImage, imageFile, width, height, outputFormat]);

  const handleReset = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setResizedImage(null);
    setWidth(0);
    setHeight(0);
    setOriginalWidth(0);
    setOriginalHeight(0);
  }, []);

  const presetSizes = [
    { label: 'HD (1280×720)', width: 1280, height: 720 },
    { label: 'Full HD (1920×1080)', width: 1920, height: 1080 },
    { label: '4K (3840×2160)', width: 3840, height: 2160 },
    { label: 'Instagram Post (1080×1080)', width: 1080, height: 1080 },
    { label: 'Instagram Story (1080×1920)', width: 1080, height: 1920 },
    { label: 'Facebook Cover (820×312)', width: 820, height: 312 },
    { label: 'Twitter Header (1500×500)', width: 1500, height: 500 },
    { label: 'YouTube Thumbnail (1280×720)', width: 1280, height: 720 },
  ];

  const applyPreset = useCallback((presetWidth: number, presetHeight: number) => {
    setWidth(presetWidth);
    setHeight(presetHeight);
    setMaintainAspectRatio(false);
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-primary-foreground mb-4 shadow-glow">
              <Maximize2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Image Resizer
            </h1>
            <p className="text-muted-foreground">
              Resize images to any dimension with quality control
            </p>
          </motion.div>

          <canvas ref={canvasRef} className="hidden" />

          {!imagePreview ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('image-resize-input')?.click()}
                className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <input
                  id="image-resize-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground font-semibold text-lg mb-2">
                  Drop an image here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports JPG, PNG, WebP, GIF and more
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Image Preview */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h2 className="font-semibold text-foreground mb-4">Preview</h2>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={resizedImage || imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="mt-3 text-sm text-muted-foreground text-center">
                  Original: {originalWidth} × {originalHeight}px
                  {resizedImage && ` → New: ${width} × ${height}px`}
                </div>
              </div>

              {/* Resize Controls */}
              <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
                <h2 className="font-semibold text-foreground">Resize Settings</h2>

                {/* Preset Sizes */}
                <div className="space-y-3">
                  <Label>Quick Presets</Label>
                  <Select onValueChange={(value) => {
                    const preset = presetSizes.find(p => `${p.width}x${p.height}` === value);
                    if (preset) applyPreset(preset.width, preset.height);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a preset size..." />
                    </SelectTrigger>
                    <SelectContent>
                      {presetSizes.map((preset) => (
                        <SelectItem key={`${preset.width}x${preset.height}`} value={`${preset.width}x${preset.height}`}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dimensions with Unit Selector */}
                <div className="space-y-4">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="width">Width</Label>
                      <Input
                        id="width"
                        type="number"
                        value={displayWidth}
                        onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)}
                        min={unit === 'percent' ? 1 : 0.01}
                        step={unit === 'pixels' || unit === 'percent' ? 1 : 0.01}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height</Label>
                      <Input
                        id="height"
                        type="number"
                        value={displayHeight}
                        onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0)}
                        min={unit === 'percent' ? 1 : 0.01}
                        step={unit === 'pixels' || unit === 'percent' ? 1 : 0.01}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select value={unit} onValueChange={(v) => setUnit(v as UnitType)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pixels">Pixels</SelectItem>
                          <SelectItem value="percent">Percent</SelectItem>
                          <SelectItem value="centimeters">Centimeters</SelectItem>
                          <SelectItem value="inches">Inches</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Resolution/DPI */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dpi">Resolution</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="dpi"
                          type="number"
                          value={dpi}
                          onChange={(e) => setDpi(parseInt(e.target.value) || 72)}
                          min={1}
                          max={600}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">DPI</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aspect Ratio Lock */}
                <div className="flex items-center gap-3">
                  <Button
                    variant={maintainAspectRatio ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                    className="gap-2"
                  >
                    {maintainAspectRatio ? (
                      <>
                        <Link2 className="w-4 h-4" />
                        Aspect Ratio Locked
                      </>
                    ) : (
                      <>
                        <Link2Off className="w-4 h-4" />
                        Aspect Ratio Unlocked
                      </>
                    )}
                  </Button>
                </div>

                {/* Scale Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Scale</Label>
                    <span className="text-sm text-muted-foreground">{currentScale}%</span>
                  </div>
                  <Slider
                    value={[currentScale]}
                    onValueChange={(values) => handleScaleChange(values[0])}
                    min={1}
                    max={200}
                    step={1}
                  />
                </div>

                {/* Format, Quality, and Background */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Output Format */}
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as 'png' | 'jpeg' | 'webp')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpeg">JPG</SelectItem>
                        <SelectItem value="webp">WebP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quality */}
                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={quality}
                        onChange={(e) => setQuality(Math.min(100, Math.max(1, parseInt(e.target.value) || 90)))}
                        min={1}
                        max={100}
                        className="w-16"
                        disabled={outputFormat === 'png'}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <div className="flex items-center gap-2 h-10">
                      <button
                        type="button"
                        onClick={() => setBackgroundColor('transparent')}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          backgroundColor === 'transparent' 
                            ? 'border-primary ring-2 ring-primary/30' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        style={{
                          background: 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px'
                        }}
                        title="Transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setBackgroundColor('white')}
                        className={`w-8 h-8 rounded-full border-2 bg-white transition-all ${
                          backgroundColor === 'white' 
                            ? 'border-primary ring-2 ring-primary/30' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        title="White"
                      />
                      <button
                        type="button"
                        onClick={() => setBackgroundColor('black')}
                        className={`w-8 h-8 rounded-full border-2 bg-black transition-all ${
                          backgroundColor === 'black' 
                            ? 'border-primary ring-2 ring-primary/30' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        title="Black"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Client-side Processing</p>
                  <p className="text-muted-foreground">
                    Your images are processed entirely in your browser. Nothing is uploaded to any server.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleResize}
                  disabled={isProcessing || width <= 0 || height <= 0}
                  className="flex-1 h-14 text-lg gap-2 gradient-primary text-primary-foreground shadow-glow"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Resizing...
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-5 h-5" />
                      Resize Image
                    </>
                  )}
                </Button>

                {resizedImage && (
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex-1 h-14 text-lg gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </Button>
                )}
              </div>

              <Button
                onClick={handleReset}
                variant="ghost"
                className="w-full gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Upload Different Image
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Resize;
