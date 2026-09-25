import React, { useState } from 'react';
import { X, Printer, Share2, Check, Copy, ArrowRight, Store } from 'lucide-react';
import { SaleRecord, ShopSettings } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  sale: SaleRecord | null;
  settings: ShopSettings;
  onClose: () => void;
  onNewSale?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  sale,
  settings,
  onClose,
  onNewSale,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !sale) return null;

  const currency = settings.currency || 'MAD';

  // Format receipt text for sharing via WhatsApp or copying
  const generateReceiptText = (): string => {
    let text = `🛒 *${settings.shopName.toUpperCase()}*\n`;
    if (settings.phone) text += `📞 ${settings.phone}\n`;
    if (settings.address) text += `📍 ${settings.address}\n`;
    text += `--------------------------------\n`;
    text += `Reçu N° : ${sale.receiptNumber}\n`;
    text += `Date : ${sale.dateStr} ${sale.timeStr}\n`;
    text += `--------------------------------\n`;
    sale.items.forEach((item) => {
      text += `${item.name}\n`;
      text += `  ${item.quantity} x ${item.unitPrice.toFixed(2)} ${currency} = ${item.lineTotal.toFixed(2)} ${currency}\n`;
    });
    text += `--------------------------------\n`;
    text += `*TOTAL : ${sale.total.toFixed(2)} ${currency}*\n`;
    text += `Paiement : ${sale.paymentMethod === 'CASH' ? 'Espèces' : 'Carte'}\n`;
    if (sale.paymentMethod === 'CASH') {
      text += `Reçu : ${sale.amountReceived.toFixed(2)} ${currency}\n`;
      text += `Monnaie rendue : ${sale.changeDue.toFixed(2)} ${currency}\n`;
    }
    text += `--------------------------------\n`;
    text += `${settings.receiptFooter || 'Merci pour votre visite !'}\n`;
    return text;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = generateReceiptText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reçu ${sale.receiptNumber} - ${settings.shopName}`,
          text,
        });
        return;
      } catch {
        // User cancelled or error, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-3 bg-slate-850 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Ticket de Caisse</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Paper Area (styled like paper) */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950/60">
          <div
            id="printable-receipt"
            className="bg-white text-slate-900 p-5 rounded-xl shadow-lg font-mono text-xs max-w-[320px] mx-auto border-t-8 border-slate-800"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h3 className="font-black text-base uppercase tracking-wider text-slate-900">
                {settings.shopName}
              </h3>
              {settings.address && (
                <p className="text-[10px] text-slate-600 mt-0.5">{settings.address}</p>
              )}
              {settings.phone && (
                <p className="text-[10px] text-slate-600">Tél : {settings.phone}</p>
              )}
            </div>

            {/* Receipt Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] text-slate-700 space-y-0.5">
              <div className="flex justify-between">
                <span>Ticket N° :</span>
                <span className="font-bold">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date :</span>
                <span>{sale.dateStr} {sale.timeStr}</span>
              </div>
              <div className="flex justify-between">
                <span>Règlement :</span>
                <span className="font-bold">{sale.paymentMethod === 'CASH' ? 'ESPÈCES' : 'CARTE / TPE'}</span>
              </div>
            </div>

            {/* Line items */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500 pb-1 border-b border-slate-200">
                <span>Article / Qté</span>
                <span>Total</span>
              </div>

              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5 text-[11px]">
                  <div className="font-bold text-slate-800 truncate">
                    {item.name}
                  </div>
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>
                      {item.quantity} {item.unit !== 'pièce' ? item.unit : ''} x {item.unitPrice.toFixed(2)} {currency}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {item.lineTotal.toFixed(2)} {currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="py-3 border-b-2 border-slate-900 space-y-1 text-[11px]">
              <div className="flex justify-between text-sm font-black text-slate-950 pt-1">
                <span>TOTAL PAYÉ :</span>
                <span>{sale.total.toFixed(2)} {currency}</span>
              </div>

              {sale.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between text-slate-600 pt-1 text-[10px]">
                    <span>Espèces reçues :</span>
                    <span>{sale.amountReceived.toFixed(2)} {currency}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800 text-[10px]">
                    <span>Monnaie rendue :</span>
                    <span>{sale.changeDue.toFixed(2)} {currency}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-600 space-y-1">
              <p className="font-medium">{settings.receiptFooter || 'Merci de votre visite à Taha Market !'}</p>
              <p className="text-[9px] text-slate-400">Taha Market POS • Système de caisse</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-slate-850 border-t border-slate-750 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimer (Android)</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-sky-400" />
                  <span>Partager / WhatsApp</span>
                </>
              )}
            </button>
          </div>

          {onNewSale && (
            <button
              type="button"
              onClick={onNewSale}
              className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <span>Client suivant / Nouvelle vente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
