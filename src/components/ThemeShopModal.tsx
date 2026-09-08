import React, { useState } from 'react';
import { Coins, Sparkles, Check, Lock, Palette, X, Heart } from 'lucide-react';
import { THEMES, ThemeConfig } from '../utils/theme';

interface ThemeShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  unlockedThemes: string[];
  activeTheme: string;
  onBuyTheme: (themeId: string, price: number) => void;
  onEquipTheme: (themeId: string) => void;
}

export const ThemeShopModal: React.FC<ThemeShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  unlockedThemes,
  activeTheme,
  onBuyTheme,
  onEquipTheme,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = (theme: ThemeConfig) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (coins < theme.price) {
      setErrorMsg(`Insufficient Teenthenics Coins! You need ${theme.price - coins} more coins.`);
      return;
    }

    onBuyTheme(theme.id, theme.price);
    setSuccessMsg(`Successfully unlocked "${theme.name}"!`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl shadow-black/85 flex flex-col max-h-[85vh] overflow-hidden z-10 animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white font-display">Teenthenics Custom Theme Shop</h2>
              <p className="text-xs text-zinc-400">Buy & equip colorful designs using earned coins!</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coin Balance Banner */}
        <div className="mx-6 mt-6 p-4 rounded-2xl bg-gradient-to-r from-zinc-850 via-zinc-800 to-zinc-850 border border-zinc-750 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 animate-bounce">
              <Coins className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Your Coin Balance</p>
              <p className="text-2xl font-black font-mono text-amber-400 flex items-center gap-1.5">
                {coins} <span className="text-xs font-bold text-zinc-500">TCOINS</span>
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-mono bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2.5 py-1 rounded-full font-bold">
              +50 Coins / Workout • +100 Coins / Level Up
            </span>
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-semibold text-center">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold text-center">
            {successMsg}
          </div>
        )}

        {/* Shop Items List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {Object.values(THEMES).map((theme) => {
            const isUnlocked = unlockedThemes.includes(theme.id);
            const isActive = activeTheme === theme.id;

            return (
              <div 
                key={theme.id}
                className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isActive 
                    ? 'bg-zinc-850 border-orange-500/40 shadow-md shadow-orange-500/5' 
                    : isUnlocked 
                      ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700' 
                      : 'bg-zinc-900/40 border-zinc-800/60 opacity-80'
                }`}
              >
                {/* Theme Info & Palette Preview */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white font-display">{theme.name}</span>
                    {isActive && (
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        Active
                      </span>
                    )}
                    {isUnlocked && !isActive && (
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-zinc-800 text-zinc-400">
                        Owned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">{theme.description}</p>
                  
                  {/* Visual Color Chips Preview */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="text-[10px] text-zinc-500 mr-1.5 font-mono">Palette:</div>
                    <div className={`w-4 h-4 rounded-full ${theme.bg} border border-zinc-800`} title="Page Background" />
                    <div className={`w-4 h-4 rounded-full ${theme.cardBg} border border-zinc-800`} title="Cards" />
                    <div className={`w-4 h-4 rounded-full ${theme.primaryBg}`} title="Accent Primary" />
                    <div className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                      {theme.isLight ? 'Light Base' : 'Dark Base'}
                    </div>
                  </div>
                </div>

                {/* Purchase / Equip Action Buttons */}
                <div className="shrink-0 flex items-center justify-end">
                  {isActive ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-zinc-800 text-zinc-500 text-xs font-bold rounded-xl flex items-center gap-1 cursor-default"
                    >
                      <Check className="w-3.5 h-3.5" /> Equipped
                    </button>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => {
                        onEquipTheme(theme.id);
                        setSuccessMsg(`Equipped "${theme.name}"!`);
                      }}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      Equip Theme
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(theme)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/10 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5 fill-current" /> Buy for {theme.price}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/60 border-t border-zinc-800 text-center text-[10px] text-zinc-500">
          Unlock more themes by setting custom personal records and completing consistent routines!
        </div>
      </div>
    </div>
  );
};
