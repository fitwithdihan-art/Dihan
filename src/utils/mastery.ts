import { ExerciseLevelUpEvent, ExerciseMastery, WorkoutExerciseLog, WorkoutSession } from '../types';
import { EXERCISES } from '../data/exercises';

// Level thresholds progression
// Each bracket defines the start XP of that level
export const LEVEL_THRESHOLDS = [
  0,     // Level 1: 0 XP
  120,   // Level 2: 120 XP (+120)
  280,   // Level 3: 280 XP (+160)
  480,   // Level 4: 480 XP (+200)
  740,   // Level 5: 740 XP (+260)
  1060,  // Level 6: 1060 XP (+320)
  1460,  // Level 7: 1460 XP (+400)
  1960,  // Level 8: 1960 XP (+500)
  2600,  // Level 9: 2600 XP (+640)
  3400,  // Level 10: 3400 XP (+800)
];

export const RANK_TITLES: Record<number, string> = {
  1: 'Novice',
  2: 'Apprentice',
  3: 'Practitioner',
  4: 'Adept',
  5: 'Skilled',
  6: 'Expert',
  7: 'Specialist',
  8: 'Elite',
  9: 'Master',
  10: 'Grandmaster',
};

export function getLevelInfo(totalXp: number): {
  level: number;
  currentLevelXp: number;
  xpNeededForLevel: number;
  progressPercent: number;
  rankTitle: string;
  badgeTier: 'copper' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'red_diamond' | 'cosmic_obsidian';
} {
  const safeXp = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;

  // Determine level
  let level = 1;
  while (level < 100) {
    const nextThreshold = getThresholdForLevel(level + 1);
    if (safeXp >= nextThreshold) {
      level += 1;
    } else {
      break;
    }
  }

  const currentLevelBase = getThresholdForLevel(level);
  const nextLevelThreshold = getThresholdForLevel(level + 1);
  const xpNeededForLevel = Math.max(1, nextLevelThreshold - currentLevelBase);
  const currentLevelXp = Math.max(0, safeXp - currentLevelBase);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentLevelXp / xpNeededForLevel) * 100) || 0));

  const rankTitle = RANK_TITLES[Math.min(10, level)] || `Grandmaster ${level - 10}`;

  let badgeTier: 'copper' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'red_diamond' | 'cosmic_obsidian' = 'copper';
  if (level >= 13) badgeTier = 'cosmic_obsidian';
  else if (level >= 11) badgeTier = 'red_diamond';
  else if (level >= 9) badgeTier = 'diamond';
  else if (level >= 7) badgeTier = 'platinum';
  else if (level >= 5) badgeTier = 'gold';
  else if (level >= 3) badgeTier = 'silver';
  else if (level >= 2) badgeTier = 'bronze';

  return {
    level,
    currentLevelXp,
    xpNeededForLevel,
    progressPercent,
    rankTitle,
    badgeTier,
  };
}

export function getThresholdForLevel(lvl: number): number {
  if (lvl <= 1) return 0;
  if (lvl <= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[lvl - 1];
  }
  // Above level 10: each subsequent level requires 1200 XP
  const base10 = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]; // 3400 for level 10
  const lvl11Threshold = 4400; // 1000 for level 10 -> 11
  return lvl11Threshold + (lvl - 11) * 1200;
}

export interface ExerciseSessionXpResult {
  totalXp: number;
  baseSetsXp: number;
  volumeXp: number;
  weightXp: number;
  overloadRepBonus: number;
  overloadSetBonus: number;
  overloadVolumeBonus: number;
  cleanCompletionBonus: number;
  overloadReasons: string[];
  completedSetsCount: number;
  sessionVolume: number;
  bestSetVal: number;
}

/**
 * Calculates XP earned for an individual exercise in a single workout session,
 * specifically awarding massive bonuses when the user increases their reps or sets!
 */
