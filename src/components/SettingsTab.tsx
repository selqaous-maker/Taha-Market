import React, { useState, useEffect } from 'react';
import { ShopSettings, Product, SaleRecord } from '../types';
import { dbService } from '../services/db';
import { PinModal } from './PinModal';
import {
  Store,
  Database,
  Download,
  Upload,
  ShieldAlert,
  Key,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Info
} from 'lucide-react';

interface SettingsTabProps {
  settings: ShopSettings;
  onRefreshSettings: () => Promise<void>;
  onRefreshAll: () => Promise<void>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onRefreshSettings,
  onRefreshAll,
}) => {
  const [shopName, setShopName] = useState(settings.shopName);
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [currency, setCurrency] = useState<'MAD' | 'DH'>(settings.currency || 'MAD');
  const [ownerPin, setOwnerPin] = useState(settings.ownerPin || '1234');
  const [pinRequiredForPriceChange, setPinRequiredForPriceChange] = useState(settings.pinRequiredForPriceChange);
  const [pinRequiredForDelete, setPinRequiredForDelete] = useState(settings.pinRequiredForDelete);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || '');

  const [storageInfo, setStorageInfo] = useState<{
    isIndexedDB: boolean;
    usageBytes?: number;
    quotaBytes?: number;
    productCount: number;
    saleCount: number;
  }>({ isIndexedDB: true, productCount: 0, saleCount: 0 });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // PIN modal for reset
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const info = await dbService.getStorageInfo();
      setStorageInfo(info);
    } catch {
      // Ignore
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.saveSettings({
        shopName: shopName.trim() || 'Taha Market',
        phone: phone.trim(),
        address: address.trim(),
        currency,
        ownerPin: ownerPin.trim() || '1234',
        pinRequiredForPriceChange,
        pinRequiredForDelete,
        receiptFooter: receiptFooter.trim(),
      });
      await onRefreshSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  // Export full JSON backup
  const handleExportJSON = async () => {
    try {
      const backup = await dbService.exportBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `taha-market-sauvegarde-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await onRefreshSettings();
      await loadStorageInfo();
    } catch (err: any) {
      alert('Erreur d\'export: ' + err.message);
    }
  };

  // Export Products to CSV
  const handleExportProductsCSV = async () => {
    try {
      const products = await dbService.getAllProducts();
      let csv = 'ID,Nom,CodeBarres,PrixMAD,Unite,Categorie,Actif\n';
      products.forEach((p) => {
        const safeName = `"${p.name.replace(/"/g, '""')}"`;
        const barcode = p.barcode || '';
        const cat = `"${(p.category || '').replace(/"/g, '""')}"`;
        csv += `${p.id},${safeName},${barcode},${p.price.toFixed(2)},${p.unit},${cat},${p.isActive ? '1' : '0'}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taha-market-produits-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Export Sales to CSV
  const handleExportSalesCSV = async () => {
    try {
      const sales = await dbService.getAllSales();
      let csv = 'TicketID,Date,Heure,Paiement,TotalMAD,RecuMAD,RenduMAD,Articles\n';
      sales.forEach((s) => {
        const itemsSummary = `"${s.items.map((i) => `${i.quantity}x ${i.name}`).join(' | ').replace(/"/g, '""')}"`;
        csv += `${s.receiptNumber},${s.dateStr},${s.timeStr},${s.paymentMethod},${s.total.toFixed(2)},${s.amountReceived.toFixed(2)},${s.changeDue.toFixed(2)},${itemsSummary}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taha-market-ventes-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Import JSON backup file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportStatus('Analyse du fichier...');

    try {
      const text = await file.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error('Le fichier sélectionné n\'est pas un document JSON valide.');
      }

      if (!json.products || !Array.isArray(json.products)) {
        throw new Error('Format de sauvegarde invalide : tableau de produits manquant.');
      }

      const result = await dbService.importBackup(json, 'merge');
      setImportStatus(
        `✓ Importation réussie : ${result.importedProducts} produits et ${result.importedSales} ventes fusionnés !`
      );
      await onRefreshAll();
      await loadStorageInfo();
    } catch (err: any) {
      setImportError(err.message || 'Échec de l\'importation');
      setImportStatus(null);
    } finally {
      event.target.value = '';
    }
  };

  // Reset database to demo Moroccan catalog
  const handleResetCatalog = async () => {
    setIsPinModalOpen(true);
  };

  const executeResetCatalog = async () => {
    try {
      await dbService.resetToDemo();
      await onRefreshAll();
      await loadStorageInfo();
      alert('Catalogue réinitialisé avec les produits marocains par défaut !');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Human readable storage usage
  const formatBytes = (bytes?: number): string => {
    if (!bytes) return 'Inconnu';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} Mo`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 max-w-2xl w-full mx-auto p-2.5 sm:p-3 space-y-4 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-white">Paramètres & Sauvegarde</h2>
        <p className="text-xs text-slate-400">
          Configuration du magasin, stockage local et sécurité
        </p>
      </div>

      {/* Backup Alert Banner if Never Backed Up */}
      {!settings.lastBackupAt ? (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-100">Aucune sauvegarde externe effectuée !</p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Les données sont stockées de façon sécurisée dans le stockage local IndexedDB de votre téléphone. Toutefois, pour vous prémunir contre la perte ou la panne de l'appareil, téléchargez régulièrement une sauvegarde JSON ci-dessous.
            </p>
            <button
              type="button"
              onClick={handleExportJSON}
              className="mt-1 px-3 py-1.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs hover:bg-amber-400 transition"
            >
              Télécharger la sauvegarde maintenant
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-slate-850 border border-slate-750 text-xs text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Dernière sauvegarde :</span>
          </span>
          <span className="font-mono text-slate-300">
            {new Date(settings.lastBackupAt).toLocaleString('fr-FR')}
          </span>
        </div>
      )}

      {/* 1. Shop Info Form */}
      <form onSubmit={handleSaveSettings} className="p-4 bg-slate-850 rounded-3xl border border-slate-750 space-y-3.5">
        <div className="flex items-center gap-2 border-b border-slate-750/70 pb-2">
          <Store className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Identité du Magasin
          </h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Nom de l'épicerie
          </label>
          <input
            type="text"
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Téléphone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+212 6..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Devise d'affichage</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none font-bold font-mono"
            >
              <option value="MAD">MAD (Dirham marocain)</option>
              <option value="DH">DH (Dirham)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Adresse</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Quartier, N° magasin, Ville..."
            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Message de pied de ticket
          </label>
          <input
            type="text"
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            placeholder="Merci pour votre visite à Taha Market !"
            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
          />
        </div>

        {/* Security & PIN Section */}
        <div className="pt-2 border-t border-slate-750/70 space-y-2.5">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Contrôle Gérant & Code PIN
            </h4>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Code PIN Propriétaire (4 chiffres)
            </label>
            <input
              type="password"
              maxLength={6}
              value={ownerPin}
              onChange={(e) => setOwnerPin(e.target.value)}
              className="w-32 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-1.5 text-base font-mono font-bold tracking-widest text-amber-300 outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Code de sécurité local pour séparer l'accès caissier et gérant.
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={pinRequiredForPriceChange}
                onChange={(e) => setPinRequiredForPriceChange(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Exiger le code PIN pour modifier un prix en caisse</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={pinRequiredForDelete}
                onChange={(e) => setPinRequiredForDelete(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Exiger le code PIN pour supprimer un produit du catalogue</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Paramètres enregistrés !</span>
            </>
          ) : (
            <span>Enregistrer les paramètres</span>
          )}
        </button>
      </form>

      {/* 2. Storage & System Status */}
      <div className="p-4 bg-slate-850 rounded-3xl border border-slate-750 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-750/70 pb-2">
          <HardDrive className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            État du Stockage Local (IndexedDB)
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-750">
            <span className="text-slate-400 block text-[10px]">Moteur de Base</span>
            <span className="font-bold text-emerald-400">IndexedDB Persistant</span>
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-750">
            <span className="text-slate-400 block text-[10px]">Données enregistrées</span>
            <span className="font-bold text-white">
              {storageInfo.productCount} prod. / {storageInfo.saleCount} ventes
            </span>
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-750">
            <span className="text-slate-400 block text-[10px]">Espace utilisé</span>
            <span className="font-bold text-slate-200">
              {formatBytes(storageInfo.usageBytes)}
            </span>
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-750">
            <span className="text-slate-400 block text-[10px]">Quota disponible</span>
            <span className="font-bold text-slate-200">
              {formatBytes(storageInfo.quotaBytes)}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-750/60 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p>
            Taha Market POS fonctionne intégralement hors-ligne sans connexion internet requise pendant les heures de vente.
          </p>
        </div>
      </div>

      {/* 3. Export & Import Controls */}
      <div className="p-4 bg-slate-850 rounded-3xl border border-slate-750 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-750/70 pb-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Sauvegardes & Import / Export
          </h3>
        </div>

        {importStatus && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            {importStatus}
          </div>
        )}

        {importError && (
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {importError}
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-emerald-950"
          >
            <Download className="w-4 h-4" />
            <span>Sauvegarde Complète (JSON)</span>
          </button>

          <label className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition active:scale-95">
            <Upload className="w-4 h-4 text-sky-400" />
            <span>Importer Sauvegarde (JSON)</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* CSV Exports */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportProductsCSV}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Produits (Excel CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleExportSalesCSV}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
            <span>Ventes (Excel CSV)</span>
          </button>
        </div>
      </div>

      {/* 4. Danger Zone / Reset */}
      <div className="p-4 bg-slate-850/60 rounded-3xl border border-rose-900/30 space-y-2.5">
        <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
          Zone de réinitialisation
        </h4>
        <p className="text-[11px] text-slate-400">
          Rétablir les 20+ produits marocains d'exemple (lait, thé, eau, pain, biscuits, etc.).
        </p>
        <button
          type="button"
          onClick={handleResetCatalog}
          className="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl transition"
        >
          Réinitialiser le catalogue de démo
        </button>
      </div>

      {isPinModalOpen && (
        <PinModal
          isOpen={isPinModalOpen}
          expectedPin={settings.ownerPin || '1234'}
          onSuccess={executeResetCatalog}
          onClose={() => setIsPinModalOpen(false)}
        />
      )}
    </div>
  );
};
