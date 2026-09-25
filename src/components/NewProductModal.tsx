import React, { useState, useEffect, useRef } from 'react';
import { X, PlusCircle, Tag, DollarSign, Layers, AlertTriangle } from 'lucide-react';
import { Product } from '../types';

interface NewProductModalProps {
  barcode: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveAndAdd: (productData: {
    barcode: string;
    name: string;
    price: number;
    category?: string;
    unit: string;
  }) => Promise<void>;
}

const COMMON_CATEGORIES = [
  'Épicerie',
  'Produits Laitiers',
  'Boissons',
  'Boulangerie',
  'Snacks & Biscuits',
  'Hygiène & Entretien',
  'Frais',
  'Divers'
];

export const NewProductModal: React.FC<NewProductModalProps> = ({
  barcode,
  isOpen,
  onClose,
  onSaveAndAdd,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Épicerie');
  const [unit, setUnit] = useState('pièce');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setPrice('');
      setCategory('Épicerie');
      setUnit('pièce');
      setError(null);
      setIsSaving(false);
      // Autofocus name input for fast cashier entry
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, barcode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Veuillez saisir le nom du produit.');
      return;
    }

    const numPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Veuillez saisir un prix valide supérieur à 0 MAD.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveAndAdd({
        barcode: barcode.trim(),
        name: cleanName,
        price: Math.round(numPrice * 100) / 100,
        category: category.trim() || 'Divers',
        unit,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500/20 via-slate-850 to-slate-850 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Nouveau Produit Détecté</h2>
              <p className="text-xs text-amber-300 font-mono">Code : {barcode}</p>
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
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Ce code-barres est inconnu. Renseignez son nom et son prix pour l'ajouter immédiatement au panier et le mémoriser.</span>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Barcode (Read-only) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Code-barres scanné</label>
            <input
              type="text"
              readOnly
              value={barcode}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono font-bold tracking-wider outline-none cursor-not-allowed select-all"
            />
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Nom du produit <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={nameInputRef}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Yaourt Moufid Fraise 110g"
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Price (MAD) */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Prix de vente (MAD / DH) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-400 font-mono">
                MAD
              </span>
              <input
                type="number"
                step="0.10"
                min="0.10"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-14 pr-3 py-2.5 text-lg font-bold font-mono text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Catégorie (optionnelle)</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    category === cat
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Unit selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Unité de vente</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['pièce', 'kg', 'paquet', 'boîte'].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`py-1.5 rounded-lg text-xs font-medium capitalize text-center transition ${
                    unit === u
                      ? 'bg-slate-700 text-emerald-400 border border-emerald-500 font-bold'
                      : 'bg-slate-800/80 text-slate-400 border border-transparent hover:bg-slate-700'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim() || !price}
              className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition active:scale-98 flex items-center justify-center gap-1.5"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer & Ajouter au panier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
