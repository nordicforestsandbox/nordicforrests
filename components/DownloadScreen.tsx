
import React from 'react';
import Button from './Button';
import { DownloadIcon } from './Icons';

interface DownloadScreenProps {
  originalImage: string;
  editedImage: string;
  onStartOver: () => void;
}

const DownloadScreen: React.FC<DownloadScreenProps> = ({ originalImage, editedImage, onStartOver }) => {

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = 'edited-image-nordicforests.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center w-full animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Image is Ready!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 w-full">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2 text-gray-600">Before</h3>
          <img src={originalImage} alt="Original" className="rounded-lg shadow-md max-h-80 object-contain" />
        </div>
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2 text-gray-600">After</h3>
          <img src={editedImage} alt="Edited" className="rounded-lg shadow-md max-h-80 object-contain" />
        </div>
      </div>
      <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button onClick={handleDownload} size="large" className="w-full">
            <DownloadIcon className="w-5 h-5 mr-2"/>
            Download Image
        </Button>
        <Button onClick={onStartOver} variant="secondary" size="large" className="w-full">
            Start Over
        </Button>
      </div>
    </div>
  );
};

export default DownloadScreen;