export function calculateExerciseSessionXp(
  log: WorkoutExerciseLog,
  prevLog?: WorkoutExerciseLog
): ExerciseSessionXpResult {
  const exDef = EXERCISES.find((e) => e.id === log.exerciseId);
  const isHold = exDef?.type === 'hold_seconds';

  const completedSets = log.sets.filter((s) => s.isCompleted && s.completedRepsOrSecs > 0);
  const completedSetsCount = completedSets.length;

  if (completedSetsCount === 0) {
    return {
      totalXp: 0,
      baseSetsXp: 0,
      volumeXp: 0,
      weightXp: 0,
      overloadRepBonus: 0,
      overloadSetBonus: 0,
      overloadVolumeBonus: 0,
      cleanCompletionBonus: 0,
      overloadReasons: [],
      completedSetsCount: 0,
      sessionVolume: 0,
      bestSetVal: 0,
    };
  }

  // 1. Base Set Completion XP: 20 XP per clean completed set
  const baseSetsXp = completedSetsCount * 20;

  // 2. Volume XP: 2 XP per rep, or 1 XP per 2 seconds of hold
  let sessionVolume = 0;
  let weightXp = 0;
  let bestSetVal = 0;

  completedSets.forEach((s) => {
    sessionVolume += s.completedRepsOrSecs;
    if (s.completedRepsOrSecs > bestSetVal) {
      bestSetVal = s.completedRepsOrSecs;
    }
    if (s.weightKg && s.weightKg > 0) {
      weightXp += Math.round(s.weightKg * 3);
    }
  });

  const volumeXp = isHold ? Math.round(sessionVolume * 0.75) : sessionVolume * 2;

  // 3. Progressive Overload Bonuses: did reps or sets increase compared to previous session?
  let overloadRepBonus = 0;
  let overloadSetBonus = 0;
  let overloadVolumeBonus = 0;
  const overloadReasons: string[] = [];

  if (prevLog) {
    const prevCompletedSets = prevLog.sets.filter((s) => s.isCompleted && s.completedRepsOrSecs > 0);
    const prevSetsCount = prevCompletedSets.length;
    let prevVolume = 0;
    let prevBestSet = 0;

    prevCompletedSets.forEach((s) => {
      prevVolume += s.completedRepsOrSecs;
      if (s.completedRepsOrSecs > prevBestSet) {
        prevBestSet = s.completedRepsOrSecs;
      }
    });

    // Increased Reps in a Set Overload Bonus
    if (bestSetVal > prevBestSet && prevBestSet > 0) {
      const diff = bestSetVal - prevBestSet;
      overloadRepBonus = 50 + Math.min(30, diff * 5);
      overloadReasons.push(`+${diff} ${isHold ? 'sec' : 'rep'} Peak Set Overload (+${overloadRepBonus} XP)`);
    }

    // Increased Sets Overload Bonus
    if (completedSetsCount > prevSetsCount && prevSetsCount > 0) {
      const diff = completedSetsCount - prevSetsCount;
      overloadSetBonus = 40 + Math.min(30, diff * 15);
      overloadReasons.push(`+${diff} Extra Set Overload (+${overloadSetBonus} XP)`);
    }

    // Increased Total Session Volume Overload Bonus
    if (sessionVolume > prevVolume && prevVolume > 0) {
      const diff = sessionVolume - prevVolume;
      overloadVolumeBonus = 60;
      overloadReasons.push(`+${diff} ${isHold ? 'sec' : 'rep'} Total Volume Overload (+60 XP)`);
    }
  } else {
    // First time completing this exercise: give a starter discovery bonus
    overloadReasons.push('First Workout Logged (+30 XP Discovery)');
    overloadRepBonus = 30;
  }

  // 4. Clean Completion Bonus (3+ sets completed with consistency)
  let cleanCompletionBonus = 0;
  if (completedSetsCount >= 3 && log.sets.every((s) => s.isCompleted)) {
    cleanCompletionBonus = 30;
    overloadReasons.push('100% Set Completion Bonus (+30 XP)');
  }

  const totalXp =
    baseSetsXp +
    volumeXp +
    weightXp +
    overloadRepBonus +
    overloadSetBonus +
    overloadVolumeBonus +
    cleanCompletionBonus;

  return {
    totalXp,
    baseSetsXp,
    volumeXp,
    weightXp,
    overloadRepBonus,
    overloadSetBonus,
    overloadVolumeBonus,
    cleanCompletionBonus,
    overloadReasons,
    completedSetsCount,
    sessionVolume,
    bestSetVal,
  };
}

/**
 * Computes the mastery stats and level for a single exercise across all historic sessions.
 */
