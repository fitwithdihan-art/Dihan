import React, { useState, useEffect } from 'react';
import { AppData, Exercise, PersonalRecord, Routine, UserPreferences, WorkoutSession, FriendProfile, RepRankTestResult } from './types';
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
import { CalendarPlannerView } from './components/CalendarPlannerView';
import { RanksView } from './components/RanksView';
import { RepRankCalculatorView } from './components/RepRankCalculatorView';
import { WorkoutActive } from './components/WorkoutActive';
import { RoutineEditorModal } from './components/RoutineEditorModal';
import { THEMES } from './utils/theme';
import { ThemeShopModal } from './components/ThemeShopModal';
import { FriendsView } from './components/FriendsView';
import { InviteFriendsModal } from './components/InviteFriendsModal';
import { useAuth } from './utils/authContext';
import { Sparkles, Gift, UserPlus, X } from 'lucide-react';

export default function App() {
  const { user, saveToCloud, loadFromCloud } = useAuth();
  const [appData, setAppData] = useState<AppData>(() => {
    const loaded = loadAppData();
    setCustomExercises(loaded.customExercises || []);
    return loaded;
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('routines');
  const [isThemeShopOpen, setIsThemeShopOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [incomingInvite, setIncomingInvite] = useState<{
    code: string;
    refUsername?: string;
  } | null>(null);
  const [inviteAcceptedNotification, setInviteAcceptedNotification] = useState<string | null>(null);

  // Check URL parameters on mount for friend invitation links
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const inviteParam = params.get('invite');
        const refParam = params.get('ref') || params.get('inviter');
        if (inviteParam || refParam) {
          setIncomingInvite({
            code: inviteParam || 'CALI-8842',
            refUsername: refParam || undefined,
          });
        }
      }
    } catch (err) {
      console.warn('Error reading invite params:', err);
    }
  }, []);

  // Keep global custom exercises list synchronized
  useEffect(() => {
    setCustomExercises(appData.customExercises || []);
  }, [appData.customExercises]);

  // Load data from cloud when user logs in, or push local data to cloud if new
  useEffect(() => {
    let active = true;
    async function syncAuthData() {
      if (!user) return;
      const cloudData = await loadFromCloud();
      if (!active) return;
      if (cloudData) {
        setAppData(cloudData);
        saveAppData(cloudData);
      } else {
        // No cloud data yet - initialize cloud database with existing local data
        await saveToCloud(appData);
      }
    }
    syncAuthData();
    return () => {
      active = false;
    };
  }, [user]);

  // Active workout state
  const [activeWorkout, setActiveWorkout] = useState<{
    routine?: Routine | null;
  } | null>(null);

  // Routine editor modal state
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [isRoutineEditorOpen, setIsRoutineEditorOpen] = useState<boolean>(false);

  // Sync to local storage and cloud on changes
  const updateAppData = (updater: (prev: AppData) => AppData) => {
    setAppData((prev) => {
      const next = updater(prev);
      saveAppData(next);
      if (user) {
        saveToCloud(next);
      }
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

  // Rep Rank Test History Management
  const handleSaveRepRankTest = (test: RepRankTestResult) => {
    updateAppData((prev) => ({
      ...prev,
      repRankHistory: [test, ...(prev.repRankHistory || [])],
    }));
  };

  const handleDeleteRepRankTest = (testId: string) => {
    updateAppData((prev) => ({
      ...prev,
      repRankHistory: (prev.repRankHistory || []).filter((t) => t.id !== testId),
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

  // Incoming Friend Invite Handlers
  const handleAcceptIncomingInvite = () => {
    if (!incomingInvite) return;
    const inviterName = incomingInvite.refUsername || 'Gym Bro';
    const inviterHandle = (incomingInvite.refUsername || 'athlete').toLowerCase().replace(/\s+/g, '_');

    const newFriend: FriendProfile = {
      id: `invited_${Date.now()}`,
      userId: incomingInvite.code,
      username: inviterHandle,
      athleteName: inviterName,
      avatarUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=60',
      level: 4,
      totalWorkouts: 18,
      streak: 3,
      status: 'online',
      bestPr: '15 Clean Muscle-ups',
    };

    updateAppData((prev) => {
      const existing = prev.localFriends || [];
      const alreadyFriends = existing.some(
        (f) => f.username.toLowerCase() === inviterHandle.toLowerCase() || f.userId === incomingInvite.code
      );
      const updatedFriends = alreadyFriends ? existing : [newFriend, ...existing];
      return {
        ...prev,
        localFriends: updatedFriends,
        coins: (prev.coins || 0) + 50, // +50 Welcome coins bonus!
      };
    });

    // Clean URL without reloading
    if (typeof window !== 'undefined') {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    setIncomingInvite(null);
    setInviteAcceptedNotification(`You connected with @${inviterHandle} and earned +50 Welcome Coins! 🪙`);
    setActiveTab('friends');
    setTimeout(() => setInviteAcceptedNotification(null), 4000);
  };

  const handleDismissIncomingInvite = () => {
    if (typeof window !== 'undefined') {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
    setIncomingInvite(null);
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
        athleteName={appData.userPreferences.athleteName || 'Calisthenics Beast'}
        username={appData.userPreferences.username || 'calibeast'}
        avatarUrl={appData.userPreferences.avatarUrl || ''}
        bio={appData.userPreferences.bio || ''}
        bestRank={appData.userPreferences.bestRank}
        bestRankTier={appData.userPreferences.bestRankTier}
        appData={appData}
        onUpdateProfile={(name, username, avatarUrl, bio, bestRank, bestRankTier) =>
          handleUpdatePreferences({
            athleteName: name,
            username,
            avatarUrl,
            ...(bio !== undefined ? { bio } : {}),
            ...(bestRank !== undefined ? { bestRank } : {}),
            ...(bestRankTier !== undefined ? { bestRankTier } : {}),
          })
        }
        friendsCount={appData.localFriends ? appData.localFriends.length : 2}
        onOpenInvite={() => setIsInviteModalOpen(true)}
      />

      {/* Incoming Friend Invite Banner */}
      {incomingInvite && (
        <div className="bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 border-b border-orange-500/40 px-4 py-3 text-center animate-fade-in relative z-30">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-zinc-100 font-mono">
              <Gift className="w-5 h-5 text-orange-400 shrink-0 animate-bounce" />
              <span>
                <strong>@{incomingInvite.refUsername || incomingInvite.code}</strong> invited you to join their squad! Claim <strong>+50 Welcome Coins</strong> 🪙
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleAcceptIncomingInvite}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 rounded-xl font-mono font-black text-xs transition active:scale-95 shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Accept & Add Friend</span>
              </button>
              <button
                type="button"
                onClick={handleDismissIncomingInvite}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification when accepted */}
      {inviteAcceptedNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-orange-500/60 text-white text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
          <span>{inviteAcceptedNotification}</span>
        </div>
      )}

      {/* Main App Content View Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 pb-24 md:py-8">
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

        {activeTab === 'calendar' && (
          <CalendarPlannerView
            appData={appData}
            onUpdateAppData={setAppData}
            onStartRoutine={handleStartRoutine}
            onStartFreeWorkout={handleStartFreeWorkout}
            onShowToast={(msg) => setInviteAcceptedNotification(msg)}
          />
        )}

        {activeTab === 'ranks' && (
          <RanksView
            customExercises={appData.customExercises}
            prs={appData.prs}
            sessions={appData.sessions}
            onNavigateToCalculator={(exId, reps) => {
              setActiveTab('calculator');
            }}
            onStartRoutine={handleStartRoutine}
            onShowToast={(msg) => setInviteAcceptedNotification(msg)}
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
            onNavigateToCalculator={() => setActiveTab('calculator')}
          />
        )}

        {activeTab === 'calculator' && (
          <RepRankCalculatorView
            customExercises={appData.customExercises}
            userPreferences={appData.userPreferences}
            repRankHistory={appData.repRankHistory}
            onAddCustomExercise={handleSaveCustomExercise}
            onUpdatePreferences={handleUpdatePreferences}
            onAddPR={handleAddPR}
            onSaveHistoryTest={handleSaveRepRankTest}
            onDeleteHistoryTest={handleDeleteRepRankTest}
          />
        )}

        {activeTab === 'friends' && (
          <FriendsView
            userPreferences={appData.userPreferences}
            appData={appData}
            onUpdatePreferences={handleUpdatePreferences}
            onUpdateFriends={(friendsList) => {
              updateAppData((prev) => ({
                ...prev,
                localFriends: friendsList,
              }));
            }}
            onStartRoutineWithFriend={() => {
              setActiveTab('routines');
            }}
            onOpenInvite={() => setIsInviteModalOpen(true)}
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

      {/* Invite Friends Modal */}
      <InviteFriendsModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        userPreferences={appData.userPreferences}
        friendCode={user ? user.uid.slice(0, 8).toUpperCase() : 'CALI-8842'}
        totalFriendsCount={appData.localFriends ? appData.localFriends.length : 2}
        onInviteSuccess={() => {
          setInviteAcceptedNotification('Squad invite link copied! Share it with your friends.');
          setTimeout(() => setInviteAcceptedNotification(null), 3000);
        }}
      />
    </div>
  );
}

