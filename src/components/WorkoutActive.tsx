import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  Check,
  Plus,
  Trash2,
  Timer,
  Award,
  AlertCircle,
  Dumbbell,
  ArrowLeft,
  ChevronDown,
  Sparkles,
  Info,
  Zap,
  Flame,
  TrendingUp,
  Copy,
  RotateCcw,
  Sliders,
  MoreHorizontal,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Exercise, ExerciseLevelUpEvent, PersonalRecord, Routine, WorkoutExerciseLog, WorkoutSession, WorkoutSet } from '../types';
import { EXERCISES, findExercise } from '../data/exercises';
import { RestTimerModal } from './RestTimerModal';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { LevelUpModal } from './LevelUpModal';
import { GymBeastVisualizer } from './GymBeastVisualizer';
import { playPrFanfare } from '../utils/sound';
import { computeExerciseMastery, calculateExerciseSessionXp, evaluateSessionLevelUps, getLevelInfo } from '../utils/mastery';

interface WorkoutActiveProps {
  routine?: Routine | null;
  initialExercises?: Exercise[];
  pastSessions: WorkoutSession[];
  existingPRs: PersonalRecord[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  autoRestTimerEnabled: boolean;
  onToggleAutoRestTimer: () => void;
  weightUnit: 'kg' | 'lbs';
  onFinishWorkout: (session: WorkoutSession) => void;
  onCancelWorkout: () => void;
  customExercises?: Exercise[];
  onSaveCustomExercise?: (ex: Exercise) => void;
}

export const WorkoutActive: React.FC<WorkoutActiveProps> = ({
  routine,
  initialExercises = [],
  pastSessions,
  existingPRs,
  soundEnabled,
  onToggleSound,
  autoRestTimerEnabled,
  onToggleAutoRestTimer,
  weightUnit,
  onFinishWorkout,
  onCancelWorkout,
  customExercises = [],
  onSaveCustomExercise,
}) => {
  // Session start time & elapsed timer
  const [startTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Set correction & bulk-addition states
  const [customAddSetsCount, setCustomAddSetsCount] = useState<Record<string, number>>({});
  const [activeSetMenu, setActiveSetMenu] = useState<{ exIndex: number; setIndex: number } | null>(null);
  const [correctedSetIds, setCorrectedSetIds] = useState<Record<string, boolean>>({});

  // Active exercises list
  const [exerciseLogs, setExerciseLogs] = useState<WorkoutExerciseLog[]>(() => {
    if (routine) {
      return routine.items.map((item) => {
        const ex = findExercise(item.exerciseId, customExercises);
        const defaultReps = item.defaultTargetRepsOrSecs || (ex?.type === 'hold_seconds' ? 20 : 8);
        const sets: WorkoutSet[] = Array.from({ length: item.defaultSets || 3 }, (_, i) => ({
          id: `set_${item.exerciseId}_${i + 1}_${Date.now()}`,
          setNumber: i + 1,
          type: 'normal',
          targetRepsOrSecs: defaultReps,
          completedRepsOrSecs: defaultReps,
          weightKg: 0,
          isCompleted: false,
        }));
        return {
          exerciseId: item.exerciseId,
          sets,
          notes: item.notes,
          restTimerSeconds: item.defaultRestSeconds || 90,
        };
      });
    } else if (initialExercises.length > 0) {

      return initialExercises.map((ex) => ({
        exerciseId: ex.id,
        sets: [
          {
            id: `set_${ex.id}_1_${Date.now()}`,
            setNumber: 1,
            type: 'normal',
            targetRepsOrSecs: ex.type === 'hold_seconds' ? 20 : 8,
            completedRepsOrSecs: ex.type === 'hold_seconds' ? 20 : 8,
            weightKg: 0,
            isCompleted: false,
          },
        ],
        restTimerSeconds: 90,
      }));
    } else {
      // Default fallback starter exercise
      return [
        {
          exerciseId: 'standard_pull_up',
          sets: [
            {
              id: `set_initial_1_${Date.now()}`,
              setNumber: 1,
              type: 'normal',
              targetRepsOrSecs: 8,
              completedRepsOrSecs: 8,
              weightKg: 0,
              isCompleted: false,
            },
          ],
          restTimerSeconds: 90,
        },
      ];
    }
  });

  // Rest Timer State
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);
  const [restDuration, setRestDuration] = useState<number>(90);
  const [currentRestExerciseName, setCurrentRestExerciseName] = useState<string>('');

  // Modals
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState<boolean>(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState<boolean>(false);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [sessionRating, setSessionRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  // Exercise Level-Up Celebration States
  const [levelUpEvents, setLevelUpEvents] = useState<ExerciseLevelUpEvent[]>([]);
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(false);
  const [pendingFinishedSession, setPendingFinishedSession] = useState<WorkoutSession | null>(null);

  // Elapsed timer loop
  useEffect(() => {
    if (isTimerPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerPaused]);

  // Format HH:MM:SS or MM:SS
  const formatElapsedTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Find previous session logs for a given exercise
  const getPreviousSessionData = (exerciseId: string) => {
    for (const session of pastSessions) {
      const match = session.exercises.find((e) => e.exerciseId === exerciseId);
      if (match && match.sets.some((s) => s.isCompleted)) {
        return {
          date: new Date(session.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          sets: match.sets.filter((s) => s.isCompleted),
        };
      }
    }
    return null;
  };

  // Set management
  const handleToggleSetComplete = (exIndex: number, setIndex: number) => {
    setExerciseLogs((prev) => {
      const next = [...prev];
      const ex = { ...next[exIndex] };
      const sets = [...ex.sets];
      const targetSet = { ...sets[setIndex] };

      const wasCompleted = targetSet.isCompleted;
      targetSet.isCompleted = !wasCompleted;
      sets[setIndex] = targetSet;
      ex.sets = sets;
      next[exIndex] = ex;

      // Auto start rest timer on completion!
      if (!wasCompleted && autoRestTimerEnabled) {
        const exerciseDef = EXERCISES.find((e) => e.id === ex.exerciseId);
        setCurrentRestExerciseName(exerciseDef?.name || 'Exercise');
        setRestDuration(ex.restTimerSeconds || 90);
        setIsRestTimerActive(true);
      }

      return next;
    });
  };

  const handleUpdateSet = (exIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => {
    setExerciseLogs((prev) => {
      const next = [...prev];
      const ex = { ...next[exIndex] };
      const sets = [...ex.sets];
      const currentSet = sets[setIndex];
      sets[setIndex] = { ...currentSet, ...updates };

      // If the set is already completed and user modifies reps or weight, flag as corrected
      if (currentSet.isCompleted && ('completedRepsOrSecs' in updates || 'weightKg' in updates || 'type' in updates)) {
        setCorrectedSetIds((c) => ({ ...c, [currentSet.id]: true }));
      }

      ex.sets = sets;
      next[exIndex] = ex;
      return next;
    });
  };

  const handleAddSet = (exIndex: number) => {
    setExerciseLogs((prev) => {
      const next = [...prev];
      const ex = { ...next[exIndex] };
      const lastSet = ex.sets[ex.sets.length - 1];
      const newSetNumber = ex.sets.length + 1;

      const newSet: WorkoutSet = {
        id: `set_${ex.exerciseId}_${newSetNumber}_${Date.now()}`,
        setNumber: newSetNumber,
        type: 'normal',
        targetRepsOrSecs: lastSet ? lastSet.targetRepsOrSecs : 8,
        completedRepsOrSecs: lastSet ? lastSet.completedRepsOrSecs : 8,
        weightKg: lastSet ? lastSet.weightKg : 0,
        isCompleted: false,
      };

      ex.sets = [...ex.sets, newSet];
      next[exIndex] = ex;
      return next;
    });
  };

  const handleAddMultipleSets = (exIndex: number, count: number) => {
    if (count <= 0) return;
    setExerciseLogs((prev) => {
      const next = [...prev];
      const ex = { ...next[exIndex] };
      const lastSet = ex.sets[ex.sets.length - 1];
      const startingCount = ex.sets.length;

      const newSets: WorkoutSet[] = Array.from({ length: count }, (_, i) => {
        const num = startingCount + i + 1;
        return {
          id: `set_${ex.exerciseId}_${num}_${Date.now()}_${i}`,
          setNumber: num,
          type: 'normal',
          targetRepsOrSecs: lastSet ? lastSet.targetRepsOrSecs : 8,
          completedRepsOrSecs: lastSet ? lastSet.completedRepsOrSecs : 8,
          weightKg: lastSet ? lastSet.weightKg : 0,
          isCompleted: false,
        };
      });

      ex.sets = [...ex.sets, ...newSets];
      next[exIndex] = ex;
      return next;
    });
  };

  const handleDuplicateSet = (exIndex: number, setIndex: number) => {
    setExerciseLogs((prev) => {
      const next = [...prev];
      const ex = { ...next[exIndex] };
      const sourceSet = ex.sets[setIndex];

      const duplicated: WorkoutSet = {
        id: `set_dup_${ex.exerciseId}_${Date.now()}`,
        setNumber: setIndex + 2,
        type: sourceSet.type || 'normal',
        targetRepsOrSecs: sourceSet.targetRepsOrSecs,
        completedRepsOrSecs: sourceSet.completedRepsOrSecs,
        weightKg: sourceSet.weightKg,
        isCompleted: false,
      };

      const updatedSets = [...ex.sets];
      updatedSets.splice(setIndex + 1, 0, duplicated);
      ex.sets = updatedSets.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      next[exIndex] = ex;
      return next;
    });
  };

  const handleResetSet = (exIndex: number, setIndex: number) => {
    setExerciseLogs((prev) => {
      const next = [...prev];
      const ex = { ...next[exIndex] };
      const s = { ...ex.sets[setIndex] };
      s.completedRepsOrSecs = s.targetRepsOrSecs;
      s.weightKg = 0;
      s.isCompleted = false;
      s.type = 'normal';
      ex.sets[setIndex] = s;
      next[exIndex] = ex;
      return next;
    });
    setActiveSetMenu(null);
  };

  const handleCycleSetType = (exIndex: number, setIndex: number) => {
    const cycleMap: Record<string, WorkoutSet['type']> = {
      normal: 'warmup',
      warmup: 'drop',
      drop: 'failure',
      failure: 'normal',
    };
    const current = exerciseLogs[exIndex].sets[setIndex].type || 'normal';
    const nextType = cycleMap[current] || 'normal';
    handleUpdateSet(exIndex, setIndex, { type: nextType });
  };

  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    setExerciseLogs((prev) => {
      const next = [...prev];
      const ex = { ...next[exIndex] };
      if (ex.sets.length <= 1) {
        // Reset the only set rather than breaking layout
        ex.sets = [
          {
            id: `set_${ex.exerciseId}_1_${Date.now()}`,
            setNumber: 1,
            type: 'normal',
            targetRepsOrSecs: 8,
            completedRepsOrSecs: 8,
            weightKg: 0,
            isCompleted: false,
          },
        ];
        next[exIndex] = ex;
        return next;
      }

      const filtered = ex.sets.filter((_, idx) => idx !== setIndex);
      // Renumber
      ex.sets = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      next[exIndex] = ex;
      return next;
    });
    setActiveSetMenu(null);
  };

  const handleRemoveExercise = (exIndex: number) => {
    setExerciseLogs((prev) => prev.filter((_, idx) => idx !== exIndex));
  };

  const handleAddExerciseToWorkout = (exercise: Exercise) => {
    const isHold = exercise.type === 'hold_seconds';
    const newLog: WorkoutExerciseLog = {
      exerciseId: exercise.id,
      sets: [
        {
          id: `set_${exercise.id}_1_${Date.now()}`,
          setNumber: 1,
          type: 'normal',
          targetRepsOrSecs: isHold ? 20 : 8,
          completedRepsOrSecs: isHold ? 20 : 8,
          weightKg: 0,
          isCompleted: false,
        },
        {
          id: `set_${exercise.id}_2_${Date.now()}`,
          setNumber: 2,
          type: 'normal',
          targetRepsOrSecs: isHold ? 20 : 8,
          completedRepsOrSecs: isHold ? 20 : 8,
          weightKg: 0,
          isCompleted: false,
        },
        {
          id: `set_${exercise.id}_3_${Date.now()}`,
          setNumber: 3,
          type: 'normal',
          targetRepsOrSecs: isHold ? 20 : 8,
          completedRepsOrSecs: isHold ? 20 : 8,
          weightKg: 0,
          isCompleted: false,
        },
      ],
      restTimerSeconds: 90,
    };

    setExerciseLogs((prev) => [...prev, newLog]);
  };

  // Workout metrics calculation
  const metrics = useMemo(() => {
    let totalVolumeReps = 0;
    let totalHoldSeconds = 0;
    let totalSetsCompleted = 0;

    exerciseLogs.forEach((log) => {
      const exDef = EXERCISES.find((e) => e.id === log.exerciseId);
      const isHold = exDef?.type === 'hold_seconds';

      log.sets.forEach((s) => {
        if (s.isCompleted) {
          totalSetsCompleted += 1;
          if (isHold) {
            totalHoldSeconds += s.completedRepsOrSecs;
          } else {
            totalVolumeReps += s.completedRepsOrSecs;
          }
        }
      });
    });

    return { totalVolumeReps, totalHoldSeconds, totalSetsCompleted };
  }, [exerciseLogs]);

  // Evaluate live session performance, XP and level-ups
  const sessionEvaluation = useMemo(() => {
    const tentativeSession: WorkoutSession = {
      id: `temp_${Date.now()}`,
      routineId: routine?.id,
      routineTitle: routine?.title || 'Free Calisthenics Session',
      startTime,
      endTime: Date.now(),
      durationSeconds: Math.max(1, elapsedSeconds),
      exercises: exerciseLogs,
      totalVolumeReps: metrics.totalVolumeReps,
      totalHoldSeconds: metrics.totalHoldSeconds,
      totalSetsCompleted: metrics.totalSetsCompleted,
    };
    return evaluateSessionLevelUps(tentativeSession, pastSessions);
  }, [routine, startTime, elapsedSeconds, exerciseLogs, metrics, pastSessions]);

  // Handle Finish Workout Modal Open
  const triggerFinishModal = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    playPrFanfare(soundEnabled);
    setIsFinishModalOpen(true);
  };

  const handleConfirmFinish = () => {
    const session: WorkoutSession = {
      id: `session_${Date.now()}`,
      routineId: routine?.id,
      routineTitle: routine?.title || 'Free Calisthenics Session',
      startTime,
      endTime: Date.now(),
      durationSeconds: Math.max(1, elapsedSeconds),
      exercises: exerciseLogs,
      notes: sessionNotes.trim() || undefined,
      rating: sessionRating,
      totalVolumeReps: metrics.totalVolumeReps,
      totalHoldSeconds: metrics.totalHoldSeconds,
      totalSetsCompleted: metrics.totalSetsCompleted,
      xpEarned: sessionEvaluation.totalXpEarned,
      levelUpsAchieved:
        sessionEvaluation.leveledUpEvents.length > 0 ? sessionEvaluation.leveledUpEvents : undefined,
    };

    setIsFinishModalOpen(false);

    // If any exercise leveled up, trigger the celebration modal first!
    if (sessionEvaluation.leveledUpEvents.length > 0) {
      setLevelUpEvents(sessionEvaluation.leveledUpEvents);
      setPendingFinishedSession(session);
      setShowLevelUpModal(true);
    } else {
      onFinishWorkout(session);
    }
  };

  const handleCloseLevelUpModal = () => {
    setShowLevelUpModal(false);
    if (pendingFinishedSession) {
      onFinishWorkout(pendingFinishedSession);
    }
  };

  return (
    <div id="active-workout-page" className="min-h-screen bg-zinc-950 text-zinc-100 pb-28">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="cancel-workout-btn"
              onClick={() => setShowDiscardConfirm(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition"
              title="Discard Workout"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <h1 className="text-sm sm:text-base font-bold text-white font-display truncate max-w-[200px] sm:max-w-xs">
                  {routine?.title || 'Free Workout'}
                </h1>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                {metrics.totalSetsCompleted} sets done • {metrics.totalVolumeReps} reps
                {metrics.totalHoldSeconds > 0 && ` • ${metrics.totalHoldSeconds}s holds`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {/* Auto Rest Toggle Button */}
            <button
              id="active-toggle-autorest-btn"
              onClick={onToggleAutoRestTimer}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition ${
                autoRestTimerEnabled
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
              title={autoRestTimerEnabled ? 'Auto Rest Timer is ON (Tap to turn OFF)' : 'Auto Rest Timer is OFF (Tap to turn ON)'}
            >
              <Timer className={`w-3.5 h-3.5 ${autoRestTimerEnabled ? 'text-orange-400 animate-pulse' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline">Auto Rest: {autoRestTimerEnabled ? 'ON' : 'OFF'}</span>
              <span className="sm:hidden">{autoRestTimerEnabled ? 'Auto' : 'Manual'}</span>
            </button>

            {/* Manual Rest Start Button */}
            <button
              id="active-manual-rest-btn"
              onClick={() => {
                setCurrentRestExerciseName('Manual Rest Interval');
                setRestDuration(90); // default to 90 seconds
                setIsRestTimerActive(true);
              }}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition"
              title="Launch Rest Timer Now"
            >
              <Play className="w-3 h-3 text-orange-400" />
              <span>Rest Now</span>
            </button>

            {/* Live Clock */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-sm font-bold text-orange-400">
              <Timer className="w-4 h-4 text-orange-400/80" />
              <span id="active-workout-timer-clock">{formatElapsedTime(elapsedSeconds)}</span>
              <button
                onClick={() => setIsTimerPaused(!isTimerPaused)}
                className="ml-1 text-zinc-400 hover:text-white"
                title={isTimerPaused ? 'Resume' : 'Pause'}
              >
                {isTimerPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3" />}
              </button>
            </div>

            {/* Finish Workout CTA */}
            <button
              id="open-finish-workout-btn"
              onClick={triggerFinishModal}
              disabled={metrics.totalSetsCompleted === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:hover:bg-orange-500 text-zinc-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Finish</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Exercises Content */}
      <main className="max-w-4xl mx-auto px-4 py-5 space-y-6">
        {exerciseLogs.map((log, exIndex) => {
          const exDef = findExercise(log.exerciseId, customExercises);
          const isHold = exDef?.type === 'hold_seconds';
          const prevData = getPreviousSessionData(log.exerciseId);

          // Calculate current mastery level and live session XP
          const currentMastery = computeExerciseMastery(log.exerciseId, pastSessions);
          let prevLogForThisEx: WorkoutExerciseLog | undefined;
          for (const session of pastSessions) {
            const match = session.exercises.find((e) => e.exerciseId === log.exerciseId);
            if (match && match.sets.some((s) => s.isCompleted)) {
              prevLogForThisEx = match;
              break;
            }
          }
          const liveXpResult = calculateExerciseSessionXp(log, prevLogForThisEx);
          const totalAccumulatedXp = currentMastery.totalXp + liveXpResult.totalXp;
          const liveLevelInfo = getLevelInfo(totalAccumulatedXp);
          const isLeveledUpLive = liveLevelInfo.level > currentMastery.level;

          return (
            <div
              key={`${log.exerciseId}_${exIndex}`}
              id={`active-exercise-card-${log.exerciseId}`}
              className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg"
            >
              {/* Exercise Header */}
              <div className="px-4 sm:px-5 py-3.5 bg-zinc-900 border-b border-zinc-800/70 flex items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-white font-display tracking-tight">
                      {exDef?.name || log.exerciseId}
                    </h2>
                    {isHold && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Hold
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded uppercase bg-zinc-800 text-zinc-400">
                      {exDef?.category}
                    </span>
                    {exDef?.primaryMuscles && exDef.primaryMuscles.length > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-orange-500/10 text-orange-400/90 border border-orange-500/20 capitalize">
                        {exDef.primaryMuscles.join(', ')}
                      </span>
                    )}

                    {/* Movement Level Badge */}
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition shadow-sm ${
                        isLeveledUpLive
                          ? 'bg-gradient-to-r from-orange-400 to-amber-300 text-zinc-950 ring-2 ring-orange-400/40 animate-pulse'
                          : 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                      }`}
                      title={`Level ${liveLevelInfo.level} ${liveLevelInfo.rankTitle}`}
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span>
                        Lvl {liveLevelInfo.level} • {liveLevelInfo.rankTitle}
                      </span>
                      {isLeveledUpLive && <span className="text-[10px] font-black uppercase ml-0.5">LEVEL UP!</span>}
                    </div>
                  </div>

                  {/* Level Progress Bar & Live XP */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                      <div className="w-24 sm:w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${Number.isFinite(liveLevelInfo.progressPercent) ? liveLevelInfo.progressPercent : 0}%` }}
                        />
                      </div>
                      <span className="text-zinc-300">
                        {liveLevelInfo.currentLevelXp}/{liveLevelInfo.xpNeededForLevel} XP
                      </span>
                    </div>

                    {liveXpResult.totalXp > 0 && (
                      <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.2 rounded border border-orange-500/20">
                        +{liveXpResult.totalXp} XP earned this session
                      </span>
                    )}
                  </div>

                  {/* Overload achievements */}
                  {liveXpResult.overloadReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {liveXpResult.overloadReasons.map((reason, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1"
                        >
                          <Flame className="w-2.5 h-2.5 text-emerald-400" />
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Previous session performance anchor */}
                  {prevData ? (
                    <p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
                      <span className="text-orange-400/90 font-medium">Prev ({prevData.date}):</span>
                      {prevData.sets.map((s, i) => (
                        <span key={i} className="font-mono text-zinc-300">
                          {s.completedRepsOrSecs}
                          {isHold ? 's' : ''}
                          {s.weightKg ? ` @+${s.weightKg}${weightUnit}` : ''}
                          {i < prevData.sets.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500 mt-1.5">First time logging this movement</p>
                  )}
                </div>

                {/* Exercise Actions: Form Cues & Remove */}
                <div className="flex items-center gap-1.5">
                  <button
                    id={`remove-exercise-btn-${log.exerciseId}`}
                    onClick={() => handleRemoveExercise(exIndex)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
                    title="Remove Exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form cues reminder tip */}
              {exDef?.formCues && exDef.formCues.length > 0 && (
                <div className="px-4 py-2 bg-zinc-950/40 border-b border-zinc-800/40 text-[11px] text-zinc-400 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-orange-500/80 shrink-0" />
                  <span className="truncate">Key Cue: {exDef.formCues[0]}</span>
                </div>
              )}

              {/* Muscle Target Character Visualizer */}
              <div className="px-4 pt-3 pb-1">
                <GymBeastVisualizer
                  primaryMuscles={exDef?.primaryMuscles || []}
                  secondaryMuscles={exDef?.secondaryMuscles || []}
                  compact={true}
                />
              </div>

              {/* Sets Table */}
              <div className="p-3 sm:p-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 text-[11px] font-mono uppercase tracking-wider text-zinc-400 px-2 pb-2 border-b border-zinc-800">
                  <div className="col-span-2 text-center">Set</div>
                  <div className="col-span-3 text-center">{weightUnit.toUpperCase()} (+/-)</div>
                  <div className="col-span-4 text-center">{isHold ? 'Seconds' : 'Reps'}</div>
                  <div className="col-span-3 text-center">Done / Edit</div>
                </div>

                {/* Set Rows */}
                <div className="divide-y divide-zinc-800/50">
                  {log.sets.map((set, setIndex) => {
                    const isMenuOpen =
                      activeSetMenu?.exIndex === exIndex && activeSetMenu?.setIndex === setIndex;
                    const wasCorrected = Boolean(correctedSetIds[set.id]);

                    return (
                      <div
                        key={set.id}
                        id={`set-row-${log.exerciseId}-${set.setNumber}`}
                        className={`py-2 px-1 rounded-xl transition ${
                          set.isCompleted ? 'bg-emerald-950/20 border border-emerald-900/30' : 'hover:bg-zinc-800/30'
                        }`}
                      >
                        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-center">
                          {/* Set # & Type Tag (click to cycle type) */}
                          <div className="col-span-2 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleCycleSetType(exIndex, setIndex)}
                              title={`Set #${set.setNumber} (${set.type || 'normal'}). Tap to change type: Normal -> Warmup -> Drop -> Failure`}
                              className={`px-1.5 py-1 min-w-[28px] h-7 flex items-center justify-center rounded-lg text-xs font-mono font-bold transition ${
                                set.type === 'warmup'
                                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                  : set.type === 'drop'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                  : set.type === 'failure'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : set.isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                              }`}
                            >
                              <span>#{set.setNumber}</span>
                              {set.type === 'warmup' && <span className="text-[9px] ml-0.5 font-black text-orange-400">W</span>}
                              {set.type === 'drop' && <span className="text-[9px] ml-0.5 font-black text-indigo-400">D</span>}
                              {set.type === 'failure' && <span className="text-[9px] ml-0.5 font-black text-rose-400">F</span>}
                            </button>
                          </div>

                          {/* Weight input (+kg or lbs) */}
                          <div className="col-span-3 flex items-center justify-center">
                            <input
                              type="number"
                              min="-50"
                              max="250"
                              step="0.5"
                              placeholder="0"
                              value={!set.weightKg || set.weightKg === 0 || !Number.isFinite(set.weightKg) ? '' : set.weightKg}
                              onChange={(e) =>
                                handleUpdateSet(exIndex, setIndex, {
                                  weightKg: parseFloat(e.target.value) || 0,
                                })
                              }
                              title="Added or assisted weight"
                              className="w-full max-w-[70px] py-1.5 px-2 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-xs font-mono text-center text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>

                          {/* Reps or Hold Seconds with Steppers & Direct Edit */}
                          <div className="col-span-4 flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSet(exIndex, setIndex, {
                                  completedRepsOrSecs: Math.max(0, (Number(set.completedRepsOrSecs) || 0) - (isHold ? 5 : 1)),
                                })
                              }
                              className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition"
                              title={`Subtract ${isHold ? '5s' : '1 rep'}`}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              max="999"
                              value={Number.isFinite(set.completedRepsOrSecs) ? set.completedRepsOrSecs : 0}
                              onChange={(e) =>
                                handleUpdateSet(exIndex, setIndex, {
                                  completedRepsOrSecs: Math.max(0, parseInt(e.target.value) || 0),
                                })
                              }
                              title="Completed reps or hold seconds. Tap to edit."
                              className={`w-12 py-1 bg-zinc-950 border rounded-lg text-xs font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-orange-500 transition ${
                                set.isCompleted
                                  ? 'text-emerald-400 border-emerald-700/80 ring-1 ring-emerald-500/20'
                                  : 'text-orange-400 border-zinc-700/70'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSet(exIndex, setIndex, {
                                  completedRepsOrSecs: set.completedRepsOrSecs + (isHold ? 5 : 1),
                                })
                              }
                              className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition"
                              title={`Add ${isHold ? '5s' : '1 rep'}`}
                            >
                              +
                            </button>
                          </div>

                          {/* Complete Checkbox & Actions */}
                          <div className="col-span-3 flex items-center justify-center gap-1">
                            {/* Complete / Undo Button */}
                            <button
                              id={`complete-set-btn-${log.exerciseId}-${set.setNumber}`}
                              type="button"
                              onClick={() => handleToggleSetComplete(exIndex, setIndex)}
                              className={`w-8 h-8 flex items-center justify-center rounded-xl transition ${
                                set.isCompleted
                                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700'
                              }`}
                              title={set.isCompleted ? 'Completed! Tap to undo / mark incomplete' : 'Mark Completed & start rest timer'}
                            >
                              <Check className={`w-4 h-4 ${set.isCompleted ? 'stroke-[3]' : 'stroke-[2]'}`} />
                            </button>

                            {/* Duplicate Set Button */}
                            <button
                              type="button"
                              onClick={() => handleDuplicateSet(exIndex, setIndex)}
                              className="p-1 text-zinc-500 hover:text-orange-400 hover:bg-zinc-800 rounded-lg transition"
                              title="Duplicate this set"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Correct / Options Menu Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setActiveSetMenu(
                                  isMenuOpen ? null : { exIndex, setIndex }
                                )
                              }
                              className={`p-1 rounded-lg transition ${
                                isMenuOpen
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                              }`}
                              title="Correct this set / options"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Visual tag if set was edited/corrected */}
                        {wasCorrected && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/90 pl-2 pt-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Set #{set.setNumber} corrected & saved</span>
                          </div>
                        )}

                        {/* Set Correction & Options Dropdown Popover */}
                        {isMenuOpen && (
                          <div className="mt-2 p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl space-y-2 text-xs shadow-xl animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                              <span className="font-bold text-zinc-200 font-display">
                                Correct Set #{set.setNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveSetMenu(null)}
                                className="text-[10px] text-zinc-400 hover:text-white"
                              >
                                Close
                              </button>
                            </div>

                            {/* Set Type selection */}
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-mono text-zinc-400 block">Set Type:</span>
                              <div className="grid grid-cols-4 gap-1">
                                {(
                                  [
                                    { type: 'normal', label: 'Normal' },
                                    { type: 'warmup', label: 'Warmup' },
                                    { type: 'drop', label: 'Drop' },
                                    { type: 'failure', label: 'Failure' },
                                  ] as const
                                ).map((t) => (
                                  <button
                                    key={t.type}
                                    type="button"
                                    onClick={() => {
                                      handleUpdateSet(exIndex, setIndex, { type: t.type });
                                    }}
                                    className={`py-1 px-1.5 rounded text-[10px] font-mono font-bold transition text-center ${
                                      (set.type || 'normal') === t.type
                                        ? 'bg-orange-500 text-zinc-950 shadow-sm'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                                    }`}
                                  >
                                    {t.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Quick Correction Actions */}
                            <div className="flex items-center justify-between pt-1 gap-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleResetSet(exIndex, setIndex)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition"
                              >
                                <RotateCcw className="w-3 h-3" /> Reset Target
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDuplicateSet(exIndex, setIndex)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition"
                              >
                                <Copy className="w-3 h-3" /> Duplicate
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveSet(exIndex, setIndex)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] transition ml-auto"
                              >
                                <Trash2 className="w-3 h-3" /> Delete Set
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Sets Footer: Add as many sets as you want! */}
                <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 font-semibold mr-1">
                      Add Sets:
                    </span>
                    <button
                      id={`add-set-btn-${log.exerciseId}`}
                      type="button"
                      onClick={() => handleAddSet(exIndex)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold transition"
                      title="Add 1 Set"
                    >
                      <Plus className="w-3.5 h-3.5" /> +1 Set
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddMultipleSets(exIndex, 2)}
                      className="px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition"
                      title="Add 2 Sets"
                    >
                      +2
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddMultipleSets(exIndex, 3)}
                      className="px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition"
                      title="Add 3 Sets"
                    >
                      +3
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddMultipleSets(exIndex, 5)}
                      className="px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition"
                      title="Add 5 Sets"
                    >
                      +5
                    </button>

                    {/* Custom Quantity Input */}
                    <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden ml-1">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        placeholder="Qty"
                        value={customAddSetsCount[log.exerciseId] || ''}
                        onChange={(e) =>
                          setCustomAddSetsCount((prev) => ({
                            ...prev,
                            [log.exerciseId]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-12 py-1 px-1 bg-transparent text-xs font-mono text-center text-white placeholder-zinc-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const count = customAddSetsCount[log.exerciseId] || 1;
                          handleAddMultipleSets(exIndex, count);
                          setCustomAddSetsCount((prev) => ({ ...prev, [log.exerciseId]: 0 }));
                        }}
                        className="px-2 py-1 bg-zinc-800 hover:bg-orange-500 hover:text-zinc-950 text-[11px] font-semibold text-zinc-300 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Rest Timer Selector */}
                  <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
                    <span className="font-mono text-[11px]">Rest:</span>
                    <select
                      value={log.restTimerSeconds || 90}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 90;
                        setExerciseLogs((prev) => {
                          const next = [...prev];
                          next[exIndex] = { ...next[exIndex], restTimerSeconds: val };
                          return next;
                        });
                      }}
                      className="bg-zinc-800/80 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                    >
                      <option value={30}>30s</option>
                      <option value={45}>45s</option>
                      <option value={60}>60s</option>
                      <option value={90}>90s</option>
                      <option value={120}>2m</option>
                      <option value={180}>3m</option>
                      <option value={240}>4m</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Another Exercise Button */}
        <button
          id="open-add-exercise-to-active-workout-btn"
          onClick={() => setIsAddExerciseOpen(true)}
          className="w-full py-4 border-2 border-dashed border-zinc-800 hover:border-orange-500/50 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-zinc-400 hover:text-orange-400 transition"
        >
          <Plus className="w-4 h-4" /> Add Another Exercise
        </button>
      </main>

      {/* Floating Finish Bottom Bar (Mobile Friendly) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-zinc-950/90 border-t border-zinc-800 backdrop-blur-md sm:hidden">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div className="text-xs font-mono text-zinc-400">
            <span className="text-white font-bold">{metrics.totalSetsCompleted}</span> sets done
          </div>
          <button
            onClick={triggerFinishModal}
            disabled={metrics.totalSetsCompleted === 0}
            className="flex-1 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-zinc-950 font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" /> Finish Workout
          </button>
        </div>
      </div>

      {/* Rest Timer Modal / Floating Bar */}
      <RestTimerModal
        initialSeconds={restDuration}
        isOpen={isRestTimerActive}
        onClose={() => setIsRestTimerActive(false)}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        exerciseName={currentRestExerciseName}
      />

      {/* Add Exercise Library Modal */}
      <ExerciseLibraryModal
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onSelectExercise={handleAddExerciseToWorkout}
        alreadySelectedIds={exerciseLogs.map((e) => e.exerciseId)}
        title="Add Exercise to Current Workout"
        customExercises={customExercises}
        onSaveCustomExercise={onSaveCustomExercise}
      />

      {/* Finish Workout Summary Modal */}
      {isFinishModalOpen && (
        <div
          id="finish-workout-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <div
            id="finish-workout-modal"
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black font-display text-white tracking-tight">Workout Completed!</h3>
              <p className="text-xs text-zinc-400 mt-1">Great calisthenics session recorded.</p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80">
              <div className="p-2">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Duration</span>
                <p className="font-mono text-lg font-bold text-white mt-0.5">{formatElapsedTime(elapsedSeconds)}</p>
              </div>
              <div className="p-2 border-x border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Total Sets</span>
                <p className="font-mono text-lg font-bold text-orange-400 mt-0.5">{metrics.totalSetsCompleted}</p>
              </div>
              <div className="p-2">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Reps / Holds</span>
                <p className="font-mono text-lg font-bold text-emerald-400 mt-0.5">
                  {metrics.totalVolumeReps}
                  {metrics.totalHoldSeconds > 0 ? ` +${metrics.totalHoldSeconds}s` : ''}
                </p>
              </div>
            </div>

            {/* Exercise Mastery & Level Up Section */}
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800/80 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-orange-400" /> Movement XP & Levels
                </span>
                <span className="text-xs font-mono font-bold text-orange-400">
                  +{sessionEvaluation.totalXpEarned} XP Earned
                </span>
              </div>

              {sessionEvaluation.leveledUpEvents.length > 0 && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/40 text-orange-300 text-xs flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    {sessionEvaluation.leveledUpEvents.length} Movement(s) Leveled Up!
                  </span>
                  <span className="text-[10px] font-mono uppercase font-bold text-orange-400">Ready to Claim</span>
                </div>
              )}

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {sessionEvaluation.exerciseBreakdowns.map((ex, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 border-b border-zinc-900 last:border-0"
                  >
                    <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                      <span className="text-zinc-300 font-semibold truncate">{ex.exerciseName}</span>
                      {ex.newLevel > ex.oldLevel ? (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-orange-500 text-zinc-950">
                          Lvl {ex.newLevel}!
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-500">Lvl {ex.newLevel}</span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-orange-400 font-semibold">+{ex.xpEarned} XP</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">How did it feel?</label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSessionRating(star as 1 | 2 | 3 | 4 | 5)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition ${
                      sessionRating >= star
                        ? 'bg-orange-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-400">Session Notes (optional)</label>
              <textarea
                id="finish-session-notes-input"
                rows={2}
                placeholder="Form reflections, joint feeling, energy level..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition"
              >
                Back to Session
              </button>
              <button
                id="save-completed-workout-btn"
                type="button"
                onClick={handleConfirmFinish}
                className="py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-xs shadow-lg transition"
              >
                Save Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Workout Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-display">Discard Workout?</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Your progress during this session will not be saved to your history.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition"
              >
                Continue Workout
              </button>
              <button
                id="confirm-discard-workout-btn"
                onClick={onCancelWorkout}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Celebration Modal */}
      <LevelUpModal
        isOpen={showLevelUpModal}
        onClose={handleCloseLevelUpModal}
        levelUps={levelUpEvents}
        totalXpEarned={pendingFinishedSession?.xpEarned || 0}
        soundEnabled={soundEnabled}
      />
    </div>
  );
};
