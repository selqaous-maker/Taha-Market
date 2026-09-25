import React, { useState, useEffect, useRef } from 'react';
import { X, Banknote, CreditCard, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { CartItem, PaymentMethod, SaleRecord } from '../types';
import { playSuccessChime } from '../services/audio';

interface CheckoutModalProps {
  isOpen: boolean;
  total: number;
  currency: string;
  items: CartItem[];
  onClose: () => void;
  onCompleteSale: (saleData: {
    paymentMethod: PaymentMethod;
    amountReceived: number;
    changeDue: number;
  }) => Promise<SaleRecord>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  total,
  currency,
  items,
  onClose,
  onCompleteSale,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [receivedStr, setReceivedStr] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate taps
  const submitLockRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('CASH');
      setReceivedStr('');
      setError(null);
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const roundedTotal = Math.round(total * 100) / 100;
  const receivedNum = paymentMethod === 'CASH'
    ? parseFloat(receivedStr.replace(',', '.') || '0')
    : roundedTotal;

  const changeDue = Math.max(0, Math.round((receivedNum - roundedTotal) * 100) / 100);
  const isCashSufficient = paymentMethod === 'CARD' || receivedNum >= roundedTotal;
  const missingAmount = Math.max(0, Math.round((roundedTotal - receivedNum) * 100) / 100);

  // Quick cash bill shortcuts in Moroccan Dirhams
  const handleQuickCash = (amount: number) => {
    setReceivedStr(amount.toFixed(2));
    setError(null);
  };

  const handleAddBill = (bill: number) => {
    const current = parseFloat(receivedStr.replace(',', '.') || '0');
    setReceivedStr((current + bill).toFixed(2));
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (submitLockRef.current || isSubmitting) {
      return; // Block duplicate tap
    }

    if (!isCashSufficient) {
      setError(`Montant insuffisant. Il manque ${missingAmount.toFixed(2)} ${currency}.`);
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      await onCompleteSale({
        paymentMethod,
        amountReceived: paymentMethod === 'CARD' ? roundedTotal : receivedNum,
        changeDue: paymentMethod === 'CARD' ? 0 : changeDue,
      });
      playSuccessChime();
      // Cart will be cleared by parent after success
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement de la vente');
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-750 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Règlement & Encaissement</h2>
            <p className="text-xs text-slate-400">
              {items.length} article{items.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Total Display */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 text-center">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Total à payer
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-300 mt-1">
              {roundedTotal.toFixed(2)} <span className="text-lg text-emerald-400 font-bold">{currency}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mode de paiement
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-3 px-3 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition active:scale-98 ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-900/40'
                    : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Espèces (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`py-3 px-3 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition active:scale-98 ${
                  paymentMethod === 'CARD'
                    ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-900/40'
                    : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Carte / TPE</span>
              </button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'CASH' ? (
            <div className="space-y-3 p-3 rounded-2xl bg-slate-850/80 border border-slate-750">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Montant reçu du client (MAD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    autoFocus
                    value={receivedStr}
                    onChange={(e) => {
                      setReceivedStr(e.target.value);
                      setError(null);
                    }}
                    placeholder={roundedTotal.toFixed(2)}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2.5 text-xl font-mono font-bold text-white placeholder-slate-600 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                    {currency}
                  </span>
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div>
                <div className="text-[11px] text-slate-400 font-medium mb-1 flex items-center justify-between">
                  <span>Billets rapides marocains :</span>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(roundedTotal)}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    Montant exact ({roundedTotal.toFixed(2)})
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[20, 50, 100, 200].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => handleQuickCash(bill)}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition active:scale-95 border ${
                        receivedNum === bill
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                          : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {bill} DH
                    </button>
                  ))}
                </div>
              </div>

              {/* Change calculation display */}
              <div className="pt-2 border-t border-slate-750">
                {!isCashSufficient ? (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <div>
                      <span className="font-bold">Montant insuffisant.</span> Il manque{' '}
                      <span className="font-mono font-bold">{missingAmount.toFixed(2)} {currency}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-emerald-400 block">
                        Monnaie à rendre :
                      </span>
                      <span className="text-2xl font-black font-mono text-emerald-300">
                        {changeDue.toFixed(2)} <span className="text-sm font-bold">{currency}</span>
                      </span>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Card Note */
            <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200 space-y-1.5">
              <p className="font-semibold text-sky-100 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-sky-400" />
                Paiement par terminal bancaire (TPE)
              </p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Effectuez le paiement sur le TPE externe du magasin. La vente sera enregistrée sous le mode Carte à des fins comptables sans simuler de transaction bancaire en ligne.
              </p>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-850 border-t border-slate-750 flex gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-2xl transition"
          >
            Annuler
          </button>

          <button
            type="button"
            disabled={isSubmitting || !isCashSufficient}
            onClick={() => handleSubmit()}
            className="flex-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-900/40 transition active:scale-98 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Enregistrement...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Valider la vente ({roundedTotal.toFixed(2)} {currency})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
