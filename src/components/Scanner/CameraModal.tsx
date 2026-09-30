import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // prefer back camera on phones/tablets
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or upload an image file instead.');
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/50">
          <div className="flex items-center gap-2 text-stone-200 font-semibold">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span>Live Camera Inspection</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-8 text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
              <p className="text-stone-300 text-sm mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
              >
                Retry Camera
              </button>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured specimen" className="w-full h-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Alignment Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-emerald-400/60 rounded-full border-dashed animate-pulse flex items-center justify-center">
                  <div className="w-12 h-12 border-t-2 border-l-2 border-emerald-400 absolute top-4 left-4" />
                  <div className="w-12 h-12 border-t-2 border-r-2 border-emerald-400 absolute top-4 right-4" />
                  <div className="w-12 h-12 border-b-2 border-l-2 border-emerald-400 absolute bottom-4 left-4" />
                  <div className="w-12 h-12 border-b-2 border-r-2 border-emerald-400 absolute bottom-4 right-4" />
                </div>
                <div className="absolute bottom-4 bg-black/60 px-3 py-1 rounded-full text-[11px] text-emerald-300 font-mono backdrop-blur-sm border border-emerald-500/20">
                  Align single produce item inside crosshairs
                </div>
              </div>
            </>
          )}

          {isInitializing && !cameraError && (
            <div className="absolute inset-0 bg-stone-950/80 flex items-center justify-center text-stone-300 text-sm gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
              <span>Initializing camera feed...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-stone-400 hover:text-stone-200 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-stone-800 text-stone-300 hover:bg-stone-700 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Analyze Specimen</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={takeSnapshot}
                disabled={isInitializing || !!cameraError}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg shadow-emerald-600/30 transition"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Snapshot</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
