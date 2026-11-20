
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Image as ImageIcon, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import type { DiagnosisResult } from '@/components/DiagnosisResults';
import { useTranslation } from '@/i18n/useTranslation';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = Number(import.meta.env.VITE_MAX_UPLOAD_BYTES) || 10 * 1024 * 1024;
const MAX_IMAGE_SIZE_LABEL = `${Math.floor(MAX_IMAGE_SIZE / (1024 * 1024))} MB`;

interface ImageUploaderProps {
  onAnalysisComplete?: (results: DiagnosisResult, imageUrl: string) => void;
}

export const ImageUploader = ({ onAnalysisComplete }: ImageUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setFile(null);
      setPreview(null);
      toast.error('Choose a JPG, PNG, or WebP image.');
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE) {
      setFile(null);
      setPreview(null);
      toast.error(`File size exceeds ${MAX_IMAGE_SIZE_LABEL} limit`);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setFile(null);
      setPreview(null);
      toast.error('This image could not be read. Choose another photo.');
    };
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const image = new Image();
      image.onerror = () => {
        setFile(null);
        setPreview(null);
        toast.error('This image is damaged or unreadable. Choose another photo.');
      };
      image.onload = () => {
        if (image.naturalWidth < 64 || image.naturalHeight < 64) {
          setFile(null);
          setPreview(null);
          toast.error('Choose an image at least 64 × 64 pixels.');
          return;
        }
        setFile(selectedFile);
        setPreview(dataUrl);
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(selectedFile);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const clearSelection = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Could not analyze this image.');
      }
      toast[data.demo_mode ? 'warning' : 'success'](
        data.demo_mode ? 'DEMO MODE: this result is not an accurate diagnosis.' : 'Image analyzed. Confirm the result with a local agronomist.'
      );
      
      if (onAnalysisComplete) {
        onAnalysisComplete(data, preview || '');
      } else {
        navigate('/diagnosis', { state: { results: data, imageUrl: preview } });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'The diagnosis service is unavailable.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto glass-panel">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-xl font-medium">{t('diagnosis.uploadTitle')}</h3>
            <p className="text-muted-foreground">
              {t('diagnosis.uploadHint')}
            </p>
          </div>
          
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-6 transition-colors duration-200 ease-in-out relative",
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50 hover:bg-muted/50",
              preview ? "pt-3" : "min-h-[250px] flex flex-col items-center justify-center"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {preview ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium truncate max-w-[70%]">
                    {file?.name}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={clearSelection}
                    aria-label="Remove selected photo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <img 
                  src={preview} 
                  alt="Plant preview" 
                  className="rounded-lg max-h-[300px] mx-auto object-contain"
                />
              </>
            ) : (
              <>
                <div className="mb-4 bg-muted rounded-full p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="mb-2 text-center">
                  <span className="font-medium">Drag & drop</span> your image here or{' '}
                  <button 
                    type="button" 
                    className="text-primary font-medium hover:underline focus:outline-none"
                    onClick={triggerFileInput}
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-center text-muted-foreground">
                  Supported formats: JPG, PNG, WebP (max {MAX_IMAGE_SIZE_LABEL})
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
              aria-label="Take or choose a plant photo"
            />
          </div>
          
          <div className="flex justify-center mt-4 space-x-3">
            {!preview ? (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="gap-2"
                  onClick={triggerFileInput}
                >
                  <ImageIcon className="h-4 w-4" />
                  Select File
                </Button>
                <Button 
                  type="button" 
                  className="gap-2"
                  onClick={() => {
                    cameraInputRef.current?.click();
                  }}
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
              </>
            ) : (
              <Button
                type="button"
                className="gap-2 min-w-[120px]"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {t('diagnosis.analyze')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUploader;
