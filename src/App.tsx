import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { CashierTab } from './components/CashierTab';
import { ProductsTab } from './components/ProductsTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsTab } from './components/SettingsTab';
import { AcceptanceTestModal } from './components/AcceptanceTestModal';
import { Product, SaleRecord, ShopSettings, CartItem } from './types';
import { dbService, DEFAULT_SETTINGS } from './services/db';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('caisse');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);

  // Load initial data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      const [loadedProducts, loadedSales, loadedSettings] = await Promise.all([
        dbService.getAllProducts(),
        dbService.getAllSales(),
        dbService.getSettings(),
      ]);
      setProducts(loadedProducts);
      setSales(loadedSales);
      setSettings(loadedSettings);
    } catch (err) {
      console.error('Erreur chargement IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefreshProducts = async () => {
    const updated = await dbService.getAllProducts();
    setProducts(updated);
  };

  const handleRefreshSettings = async () => {
    const updated = await dbService.getSettings();
    setSettings(updated);
  };

  const handleRefreshSales = async () => {
    const updated = await dbService.getAllSales();
    setSales(updated);
  };

  const handleSaleCompleted = (newSale: SaleRecord) => {
    setSales((prev) => [newSale, ...prev]);
  };

  // Determine if backup warning should be shown (never backed up or > 7 days)
  const hasBackupWarning = !settings.lastBackupAt || (
    Date.now() - new Date(settings.lastBackupAt).getTime() > 7 * 24 * 60 * 60 * 1000
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-950/50 mb-4 animate-bounce">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-200">
          Taha Market POS
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Initialisation de la caisse et du stockage local...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white font-sans">
      {/* Top App Bar */}
      <Navbar
        shopName={settings.shopName || 'Taha Market'}
        hasBackupWarning={hasBackupWarning}
        onOpenTests={() => setIsTestModalOpen(true)}
        onOpenBackup={() => setActiveTab('parametres')}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {activeTab === 'caisse' && (
          <CashierTab
            products={products}
            settings={settings}
            cart={cart}
            setCart={setCart}
            onRefreshProducts={handleRefreshProducts}
            onSaleCompleted={handleSaleCompleted}
          />
        )}

        {activeTab === 'produits' && (
          <ProductsTab
            products={products}
            settings={settings}
            onRefresh={handleRefreshProducts}
          />
        )}

        {activeTab === 'historique' && (
          <HistoryTab
            sales={sales}
            settings={settings}
          />
        )}

        {activeTab === 'parametres' && (
          <SettingsTab
            settings={settings}
            onRefreshSettings={handleRefreshSettings}
            onRefreshAll={loadData}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        cartCount={cart.length}
      />

      {/* Acceptance Tests Runner Modal */}
      {isTestModalOpen && (
        <AcceptanceTestModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          onRefreshAll={loadData}
        />
      )}
    </div>
  );
}
