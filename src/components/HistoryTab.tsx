import React, { useState, useMemo } from 'react';
import { SaleRecord, ShopSettings } from '../types';
import { ReceiptModal } from './ReceiptModal';
import {
  Calendar,
  DollarSign,
  Receipt,
  Search,
  Banknote,
  CreditCard,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';

interface HistoryTabProps {
  sales: SaleRecord[];
  settings: ShopSettings;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ sales, settings }) => {
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');

  const currency = settings.currency || 'MAD';

  // Dates
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);
  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }, []);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Date filter
      if (dateFilter === 'today' && sale.dateStr !== todayStr) return false;
      if (dateFilter === 'yesterday' && sale.dateStr !== yesterdayStr) return false;
      if (dateFilter === '7days' && sale.dateStr < sevenDaysAgoStr) return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesReceipt = sale.receiptNumber.toLowerCase().includes(q);
        const matchesItems = sale.items.some((i) => i.name.toLowerCase().includes(q));
        return matchesReceipt || matchesItems;
      }

      return true;
    });
  }, [sales, dateFilter, searchQuery, todayStr, yesterdayStr, sevenDaysAgoStr]);

  // Today KPI Metrics
  const todayStats = useMemo(() => {
    const todayOnly = sales.filter((s) => s.dateStr === todayStr);
    const count = todayOnly.length;
    const totalMAD = todayOnly.reduce((sum, s) => sum + s.total, 0);
    const cashTotal = todayOnly.filter((s) => s.paymentMethod === 'CASH').reduce((sum, s) => sum + s.total, 0);
    const cardTotal = todayOnly.filter((s) => s.paymentMethod === 'CARD').reduce((sum, s) => sum + s.total, 0);
    const avgBasket = count > 0 ? totalMAD / count : 0;

    return { count, totalMAD, cashTotal, cardTotal, avgBasket };
  }, [sales, todayStr]);

  return (
    <div className="flex-1 flex flex-col min-h-0 max-w-2xl w-full mx-auto p-2.5 sm:p-3 space-y-3 pb-24">
      {/* Top Header */}
      <div>
        <h2 className="text-base font-bold text-white">Historique des Ventes</h2>
        <p className="text-xs text-slate-400">
          Suivi des encaissements et consultation des tickets
        </p>
      </div>

      {/* Daily KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-900/40 to-slate-850 border border-emerald-500/30">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
            Ventes Aujourd'hui
          </span>
          <div className="text-xl font-black font-mono text-white mt-0.5">
            {todayStats.totalMAD.toFixed(2)}{' '}
            <span className="text-xs text-emerald-400 font-bold">{currency}</span>
          </div>
          <span className="text-[10px] text-slate-400">{todayStats.count} ticket{todayStats.count > 1 ? 's' : ''}</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-850 border border-slate-750">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Panier Moyen
          </span>
          <div className="text-xl font-black font-mono text-slate-200 mt-0.5">
            {todayStats.avgBasket.toFixed(2)}{' '}
            <span className="text-xs text-slate-400 font-bold">{currency}</span>
          </div>
          <span className="text-[10px] text-slate-400">/ transaction</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-850 border border-slate-750">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Banknote className="w-3 h-3 text-emerald-400" />
            <span>Espèces</span>
          </span>
          <div className="text-lg font-black font-mono text-slate-200 mt-0.5">
            {todayStats.cashTotal.toFixed(2)}{' '}
            <span className="text-xs text-slate-400 font-bold">{currency}</span>
          </div>
          <span className="text-[10px] text-slate-400">En caisse</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-850 border border-slate-750">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-sky-400" />
            <span>Carte / TPE</span>
          </span>
          <div className="text-lg font-black font-mono text-slate-200 mt-0.5">
            {todayStats.cardTotal.toFixed(2)}{' '}
            <span className="text-xs text-slate-400 font-bold">{currency}</span>
          </div>
          <span className="text-[10px] text-slate-400">Bancaire</span>
        </div>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'today', label: "Aujourd'hui" },
          { id: 'yesterday', label: 'Hier' },
          { id: '7days', label: '7 derniers jours' },
          { id: 'all', label: 'Toutes les ventes' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setDateFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              dateFilter === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par N° de ticket ou article..."
          className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
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

      {/* Sales List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredSales.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-850/50 rounded-2xl border border-dashed border-slate-800">
            Aucune vente enregistrée pour cette période.
          </div>
        ) : (
          filteredSales.map((sale) => (
            <button
              key={sale.id}
              type="button"
              onClick={() => setSelectedSale(sale)}
              className="w-full p-3 rounded-2xl bg-slate-800/90 hover:bg-slate-750 active:bg-slate-700 border border-slate-750 hover:border-slate-700 text-left transition flex items-center justify-between gap-3 group shadow-xs active:scale-99"
            >
              {/* Left Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white group-hover:text-emerald-300">
                    {sale.receiptNumber}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      sale.paymentMethod === 'CASH'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-sky-500/15 text-sky-400'
                    }`}
                  >
                    {sale.paymentMethod === 'CASH' ? 'Espèces' : 'Carte'}
                  </span>
                </div>

                {/* Items preview snippet */}
                <p className="text-xs text-slate-400 truncate mt-1">
                  {sale.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </p>

                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {sale.timeStr} ({sale.dateStr})
                  </span>
                  <span>•</span>
                  <span>{sale.items.length} article{sale.items.length > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Right Total */}
              <div className="text-right shrink-0 flex items-center gap-2">
                <div>
                  <div className="text-base font-black font-mono text-emerald-400">
                    {sale.total.toFixed(2)}{' '}
                    <span className="text-xs text-emerald-500 font-bold">{currency}</span>
                  </div>
                  {sale.paymentMethod === 'CASH' && sale.changeDue > 0 && (
                    <div className="text-[10px] text-slate-400">
                      Rendu : {sale.changeDue.toFixed(2)} {currency}
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Full Historical Receipt View Modal */}
      {selectedSale && (
        <ReceiptModal
          isOpen={Boolean(selectedSale)}
          sale={selectedSale}
          settings={settings}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
};
