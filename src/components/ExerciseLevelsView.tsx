import React, { useState, useMemo } from 'react';
import {
  Zap,
  Sparkles,
  Flame,
  Trophy,
  TrendingUp,
  Search,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { WorkoutSession } from '../types';
import { EXERCISES } from '../data/exercises';
import { getAllExerciseMasteries, LEVEL_THRESHOLDS, RANK_TITLES } from '../utils/mastery';
import { OreBadge } from './OreBadge';

interface ExerciseLevelsViewProps {
  sessions: WorkoutSession[];
  weightUnit: 'kg' | 'lbs';
}

export const ExerciseLevelsView: React.FC<ExerciseLevelsViewProps> = ({ sessions, weightUnit }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'level' | 'xp' | 'overloads' | 'name'>('level');
  const [showRoadmapModal, setShowRoadmapModal] = useState<boolean>(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Compute masteries for all exercises
  const masteries = useMemo(() => {
    return getAllExerciseMasteries(sessions);
  }, [sessions]);

  // Aggregate athlete stats
  const athleteStats = useMemo(() => {
    const totalLevel = masteries.reduce((sum, m) => sum + (m.level || 1), 0);
    const totalXp = masteries.reduce((sum, m) => sum + (m.totalXp || 0), 0);
    const totalOverloads = masteries.reduce((sum, m) => sum + (m.overloadCount || 0), 0);
    const leveledUpCount = masteries.filter((m) => (m.level || 1) > 1).length;

    return {
      totalLevel,
      totalXp,
      totalOverloads,
      leveledUpCount,
    };
  }, [masteries]);

  // Filter & sort masteries
  const filteredMasteries = useMemo(() => {
    return masteries
      .filter((m) => {
        const ex = EXERCISES.find((e) => e.id === m.exerciseId);
        if (!ex) return false;

        const matchesQuery =
          ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ex.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ex.primaryMuscles.some((pm) => pm.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory =
          selectedCategory === 'all' ||
          (selectedCategory === 'bands'
            ? ex.id.startsWith('band_') || ex.name.toLowerCase().includes('band')
            : ex.category.toLowerCase() === selectedCategory.toLowerCase());

        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'level') {
          if (b.level !== a.level) return b.level - a.level;
          return b.totalXp - a.totalXp;
        }
        if (sortBy === 'xp') {
          return b.totalXp - a.totalXp;
        }
        if (sortBy === 'overloads') {
          return (b.overloadCount || 0) - (a.overloadCount || 0);
        }
        const exA = EXERCISES.find((e) => e.id === a.exerciseId)?.name || a.exerciseId;
        const exB = EXERCISES.find((e) => e.id === b.exerciseId)?.name || b.exerciseId;
        return exA.localeCompare(exB);
      });
  }, [masteries, searchQuery, selectedCategory, sortBy]);

  const categories = ['all', 'bands', 'push', 'pull', 'core', 'legs', 'skills', 'handstand'];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'cosmic_obsidian':
        return 'from-purple-500 to-indigo-600 text-purple-200 border-purple-500/40 bg-purple-950/20';
      case 'red_diamond':
        return 'from-rose-500 to-red-600 text-rose-200 border-rose-500/40 bg-rose-950/20';
      case 'diamond':
        return 'from-[#f97316] to-orange-600 text-[#f97316] border-[#f97316]/40 bg-orange-950/20';
      case 'platinum':
        return 'from-orange-400 to-amber-500 text-orange-200 border-orange-500/35 bg-orange-950/20';
      case 'gold':
        return 'from-amber-400 to-orange-500 text-amber-300 border-amber-500/45 bg-amber-950/20';
      case 'silver':
        return 'from-slate-300 to-zinc-400 text-slate-200 border-slate-400/45 bg-slate-850/20';
      case 'bronze':
        return 'from-orange-700 to-amber-800 text-orange-300 border-orange-600/35 bg-orange-950/20';
      case 'copper':
      default:
        return 'from-orange-500 to-orange-600 text-orange-300 border-orange-500/35 bg-orange-950/20';
    }
  };

  return (
    <div id="exercise-levels-view" className="space-y-6">
      {/* Athlete Mastery Header Banner */}
      <div className="p-5 sm:p-7 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-orange-950/20 border border-zinc-800 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current text-orange-400" />
              Exercise Level-Up Engine
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
            Movement Mastery & Levels
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Level up your exercises by completing sets and reps. Increase your reps or sets compared to your previous
            workout to trigger <span className="text-orange-400 font-semibold">Progressive Overload XP bonuses</span> and
            rank up!
          </p>
        </div>

        {/* Aggregate Level Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">Total Levels</span>
            <span className="text-2xl font-black font-mono text-orange-400 mt-0.5 block">
              {athleteStats.totalLevel}
            </span>
            <span className="text-[10px] text-zinc-500">cumulative</span>
          </div>

          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">Total XP</span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5 block">
              {athleteStats.totalXp.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-500">mastery points</span>
          </div>

          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">Overloads</span>
            <span className="text-2xl font-black font-mono text-orange-400 mt-0.5 block">
              {athleteStats.totalOverloads}
            </span>
            <span className="text-[10px] text-zinc-500">PR jumps</span>
          </div>

          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">Evolved</span>
            <span className="text-2xl font-black font-mono text-indigo-400 mt-0.5 block">
              {athleteStats.leveledUpCount}
            </span>
            <span className="text-[10px] text-zinc-500">movements</span>
          </div>
        </div>
      </div>

      {/* How It Works & Progressive Overload Banner */}
      <div className="p-4 sm:p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">How to Level Up Your Exercises</h3>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl">
              Finish sets (<span className="text-zinc-200 font-mono font-semibold">+20 XP</span>) & reps (
              <span className="text-zinc-200 font-mono font-semibold">+2 XP</span>). Increase reps over your previous
              best (<span className="text-orange-400 font-mono font-bold">+50 XP Rep Overload</span>) or complete more
              sets (<span className="text-emerald-400 font-mono font-bold">+40 XP Set Overload</span>) to earn ranks!
            </p>
          </div>
        </div>

        <button
          id="view-mastery-roadmap-btn"
          onClick={() => setShowRoadmapModal(true)}
          className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition shrink-0 self-start sm:self-auto"
        >
          <Info className="w-3.5 h-3.5 text-orange-400" />
          <span>View Level Roadmap</span>
        </button>
      </div>

      {/* Filters, Search & Sort Toolbar */}
      <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-exercise-levels-input"
              type="text"
              placeholder="Search movement or muscle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-mono text-zinc-400">Sort by:</span>
            <select
              id="sort-exercise-levels-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
            >
              <option value="level">Highest Level First</option>
              <option value="xp">Total XP Earned</option>
              <option value="overloads">Most Overloads</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMasteries.map((m) => {
          const exDef = EXERCISES.find((e) => e.id === m.exerciseId);
          const isHold = exDef?.type === 'hold_seconds';
          const isExpanded = expandedExerciseId === m.exerciseId;
          const tierStyle = getTierColor(m.badgeTier);

          return (
            <div
              key={m.exerciseId}
              id={`mastery-card-${m.exerciseId}`}
              className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl overflow-hidden shadow-lg hover:border-zinc-700/80 transition flex flex-col justify-between"
            >
              {/* Card Top */}
              <div className="p-4 sm:p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-display">{exDef?.name || m.exerciseId}</h3>
                      {isHold && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Hold
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-medium uppercase text-zinc-400">{exDef?.category}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                        {exDef?.primaryMuscles.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Level & Rank Badge with Mini Ore Badge */}
                  <div className="flex items-center gap-2">
                    <OreBadge tier={m.badgeTier} level={m.level} size="sm" className="shrink-0" />
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border shadow-sm ${tierStyle}`}
                    >
                      <span>
                        Lvl {m.level} • {m.rankTitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">Level {m.level} Progress</span>
                    <span className="text-orange-400 font-semibold">
                      {m.currentLevelXp} / {m.xpNeededForLevel} XP ({Number.isFinite(m.progressPercent) ? m.progressPercent : 0}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${Number.isFinite(m.progressPercent) ? m.progressPercent : 0}%` }}
                    />
                  </div>
                </div>

                {/* Stats Matrix */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800/70 text-center text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Peak Set</span>
                    <span className="font-bold text-white text-sm">
                      {(m.bestSetRepsOrSecs || 0) > 0 ? (
                        <>
                          {m.bestSetRepsOrSecs}
                          <span className="text-xs font-normal text-zinc-400">{isHold ? 's' : 'r'}</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>

                  <div className="border-x border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block uppercase">Strict Sets</span>
                    <span className="font-bold text-orange-400 text-sm">{m.totalLifetimeSets || 0}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Total Vol</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {(m.totalLifetimeRepsOrSecs || 0) > 0
                        ? `${m.totalLifetimeRepsOrSecs}${isHold ? 's' : 'r'}`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 sm:px-5 py-2.5 bg-zinc-950/50 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>{m.overloadCount || 0} Progressive Overloads</span>
                </div>

                <button
                  onClick={() => setExpandedExerciseId(isExpanded ? null : m.exerciseId)}
                  className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition"
                >
                  <span>{isExpanded ? 'Hide Cues' : 'Form Cues'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Form cues drawer */}
              {isExpanded && exDef?.formCues && (
                <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800/80 text-xs text-zinc-300 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-orange-400 font-bold block">
                    Key Technique Cues:
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[11px]">
                    {exDef.formCues.map((cue, cIdx) => (
                      <li key={cIdx}>{cue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Level Roadmap Modal */}
      {showRoadmapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-bold text-white font-display">Movement Level Progression Ladder</h3>
              </div>
              <button
                onClick={() => setShowRoadmapModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Calisthenics strength is built through progressive overload. Every movement follows a 10-tier prestige
                progression. Reach higher levels by increasing your volume, reps, and sets each session!
              </p>
            </div>

            <div className="space-y-2.5">
              {LEVEL_THRESHOLDS.map((xpStart, index) => {
                const level = index + 1;
                const title = RANK_TITLES[level] || 'Master';
                const nextXp = LEVEL_THRESHOLDS[index + 1];
                const currentTier = level >= 13 ? 'cosmic_obsidian' :
                                    level >= 11 ? 'red_diamond' :
                                    level >= 9 ? 'diamond' :
                                    level >= 7 ? 'platinum' :
                                    level >= 5 ? 'gold' :
                                    level >= 3 ? 'silver' :
                                    level >= 2 ? 'bronze' : 'copper';

                return (
                  <div
                    key={level}
                    className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 font-mono text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <OreBadge tier={currentTier} level={level} size="sm" className="shrink-0" />
                      <div>
                        <span className="font-bold text-white block">{title}</span>
                        <span className="text-[10px] text-zinc-500">
                          {nextXp ? `${xpStart} – ${nextXp - 1} XP` : `${xpStart}+ XP`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-zinc-400">
                      {level === 1
                        ? 'Starter Level'
                        : level <= 3
                        ? 'Foundational Competence'
                        : level <= 6
                        ? 'Intermediate Calisthenics'
                        : level <= 8
                        ? 'Advanced Mastery'
                        : 'Elite Prestige'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-xs text-orange-300 space-y-1">
              <span className="font-bold block">XP Calculation Breakdown:</span>
              <ul className="list-disc pl-4 text-[11px] text-zinc-300 space-y-0.5">
                <li>+20 XP for every completed set</li>
                <li>+2 XP per rep or hold second completed</li>
                <li>+50 XP bonus for exceeding previous workout's peak rep/hold set</li>
                <li>+40 XP bonus for completing more sets than previous workout</li>
                <li>+20 XP bonus for full set adherence</li>
              </ul>
            </div>

            <button
              onClick={() => setShowRoadmapModal(false)}
              className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
