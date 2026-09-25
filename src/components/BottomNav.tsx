import React from 'react';
import { ShoppingCart, Package, History, Settings } from 'lucide-react';

export type ActiveTab = 'caisse' | 'produits' | 'historique' | 'parametres';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  cartCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  cartCount,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'caisse',
      label: 'Caisse',
      icon: <ShoppingCart className="w-5 h-5" />,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      id: 'produits',
      label: 'Produits',
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'historique',
      label: 'Historique',
      icon: <History className="w-5 h-5" />,
    },
    {
      id: 'parametres',
      label: 'Paramètres',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shrink-0 sticky bottom-0 z-30 pb-safe">
      <div className="max-w-2xl mx-auto grid grid-cols-4 px-1 py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`relative py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all select-none active:scale-95 ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Icon Container with Badge */}
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition ${
                    isActive ? 'bg-emerald-500/15 text-emerald-400' : ''
                  }`}
                >
                  {tab.icon}
                </div>

                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-scale">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] tracking-tight truncate max-w-full">
                {tab.label}
              </span>

              {/* Indicator dot */}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 -mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
