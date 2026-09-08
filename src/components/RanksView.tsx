import React, { useState, useMemo } from 'react';
import {
  Award,
  TrendingUp,
  Target,
  Dumbbell,
  Sliders,
  Zap,
  ArrowRight,
  CheckCircle2,
  Check,
  Search,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Shield,
  Layers,
  Flame,
} from 'lucide-react';
import { Exercise, PersonalRecord, WorkoutSession, Routine } from '../types';
import { EXERCISES } from '../data/exercises';
import { RankBadge } from './RankBadge';
import { BadgeTier, TIER_CONFIG } from '../utils/rankService';
import {
  getExerciseBenchmarks,
  getMovementLevelUpMilestones,
  TIER_PERCENTILES,
} from '../utils/repRankCalculator';

interface RanksViewProps {
  customExercises?: Exercise[];
  prs?: PersonalRecord[];
  sessions?: WorkoutSession[];
  onNavigateToCalculator?: (exerciseId?: string, reps?: number) => void;
  onStartRoutine?: (routine: Routine) => void;
  onShowToast?: (message: string) => void;
}

export const RanksView: React.FC<RanksViewProps> = ({
  customExercises = [],
  prs = [],
  sessions = [],
  onNavigateToCalculator,
  onStartRoutine,
  onShowToast,
}) => {
  // Combine stock exercises + custom exercises
  const allExercises: Exercise[] = useMemo(() => {
    return [...EXERCISES, ...customExercises];
  }, [customExercises]);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Selected exercise for the Level-Up Gap Explorer
  const defaultEx =
    allExercises.find((e) => e.id.includes('pull_up') || e.id.includes('push_up')) || allExercises[0];
  const [activeExerciseId, setActiveExerciseId] = useState<string>(defaultEx?.id || 'pull_up');

  // Active exercise object
  const activeExercise = useMemo(() => {
    return allExercises.find((e) => e.id === activeExerciseId) || allExercises[0];
  }, [allExercises, activeExerciseId]);

  // Find user's best personal record / session max for the active exercise
  const userBestForActiveEx = useMemo(() => {
    // Check PRs table first
    const matchedPR = prs.find((p) => p.exerciseId === activeExerciseId);
    if (matchedPR && matchedPR.value > 0) return matchedPR.value;

    // Check workout sessions
    let maxRep = 0;
    sessions.forEach((s) => {
      s.exercises.forEach((ex) => {
        if (ex.exerciseId === activeExerciseId) {
          ex.sets.forEach((set) => {
            if (set.isCompleted && set.completedRepsOrSecs > maxRep) {
              maxRep = set.completedRepsOrSecs;
            }
          });
        }
      });
    });
    return maxRep;
  }, [activeExerciseId, prs, sessions]);

  // Reps state for interactive level up calculation
  const [inputCurrentReps, setInputCurrentReps] = useState<number>(() => {
    return userBestForActiveEx > 0 ? userBestForActiveEx : 12;
  });

  // When active exercise changes, optionally sync to user's real PR if higher
  const handleSelectExercise = (exId: string) => {
    setActiveExerciseId(exId);
    const matchedPR = prs.find((p) => p.exerciseId === exId);
    if (matchedPR && matchedPR.value > 0) {
      setInputCurrentReps(matchedPR.value);
    } else {
      // Find session max
      let maxRep = 0;
      sessions.forEach((s) => {
        s.exercises.forEach((ex) => {
          if (ex.exerciseId === exId) {
            ex.sets.forEach((set) => {
              if (set.isCompleted && set.completedRepsOrSecs > maxRep) {
                maxRep = set.completedRepsOrSecs;
              }
            });
          }
        });
      });
      setInputCurrentReps(maxRep > 0 ? maxRep : 10);
    }
  };

  // Calculate milestones for the active exercise and input reps
  const levelUpData = useMemo(() => {
    return getMovementLevelUpMilestones(activeExercise, inputCurrentReps);
  }, [activeExercise, inputCurrentReps]);

  // Expanded cards in matrix view
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Filtered exercises for the master standards matrix
  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchSearch =
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.primaryMuscles && ex.primaryMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchCategory = selectedCategory === 'all' || ex.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchDiff = selectedDifficulty === 'all' || ex.difficulty === selectedDifficulty;
      return matchSearch && matchCategory && matchDiff;
    });
  }, [allExercises, searchQuery, selectedCategory, selectedDifficulty]);

  // Categories list
  const categories = [
    { id: 'all', label: 'All Movements' },
    { id: 'pull', label: 'Pull' },
    { id: 'push', label: 'Push' },
    { id: 'core', label: 'Core' },
    { id: 'legs', label: 'Legs' },
    { id: 'skills', label: 'Skills & Holds' },
    { id: 'handstand', label: 'Handstand' },
  ];

  const isHold = activeExercise?.type === 'hold_seconds';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Hero Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-orange-500/30 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Exercise Ranks & Roadmaps
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                11 Athletic Tiers
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
              Calisthenics Exercise Ranks
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Discover exactly how many reps or hold seconds you need to level up each exercise rank from{' '}
              <strong className="text-zinc-200">Novice</strong> all the way to{' '}
              <strong className="text-orange-400">Cosmic Obsidian</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {onNavigateToCalculator && (
              <button
                type="button"
                onClick={() => onNavigateToCalculator(activeExercise.id, inputCurrentReps)}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-black font-mono transition flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Test in Rank Calculator</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Level-Up Gap Explorer */}
      <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                Level-Up Rep Gap Simulator
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Pick an exercise and adjust reps to see the exact gap to reach the next athletic rank.
            </p>
          </div>

          {userBestForActiveEx > 0 && (
            <button
              type="button"
              onClick={() => setInputCurrentReps(userBestForActiveEx)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-orange-400 text-xs font-mono font-bold border border-orange-500/30 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Use My Actual PR ({userBestForActiveEx} {isHold ? 's' : 'reps'})</span>
            </button>
          )}
        </div>

        {/* Movement Selector & Reps Adjuster */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Movement Dropdown */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
              <span>Select Exercise</span>
            </label>
            <select
              value={activeExerciseId}
              onChange={(e) => handleSelectExercise(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium cursor-pointer"
            >
              {allExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.category} • {ex.type === 'hold_seconds' ? 'seconds' : 'reps'})
                </option>
              ))}
            </select>
          </div>

          {/* Current Reps / Hold Seconds Stepper */}
          <div className="md:col-span-6 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-400" />
                <span>Current Clean Reps / Hold</span>
              </label>
              <span className="text-xs font-mono font-bold text-orange-400">
                {inputCurrentReps} {isHold ? 'seconds' : 'reps'}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setInputCurrentReps((prev) => Math.max(0, prev - (isHold ? 5 : 5)))}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => setInputCurrentReps((prev) => Math.max(0, prev - 1))}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
              >
                -1
              </button>

              <input
                type="number"
                min={0}
                max={500}
                value={Number.isNaN(inputCurrentReps) ? 0 : inputCurrentReps}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setInputCurrentReps(Number.isNaN(val) ? 0 : Math.max(0, val));
                }}
                className="flex-1 text-center text-xl font-mono font-black text-white bg-transparent focus:outline-none min-w-[3rem]"
              />

              <button
                type="button"
                onClick={() => setInputCurrentReps((prev) => prev + 1)}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setInputCurrentReps((prev) => prev + (isHold ? 5 : 5))}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
              >
                +5
              </button>
            </div>
          </div>
        </div>

        {/* Current Standing & Immediate Next Level-Up Callout */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RankBadge
              rankTitle={levelUpData.milestones[levelUpData.currentTierIndex]?.rankTitle || 'Novice'}
              tier={levelUpData.currentTier}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-black uppercase text-orange-400">
                  Current Rank: {TIER_CONFIG[levelUpData.currentTier]?.name || 'Novice'} Tier
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  • Top {Math.max(1, Math.min(99, 100 - Math.round(levelUpData.milestones[levelUpData.currentTierIndex]?.percentile || 50)))}% Global
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                {levelUpData.milestones[levelUpData.currentTierIndex]?.rankTitle || 'Initiator'}
              </h3>
            </div>
          </div>

          {levelUpData.nextTargetMilestone ? (
            <div className="text-left sm:text-right bg-orange-500/10 border border-orange-500/25 p-3 rounded-xl sm:bg-transparent sm:border-0 sm:p-0">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block">Immediate Next Level-Up</span>
              <p className="text-sm sm:text-base font-mono font-black text-orange-400 flex items-center sm:justify-end gap-1.5 flex-wrap">
                <span>
                  +{levelUpData.nextTargetMilestone.repsNeededFromCurrent || 0} {isHold ? 'seconds' : 'reps'}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
                <span>{levelUpData.nextTargetMilestone.tierName}</span>
              </p>
              <span className="text-[10px] text-zinc-500 font-mono">
                Requires {levelUpData.nextTargetMilestone.minReps || 0} total {isHold ? 'seconds' : 'reps'}
              </span>
            </div>
          ) : (
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-purple-300">Supreme Cosmic Tier</span>
              <p className="text-[11px] text-zinc-400 font-mono">You've unlocked the highest rank!</p>
            </div>
          )}
        </div>

        {/* Step-by-Step Level-Up Progression Ladder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
              <span>Full Level-Up Progression Roadmap</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Exact reps required for all 11 rank tiers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {levelUpData.milestones.map((m) => {
              const isCompleted = m.isCompleted;
              const isCurrent = m.isCurrentTier;
              const isNext = m.isNextTarget;
              const repsToUnlock = m.repsNeededFromCurrent || 0;

              return (
                <div
                  key={m.tier}
                  className={`p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? 'bg-zinc-950 border-orange-500 ring-1 ring-orange-500/50 shadow-lg shadow-orange-500/10'
                      : isNext
                      ? 'bg-zinc-950/90 border-orange-500/60 shadow-md ring-1 ring-orange-500/20'
                      : isCompleted
                      ? 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                      : 'bg-zinc-950/30 border-zinc-850 opacity-80'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header with tier badge and completion badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{m.badgeConfig.icon}</span>
                        <div>
                          <h4 className="text-xs font-bold text-white font-mono uppercase">{m.tierName}</h4>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Top {Math.max(1, Math.min(99, 100 - Math.round(m.percentile || 50)))}%
                          </span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase bg-orange-500 text-zinc-950 shadow-sm">
                          Current
                        </span>
                      ) : isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          Unlocked
                        </span>
                      ) : isNext ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse">
                          Next Goal
                        </span>
                      ) : null}
                    </div>

                    <p className="text-[11px] font-bold text-zinc-300 font-display line-clamp-1">{m.rankTitle}</p>

                    {/* Threshold info */}
                    <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800/80 space-y-0.5">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                        <span>Standard:</span>
                        <span className="font-bold text-white">
                          {m.minReps}+ {m.unit}
                        </span>
                      </div>
                      {m.tierIndex > 0 && (
                        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                          <span>Jump from prev:</span>
                          <span className="text-orange-400/90">
                            +{m.repsToLevelUpFromPrev} {m.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Level-Up Delta Callout */}
                  <div className="pt-1 border-t border-zinc-800/60">
                    {isCompleted ? (
                      <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Rank mastered ({inputCurrentReps || 0} {m.unit})</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono font-bold">
                          <span className="text-zinc-400">Need to Level Up:</span>
                          <span className="text-orange-400 font-black">
                            +{repsToUnlock} {m.unit}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                m.minReps > 0
                                  ? Math.min(100, Math.max(0, Math.round(((Number(inputCurrentReps) || 0) / m.minReps) * 100) || 0))
                                  : 100
                              }%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                          <span>
                            {inputCurrentReps || 0} / {m.minReps}
                          </span>
                          <span>
                            {m.minReps > 0
                              ? Math.min(100, Math.max(0, Math.round(((Number(inputCurrentReps) || 0) / m.minReps) * 100) || 0))
                              : 100}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* All Movements Rank Standards Catalog & Matrix */}
      <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                All Exercise Movement Standards
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Browse rep requirements for all exercises. Tap any card to view its full rank roadmap.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search movement, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-orange-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Movements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((ex) => {
            const isSelected = activeExerciseId === ex.id;
            const benchmarks = getExerciseBenchmarks(ex);
            const isExHold = ex.type === 'hold_seconds';

            // Check if user has PR for this
            const matchedPR = prs.find((p) => p.exerciseId === ex.id);
            const userBest = matchedPR?.value || 0;

            // Find current tier for user best
            let currentTierName = 'Novice';
            let nextRankThreshold = benchmarks[1]?.minRepsOrSecs || 5;
            for (let i = benchmarks.length - 1; i >= 0; i--) {
              if (userBest >= benchmarks[i].minRepsOrSecs) {
                currentTierName = TIER_CONFIG[benchmarks[i].tier]?.name || 'Novice';
                nextRankThreshold = benchmarks[i + 1]?.minRepsOrSecs || benchmarks[i].minRepsOrSecs;
                break;
              }
            }

            return (
              <div
                key={ex.id}
                onClick={() => handleSelectExercise(ex.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-zinc-950 border-orange-500 ring-1 ring-orange-500/40 shadow-lg'
                    : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white font-display line-clamp-1">{ex.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono uppercase text-zinc-400">{ex.category}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-[10px] font-mono text-orange-400/90">
                          {isExHold ? 'Hold (Secs)' : 'Reps'}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-orange-500 text-zinc-950">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Benchmark highlights */}
                  <div className="grid grid-cols-3 gap-1.5 text-center p-2 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-[10px] font-mono">
                    <div>
                      <span className="text-zinc-500 block uppercase">Bronze</span>
                      <span className="font-bold text-amber-400">{benchmarks[1]?.minRepsOrSecs || 5}{isExHold ? 's' : 'r'}</span>
                    </div>
                    <div className="border-x border-zinc-800">
                      <span className="text-zinc-500 block uppercase">Gold</span>
                      <span className="font-bold text-yellow-400">{benchmarks[3]?.minRepsOrSecs || 15}{isExHold ? 's' : 'r'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase">Diamond</span>
                      <span className="font-bold text-cyan-400">{benchmarks[5]?.minRepsOrSecs || 30}{isExHold ? 's' : 'r'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs font-mono">
                  <span className="text-zinc-400">
                    {userBest > 0 ? (
                      <>
                        PR: <strong className="text-white">{userBest}{isExHold ? 's' : 'r'}</strong> ({currentTierName})
                      </>
                    ) : (
                      'Tap to simulate rank'
                    )}
                  </span>
                  <span className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 text-[11px]">
                    View Gap <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
