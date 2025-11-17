
import React, { useState, useCallback } from 'react';
import { AppStep } from './types';
import FileUpload from './components/FileUpload';
import ImageEditor from './components/ImageEditor';
import DownloadScreen from './components/DownloadScreen';
import { TreeIcon } from './components/Icons';

const Header: React.FC = () => (
  <header className="py-6 w-full flex flex-col items-center justify-center text-center">
    <div className="flex items-center gap-3">
      <TreeIcon className="w-10 h-10 text-brand-primary" />
      <h1 className="text-3xl md:text-4xl font-bold text-brand-dark tracking-tight">
        NordicForests
      </h1>
    </div>
    <p className="mt-2 text-md md:text-lg text-gray-600">
      Remove anything from any image—instantly.
    </p>
  </header>
);

const StepIndicator: React.FC<{ currentStep: AppStep }> = ({ currentStep }) => {
  const steps = [
    { id: AppStep.UPLOAD, title: 'Upload' },
    { id: AppStep.EDIT, title: 'Select Object' },
    { id: AppStep.RESULT, title: 'Download' },
  ];

  const getStepClass = (step: AppStep) => {
    if (step === currentStep) {
      return 'bg-brand-primary text-white';
    }
    return 'bg-gray-200 text-gray-500';
  };
  
  const getStepIndex = (step: AppStep) => steps.findIndex(s => s.id === step);

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${getStepClass(step.id)}`}
              >
                {index + 1}
              </div>
              <p className={`mt-2 text-xs md:text-sm font-medium ${currentStep === step.id ? 'text-brand-primary' : 'text-gray-500'}`}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded ${getStepIndex(currentStep) > index ? 'bg-brand-primary' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);

  const handleImageUpload = useCallback((file: File) => {
    setOriginalImage(file);
    setStep(AppStep.EDIT);
  }, []);

  const handleProcessingComplete = useCallback((originalImageUrl: string, editedImageUrl: string) => {
    setEditedImage(editedImageUrl);
    setStep(AppStep.RESULT);
  }, []);

  const handleStartOver = useCallback(() => {
    setOriginalImage(null);
    setEditedImage(null);
    setStep(AppStep.UPLOAD);
  }, []);

  const renderStep = () => {
    switch (step) {
      case AppStep.UPLOAD:
        return <FileUpload onImageUpload={handleImageUpload} />;
      case AppStep.EDIT:
        if (!originalImage) {
            handleStartOver();
            return null;
        }
        return <ImageEditor imageFile={originalImage} onComplete={handleProcessingComplete} />;
      case AppStep.RESULT:
         if (!originalImage || !editedImage) {
            handleStartOver();
            return null;
        }
        return <DownloadScreen originalImage={URL.createObjectURL(originalImage)} editedImage={editedImage} onStartOver={handleStartOver} />;
      default:
        return <FileUpload onImageUpload={handleImageUpload} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col items-center p-4">
      <Header />
      <StepIndicator currentStep={step} />
      <main className="w-full max-w-4xl flex-grow flex flex-col items-center justify-center">
        <div className="w-full bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            {renderStep()}
        </div>
      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} NordicForests. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
