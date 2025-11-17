import React, { useRef, useEffect, useState, useCallback } from 'react';
import { removeObject } from '../services/geminiService';
import { UndoIcon, TrashIcon, RedoIcon } from './Icons';
import Button from './Button';
import Spinner from './Spinner';

interface ImageEditorProps {
  imageFile: File;
  onComplete: (originalImageUrl: string, editedImageUrl: string) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageFile, onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(40);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const drawImage = useCallback(() => {
    const image = new Image();
    image.src = URL.createObjectURL(imageFile);
    image.onload = () => {
      const container = containerRef.current;
      const imageCanvas = imageCanvasRef.current;
      const drawingCanvas = drawingCanvasRef.current;
      if (!container || !imageCanvas || !drawingCanvas) return;

      const maxWidth = container.clientWidth;
      const maxHeight = window.innerHeight * 0.6;

      let { width, height } = image;
      const ratio = width / height;

      if (width > maxWidth) {
        width = maxWidth;
        height = width / ratio;
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }
      
      imageCanvas.width = width;
      imageCanvas.height = height;
      drawingCanvas.width = width;
      drawingCanvas.height = height;

      const imgCtx = imageCanvas.getContext('2d');
      imgCtx?.drawImage(image, 0, 0, width, height);

      const drawCtx = drawingCanvas.getContext('2d');
      if (drawCtx) {
        const initialImageData = drawCtx.getImageData(0, 0, width, height);
        setHistory([initialImageData]);
        setHistoryIndex(0);
      }
    };
  }, [imageFile]);

  useEffect(() => {
    drawImage();
    window.addEventListener('resize', drawImage);
    return () => {
      window.removeEventListener('resize', drawImage);
    };
  }, [drawImage]);

  const saveToHistory = () => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;
    
    const newHistory = history.slice(0, historyIndex + 1);
    const newImageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
    setHistory([...newHistory, newImageData]);
    setHistoryIndex(newHistory.length);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    if (!coords) return;
    
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if(!isDrawing) return;
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
    saveToHistory();
  };
  
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const canvas = drawingCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && history[newIndex]) {
        ctx.putImageData(history[newIndex], 0, 0);
        setHistoryIndex(newIndex);
      }
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const canvas = drawingCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && history[newIndex]) {
        ctx.putImageData(history[newIndex], 0, 0);
        setHistoryIndex(newIndex);
      }
    }
  }, [history, historyIndex]);

  const handleClear = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (history.length > 0 && history[0]) {
      ctx?.putImageData(history[0], 0, 0);
      setHistory([history[0]]);
      setHistoryIndex(0);
      saveToHistory();
    }
  }, [history, saveToHistory]);


  const handleProcessImage = async () => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas || historyIndex === 0) {
      alert("Please select an area to remove first.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const loadImage = (file: File): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image for processing."));
        img.src = URL.createObjectURL(file);
      });
    };

    try {
      const originalImage = await loadImage(imageFile);

      // 1. Create full-resolution original image base64
      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = originalImage.naturalWidth;
      originalCanvas.height = originalImage.naturalHeight;
      const originalCtx = originalCanvas.getContext('2d');
      if (!originalCtx) throw new Error('Could not get original canvas context');
      originalCtx.drawImage(originalImage, 0, 0);
      const mimeType = imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const originalImageBase64 = originalCanvas.toDataURL(mimeType, 1.0);

      // 2. Create full-resolution mask image base64 by scaling the drawing canvas
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = originalImage.naturalWidth;
      maskCanvas.height = originalImage.naturalHeight;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) throw new Error('Could not get mask canvas context');
      
      maskCtx.drawImage(drawingCanvas, 0, 0, maskCanvas.width, maskCanvas.height);
      const maskImageBase64 = maskCanvas.toDataURL('image/png', 1.0); // Mask is always a lossless PNG
      
      const resultBase64 = await removeObject(originalImageBase64, maskImageBase64, mimeType);
      onComplete(URL.createObjectURL(imageFile), resultBase64);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <Spinner />
          <p className="mt-4 text-lg font-medium text-gray-600">Removing object...</p>
          <p className="text-sm text-gray-500">This may take a moment.</p>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="relative w-full max-w-full mx-auto touch-none select-none rounded-lg overflow-hidden shadow-lg" style={{ aspectRatio: `${imageCanvasRef.current?.width || 16}/${imageCanvasRef.current?.height || 9}` }}>
            <canvas ref={imageCanvasRef} className="absolute top-0 left-0 w-full h-full" />
            <canvas
              ref={drawingCanvasRef}
              className="absolute top-0 left-0 w-full h-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div className="w-full flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
             <div className="flex items-center gap-2">
                <label htmlFor="brushSize" className="text-sm font-medium text-gray-700">Brush Size:</label>
                <input
                    id="brushSize"
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-32 cursor-pointer"
                />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleUndo} variant="secondary" disabled={historyIndex <= 0}><UndoIcon className="w-5 h-5" /> Undo</Button>
              <Button onClick={handleRedo} variant="secondary" disabled={historyIndex >= history.length - 1}><RedoIcon className="w-5 h-5" /> Redo</Button>
              <Button onClick={handleClear} variant="secondary" disabled={historyIndex <= 0}><TrashIcon className="w-5 h-5" /> Clear</Button>
            </div>
          </div>
          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
          <div className="w-full mt-8">
            <Button onClick={handleProcessImage} size="large" className="w-full" disabled={historyIndex <= 0}>Remove Object</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ImageEditor;