export type ExerciseCategory = 'push' | 'pull' | 'core' | 'legs' | 'skills' | 'handstand';

export type MeasurementType = 'reps' | 'hold_seconds';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  type: MeasurementType;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  progressionFamily?: string;
  progressionLevel?: number; // 1 to N in the ladder
  description: string;
  formCues: string[];
  supportsAddedWeight: boolean;
  supportsAssistance: boolean;
  isCustom?: boolean;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: 'normal' | 'warmup' | 'drop' | 'failure';
  targetRepsOrSecs: number;
  completedRepsOrSecs: number;
  weightKg?: number; // added weight (+kg) or negative for assistance
  isCompleted: boolean;
  rpe?: number; // Rate of Perceived Exertion 1-10
  notes?: string;
}

export interface WorkoutExerciseLog {
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
  restTimerSeconds?: number;
}

export interface RoutineItem {
  exerciseId: string;
  defaultSets: number;
  defaultTargetRepsOrSecs: number;
  defaultRestSeconds: number;
  notes?: string;
  targetRpe?: number;
}

export interface Routine {
  id: string;
  title: string;
  description: string;
  category: 'full_body' | 'upper' | 'lower' | 'skills' | 'core' | 'custom';
  estimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  items: RoutineItem[];
  isCustom?: boolean;
  scheduleDays?: string[];
  tags?: string[];
}

export interface WorkoutSession {
  id: string;
  routineId?: string;
  routineTitle: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  exercises: WorkoutExerciseLog[];
  notes?: string;
  rating?: 1 | 2 | 3 | 4 | 5; // how felt
  totalVolumeReps: number;
  totalHoldSeconds: number;
  totalSetsCompleted: number;
  prsAchieved?: string[];
  levelUpsAchieved?: ExerciseLevelUpEvent[];
  xpEarned?: number;
}

export interface ExerciseMastery {
  exerciseId: string;
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpNeededForLevel: number;
  progressPercent: number;
  rankTitle: string;
  badgeTier: 'copper' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'red_diamond' | 'cosmic_obsidian';
  totalLifetimeRepsOrSecs: number;
  totalLifetimeSets: number;
  bestSetRepsOrSecs: number;
  bestSessionVolume: number;
  lastSessionReps?: number;
  lastSessionSets?: number;
  overloadCount: number;
}

export interface ExerciseLevelUpEvent {
  exerciseId: string;
  exerciseName: string;
  previousLevel: number;
  newLevel: number;
  previousTitle: string;
  newTitle: string;
  totalXpGained: number;
  overloadReasons: string[];
}

export interface ProgressionMilestone {
  level: number;
  name: string;
  exerciseId: string;
  masteryRequirement: string;
  description: string;
  keyCues: string[];
}

export interface ProgressionTree {
  id: string;
  title: string;
  category: ExerciseCategory;
  description: string;
  iconName: string;
  currentLevel: number; // 1-indexed milestone reached
  milestones: ProgressionMilestone[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  recordType: 'max_reps' | 'max_hold' | 'max_weight_reps';
  value: number; // reps or seconds or added weight
  secondaryValue?: number; // e.g. reps if max_weight
  achievedAt: number; // timestamp
  previousValue?: number;
}

export interface UserPreferences {
  unit: 'kg' | 'lbs';
  defaultRestSeconds: number;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  athleteName: string;
  autoRestTimerEnabled?: boolean;
}

export interface AppData {
  version: number;
  routines: Routine[];
  sessions: WorkoutSession[];
  progressions: ProgressionTree[];
  prs: PersonalRecord[];
  userPreferences: UserPreferences;
  customExercises?: Exercise[];
  coins?: number;
  unlockedThemes?: string[];
  activeTheme?: string;
}
