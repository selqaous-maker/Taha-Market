import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, KeyRound, AlertCircle } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  title?: string;
  expectedPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  title = 'Code PIN Propriétaire Requis',
  expectedPin,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === expectedPin) {
      onSuccess();
      onClose();
    } else {
      setError('Code PIN incorrect.');
      setPin('');
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin === expectedPin) {
        onSuccess();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 bg-slate-850 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 text-center">
          <p className="text-xs text-slate-400">
            Entrez le code PIN du gérant (par défaut : <span className="text-emerald-400 font-mono font-bold">1234</span>)
          </p>

          {/* Dots representation */}
          <div className="flex justify-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  pin.length > idx
                    ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-sm shadow-emerald-500/50'
                    : 'bg-slate-800 border-slate-700'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="text-xs text-rose-400 font-medium py-1 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1 max-w-[200px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className="w-14 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white text-lg font-bold font-mono flex items-center justify-center mx-auto transition active:scale-95 border border-slate-750"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="w-14 h-12 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center mx-auto transition active:scale-95"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="w-14 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white text-lg font-bold font-mono flex items-center justify-center mx-auto transition active:scale-95 border border-slate-750"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPin(pin.slice(0, -1))}
              className="w-14 h-12 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center mx-auto transition active:scale-95"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
