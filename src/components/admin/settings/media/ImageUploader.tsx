
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileImage, AlertCircle } from "lucide-react";
import { ImageUpload } from '@/types/settings';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageUploaderProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  upload: ImageUpload | null;
  setUpload: React.Dispatch<React.SetStateAction<ImageUpload | null>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  iconComponent?: React.ReactNode;
  placeholder?: string;
  uploadError?: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUrl,
  setImageUrl,
  upload,
  setUpload,
  fileInputRef,
  handleFileChange,
  iconComponent = <Upload className="h-4 w-4" />,
  placeholder = "URL da imagem (ou faça upload)",
  uploadError = null
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder={placeholder}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <span className="text-sm text-gray-500">ou</span>
          <div>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              {iconComponent}
              <span>Upload</span>
            </Button>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>
      
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
      
      {upload && (
        <div className="mt-2">
          <p className="text-sm text-gray-500 mb-2">Preview:</p>
          <div className="relative h-32 w-full rounded overflow-hidden bg-gray-100">
            <img
              src={upload.previewUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
