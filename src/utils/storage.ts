import { AppData, PersonalRecord, Routine, WorkoutSession } from '../types';
import { DEFAULT_ROUTINES } from '../data/defaultRoutines';
import { DEFAULT_PROGRESSIONS } from '../data/progressions';
import { INITIAL_PRS, INITIAL_SESSIONS } from '../data/sampleData';

const STORAGE_KEY = 'calisthenics_tracker_v1';
const CURRENT_VERSION = 1;

export const DEFAULT_APP_DATA: AppData = {
  version: CURRENT_VERSION,
  routines: DEFAULT_ROUTINES,
  sessions: INITIAL_SESSIONS,
  progressions: DEFAULT_PROGRESSIONS,
  prs: INITIAL_PRS,
  userPreferences: {
    unit: 'kg',
    defaultRestSeconds: 90,
    soundEnabled: true,
    vibrateEnabled: true,
    athleteName: 'Athlete',
    autoRestTimerEnabled: true,
  },
  coins: 100,
  unlockedThemes: ['orange_dark'],
  activeTheme: 'orange_dark',
};

export function loadAppData(): AppData {
  if (typeof window === 'undefined') return DEFAULT_APP_DATA;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveAppData(DEFAULT_APP_DATA);
      return DEFAULT_APP_DATA;
    }

    const parsed = JSON.parse(raw) as Partial<AppData>;
    
    // Merge new default routines and progressions if missing from saved state
    const savedRoutines = Array.isArray(parsed.routines) ? parsed.routines : [];
    const savedRoutineIds = new Set(savedRoutines.map((r) => r.id));
    const mergedRoutines = [
      ...savedRoutines,
      ...DEFAULT_ROUTINES.filter((r) => !savedRoutineIds.has(r.id)),
    ];

    const savedProgressions = Array.isArray(parsed.progressions) ? parsed.progressions : [];
    const savedProgIds = new Set(savedProgressions.map((p) => p.id));
    const mergedProgressions = [
      ...savedProgressions,
      ...DEFAULT_PROGRESSIONS.filter((p) => !savedProgIds.has(p.id)),
    ];

    // Ensure all critical properties are present
    const updatedData: AppData = {
      version: CURRENT_VERSION,
      routines: mergedRoutines.length > 0 ? mergedRoutines : DEFAULT_ROUTINES,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : INITIAL_SESSIONS,
      progressions: mergedProgressions.length > 0 ? mergedProgressions : DEFAULT_PROGRESSIONS,
      prs: Array.isArray(parsed.prs) ? parsed.prs : INITIAL_PRS,
      userPreferences: {
        ...DEFAULT_APP_DATA.userPreferences,
        ...(parsed.userPreferences || {}),
      },
      customExercises: Array.isArray(parsed.customExercises) ? parsed.customExercises : [],
      coins: typeof parsed.coins === 'number' ? parsed.coins : 100,
      unlockedThemes: Array.isArray(parsed.unlockedThemes) ? parsed.unlockedThemes : ['orange_dark'],
      activeTheme: typeof parsed.activeTheme === 'string' ? parsed.activeTheme : 'orange_dark',
    };

    return updatedData;
  } catch (err) {
    console.error('Failed to parse stored calisthenics app data:', err);
    return DEFAULT_APP_DATA;
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save calisthenics app data to localStorage:', err);
  }
}

export function exportAppDataAsJson(data: AppData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calisthenics-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importAppDataFromJson(jsonString: string): AppData {
  const parsed = JSON.parse(jsonString) as Partial<AppData>;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup file format');
  }

  const validData: AppData = {
    version: CURRENT_VERSION,
    routines: Array.isArray(parsed.routines) ? parsed.routines : DEFAULT_ROUTINES,
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    progressions: Array.isArray(parsed.progressions) ? parsed.progressions : DEFAULT_PROGRESSIONS,
    prs: Array.isArray(parsed.prs) ? parsed.prs : [],
    userPreferences: {
      ...DEFAULT_APP_DATA.userPreferences,
      ...(parsed.userPreferences || {}),
    },
    customExercises: Array.isArray(parsed.customExercises) ? parsed.customExercises : [],
    coins: typeof parsed.coins === 'number' ? parsed.coins : 100,
    unlockedThemes: Array.isArray(parsed.unlockedThemes) ? parsed.unlockedThemes : ['orange_dark'],
    activeTheme: typeof parsed.activeTheme === 'string' ? parsed.activeTheme : 'orange_dark',
  };

  saveAppData(validData);
  return validData;
}

// PR Checker utility
export function checkAndRegisterPRs(
  session: WorkoutSession,
  existingPRs: PersonalRecord[]
): { updatedPRs: PersonalRecord[]; newPRDescriptions: string[] } {
  const newPRDescriptions: string[] = [];
  const updatedPRs = [...existingPRs];

  session.exercises.forEach((exLog) => {
    exLog.sets.forEach((s) => {
      if (!s.isCompleted || s.completedRepsOrSecs <= 0) return;

      // Check max reps / hold
      const existingRecord = updatedPRs.find((p) => p.exerciseId === exLog.exerciseId && p.recordType !== 'max_weight_reps');
      if (existingRecord) {
        if (s.completedRepsOrSecs > existingRecord.value) {
          const prev = existingRecord.value;
          existingRecord.previousValue = prev;
          existingRecord.value = s.completedRepsOrSecs;
          existingRecord.achievedAt = Date.now();
          newPRDescriptions.push(`${existingRecord.exerciseName}: ${s.completedRepsOrSecs} (beat previous ${prev})`);
        }
      }

      // Check added weight record
      if (s.weightKg && s.weightKg > 0) {
        const existingWeightRecord = updatedPRs.find((p) => p.exerciseId === exLog.exerciseId && p.recordType === 'max_weight_reps');
        if (existingWeightRecord) {
          if (s.weightKg > existingWeightRecord.value) {
            const prev = existingWeightRecord.value;
            existingWeightRecord.previousValue = prev;
            existingWeightRecord.value = s.weightKg;
            existingWeightRecord.secondaryValue = s.completedRepsOrSecs;
            existingWeightRecord.achievedAt = Date.now();
            newPRDescriptions.push(`${existingWeightRecord.exerciseName}: +${s.weightKg}kg for ${s.completedRepsOrSecs} reps (beat +${prev}kg)`);
          }
        }
      }
    });
  });

  return { updatedPRs, newPRDescriptions };
}
