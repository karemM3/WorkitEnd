import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ImageIcon, Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface FileUploadProps {
  onChange: (file: File | null) => void;
  value?: File | string | null;
  accept?: string;
  maxSize?: number; // Size in MB
  className?: string;
  label?: string;
  previewType?: 'image' | 'document';
  error?: string;
  id?: string;
}

export function FileUpload({
  onChange,
  value,
  accept = 'image/*',
  maxSize = 5, // Default 5MB
  className,
  label = 'Upload File',
  previewType = 'image',
  error,
  id
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Set initial preview if value is a string (URL)
  React.useEffect(() => {
    if (typeof value === 'string') {
      setPreview(value);
    } else if (value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    
    const file = e.target.files?.[0] || null;
    if (!file) {
      onChange(null);
      setPreview(null);
      return;
    }
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setFileError(`File size exceeds ${maxSize}MB limit`);
      onChange(null);
      setPreview(null);
      return;
    }
    
    // For image previews
    if (previewType === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (previewType === 'document') {
      // For document, just show the filename
      setPreview(file.name);
    }
    
    onChange(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    onChange(null);
    setPreview(null);
    setFileError(null);
    
    // Reset input value
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      
      <div className="w-full">
        {!preview ? (
          <div 
            onClick={handleClick}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition',
              'bg-background',
              error || fileError ? 'border-destructive' : 'border-muted-foreground/20'
            )}
          >
            <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground/70">
              {accept === 'image/*' ? 'SVG, PNG, JPG or WEBP' : accept.replace(/,/g, ', ')}
              {maxSize && ` (max ${maxSize}MB)`}
            </p>
            <input
              ref={inputRef}
              type="file"
              id={id}
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative">
            {previewType === 'image' && preview.startsWith('data:') ? (
              // Image preview
              <div className="relative w-full aspect-video bg-background rounded-md overflow-hidden border">
                <img 
                  src={preview}
                  alt="File preview" 
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              // Document preview or URL image
              <div className="relative flex items-center p-3 border rounded-md bg-muted/20">
                {previewType === 'image' ? (
                  <ImageIcon className="h-8 w-8 mr-2 text-muted-foreground" />
                ) : (
                  <Upload className="h-8 w-8 mr-2 text-muted-foreground" />
                )}
                <div className="flex-1 truncate text-sm">
                  {typeof preview === 'string' ? 
                    (preview.includes('/') ? preview.split('/').pop() : preview) : 
                    'File selected'
                  }
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-full"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        {(error || fileError) && (
          <p className="text-destructive text-sm mt-1.5">
            {error || fileError}
          </p>
        )}
      </div>
    </div>
  );
}

// Also export as default for compatibility with existing imports
export default FileUpload;