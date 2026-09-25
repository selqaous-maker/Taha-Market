import React, { useState } from 'react';
import { CameraScanner } from './CameraScanner';
import { CartList } from './CartList';
import { NewProductModal } from './NewProductModal';
import { NoBarcodeModal } from './NoBarcodeModal';
import { ProductSearchModal } from './ProductSearchModal';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { PinModal } from './PinModal';
import { Product, CartItem, SaleRecord, ShopSettings, PaymentMethod } from '../types';
import { dbService } from '../services/db';
import { playBeep, playUnknownAlert } from '../services/audio';
import { ShoppingBag, Search, CreditCard, ArrowRight, Check, AlertCircle } from 'lucide-react';

interface CashierTabProps {
  products: Product[];
  settings: ShopSettings;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onRefreshProducts: () => Promise<void>;
  onSaleCompleted: (sale: SaleRecord) => void;
}

export const CashierTab: React.FC<CashierTabProps> = ({
  products,
  settings,
  cart,
  setCart,
  onRefreshProducts,
  onSaleCompleted,
}) => {
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [isNoBarcodeOpen, setIsNoBarcodeOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Pin verification state
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pendingPinAction, setPendingPinAction] = useState<(() => void) | null>(null);

  const currency = settings.currency || 'MAD';

  // Calculate cart total
  const cartTotal = Math.round(cart.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Add product to cart by object
  const addProductToCart = (product: Product, qty: number = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.productId === product.id);
      if (existingIndex >= 0) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + qty;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          lineTotal: Math.round(newQty * updated[existingIndex].unitPrice * 100) / 100,
        };
        showToast(`+1 ${product.name} (Qté: ${newQty})`);
        return updated;
      } else {
        const newItem: CartItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          barcode: product.barcode,
          name: product.name,
          unitPrice: product.price,
          quantity: qty,
          unit: product.unit || 'pièce',
          lineTotal: Math.round(product.price * qty * 100) / 100,
        };
        showToast(`✓ ${product.name} ajouté (${product.price.toFixed(2)} ${currency})`);
        return [...prevCart, newItem];
      }
    });
  };

  // Handle scanned barcode
  const handleBarcodeScanned = async (scannedBarcode: string) => {
    const cleanBarcode = scannedBarcode.trim();
    if (!cleanBarcode) return;

    // Look up in active catalog
    const found = await dbService.getProductByBarcode(cleanBarcode);

    if (found) {
      // Barcode recognized!
      addProductToCart(found, 1);
    } else {
      // Unknown barcode!
      playUnknownAlert();
      setUnknownBarcode(cleanBarcode);
    }
  };

  // Save new unknown product and add it immediately to the current cart
  const handleSaveUnknownProduct = async (productData: {
    barcode: string;
    name: string;
    price: number;
    category?: string;
    unit: string;
  }) => {
    const newProduct = await dbService.saveProduct({
      ...productData,
      isActive: true,
    });

    await onRefreshProducts();
    addProductToCart(newProduct, 1);
    setUnknownBarcode(null);
    showToast(`✓ Nouveau produit enregistré et ajouté !`);
  };

  // Add unbarcoded item (bread, tomatoes, etc.)
  const handleAddNoBarcodeItem = (itemData: Omit<CartItem, 'id' | 'lineTotal'>) => {
    const lineTotal = Math.round(itemData.unitPrice * itemData.quantity * 100) / 100;
    const newItem: CartItem = {
      ...itemData,
      id: `adhoc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      lineTotal,
    };
    setCart((prev) => [...prev, newItem]);
    playBeep();
    showToast(`✓ ${itemData.name} ajouté (${lineTotal.toFixed(2)} ${currency})`);
  };

  // Cart operations
  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const roundedQty = Math.round(newQty * 100) / 100;
          return {
            ...item,
            quantity: roundedQty,
            lineTotal: Math.round(item.unitPrice * roundedQty * 100) / 100,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleUpdatePrice = (itemId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const roundedPrice = Math.round(newPrice * 100) / 100;
          return {
            ...item,
            originalPrice: item.originalPrice ?? item.unitPrice,
            unitPrice: roundedPrice,
            lineTotal: Math.round(roundedPrice * item.quantity * 100) / 100,
          };
        }
        return item;
      })
    );
    showToast(`Prix modifié pour cet article`);
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Request PIN for manager-controlled actions
  const handleRequestPin = (action: () => void) => {
    setPendingPinAction(() => action);
    setIsPinModalOpen(true);
  };

  // Checkout submission
  const handleCompleteSale = async (checkoutData: {
    paymentMethod: PaymentMethod;
    amountReceived: number;
    changeDue: number;
  }): Promise<SaleRecord> => {
    if (cart.length === 0) {
      throw new Error('Le panier est vide');
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8);

    // Snapshot items preserving current unit prices and quantities
    const itemSnapshots = cart.map((item) => ({
      productId: item.productId,
      barcode: item.barcode,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      unit: item.unit,
      lineTotal: item.lineTotal,
    }));

    const saleRecord = await dbService.saveSale({
      timestamp: now.getTime(),
      dateStr,
      timeStr,
      items: itemSnapshots,
      itemCount: itemSnapshots.length,
      total: cartTotal,
      paymentMethod: checkoutData.paymentMethod,
      amountReceived: checkoutData.amountReceived,
      changeDue: checkoutData.changeDue,
    });

    // Clear cart ONLY after successful persistence
    setCart([]);
    setIsCheckoutOpen(false);
    setCompletedSale(saleRecord);
    onSaleCompleted(saleRecord);

    return saleRecord;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative max-w-2xl w-full mx-auto p-2.5 sm:p-3 space-y-2.5 pb-20">
      {/* Dynamic Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-14 inset-x-4 max-w-md mx-auto z-40 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none">
          <div className="bg-emerald-600/95 text-white font-medium text-xs px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-sm border border-emerald-400 flex items-center justify-between">
            <span>{toastMessage.text}</span>
            <Check className="w-4 h-4 shrink-0" />
          </div>
        </div>
      )}

      {/* 1. Barcode Camera & Manual Scanner Card */}
      <CameraScanner
        onScan={handleBarcodeScanned}
        isPaused={Boolean(unknownBarcode || isNoBarcodeOpen || isCheckoutOpen || completedSale)}
      />

      {/* 2. Fast Actions Bar: Search Catalog & Product Without Barcode */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setIsNoBarcodeOpen(true)}
          className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 text-left transition flex items-center gap-2 group active:scale-98 shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Sans code-barres</p>
            <p className="text-[10px] text-slate-400 truncate">Pain, légumes, oeufs...</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 text-left transition flex items-center gap-2 group active:scale-98 shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Recherche</p>
            <p className="text-[10px] text-slate-400 truncate">Par nom ou catégorie</p>
          </div>
        </button>
      </div>

      {/* 3. Cart Section */}
      <div className="flex-1 flex flex-col min-h-[160px] bg-slate-850/90 border border-slate-800 rounded-3xl p-3 shadow-inner">
        <CartList
          items={cart}
          currency={currency}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onUpdatePrice={handleUpdatePrice}
          onClearCart={handleClearCart}
          onRequestPin={handleRequestPin}
          pinRequiredForPrice={settings.pinRequiredForPriceChange}
        />
      </div>

      {/* 4. Checkout Bottom Bar (Always accessible, sticky feel) */}
      <div className="bg-slate-900/95 border border-slate-750 rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center justify-between gap-3">
        <div className="pl-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Total Panier ({cart.length} {cart.length > 1 ? 'lignes' : 'ligne'})
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {cartTotal.toFixed(2)} <span className="text-xs font-bold text-emerald-500">{currency}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={cart.length === 0}
          onClick={() => setIsCheckoutOpen(true)}
          className="py-3 px-5 sm:px-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-950 transition active:scale-98 flex items-center gap-2"
        >
          <span>Encaisser</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modals */}
      {unknownBarcode && (
        <NewProductModal
          barcode={unknownBarcode}
          isOpen={Boolean(unknownBarcode)}
          onClose={() => setUnknownBarcode(null)}
          onSaveAndAdd={handleSaveUnknownProduct}
        />
      )}

      {isNoBarcodeOpen && (
        <NoBarcodeModal
          isOpen={isNoBarcodeOpen}
          onClose={() => setIsNoBarcodeOpen(false)}
          onAddToCart={handleAddNoBarcodeItem}
        />
      )}

      {isSearchOpen && (
        <ProductSearchModal
          isOpen={isSearchOpen}
          products={products}
          currency={currency}
          onClose={() => setIsSearchOpen(false)}
          onSelectProduct={(p) => addProductToCart(p, 1)}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          total={cartTotal}
          currency={currency}
          items={cart}
          onClose={() => setIsCheckoutOpen(false)}
          onCompleteSale={handleCompleteSale}
        />
      )}

      {completedSale && (
        <ReceiptModal
          isOpen={Boolean(completedSale)}
          sale={completedSale}
          settings={settings}
          onClose={() => setCompletedSale(null)}
          onNewSale={() => setCompletedSale(null)}
        />
      )}

      {isPinModalOpen && pendingPinAction && (
        <PinModal
          isOpen={isPinModalOpen}
          expectedPin={settings.ownerPin || '1234'}
          onSuccess={() => {
            if (pendingPinAction) pendingPinAction();
            setPendingPinAction(null);
          }}
          onClose={() => {
            setIsPinModalOpen(false);
            setPendingPinAction(null);
          }}
        />
      )}
    </div>
  );
};
