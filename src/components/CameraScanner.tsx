import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Zap, ZapOff, Search, Barcode as BarcodeIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { playBeep } from '../services/audio';

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  isPaused?: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, isPaused = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [isScanningActive, setIsScanningActive] = useState<boolean>(false);
  const [scannerEngine, setScannerEngine] = useState<'barcode_detector' | 'html5_qrcode' | 'unsupported'>('barcode_detector');
  const [scanCooldown, setScanCooldown] = useState<boolean>(false);
  const [lastScannedDisplay, setLastScannedDisplay] = useState<string | null>(null);

  // Animation frame ref for BarcodeDetector continuous scanning
  const animationFrameId = useRef<number | null>(null);
  const barcodeDetectorInstance = useRef<any>(null);

  // Check BarcodeDetector availability
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      setScannerEngine('barcode_detector');
      try {
        const BD = (window as any).BarcodeDetector;
        barcodeDetectorInstance.current = new BD({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
      } catch {
        setScannerEngine('html5_qrcode');
      }
    } else {
      setScannerEngine('html5_qrcode');
    }
  }, []);

  const handleDetectedCode = useCallback((code: string) => {
    if (scanCooldown || isPaused) return;
    const clean = code.trim();
    if (!clean) return;

    // Trigger cooldown to prevent accidental burst re-scans
    setScanCooldown(true);
    setLastScannedDisplay(clean);
    playBeep();
    onScan(clean);

    setTimeout(() => {
      setScanCooldown(false);
      setLastScannedDisplay(null);
    }, 1200);
  }, [scanCooldown, isPaused, onScan]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Accès caméra non supporté par ce navigateur ou bloqué par le protocole (nécessite HTTPS).');
      }

      // Request back camera (environment)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities ? (videoTrack.getCapabilities() as any) : {};
        if (capabilities.torch) {
          setHasTorch(true);
        }
      }

      // Start detection loop
      startScanningLoop();
    } catch (err: any) {
      console.warn('Camera start error:', err);
      let msg = 'Impossible d\'activer la caméra.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permission caméra refusée. Autorisez la caméra dans les réglages de Chrome/Android.';
      } else if (err.name === 'NotFoundError') {
        msg = 'Aucune caméra détectée sur cet appareil.';
      } else if (err.message) {
        msg = err.message;
      }
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
    setHasTorch(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    try {
      const nextState = !torchOn;
      await (videoTrack as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch {
      // Torch failed or unsupported
    }
  };

  // Continuous frame loop with BarcodeDetector or canvas fallback
  const startScanningLoop = () => {
    setIsScanningActive(true);

    const scanFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !cameraActive) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
        return;
      }

      // Native BarcodeDetector (fastest on Android Chrome)
      if (barcodeDetectorInstance.current && !scanCooldown && !isPaused) {
        try {
          const barcodes = await barcodeDetectorInstance.current.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            if (raw) {
              handleDetectedCode(raw);
            }
          }
        } catch {
          // Frame drop, ignore
        }
      }

      animationFrameId.current = requestAnimationFrame(scanFrame);
    };

    animationFrameId.current = requestAnimationFrame(scanFrame);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDetectedCode(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
      {/* Top Camera Controls Header */}
      <div className="p-2.5 px-3 bg-slate-850 border-b border-slate-700/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {cameraActive ? 'Scanner Caméra Actif' : 'Scanner Caméra en veille'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {cameraActive && hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2 rounded-xl text-xs font-medium transition ${
                torchOn ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Lampe torche"
            >
              {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={cameraActive ? stopCamera : startCamera}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
              cameraActive
                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-900/30'
            }`}
          >
            {cameraActive ? (
              <>
                <CameraOff className="w-3.5 h-3.5" />
                <span>Pause Cam</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Activer Caméra</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Video Viewport / Viewfinder */}
      {cameraActive ? (
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-black overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Aiming Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={`w-3/4 max-w-[280px] h-28 sm:h-32 border-2 rounded-xl transition-all duration-200 relative flex items-center justify-center ${
              scanCooldown ? 'border-emerald-400 bg-emerald-500/20 scale-105' : 'border-emerald-500/70'
            }`}>
              {/* Corner markers */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br" />

              {/* Red laser animation line */}
              <div className={`w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] ${scanCooldown ? 'hidden' : 'animate-pulse'}`} />

              <span className="absolute -bottom-6 text-[10px] uppercase font-bold tracking-widest text-emerald-300 drop-shadow-md">
                {scanCooldown ? 'Code Détecté !' : 'Viser le code-barres'}
              </span>
            </div>
          </div>

          {lastScannedDisplay && (
            <div className="absolute top-2 inset-x-4 bg-emerald-600/90 text-white font-mono text-xs px-3 py-1.5 rounded-lg text-center font-bold tracking-wider backdrop-blur-sm border border-emerald-400 shadow-lg">
              ✓ Scanné : {lastScannedDisplay}
            </div>
          )}
        </div>
      ) : (
        /* Camera Off Banner */
        <div className="p-3 bg-slate-900/60 border-b border-slate-700/60">
          {cameraError ? (
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div className="flex-1">
                <p className="font-semibold">{cameraError}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Utilisez la saisie manuelle ci-dessous pour entrer le code-barres au clavier.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-slate-400 text-xs">
              <p className="font-medium text-slate-300">Caméra désactivée pour économiser la batterie du téléphone.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Appuyez sur <span className="text-emerald-400 font-semibold">« Activer Caméra »</span> ou tapez le code ci-dessous.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Input Bar - Guaranteed alternative when camera fails */}
      <div className="p-2.5 bg-slate-800">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <BarcodeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              inputMode="numeric"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Code-barres manuel (ex: 6111...)"
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 font-mono tracking-wide outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs rounded-xl shadow-md transition active:scale-95 shrink-0"
          >
            Valider
          </button>
        </form>

        {/* Quick Simulation Barcodes for easy cashier testing */}
        <div className="mt-2 pt-2 border-t border-slate-750 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">Tests rapides :</span>
          <button
            type="button"
            onClick={() => handleDetectedCode('6111242100125')}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-emerald-300 rounded-lg text-[11px] font-mono whitespace-nowrap"
          >
            Lait Danone (4 DH)
          </button>
          <button
            type="button"
            onClick={() => handleDetectedCode('6111015001017')}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-emerald-300 rounded-lg text-[11px] font-mono whitespace-nowrap"
          >
            Sidi Ali (6 DH)
          </button>
          <button
            type="button"
            onClick={() => handleDetectedCode('6111054000123')}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-emerald-300 rounded-lg text-[11px] font-mono whitespace-nowrap"
          >
            Huile Lesieur (18 DH)
          </button>
          <button
            type="button"
            onClick={() => handleDetectedCode('6111999888777')}
            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-mono whitespace-nowrap border border-amber-500/30"
          >
            Inconnu (? DH)
          </button>
        </div>
      </div>
    </div>
  );
};
