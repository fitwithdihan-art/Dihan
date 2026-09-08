import React from 'react';
import { Dumbbell, Compass, History, Trophy, Flame, Play, Coins } from 'lucide-react';

export type ActiveTab = 'routines' | 'progressions' | 'history' | 'prs';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  hasActiveWorkout: boolean;
  onResumeWorkout: () => void;
  activeWorkoutTitle?: string;
  coins?: number;
  onOpenShop?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  hasActiveWorkout,
  onResumeWorkout,
  activeWorkoutTitle,
  coins = 0,
  onOpenShop,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      {/* Active Workout Resume Top Banner */}
      {hasActiveWorkout && (
        <div
          id="active-workout-global-banner"
          onClick={onResumeWorkout}
          className="bg-orange-500 hover:bg-orange-400 text-zinc-950 px-4 py-2 text-xs font-bold flex items-center justify-between cursor-pointer transition shadow-md"
        >
          <div className="flex items-center gap-2 max-w-md truncate">
            <span className="w-2 h-2 rounded-full bg-zinc-950 animate-ping" />
            <span className="uppercase tracking-wider font-mono">Workout in progress:</span>
            <span className="font-extrabold truncate">{activeWorkoutTitle || 'Current Session'}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 font-mono text-[11px] underline">
            <Play className="w-3 h-3 fill-current" />
            <span>Tap to Resume</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => onSelectTab('routines')}
          >
            <div className="w-9 h-9 rounded-xl bg-[#f97316] flex items-center justify-center text-zinc-950 shadow-md shadow-[#f97316]/30">
              <Flame className="w-5 h-5 fill-zinc-950 text-zinc-950" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white font-display">TEENTHENICS</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] block -mt-1 font-bold">
                Tracker & Skill Ladders
              </span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-tab-routines"
              onClick={() => onSelectTab('routines')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'routines'
                  ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Routines</span>
            </button>

            <button
              id="nav-tab-progressions"
              onClick={() => onSelectTab('progressions')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'progressions'
                  ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Progressions</span>
            </button>

            <button
              id="nav-tab-history"
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'history'
                  ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Logs</span>
            </button>

            <button
              id="nav-tab-prs"
              onClick={() => onSelectTab('prs')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'prs'
                  ? 'bg-zinc-800 text-orange-400 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">PRs & Stats</span>
            </button>

            {/* Coins Shop Trigger */}
            <button
              id="nav-coin-shop-btn"
              onClick={onOpenShop}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-400 text-xs font-black font-mono tracking-tight transition cursor-pointer select-none active:scale-95 duration-100"
              title="Open custom theme shop"
            >
              <Coins className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse shrink-0" />
              <span>{coins} <span className="text-[9px] font-bold text-amber-500 hidden sm:inline">COINS</span></span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
