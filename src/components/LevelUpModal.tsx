import React, { useEffect } from 'react';
import { Award, Zap, TrendingUp, Sparkles, Check, ArrowRight, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExerciseLevelUpEvent } from '../types';
import { playLevelUpSound } from '../utils/sound';
import { OreBadge, OreBadgeTier } from './OreBadge';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelUps: ExerciseLevelUpEvent[];
  totalXpEarned?: number;
  soundEnabled?: boolean;
}

const getOreTierFromLevel = (level: number): OreBadgeTier => {
  if (level >= 13) return 'cosmic_obsidian';
  if (level >= 11) return 'red_diamond';
  if (level >= 9) return 'diamond';
  if (level >= 7) return 'platinum';
  if (level >= 5) return 'gold';
  if (level >= 3) return 'silver';
  if (level >= 2) return 'bronze';
  return 'copper';
};

const getOreName = (tier: OreBadgeTier): string => {
  switch (tier) {
    case 'cosmic_obsidian': return 'Cosmic';
    case 'red_diamond': return 'Red Diamond';
    case 'diamond': return 'Diamond';
    case 'platinum': return 'Platinum';
    case 'gold': return 'Gold';
    case 'silver': return 'Silver';
    case 'bronze': return 'Bronze';
    default: return 'Copper';
  }
};

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  levelUps,
  totalXpEarned = 0,
  soundEnabled = true,
}) => {
  useEffect(() => {
    if (isOpen && levelUps.length > 0) {
      // Trigger sound fanfare
      playLevelUpSound(soundEnabled);

      // Trigger colorful celebratory confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6'],
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [isOpen, levelUps, soundEnabled]);

  if (!isOpen || levelUps.length === 0) return null;

  // Get highest level up event to showcase in the modal header
  const highestEvent = [...levelUps].sort((a, b) => b.newLevel - a.newLevel)[0];
  const highestTier = highestEvent ? getOreTierFromLevel(highestEvent.newLevel) : 'copper';

  return (
    <div
      id="level-up-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div
        id="level-up-modal-container"
        className="w-full max-w-lg bg-zinc-900 border border-orange-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-orange-500/10 space-y-6 text-center relative overflow-hidden"
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Badge */}
        <div className="relative">
          <div className="flex justify-center mb-1">
            <div className="animate-bounce">
              <OreBadge tier={highestTier} level={highestEvent?.newLevel} size="lg" />
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              New Ore Prestige Unlocked
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
              Exercise Level Up!
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
              By completing your sets and pushing higher reps, you advanced your calisthenics movement mastery.
            </p>
          </div>
        </div>

        {/* Leveled Up Exercises Cards */}
        <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1 text-left">
          {levelUps.map((ev, idx) => {
            const currentTier = getOreTierFromLevel(ev.newLevel);
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-zinc-950/80 border border-orange-500/30 flex flex-col gap-3 relative overflow-hidden"
              >
                {/* Upper Flex Row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-base font-bold text-white font-display">{ev.exerciseName}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-900 text-zinc-400">
                          Lvl {ev.previousLevel} ({ev.previousTitle})
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-orange-500/10 border border-orange-500/30 text-orange-400">
                          Lvl {ev.newLevel} {ev.newTitle}
                        </span>
                      </div>
                    </div>

                    <span className="inline-block font-mono text-[10px] font-bold text-orange-400 shrink-0 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      +{ev.totalXpGained} XP Earned
                    </span>
                  </div>

                  {/* Ore Badge Display */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <OreBadge tier={currentTier} level={ev.newLevel} size="sm" />
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                      {getOreName(currentTier)}
                    </span>
                  </div>
                </div>

                {/* Overload Reasons */}
                {ev.overloadReasons.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" /> Overload Milestones Unlocked:
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {ev.overloadReasons.map((reason, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-2 py-0.5 text-[10px] font-mono bg-zinc-900 border border-zinc-700/60 rounded-md text-zinc-300"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total Session XP footer */}
        {totalXpEarned > 0 && (
          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Total Session XP:
            </span>
            <span className="text-sm font-bold text-orange-400">+{totalXpEarned} XP</span>
          </div>
        )}

        {/* Action Button */}
        <button
          id="claim-level-up-btn"
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-zinc-950 font-black text-sm shadow-xl shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" /> Claim Mastery & Continue
        </button>
      </div>
    </div>
  );
};
