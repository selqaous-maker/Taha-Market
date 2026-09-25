import React, { useState } from 'react';
import { Trash2, Plus, Minus, Edit2, ShoppingCart, Tag, Check, X } from 'lucide-react';
import { CartItem } from '../types';

interface CartListProps {
  items: CartItem[];
  currency: string;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdatePrice: (itemId: string, newPrice: number) => void;
  onClearCart: () => void;
  onRequestPin?: (onSuccess: () => void) => void;
  pinRequiredForPrice: boolean;
}

export const CartList: React.FC<CartListProps> = ({
  items,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onUpdatePrice,
  onClearCart,
  onRequestPin,
  pinRequiredForPrice,
}) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');

  const startEditPrice = (item: CartItem) => {
    const doEdit = () => {
      setEditingItemId(item.id);
      setEditingPriceValue(item.unitPrice.toFixed(2));
    };

    if (pinRequiredForPrice && onRequestPin) {
      onRequestPin(doEdit);
    } else {
      doEdit();
    }
  };

  const saveEditPrice = (itemId: string) => {
    const num = parseFloat(editingPriceValue.replace(',', '.'));
    if (!isNaN(num) && num >= 0) {
      onUpdatePrice(itemId, Math.round(num * 100) / 100);
    }
    setEditingItemId(null);
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 my-2 min-h-[220px]">
        <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-600 mb-3 shadow-inner">
          <ShoppingCart className="w-8 h-8 stroke-1" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Le panier est vide</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Scannez un code-barres avec la caméra, saisissez un code ou ajoutez un produit sans code-barres.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Items count & clear button */}
      <div className="flex items-center justify-between px-1 py-1.5 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">
          Articles dans le panier ({items.reduce((acc, i) => acc + (i.unit === 'pièce' ? i.quantity : 1), 0)})
        </span>
        <button
          type="button"
          onClick={onClearCart}
          className="text-rose-400 hover:text-rose-300 font-medium active:scale-95 transition"
        >
          Vider le panier
        </button>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 max-h-[360px] sm:max-h-[420px]">
        {items.map((item) => {
          const isEditing = editingItemId === item.id;

          return (
            <div
              key={item.id}
              className="p-3 bg-slate-800/90 border border-slate-750 hover:border-slate-700 rounded-2xl shadow-xs transition flex flex-col gap-2"
            >
              {/* Row 1: Title, price tag, line total */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate leading-tight">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.barcode ? (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.barcode}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-medium">
                        Sans code-barres
                      </span>
                    )}

                    {item.originalPrice !== undefined && item.originalPrice !== item.unitPrice && (
                      <span className="text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded font-medium">
                        Prix modifié
                      </span>
                    )}
                  </div>
                </div>

                {/* Line Total */}
                <div className="text-right shrink-0">
                  <div className="text-base font-black font-mono text-emerald-400">
                    {item.lineTotal.toFixed(2)} <span className="text-xs text-emerald-500 font-bold">{currency}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {item.unitPrice.toFixed(2)} {currency}/{item.unit}
                  </div>
                </div>
              </div>

              {/* Row 2: Quantity controls & Quick Price edit */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-750/70">
                {/* Quantity adjustments */}
                <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.quantity <= 1) {
                        onRemoveItem(item.id);
                      } else {
                        onUpdateQuantity(item.id, Math.max(0.1, item.quantity - 1));
                      }
                    }}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 active:bg-slate-600 flex items-center justify-center transition"
                    title="Diminuer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-3 min-w-[42px] text-center font-mono font-bold text-sm text-white">
                    {item.quantity} {item.unit !== 'pièce' && <span className="text-[10px] text-slate-400">{item.unit}</span>}
                  </span>

                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 active:bg-slate-600 flex items-center justify-center transition"
                    title="Augmenter"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Center / Price edit */}
                <div className="flex items-center gap-1.5">
                  {isEditing ? (
                    <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-xl border border-amber-500/50">
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        autoFocus
                        value={editingPriceValue}
                        onChange={(e) => setEditingPriceValue(e.target.value)}
                        className="w-16 bg-transparent text-xs font-mono font-bold text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => saveEditPrice(item.id)}
                        className="p-1 rounded-lg bg-emerald-600 text-white"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItemId(null)}
                        className="p-1 rounded-lg bg-slate-700 text-slate-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditPrice(item)}
                      className="px-2 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition"
                      title="Modifier le prix pour cette vente"
                    >
                      <Edit2 className="w-3 h-3 text-slate-400" />
                      <span>Changer prix</span>
                    </button>
                  )}

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 flex items-center justify-center transition"
                    title="Supprimer la ligne"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
