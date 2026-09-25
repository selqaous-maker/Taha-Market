import React from 'react';
import { Store, Wifi, WifiOff, Download, Sparkles, CheckCircle, ShieldAlert } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface NavbarProps {
  shopName: string;
  hasBackupWarning: boolean;
  onOpenTests: () => void;
  onOpenBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  shopName,
  hasBackupWarning,
  onOpenTests,
  onOpenBackup,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  return (
    <header className="bg-slate-900 border-b border-slate-800 shrink-0 sticky top-0 z-30 px-3 py-2.5">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-md shadow-emerald-950 flex items-center justify-center text-white">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight text-white uppercase font-sans">
                {shopName}
              </h1>
              {/* Online / Offline badge */}
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isOnline
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                }`}
                title={isOnline ? 'Connecté' : 'Mode Hors-ligne actif'}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Caisse Enregistreuse Mobile • Android POS
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Backup warning if data hasn't been saved to external file */}
          {hasBackupWarning && (
            <button
              type="button"
              onClick={onOpenBackup}
              className="p-1.5 px-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition animate-bounce"
              title="Sauvegarde recommandée"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sauvegarder</span>
            </button>
          )}

          {/* Test Suite Runner Button */}
          <button
            type="button"
            onClick={onOpenTests}
            className="p-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
            title="Lancer les tests d'acceptation"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">Tests</span>
          </button>

          {/* PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={install}
              className="p-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-md shadow-emerald-950 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Installer</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
