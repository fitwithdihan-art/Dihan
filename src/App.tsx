import React, { useState, useEffect } from 'react';
import { AppData, Exercise, PersonalRecord, Routine, UserPreferences, WorkoutSession } from './types';
import {
  loadAppData,
  saveAppData,
  exportAppDataAsJson,
  importAppDataFromJson,
  DEFAULT_APP_DATA,
  checkAndRegisterPRs,
} from './utils/storage';
import { setCustomExercises } from './data/exercises';
import { Navbar, ActiveTab } from './components/Navbar';
import { RoutinesView } from './components/RoutinesView';
import { ProgressionsView } from './components/ProgressionsView';
import { HistoryView } from './components/HistoryView';
import { PRsAndStatsView } from './components/PRsAndStatsView';
import { WorkoutActive } from './components/WorkoutActive';
import { RoutineEditorModal } from './components/RoutineEditorModal';
import { THEMES } from './utils/theme';
import { ThemeShopModal } from './components/ThemeShopModal';

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => {
    const loaded = loadAppData();
    setCustomExercises(loaded.customExercises || []);
    return loaded;
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('routines');
  const [isThemeShopOpen, setIsThemeShopOpen] = useState<boolean>(false);

  // Keep global custom exercises list synchronized
  useEffect(() => {
    setCustomExercises(appData.customExercises || []);
  }, [appData.customExercises]);

  // Active workout state
  const [activeWorkout, setActiveWorkout] = useState<{
    routine?: Routine | null;
  } | null>(null);

  // Routine editor modal state
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [isRoutineEditorOpen, setIsRoutineEditorOpen] = useState<boolean>(false);

  // Sync to local storage on changes
  const updateAppData = (updater: (prev: AppData) => AppData) => {
    setAppData((prev) => {
      const next = updater(prev);
      saveAppData(next);
      return next;
    });
  };

  // Workout life-cycle handlers
  const handleStartRoutine = (routine: Routine) => {
    setActiveWorkout({ routine });
  };

  const handleStartFreeWorkout = () => {
    setActiveWorkout({ routine: null });
  };

  const handleFinishWorkout = (session: WorkoutSession) => {
    updateAppData((prev) => {
      // Check PRs
      const { updatedPRs, newPRDescriptions } = checkAndRegisterPRs(session, prev.prs);

      const sessionWithPRs: WorkoutSession = {
        ...session,
        prsAchieved: newPRDescriptions.length > 0 ? newPRDescriptions : undefined,
      };

      // 50 coins reward for completing workout session + 100 coins reward for each movement level-up achieved
      const levelUpsCount = session.levelUpsAchieved?.length || 0;
      const coinReward = 50 + (levelUpsCount * 100);

      return {
        ...prev,
        sessions: [sessionWithPRs, ...prev.sessions],
        prs: updatedPRs,
        coins: (prev.coins || 0) + coinReward,
      };
    });

    setActiveWorkout(null);
    setActiveTab('history');
  };

  const handleCancelWorkout = () => {
    setActiveWorkout(null);
  };

  // Progression level handler
  const handleUpdateProgressionLevel = (treeId: string, newLevel: number) => {
    updateAppData((prev) => {
      const prevProg = prev.progressions.find((p) => p.id === treeId);
      const prevLevel = prevProg ? prevProg.currentLevel : 1;
      const gainedCoins = newLevel > prevLevel ? (newLevel - prevLevel) * 100 : 0;

      return {
        ...prev,
        progressions: prev.progressions.map((p) => (p.id === treeId ? { ...p, currentLevel: newLevel } : p)),
        coins: (prev.coins || 0) + gainedCoins,
      };
    });
  };

  // Routine Management
  const handleSaveRoutine = (routine: Routine) => {
    updateAppData((prev) => {
      const existingIdx = prev.routines.findIndex((r) => r.id === routine.id);
      let updatedRoutines: Routine[];
      if (existingIdx >= 0) {
        updatedRoutines = [...prev.routines];
        updatedRoutines[existingIdx] = routine;
      } else {
        updatedRoutines = [routine, ...prev.routines];
      }
      return { ...prev, routines: updatedRoutines };
    });
  };

  const handleDeleteRoutine = (routineId: string) => {
    updateAppData((prev) => ({
      ...prev,
      routines: prev.routines.filter((r) => r.id !== routineId),
    }));
  };

  // Custom Exercise Management
  const handleSaveCustomExercise = (exercise: Exercise) => {
    updateAppData((prev) => {
      const existingCustom = prev.customExercises || [];
      const idx = existingCustom.findIndex((e) => e.id === exercise.id);
      let updatedCustom: Exercise[];
      if (idx >= 0) {
        updatedCustom = [...existingCustom];
        updatedCustom[idx] = exercise;
      } else {
        updatedCustom = [exercise, ...existingCustom];
      }
      return { ...prev, customExercises: updatedCustom };
    });
  };

  // PR Management
  const handleAddPR = (pr: PersonalRecord) => {
    updateAppData((prev) => ({
      ...prev,
      prs: [pr, ...prev.prs],
    }));
  };

  const handleDeletePR = (prId: string) => {
    updateAppData((prev) => ({
      ...prev,
      prs: prev.prs.filter((p) => p.id !== prId),
    }));
  };

  // Session Delete & Update
  const handleDeleteSession = (sessionId: string) => {
    updateAppData((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }));
  };

  const handleUpdateSession = (updatedSession: WorkoutSession) => {
    updateAppData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
    }));
  };

  // Buy & Equip Theme handlers
  const handleBuyTheme = (themeId: string, price: number) => {
    updateAppData((prev) => ({
      ...prev,
      coins: (prev.coins || 0) - price,
      unlockedThemes: [...(prev.unlockedThemes || ['orange_dark']), themeId],
      activeTheme: themeId,
    }));
  };

  const handleEquipTheme = (themeId: string) => {
    updateAppData((prev) => ({
      ...prev,
      activeTheme: themeId,
    }));
  };

  // Preferences
  const handleUpdatePreferences = (prefs: Partial<UserPreferences>) => {
    updateAppData((prev) => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        ...prefs,
      },
    }));
  };

  // Export / Import / Reset
  const handleExportData = () => {
    exportAppDataAsJson(appData);
  };

  const handleImportData = (fileContent: string) => {
    const imported = importAppDataFromJson(fileContent);
    setAppData(imported);
    setCustomExercises(imported.customExercises || []);
  };

  const handleResetData = () => {
    saveAppData(DEFAULT_APP_DATA);
    setAppData(DEFAULT_APP_DATA);
    setCustomExercises([]);
  };

  // If in active workout mode, display full active workout interface
  if (activeWorkout) {
    const activeThemeId = appData.activeTheme || 'orange_dark';
    const theme = THEMES[activeThemeId] || THEMES.orange_dark;

    // Apply CSS variable overrides based on theme
    let cssOverrides = `
      :root {
        --color-orange-300: ${theme.overrideCyan300};
        --color-orange-400: ${theme.overrideCyan400};
        --color-orange-500: ${theme.overrideCyan500};
        --color-orange-600: ${theme.overrideCyan600};
        --color-orange-500-rgb: ${theme.overrideCyanRgb};
      }
    `;

    if (theme.isLight) {
      cssOverrides += `
        :root {
          --color-zinc-950: ${theme.overrideZincBackground || '#f4f4f5'};
          --color-zinc-900: ${theme.overrideZincCardBg || '#ffffff'};
          --color-zinc-850: ${theme.overrideZincBackground || '#f4f4f5'};
          --color-zinc-800: ${theme.overrideZincBorder || '#e4e4e7'};
          --color-zinc-750: ${theme.overrideZincBorder || '#e4e4e7'};
          --color-zinc-700: #d4d4d8;
          --color-zinc-100: ${theme.overrideZincText || '#18181b'};
          --color-zinc-200: #27272a;
          --color-zinc-300: #3f3f46;
          --color-zinc-400: #52525b;
          --color-zinc-500: ${theme.overrideZincTextMuted || '#71717a'};
        }
        body {
          background-color: ${theme.overrideZincBackground || '#fafafa'} !important;
          color: ${theme.overrideZincText || '#18181b'} !important;
        }
      `;
    }

    return (
      <div id="calisthenics-app-active-wrapper" className="min-h-screen bg-zinc-950 text-zinc-100">
        <style dangerouslySetInnerHTML={{ __html: cssOverrides }} />
        <WorkoutActive
          routine={activeWorkout.routine}
          pastSessions={appData.sessions}
          existingPRs={appData.prs}
          soundEnabled={appData.userPreferences.soundEnabled}
          onToggleSound={() =>
            handleUpdatePreferences({ soundEnabled: !appData.userPreferences.soundEnabled })
          }
          autoRestTimerEnabled={appData.userPreferences.autoRestTimerEnabled !== false}
          onToggleAutoRestTimer={() =>
            handleUpdatePreferences({ autoRestTimerEnabled: !appData.userPreferences.autoRestTimerEnabled })
          }
          weightUnit={appData.userPreferences.unit}
          onFinishWorkout={handleFinishWorkout}
          onCancelWorkout={handleCancelWorkout}
          customExercises={appData.customExercises}
          onSaveCustomExercise={handleSaveCustomExercise}
        />
      </div>
    );
  }

  const activeThemeId = appData.activeTheme || 'orange_dark';
  const theme = THEMES[activeThemeId] || THEMES.orange_dark;

  // Apply CSS variable overrides based on theme
  let cssOverrides = `
    :root {
      --color-orange-300: ${theme.overrideCyan300};
      --color-orange-400: ${theme.overrideCyan400};
      --color-orange-500: ${theme.overrideCyan500};
      --color-orange-600: ${theme.overrideCyan600};
      --color-orange-500-rgb: ${theme.overrideCyanRgb};
    }
  `;

  if (theme.isLight) {
    cssOverrides += `
      :root {
        --color-zinc-950: ${theme.overrideZincBackground || '#f4f4f5'};
        --color-zinc-900: ${theme.overrideZincCardBg || '#ffffff'};
        --color-zinc-850: ${theme.overrideZincBackground || '#f4f4f5'};
        --color-zinc-800: ${theme.overrideZincBorder || '#e4e4e7'};
        --color-zinc-750: ${theme.overrideZincBorder || '#e4e4e7'};
        --color-zinc-700: #d4d4d8;
        --color-zinc-100: ${theme.overrideZincText || '#18181b'};
        --color-zinc-200: #27272a;
        --color-zinc-300: #3f3f46;
        --color-zinc-400: #52525b;
        --color-zinc-500: ${theme.overrideZincTextMuted || '#71717a'};
      }
      body {
        background-color: ${theme.overrideZincBackground || '#fafafa'} !important;
        color: ${theme.overrideZincText || '#18181b'} !important;
      }
    `;
  }

  return (
    <div id="calisthenics-app-root" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col transition-colors duration-250">
      <style dangerouslySetInnerHTML={{ __html: cssOverrides }} />
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasActiveWorkout={Boolean(activeWorkout)}
        onResumeWorkout={() => {}}
        activeWorkoutTitle={activeWorkout?.routine?.title}
        coins={appData.coins || 0}
        onOpenShop={() => setIsThemeShopOpen(true)}
      />

      {/* Main App Content View Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'routines' && (
          <RoutinesView
            routines={appData.routines}
            onStartRoutine={handleStartRoutine}
            onStartFreeWorkout={handleStartFreeWorkout}
            onOpenRoutineEditor={(routine) => {
              setEditingRoutine(routine || null);
              setIsRoutineEditorOpen(true);
            }}
            onDeleteRoutine={handleDeleteRoutine}
            customExercises={appData.customExercises}
          />
        )}

        {activeTab === 'progressions' && (
          <ProgressionsView
            progressions={appData.progressions}
            onUpdateLevel={handleUpdateProgressionLevel}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            sessions={appData.sessions}
            onDeleteSession={handleDeleteSession}
            weightUnit={appData.userPreferences.unit}
            customExercises={appData.customExercises}
            onUpdateSession={handleUpdateSession}
          />
        )}

        {activeTab === 'prs' && (
          <PRsAndStatsView
            prs={appData.prs}
            sessions={appData.sessions}
            preferences={appData.userPreferences}
            onUpdatePreferences={handleUpdatePreferences}
            onAddPR={handleAddPR}
            onDeletePR={handleDeletePR}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Routine Editor Modal */}
      <RoutineEditorModal
        isOpen={isRoutineEditorOpen}
        onClose={() => {
          setIsRoutineEditorOpen(false);
          setEditingRoutine(null);
        }}
        onSaveRoutine={handleSaveRoutine}
        initialRoutine={editingRoutine}
        customExercises={appData.customExercises}
        onSaveCustomExercise={handleSaveCustomExercise}
      />

      {/* Theme Store Shop Modal */}
      <ThemeShopModal
        isOpen={isThemeShopOpen}
        onClose={() => setIsThemeShopOpen(false)}
        coins={appData.coins || 0}
        unlockedThemes={appData.unlockedThemes || ['orange_dark']}
        activeTheme={appData.activeTheme || 'orange_dark'}
        onBuyTheme={handleBuyTheme}
        onEquipTheme={handleEquipTheme}
      />
    </div>
  );
}

