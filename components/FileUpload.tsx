
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onImageUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null) => {
    if (file && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      onImageUpload(file);
    } else {
      alert('Please upload a valid image file (PNG, JPG, WebP).');
    }
  }, [onImageUpload]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`w-full max-w-lg p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors duration-300 ${
          isDragging ? 'border-brand-primary bg-brand-light' : 'border-gray-300 bg-gray-50 hover:border-brand-secondary'
        }`}
      >
        <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center space-y-4 text-gray-500">
            <UploadIcon className={`w-12 h-12 transition-colors duration-300 ${isDragging ? 'text-brand-primary' : 'text-gray-400'}`} />
            <p className="font-semibold">
                <span className="text-brand-secondary">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm">PNG, JPG, or WebP</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