export function computeExerciseMastery(
  exerciseId: string,
  sessions: WorkoutSession[]
): ExerciseMastery {
  // Sort sessions chronologically (oldest to newest)
  const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime);

  let accumulatedXp = 0;
  let totalLifetimeSets = 0;
  let totalLifetimeRepsOrSecs = 0;
  let bestSetRepsOrSecs = 0;
  let bestSessionVolume = 0;
  let lastSessionReps = 0;
  let lastSessionSets = 0;
  let overloadCount = 0;

  let prevExerciseLog: WorkoutExerciseLog | undefined;

  sorted.forEach((session) => {
    const exLog = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!exLog) return;

    const result = calculateExerciseSessionXp(exLog, prevExerciseLog);
    if (result.completedSetsCount > 0) {
      accumulatedXp += result.totalXp;
      totalLifetimeSets += result.completedSetsCount;
      totalLifetimeRepsOrSecs += result.sessionVolume;

      if (result.bestSetVal > bestSetRepsOrSecs) {
        bestSetRepsOrSecs = result.bestSetVal;
      }
      if (result.sessionVolume > bestSessionVolume) {
        bestSessionVolume = result.sessionVolume;
      }

      if (result.overloadRepBonus > 0 || result.overloadSetBonus > 0 || result.overloadVolumeBonus > 0) {
        overloadCount += 1;
      }

      lastSessionReps = result.sessionVolume;
      lastSessionSets = result.completedSetsCount;
      prevExerciseLog = exLog;
    }
  });

  const levelInfo = getLevelInfo(accumulatedXp);

  return {
    exerciseId,
    level: levelInfo.level,
    totalXp: accumulatedXp,
    currentLevelXp: levelInfo.currentLevelXp,
    xpNeededForLevel: levelInfo.xpNeededForLevel,
    progressPercent: levelInfo.progressPercent,
    rankTitle: levelInfo.rankTitle,
    badgeTier: levelInfo.badgeTier,
    totalLifetimeRepsOrSecs,
    totalLifetimeSets,
    bestSetRepsOrSecs,
    bestSessionVolume,
    lastSessionReps: lastSessionReps > 0 ? lastSessionReps : undefined,
    lastSessionSets: lastSessionSets > 0 ? lastSessionSets : undefined,
    overloadCount,
  };
}

/**
 * Computes mastery records for all exercises in the library.
 */
export function computeAllMasteries(sessions: WorkoutSession[]): Record<string, ExerciseMastery> {
  const masteries: Record<string, ExerciseMastery> = {};
  EXERCISES.forEach((ex) => {
    masteries[ex.id] = computeExerciseMastery(ex.id, sessions);
  });
  return masteries;
}

export interface SessionLevelUpEvaluation {
  leveledUpEvents: ExerciseLevelUpEvent[];
  totalXpEarned: number;
  exerciseBreakdowns: Array<{
    exerciseId: string;
    exerciseName: string;
    xpEarned: number;
    oldLevel: number;
    newLevel: number;
    overloadReasons: string[];
  }>;
}

/**
 * Evaluates whether any exercise in the newly completed session leveled up,
 * comparing state before the session with state after the session.
 */
export function evaluateSessionLevelUps(
  currentSession: WorkoutSession,
  pastSessions: WorkoutSession[]
): SessionLevelUpEvaluation {
  const leveledUpEvents: ExerciseLevelUpEvent[] = [];
  let totalXpEarned = 0;
  const exerciseBreakdowns: SessionLevelUpEvaluation['exerciseBreakdowns'] = [];

  const sessionsBefore = pastSessions.filter((s) => s.id !== currentSession.id);
  const sessionsAfter = [currentSession, ...sessionsBefore];

  currentSession.exercises.forEach((exLog) => {
    const exDef = EXERCISES.find((e) => e.id === exLog.exerciseId);
    if (!exDef) return;

    const beforeMastery = computeExerciseMastery(exLog.exerciseId, sessionsBefore);
    const afterMastery = computeExerciseMastery(exLog.exerciseId, sessionsAfter);

    const xpDiff = afterMastery.totalXp - beforeMastery.totalXp;
    totalXpEarned += xpDiff;

    // Find previous session's log for this exercise to get overload reasons
    let prevLog: WorkoutExerciseLog | undefined;
    for (const s of sessionsBefore) {
      const match = s.exercises.find((e) => e.exerciseId === exLog.exerciseId);
      if (match && match.sets.some((set) => set.isCompleted)) {
        prevLog = match;
        break;
      }
    }

    const sessionXpCalc = calculateExerciseSessionXp(exLog, prevLog);

    exerciseBreakdowns.push({
      exerciseId: exLog.exerciseId,
      exerciseName: exDef.name,
      xpEarned: xpDiff,
      oldLevel: beforeMastery.level,
      newLevel: afterMastery.level,
      overloadReasons: sessionXpCalc.overloadReasons,
    });

    if (afterMastery.level > beforeMastery.level) {
      leveledUpEvents.push({
        exerciseId: exLog.exerciseId,
        exerciseName: exDef.name,
        previousLevel: beforeMastery.level,
        newLevel: afterMastery.level,
        previousTitle: beforeMastery.rankTitle,
        newTitle: afterMastery.rankTitle,
        totalXpGained: xpDiff,
        overloadReasons: sessionXpCalc.overloadReasons,
      });
    }
  });

  return {
    leveledUpEvents,
    totalXpEarned,
    exerciseBreakdowns,
  };
}

/**
 * Computes mastery statistics for all exercises in the library.
 */
export function getAllExerciseMasteries(sessions: WorkoutSession[]): ExerciseMastery[] {
  return EXERCISES.map((ex) => computeExerciseMastery(ex.id, sessions));
}
