import React, { useState, useMemo } from 'react';
import { Product, ShopSettings } from '../types';
import { dbService } from '../services/db';
import { PinModal } from './PinModal';
import {
  Plus,
  Search,
  Tag,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
  Archive,
  RotateCcw,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface ProductsTabProps {
  products: Product[];
  settings: ShopSettings;
  onRefresh: () => Promise<void>;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  settings,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Quick Price Edit state
  const [quickPriceProductId, setQuickPriceProductId] = useState<string | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState<string>('');

  // Full Edit / Add Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Épicerie');
  const [formUnit, setFormUnit] = useState('pièce');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // PIN modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const currency = settings.currency || 'MAD';

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!showArchived && !p.isActive) return false;
      if (showArchived && p.isActive) return false;

      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
        const matchesCat = p.category ? p.category.toLowerCase().includes(q) : false;
        return matchesName || matchesBarcode || matchesCat;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, showArchived]);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBarcode('');
    setFormPrice('');
    setFormCategory('Épicerie');
    setFormUnit('pièce');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormBarcode(prod.barcode || '');
    setFormPrice(prod.price.toFixed(2));
    setFormCategory(prod.category || 'Divers');
    setFormUnit(prod.unit || 'pièce');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Quick price update submit
  const handleSaveQuickPrice = async (productId: string) => {
    const num = parseFloat(quickPriceValue.replace(',', '.'));
    if (isNaN(num) || num < 0) {
      return;
    }
    try {
      await dbService.updateProductPrice(productId, num);
      await onRefresh();
      setQuickPriceProductId(null);
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  // Save Add/Edit form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('Le nom du produit est obligatoire.');
      return;
    }

    const numPrice = parseFloat(formPrice.replace(',', '.'));
    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError('Veuillez entrer un prix de vente valide supérieur à 0 MAD.');
      return;
    }

    const cleanBarcode = formBarcode.trim() || null;

    // Check duplicate barcode
    if (cleanBarcode) {
      const existing = products.find(
        (p) => p.barcode === cleanBarcode && (!editingProduct || p.id !== editingProduct.id)
      );
      if (existing) {
        setFormError(`Le code-barres "${cleanBarcode}" est déjà attribué à "${existing.name}".`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await dbService.saveProduct({
        id: editingProduct?.id,
        name: cleanName,
        barcode: cleanBarcode,
        price: numPrice,
        category: formCategory.trim() || 'Divers',
        unit: formUnit,
        isActive: editingProduct ? editingProduct.isActive : true,
      });

      await onRefresh();
      setIsFormModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active/archive
  const handleToggleArchive = async (prod: Product) => {
    try {
      await dbService.saveProduct({
        id: prod.id,
        name: prod.name,
        barcode: prod.barcode,
        price: prod.price,
        category: prod.category,
        unit: prod.unit,
        isActive: !prod.isActive,
      });
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  // Delete product with optional PIN
  const handleDeleteProduct = (productId: string) => {
    if (settings.pinRequiredForDelete) {
      setPendingDeleteId(productId);
      setIsPinModalOpen(true);
    } else {
      if (confirm('Confirmer la suppression définitive de cet article ?')) {
        dbService.deleteProduct(productId).then(onRefresh);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 max-w-2xl w-full mx-auto p-2.5 sm:p-3 space-y-3 pb-24">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white">Catalogue Produits</h2>
          <p className="text-xs text-slate-400">
            {products.filter((p) => p.isActive).length} articles actifs au magasin
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter Produit</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom ou code-barres..."
          className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Pills & Active / Archived toggle */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Toutes ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
          <span>{filteredProducts.length} articles trouvés</span>
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="text-slate-400 hover:text-slate-200 underline font-medium"
          >
            {showArchived ? 'Voir les articles actifs' : 'Voir les archivés / désactivés'}
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-850/50 rounded-2xl border border-dashed border-slate-800">
            Aucun produit ne correspond à votre filtre.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isQuickEditing = quickPriceProductId === product.id;

            return (
              <div
                key={product.id}
                className="p-3 bg-slate-800/90 border border-slate-750 hover:border-slate-700 rounded-2xl shadow-xs transition flex flex-col gap-2"
              >
                {/* Row 1: Name, Barcode & Price */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      {product.barcode ? (
                        <span className="font-mono text-[11px] text-emerald-400/90">
                          {product.barcode}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-medium">
                          Sans code-barres
                        </span>
                      )}
                      {product.category && <span>• {product.category}</span>}
                    </div>
                  </div>

                  {/* Price display or Quick Price input */}
                  <div className="text-right shrink-0">
                    {isQuickEditing ? (
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-emerald-500">
                        <input
                          type="number"
                          step="0.10"
                          min="0"
                          autoFocus
                          value={quickPriceValue}
                          onChange={(e) => setQuickPriceValue(e.target.value)}
                          className="w-16 bg-transparent text-xs font-mono font-bold text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveQuickPrice(product.id)}
                          className="p-1 rounded-lg bg-emerald-600 text-white"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickPriceProductId(null)}
                          className="p-1 rounded-lg bg-slate-700 text-slate-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="text-base font-black font-mono text-emerald-400">
                          {product.price.toFixed(2)}{' '}
                          <span className="text-xs font-bold text-emerald-500">{currency}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">/{product.unit}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Action Buttons */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-750/70 text-xs">
                  {/* Quick price change shortcut */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuickPriceProductId(product.id);
                      setQuickPriceValue(product.price.toFixed(2));
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span>Changer le prix</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Full edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(product)}
                      className="p-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Modifier les détails"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Archive / Deactivate */}
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(product)}
                      className={`p-1.5 rounded-xl transition ${
                        product.isActive
                          ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                          : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                      title={product.isActive ? 'Désactiver / Archiver' : 'Réactiver'}
                    >
                      {product.isActive ? <Archive className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-850 border-b border-slate-750 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingProduct ? 'Modifier l\'article' : 'Ajouter un nouvel article'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom du produit <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Thé Sultan Lion 200g"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Code-barres (laisser vide si article sans code)
                </label>
                <input
                  type="text"
                  value={formBarcode}
                  onChange={(e) => setFormBarcode(e.target.value)}
                  placeholder="Ex: 6111032001144"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-slate-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Les codes-barres doivent être uniques.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prix de vente (MAD) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.10"
                      min="0.10"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-base font-bold font-mono text-white outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                      {currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unité</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="pièce">pièce</option>
                    <option value="kg">kg</option>
                    <option value="paquet">paquet</option>
                    <option value="boîte">boîte</option>
                    <option value="bouteille">bouteille</option>
                    <option value="botte">botte</option>
                    <option value="L">Litre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Catégorie</label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Épicerie, Boissons, etc."
                  className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Enregistrement...' : 'Enregistrer le produit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pin modal for deletion */}
      {isPinModalOpen && pendingDeleteId && (
        <PinModal
          isOpen={isPinModalOpen}
          expectedPin={settings.ownerPin || '1234'}
          onSuccess={() => {
            if (pendingDeleteId) {
              dbService.deleteProduct(pendingDeleteId).then(onRefresh);
            }
            setPendingDeleteId(null);
          }}
          onClose={() => {
            setIsPinModalOpen(false);
            setPendingDeleteId(null);
          }}
        />
      )}
    </div>
  );
};
