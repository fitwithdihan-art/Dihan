import { AppData, ExerciseMastery } from '../types';
import { computeAllMasteries, getLevelInfo } from './mastery';
import { EXERCISES } from '../data/exercises';

export type BadgeTier =
  | 'copper'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'red_diamond'
  | 'cosmic_obsidian';

export interface AthleteRankItem {
  id: string;
  title: string;
  category: 'overall' | 'exercise' | 'progression' | 'streak' | 'prs' | 'honorary';
  tier: BadgeTier;
  levelScore: number;
  description: string;
  badgeIcon: string;
  isUnlocked: boolean;
}

export const TIER_CONFIG: Record<
  BadgeTier,
  {
    name: string;
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    shadowClass: string;
    gradientClass: string;
    icon: string;
  }
> = {
  copper: {
    name: 'Copper',
    label: 'Novice',
    bgClass: 'bg-amber-950/40',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-800/60',
    shadowClass: 'shadow-amber-950/30',
    gradientClass: 'from-amber-700/20 to-amber-950/40',
    icon: '🥉',
  },
  bronze: {
    name: 'Bronze',
    label: 'Apprentice',
    bgClass: 'bg-orange-950/40',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-700/60',
    shadowClass: 'shadow-amber-900/30',
    gradientClass: 'from-amber-600/20 to-orange-950/40',
    icon: '🥉',
  },
  silver: {
    name: 'Silver',
    label: 'Practitioner',
    bgClass: 'bg-slate-900/60',
    textClass: 'text-slate-200',
    borderClass: 'border-slate-500/60',
    shadowClass: 'shadow-slate-700/20',
    gradientClass: 'from-slate-400/20 to-slate-800/40',
    icon: '🥈',
  },
  gold: {
    name: 'Gold',
    label: 'Adept / Skilled',
    bgClass: 'bg-yellow-950/40',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/60',
    shadowClass: 'shadow-yellow-500/20',
    gradientClass: 'from-yellow-500/25 to-amber-900/40',
    icon: '🥇',
  },
  platinum: {
    name: 'Platinum',
    label: 'Elite Specialist',
    bgClass: 'bg-cyan-950/40',
    textClass: 'text-cyan-300',
    borderClass: 'border-cyan-400/60',
    shadowClass: 'shadow-cyan-500/20',
    gradientClass: 'from-cyan-400/25 to-blue-950/40',
    icon: '💠',
  },
  diamond: {
    name: 'Diamond',
    label: 'Master of Bars',
    bgClass: 'bg-sky-950/50',
    textClass: 'text-sky-300 font-black',
    borderClass: 'border-sky-400/80',
    shadowClass: 'shadow-sky-500/30',
    gradientClass: 'from-sky-400/30 via-indigo-500/20 to-sky-950/50',
    icon: '💎',
  },
  red_diamond: {
    name: 'Red Diamond',
    label: 'Grandmaster Champion',
    bgClass: 'bg-rose-950/50',
    textClass: 'text-rose-400 font-black',
    borderClass: 'border-rose-500/80',
    shadowClass: 'shadow-rose-500/30',
    gradientClass: 'from-rose-500/30 via-red-600/20 to-rose-950/50',
    icon: '🩸',
  },
  cosmic_obsidian: {
    name: 'Cosmic Obsidian',
    label: 'Calisthenics Legend',
    bgClass: 'bg-purple-950/60',
    textClass: 'text-purple-300 font-black',
    borderClass: 'border-purple-400/90',
    shadowClass: 'shadow-purple-500/40',
    gradientClass: 'from-purple-600/30 via-fuchsia-600/20 to-zinc-950',
    icon: '👑',
  },
};

/**
 * Computes all ranks an athlete has earned based on workouts, PRs, and progressions.
 */
