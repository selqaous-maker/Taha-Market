import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { AlertCircle, Barcode as BarcodeIcon, Camera, CameraOff } from 'lucide-react';
import { playBeep } from '../services/audio';

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  isPaused?: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, isPaused = false }) => {
  const generatedId = useId();
  const readerId = `camera-reader-${generatedId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startingRef = useRef(false);
  const cooldownRef = useRef(false);
  const onScanRef = useRef(onScan);
  const isPausedRef = useRef(isPaused);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanCooldown, setScanCooldown] = useState(false);
  const [lastScannedDisplay, setLastScannedDisplay] = useState<string | null>(null);

  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const handleDetectedCode = useCallback((code: string) => {
    if (cooldownRef.current || isPausedRef.current) return;
    const clean = code.trim();
    if (!clean) return;

    cooldownRef.current = true;
    setScanCooldown(true);
    setLastScannedDisplay(clean);
    playBeep();
    onScanRef.current(clean);

    window.setTimeout(() => {
      cooldownRef.current = false;
      setScanCooldown(false);
      setLastScannedDisplay(null);
    }, 1200);
  }, []);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setCameraActive(false);
    setCameraStarting(false);
    startingRef.current = false;

    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop();
      } catch (error) {
        console.warn('Camera stop error:', error);
      }
      try { scanner.clear(); } catch { /* The reader may already be cleared. */ }
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (startingRef.current || scannerRef.current) return;
    startingRef.current = true;
    setCameraError(null);
    setCameraStarting(true);

    let scanner: Html5Qrcode | null = null;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('La caméra nécessite une connexion HTTPS et un navigateur mobile compatible. Ouvrez le lien dans Chrome.');
      }

      scanner = new Html5Qrcode(readerId, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 110 }, aspectRatio: 16 / 9 },
        (decodedText) => handleDetectedCode(decodedText),
        () => { /* No barcode in this frame; keep scanning. */ },
      );

      setCameraActive(true);
    } catch (error) {
      console.warn('Camera start error:', error);
      if (scanner) {
        try { if (scanner.isScanning) await scanner.stop(); } catch { /* Ignore failed startup cleanup. */ }
        try { scanner.clear(); } catch { /* The reader may already be cleared. */ }
      }
      scannerRef.current = null;

      const name = (error as DOMException)?.name;
      let message = (error as Error)?.message || 'ما قدرناش نشغلو الكاميرا.';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        message = 'خاصك تسمح للمتصفح باستعمال الكاميرا من إعدادات الهاتف.';
      } else if (name === 'NotFoundError') {
        message = 'ما تلقات حتى كاميرا فهاد الجهاز.';
      } else if (name === 'NotReadableError') {
        message = 'الكاميرا مستعملة من تطبيق آخر. سدّو وجرب مرة أخرى.';
      }
      setCameraError(message);
    } finally {
      startingRef.current = false;
      setCameraStarting(false);
    }
  }, [handleDetectedCode, readerId]);

  useEffect(() => () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    if (scanner.isScanning) void scanner.stop().catch(() => undefined);
  }, []);

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualCode.trim()) return;
    handleDetectedCode(manualCode);
    setManualCode('');
  };

  const cameraVisible = cameraActive || cameraStarting;

  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
      <div className="p-2.5 px-3 bg-slate-850 border-b border-slate-700/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {cameraStarting ? 'Démarrage caméra…' : cameraActive ? 'Scanner caméra actif' : 'Scanner caméra en veille'}
          </span>
        </div>

        <button
          type="button"
          disabled={cameraStarting}
          onClick={() => cameraActive ? void stopCamera() : void startCamera()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-60 ${
            cameraActive
              ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-900/30'
          }`}
        >
          {cameraActive ? <><CameraOff className="w-3.5 h-3.5" /><span>Arrêter</span></> : <><Camera className="w-3.5 h-3.5" /><span>{cameraStarting ? 'Démarrage…' : 'Activer caméra'}</span></>}
        </button>
      </div>

      {cameraVisible ? (
        <div className="relative w-full bg-black overflow-hidden">
          <div id={readerId} className="w-full min-h-[220px] [&_video]:w-full [&_video]:max-h-[360px] [&_video]:object-cover" />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={`w-3/4 max-w-[280px] h-28 border-2 rounded-xl relative flex items-center justify-center ${scanCooldown ? 'border-emerald-400 bg-emerald-500/20' : 'border-emerald-500/70'}`}>
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br" />
              <div className={`w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] ${scanCooldown ? 'hidden' : 'animate-pulse'}`} />
              <span className="absolute -bottom-6 text-[10px] uppercase font-bold tracking-widest text-emerald-300 drop-shadow-md">
                {scanCooldown ? 'Code détecté !' : 'Viser le code-barres'}
              </span>
            </div>
          </div>
          {lastScannedDisplay && <div className="absolute top-2 inset-x-4 bg-emerald-600/90 text-white font-mono text-xs px-3 py-1.5 rounded-lg text-center font-bold tracking-wider">✓ Scanné : {lastScannedDisplay}</div>}
        </div>
      ) : (
        <div className="p-3 bg-slate-900/60 border-b border-slate-700/60">
          {cameraError ? (
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div className="flex-1">
                <p className="font-semibold">{cameraError}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">سمح بالكاميرا من إعدادات Chrome ورجع جرّب. تقدر تدخل الباركود يدوياً كذلك.</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-slate-400 text-xs">
              <p className="font-medium text-slate-300">الكاميرا مطفّية باش تحافظ على البطارية.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">اضغط «Activer caméra» أو دخل الباركود يدوياً.</p>
            </div>
          )}
        </div>
      )}

      <div className="p-2.5 bg-slate-800">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <BarcodeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              inputMode="numeric"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="Code-barres manuel (ex: 6111...)"
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 font-mono tracking-wide outline-none"
            />
          </div>
          <button type="submit" disabled={!manualCode.trim()} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs rounded-xl shadow-md transition active:scale-95 shrink-0">Valider</button>
        </form>

        <div className="mt-2 pt-2 border-t border-slate-750 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">Tests rapides :</span>
          <button type="button" onClick={() => handleDetectedCode('6111242100125')} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-emerald-300 rounded-lg text-[11px] font-mono whitespace-nowrap">Lait Danone (4 DH)</button>
          <button type="button" onClick={() => handleDetectedCode('6111015001017')} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-emerald-300 rounded-lg text-[11px] font-mono whitespace-nowrap">Sidi Ali (6 DH)</button>
          <button type="button" onClick={() => handleDetectedCode('6111054000123')} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-emerald-300 rounded-lg text-[11px] font-mono whitespace-nowrap">Huile Lesieur (18 DH)</button>
          <button type="button" onClick={() => handleDetectedCode('6111999888777')} className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-mono whitespace-nowrap border border-amber-500/30">Inconnu (? DH)</button>
        </div>
      </div>
    </div>
  );
};
