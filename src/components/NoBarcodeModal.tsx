import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Scale, Sparkles } from 'lucide-react';
import { CartItem } from '../types';

interface NoBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id' | 'lineTotal'>) => void;
}

interface QuickStaple {
  name: string;
  defaultPrice: number;
  unit: string;
  defaultQty: number;
  icon: string;
}

const MOROCCAN_STAPLES: QuickStaple[] = [
  { name: 'Pain rond marocain (Khobz)', defaultPrice: 1.20, unit: 'pièce', defaultQty: 1, icon: '🥖' },
  { name: 'Baguette parisienne', defaultPrice: 1.20, unit: 'pièce', defaultQty: 1, icon: '🥖' },
  { name: 'Oeuf frais', defaultPrice: 1.40, unit: 'pièce', defaultQty: 1, icon: '🥚' },
  { name: 'Tomates fraîches', defaultPrice: 5.00, unit: 'kg', defaultQty: 1.0, icon: '🍅' },
  { name: 'Pommes de terre', defaultPrice: 6.50, unit: 'kg', defaultQty: 1.0, icon: '🥔' },
  { name: 'Oignons rouges', defaultPrice: 4.50, unit: 'kg', defaultQty: 1.0, icon: '🧅' },
  { name: 'Menthe (Naânaâ)', defaultPrice: 1.50, unit: 'botte', defaultQty: 1, icon: '🌿' },
  { name: 'Sac plastique', defaultPrice: 0.50, unit: 'pièce', defaultQty: 1, icon: '🛍️' },
];

export const NoBarcodeModal: React.FC<NoBarcodeModalProps> = ({
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [name, setName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pièce');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectStaple = (staple: QuickStaple) => {
    setName(staple.name);
    setUnitPrice(staple.defaultPrice.toFixed(2));
    setUnit(staple.unit);
    setQuantity(staple.defaultQty.toString());
    setError(null);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Veuillez préciser le nom de l\'article.');
      return;
    }

    const priceNum = parseFloat(unitPrice.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Prix unitaire invalide (doit être > 0 MAD).');
      return;
    }

    const qtyNum = parseFloat(quantity.replace(',', '.'));
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Quantité ou poids invalide (doit être > 0).');
      return;
    }

    onAddToCart({
      barcode: null,
      name: cleanName,
      unitPrice: Math.round(priceNum * 100) / 100,
      quantity: Math.round(qtyNum * 100) / 100,
      unit,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Produit sans code-barres</h2>
              <p className="text-xs text-slate-400">Pain, légumes, vrac, oeufs...</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Quick Staple Presets Grid */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Articles fréquents (1-clic)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MOROCCAN_STAPLES.map((staple) => (
                <button
                  key={staple.name}
                  type="button"
                  onClick={() => handleSelectStaple(staple)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 text-left transition flex items-center justify-between gap-1 group"
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                      <span>{staple.icon}</span>
                      <span className="truncate">{staple.name}</span>
                    </p>
                    <p className="text-[11px] text-emerald-400 font-mono font-bold">
                      {staple.defaultPrice.toFixed(2)} MAD <span className="text-slate-500 font-normal">/{staple.unit}</span>
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="relative border-t border-slate-800 my-2">
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-slate-900 px-2 text-[11px] text-slate-500 uppercase font-bold">
              Ou saisie libre
            </span>
          </div>

          {/* Custom Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Désignation de l'article <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Mandarines, Haricots, Menthe..."
                className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Prix unitaire (MAD) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.10"
                    min="0.10"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2.5 text-base font-bold font-mono text-white placeholder-slate-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    MAD
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Quantité / Poids <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2.5 text-base font-bold font-mono text-white placeholder-slate-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Unit selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Unité</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['pièce', 'kg', 'botte', 'sac'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`py-1.5 rounded-lg text-xs font-medium capitalize text-center transition ${
                      unit === u
                        ? 'bg-slate-700 text-emerald-400 border border-emerald-500 font-bold'
                        : 'bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-750'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !unitPrice || !quantity}
                className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition active:scale-98"
              >
                Ajouter au panier
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