export function getEarnedRanks(appData: AppData): AthleteRankItem[] {
  const ranks: AthleteRankItem[] = [];
  const sessions = appData.sessions || [];
  const totalWorkouts = sessions.length;
  const prs = appData.prs || [];
  const progressions = appData.progressions || [];

  // Calculate total volume and reps
  let totalReps = 0;
  sessions.forEach((s) => {
    totalReps += s.totalVolumeReps || 0;
  });

  // Calculate current streak
  let streak = 0;
  if (sessions.length > 0) {
    const sorted = [...sessions].sort((a, b) => b.startTime - a.startTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastSessionDate = new Date(sorted[0].startTime);
    lastSessionDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      streak = Math.min(sorted.length, Math.max(1, diffDays === 0 ? 1 : 2));
    }
  }

  // 1. Overall Workout Count & Experience Ranks
  if (totalWorkouts >= 150) {
    ranks.push({
      id: 'rank_cosmic_legend',
      title: 'Cosmic Obsidian Legend',
      category: 'overall',
      tier: 'cosmic_obsidian',
      levelScore: 100,
      description: 'Completed 150+ calisthenics sessions. Absolute master of gravity.',
      badgeIcon: '👑',
      isUnlocked: true,
    });
  }
  if (totalWorkouts >= 100) {
    ranks.push({
      id: 'rank_red_diamond',
      title: 'Red Diamond Champion',
      category: 'overall',
      tier: 'red_diamond',
      levelScore: 90,
      description: 'Completed 100+ lifetime workouts. Certified bar warrior.',
      badgeIcon: '🩸',
      isUnlocked: true,
    });
  }
  if (totalWorkouts >= 60) {
    ranks.push({
      id: 'rank_diamond_master',
      title: 'Diamond Master of Bars',
      category: 'overall',
      tier: 'diamond',
      levelScore: 80,
      description: 'Completed 60+ workouts with progressive overload mastery.',
      badgeIcon: '💎',
      isUnlocked: true,
    });
  }
  if (totalWorkouts >= 35) {
    ranks.push({
      id: 'rank_platinum_elite',
      title: 'Platinum Calisthenics Elite',
      category: 'overall',
      tier: 'platinum',
      levelScore: 70,
      description: 'Completed 35+ workouts across skills and strength routines.',
      badgeIcon: '💠',
      isUnlocked: true,
    });
  }
  if (totalWorkouts >= 18) {
    ranks.push({
      id: 'rank_gold_adept',
      title: 'Gold Adept Athlete',
      category: 'overall',
      tier: 'gold',
      levelScore: 55,
      description: 'Completed 18+ workouts. Established discipline and strict form.',
      badgeIcon: '🥇',
      isUnlocked: true,
    });
  }
  if (totalWorkouts >= 8) {
    ranks.push({
      id: 'rank_silver_practitioner',
      title: 'Silver Practitioner',
      category: 'overall',
      tier: 'silver',
      levelScore: 40,
      description: 'Completed 8+ workouts. Solid foundational momentum.',
      badgeIcon: '🥈',
      isUnlocked: true,
    });
  }
  if (totalWorkouts >= 3) {
    ranks.push({
      id: 'rank_bronze_apprentice',
      title: 'Bronze Apprentice',
      category: 'overall',
      tier: 'bronze',
      levelScore: 25,
      description: 'Completed 3+ structured workouts. On the path to greatness.',
      badgeIcon: '🥉',
      isUnlocked: true,
    });
  }

  // Base starter rank always unlocked
  ranks.push({
    id: 'rank_novice_striker',
    title: 'Novice Bar Striker',
    category: 'overall',
    tier: 'copper',
    levelScore: 10,
    description: 'Began the calisthenics journey. Ready to conquer bodyweight strength.',
    badgeIcon: '🥉',
    isUnlocked: true,
  });

  // 2. Exercise Mastery Ranks
  const masteries = computeAllMasteries(sessions);
  Object.values(masteries).forEach((m) => {
    if (m.level >= 2) {
      const ex = EXERCISES.find((e) => e.id === m.exerciseId);
      const exName = ex?.name || 'Movement';
      ranks.push({
        id: `mastery_${m.exerciseId}_${m.level}`,
        title: `${exName} ${m.rankTitle}`,
        category: 'exercise',
        tier: m.badgeTier,
        levelScore: 20 + m.level * 6,
        description: `Reached Level ${m.level} in ${exName} with ${m.totalXp} XP earned.`,
        badgeIcon: m.badgeTier === 'diamond' || m.badgeTier === 'cosmic_obsidian' ? '💎' : '⚡',
        isUnlocked: true,
      });
    }
  });

  // 3. Progression Milestone Ranks
  progressions.forEach((tree) => {
    if (tree.currentLevel >= 3) {
      const milestone = tree.milestones[tree.currentLevel - 1];
      const tier: BadgeTier =
        tree.currentLevel >= 5 ? 'diamond' : tree.currentLevel >= 4 ? 'platinum' : 'gold';
      ranks.push({
        id: `prog_${tree.id}_${tree.currentLevel}`,
        title: `${tree.title} ${milestone ? milestone.name : 'Master'}`,
        category: 'progression',
        tier,
        levelScore: 30 + tree.currentLevel * 10,
        description: `Unlocked Milestone ${tree.currentLevel}: ${milestone?.name || tree.title}`,
        badgeIcon: '🧗',
        isUnlocked: true,
      });
    }
  });

  // 4. Streak Ranks
  if (streak >= 14) {
    ranks.push({
      id: 'streak_14_titan',
      title: 'Fortnight Titan Streak',
      category: 'streak',
      tier: 'platinum',
      levelScore: 65,
      description: '14+ Day unbroken workout training streak.',
      badgeIcon: '🔥',
      isUnlocked: true,
    });
  } else if (streak >= 7) {
    ranks.push({
      id: 'streak_7_warrior',
      title: '7-Day Streak Warrior',
      category: 'streak',
      tier: 'gold',
      levelScore: 50,
      description: '7-Day uninterrupted calisthenics workout streak.',
      badgeIcon: '🔥',
      isUnlocked: true,
    });
  } else if (streak >= 3) {
    ranks.push({
      id: 'streak_3_ignited',
      title: 'Ignited 3-Day Momentum',
      category: 'streak',
      tier: 'silver',
      levelScore: 30,
      description: '3+ consecutive training days.',
      badgeIcon: '⚡',
      isUnlocked: true,
    });
  }

  // 5. PR Volume / Reps Milestones
  if (totalReps >= 1000) {
    ranks.push({
      id: 'volume_1000_beast',
      title: '1,000 Reps Iron Beast',
      category: 'prs',
      tier: 'diamond',
      levelScore: 75,
      description: 'Accumulated over 1,000 lifetime reps across all calisthenics exercises.',
      badgeIcon: '🏆',
      isUnlocked: true,
    });
  } else if (totalReps >= 500) {
    ranks.push({
      id: 'volume_500_centurion',
      title: '500 Reps Bar Centurion',
      category: 'prs',
      tier: 'gold',
      levelScore: 52,
      description: 'Surpassed 500 lifetime clean reps.',
      badgeIcon: '🎖️',
      isUnlocked: true,
    });
  }

  if (prs.length >= 5) {
    ranks.push({
      id: 'prs_5_shredder',
      title: '5x PR Record Breaker',
      category: 'prs',
      tier: 'platinum',
      levelScore: 68,
      description: 'Smashed 5 distinct personal records.',
      badgeIcon: '🚀',
      isUnlocked: true,
    });
  }

  // Sort by highest levelScore descending
  ranks.sort((a, b) => b.levelScore - a.levelScore);

  return ranks;
}

