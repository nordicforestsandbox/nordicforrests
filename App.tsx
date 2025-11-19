
import React, { useState, useCallback, useEffect } from 'react';
import { AppStep } from './types';
import FileUpload from './components/FileUpload';
import ImageEditor from './components/ImageEditor';
import DownloadScreen from './components/DownloadScreen';
import { TreeIcon } from './components/Icons';
import Button from './components/Button';
import Spinner from './components/Spinner';

// Fix: Remove conflicting global declaration of Window.aistudio and cast window to any for access.
// This avoids "Subsequent property declarations must have the same type" error.

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

const APIKeyScreen: React.FC<{ onKeySelected: () => void }> = ({ onKeySelected }) => {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
       setIsSelecting(true);
       try {
         await aistudio.openSelectKey();
         // Assume success after the dialog interaction completes
         onKeySelected();
       } catch (e) {
         console.error("Failed to select key", e);
         setIsSelecting(false);
       }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full flex flex-col items-center">
        <TreeIcon className="w-16 h-16 text-brand-primary mb-6" />
        <h1 className="text-2xl font-bold text-brand-dark mb-2">Welcome to NordicForests</h1>
        <p className="text-gray-600 mb-8">
          To start removing objects from images, you need to connect your Google Gemini API key.
        </p>
        <Button onClick={handleSelectKey} size="large" className="w-full mb-4" disabled={isSelecting}>
          {isSelecting ? 'Connecting...' : 'Select API Key'}
        </Button>
        <p className="text-xs text-gray-400 mt-2">
          Need help? <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-brand-primary">View Billing Documentation</a>
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const has = await aistudio.hasSelectedApiKey();
        setHasKey(has);
      } else {
        // If not running in the specific AI Studio environment, 
        // we assume the environment variable is handled externally/locally.
        // We set true to allow the app to render, preventing a blockage for local dev.
        setHasKey(true);
      }
      setCheckingKey(false);
    };
    checkKey();
  }, []);

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

  const handleAuthError = useCallback(() => {
    const aistudio = (window as any).aistudio;
    // Only attempt to reset the key if we are in the environment that supports key selection
    if (aistudio) {
      setHasKey(false);
    }
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
        return <ImageEditor imageFile={originalImage} onComplete={handleProcessingComplete} onAuthError={handleAuthError} />;
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

  if (checkingKey) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Spinner />
        </div>
    );
  }

  if (!hasKey) {
    return <APIKeyScreen onKeySelected={() => setHasKey(true)} />;
  }

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