/**
 * Gets the current best rank for the athlete.
 * If user selected a custom best rank in userPreferences, matches that or uses it.
 * Otherwise returns the highest earned rank.
 */
export function getActiveBestRank(
  appData: AppData,
  earnedRanks?: AthleteRankItem[]
): {
  title: string;
  tier: BadgeTier;
  badgeIcon: string;
  description: string;
} {
  const allEarned = earnedRanks || getEarnedRanks(appData);
  const highest = allEarned[0] || {
    title: 'Novice Bar Striker',
    tier: 'copper' as BadgeTier,
    badgeIcon: '🥉',
    description: 'Starting calisthenics journey.',
  };

  // If user selected a specific rank
  if (appData.userPreferences.bestRank) {
    const match = allEarned.find((r) => r.title === appData.userPreferences.bestRank);
    if (match) {
      return {
        title: match.title,
        tier: match.tier,
        badgeIcon: match.badgeIcon,
        description: match.description,
      };
    }
    // Custom rank title provided by user
    return {
      title: appData.userPreferences.bestRank,
      tier: appData.userPreferences.bestRankTier || highest.tier,
      badgeIcon: '⭐',
      description: 'Custom athlete showcased rank title.',
    };
  }

  return {
    title: highest.title,
    tier: highest.tier,
    badgeIcon: highest.badgeIcon,
    description: highest.description,
  };
}
