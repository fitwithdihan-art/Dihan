import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  Edit3,
  Trash2,
  Sparkles,
  Camera,
  CheckCircle2,
  Clock,
  Dumbbell,
  MapPin,
  Smile,
  Flame,
  Award,
  Zap,
  BookOpen,
  Image as ImageIcon,
  X,
  Share2,
  Check,
  Star,
  Layers,
  CalendarDays,
} from 'lucide-react';
import {
  AppData,
  PlannedWorkout,
  WorkoutMemory,
  WorkoutSession,
  Routine,
  Exercise,
  PlannedExerciseTarget,
} from '../types';
import { EXERCISES } from '../data/exercises';

interface CalendarPlannerViewProps {
  appData: AppData;
  onUpdateAppData: (updater: (prev: AppData) => AppData) => void;
  onStartRoutine: (routine: Routine) => void;
  onStartFreeWorkout: () => void;
  onShowToast: (msg: string) => void;
}

const MEMORY_BADGES = [
  { id: '⚡ Benchmark Broken', label: '⚡ Benchmark Broken', color: 'from-amber-500 to-orange-600' },
  { id: '🏆 Rank Up Accomplished', label: '🏆 Rank Up Accomplished', color: 'from-purple-500 to-indigo-600' },
  { id: '🌅 Outdoor Park Session', label: '🌅 Outdoor Park Session', color: 'from-emerald-500 to-teal-600' },
  { id: '🧘 Mindful Form Master', label: '🧘 Mindful Form Master', color: 'from-blue-500 to-cyan-600' },
  { id: '💥 High Volume Beast', label: '💥 High Volume Beast', color: 'from-rose-500 to-red-600' },
  { id: '🤝 Trained with Squad', label: '🤝 Trained with Squad', color: 'from-amber-400 to-yellow-600' },
];

const PRESET_MEMORY_PHOTOS = [
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&auto=format&fit=crop&q=80',
];

export const CalendarPlannerView: React.FC<CalendarPlannerViewProps> = ({
  appData,
  onUpdateAppData,
  onStartRoutine,
  onStartFreeWorkout,
  onShowToast,
}) => {
  // Current viewed month/year in calendar
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [activeSubTab, setActiveSubTab] = useState<'grid' | 'memories' | 'upcoming'>('grid');

  // Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<PlannedWorkout | null>(null);
  const [editingMemory, setEditingMemory] = useState<WorkoutMemory | null>(null);

  // Form states for planning
  const [planRoutineId, setPlanRoutineId] = useState<string>('');
  const [planTitle, setPlanTitle] = useState<string>('');
  const [planFocusNotes, setPlanFocusNotes] = useState<string>('');
  const [planEstMinutes, setPlanEstMinutes] = useState<number>(45);

  // Form states for memory
  const [memoryTitle, setMemoryTitle] = useState<string>('');
  const [memoryCaption, setMemoryCaption] = useState<string>('');
  const [memoryPhotoUrl, setMemoryPhotoUrl] = useState<string>('');
  const [memoryBadge, setMemoryBadge] = useState<string>('⚡ Benchmark Broken');
  const [memoryLocation, setMemoryLocation] = useState<string>('');
  const [memoryMood, setMemoryMood] = useState<1 | 2 | 3 | 4 | 5>(5);

  const routines = appData.routines || [];
  const sessions = appData.sessions || [];
  const plannedWorkouts = appData.plannedWorkouts || [];
  const memories = appData.workoutMemories || [];

  // Helper date conversions
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Convert to Monday = 0 index
  const startOffset = (firstDayOfWeek + 6) % 7;

  const todayStr = new Date().toISOString().slice(0, 10);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().slice(0, 10));
  };

  // Build calendar matrix
  const calendarCells = useMemo(() => {
    const cells = [];
    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().slice(0, 10);
      cells.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dayNum: d, dateStr, isCurrentMonth: true });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = nextDate.toISOString().slice(0, 10);
      cells.push({ dayNum: i, dateStr, isCurrentMonth: false });
    }

    return cells;
  }, [year, month, daysInMonth, startOffset]);

  // Group data by date string
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    sessions.forEach((s) => {
      const dStr = new Date(s.startTime).toISOString().slice(0, 10);
      if (!map.has(dStr)) map.set(dStr, []);
      map.get(dStr)!.push(s);
    });
    return map;
  }, [sessions]);

  const plansByDate = useMemo(() => {
    const map = new Map<string, PlannedWorkout[]>();
    plannedWorkouts.forEach((p) => {
      if (!map.has(p.date)) map.set(p.date, []);
      map.get(p.date)!.push(p);
    });
    return map;
  }, [plannedWorkouts]);

  const memoriesByDate = useMemo(() => {
    const map = new Map<string, WorkoutMemory[]>();
    memories.forEach((m) => {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date)!.push(m);
    });
    return map;
  }, [memories]);

  // Selected date data
  const selectedSessions = sessionsByDate.get(selectedDateStr) || [];
  const selectedPlans = plansByDate.get(selectedDateStr) || [];
  const selectedMemories = memoriesByDate.get(selectedDateStr) || [];

  // Open schedule modal
  const handleOpenScheduleModal = (planToEdit?: PlannedWorkout) => {
    if (planToEdit) {
      setEditingPlan(planToEdit);
      setPlanRoutineId(planToEdit.routineId || '');
      setPlanTitle(planToEdit.routineTitle);
      setPlanFocusNotes(planToEdit.targetFocusNotes || '');
      setPlanEstMinutes(planToEdit.estimatedMinutes || 45);
    } else {
      setEditingPlan(null);
      const defaultR = routines[0];
      setPlanRoutineId(defaultR ? defaultR.id : '');
      setPlanTitle(defaultR ? defaultR.title : 'Custom Calisthenics Plan');
      setPlanFocusNotes('Focus on strict lockout and controlled eccentrics.');
      setPlanEstMinutes(45);
    }
    setIsScheduleModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) {
      onShowToast('Please provide a workout plan title');
      return;
    }

    const matchedRoutine = routines.find((r) => r.id === planRoutineId);
    const plannedExercises: PlannedExerciseTarget[] = matchedRoutine
      ? matchedRoutine.items.map((item) => {
          const exDef = EXERCISES.find((e) => e.id === item.exerciseId);
          return {
            exerciseId: item.exerciseId,
            exerciseName: exDef?.name || 'Exercise',
            targetSets: item.defaultSets,
            targetRepsOrSecs: item.defaultTargetRepsOrSecs,
            notes: item.notes,
          };
        })
      : [];

    if (editingPlan) {
      // Update existing plan
      onUpdateAppData((prev) => ({
        ...prev,
        plannedWorkouts: (prev.plannedWorkouts || []).map((p) =>
          p.id === editingPlan.id
            ? {
                ...p,
                routineId: planRoutineId || undefined,
                routineTitle: planTitle.trim(),
                targetFocusNotes: planFocusNotes.trim(),
                estimatedMinutes: planEstMinutes,
                plannedExercises,
              }
            : p
        ),
      }));
      onShowToast('Updated workout plan!');
    } else {
      // Create new plan
      const newPlan: PlannedWorkout = {
        id: `plan-${Date.now()}`,
        date: selectedDateStr,
        routineId: planRoutineId || undefined,
        routineTitle: planTitle.trim(),
        targetFocusNotes: planFocusNotes.trim(),
        estimatedMinutes: planEstMinutes,
        plannedExercises,
        createdAt: Date.now(),
      };

      onUpdateAppData((prev) => ({
        ...prev,
        plannedWorkouts: [...(prev.plannedWorkouts || []), newPlan],
      }));
      onShowToast(`Scheduled "${planTitle}" for ${selectedDateStr}!`);
    }

    setIsScheduleModalOpen(false);
  };

  const handleDeletePlan = (planId: string) => {
    onUpdateAppData((prev) => ({
      ...prev,
      plannedWorkouts: (prev.plannedWorkouts || []).filter((p) => p.id !== planId),
    }));
    onShowToast('Workout plan removed.');
  };

  // Memory modal handlers
  const handleOpenMemoryModal = (memoryToEdit?: WorkoutMemory) => {
    if (memoryToEdit) {
      setEditingMemory(memoryToEdit);
      setMemoryTitle(memoryToEdit.title);
      setMemoryCaption(memoryToEdit.caption);
      setMemoryPhotoUrl(memoryToEdit.photoUrl || '');
      setMemoryBadge(memoryToEdit.memoryBadge || '⚡ Benchmark Broken');
      setMemoryLocation(memoryToEdit.locationName || '');
      setMemoryMood(memoryToEdit.moodRating || 5);
    } else {
      setEditingMemory(null);
      setMemoryTitle('Awesome Training Session');
      setMemoryCaption('Hit clean depth and locked out every rep. Feeling energized!');
      setMemoryPhotoUrl(PRESET_MEMORY_PHOTOS[0]);
      setMemoryBadge('⚡ Benchmark Broken');
      setMemoryLocation('Calisthenics Outdoor Park');
      setMemoryMood(5);
    }
    setIsMemoryModalOpen(true);
  };

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryTitle.trim()) {
      onShowToast('Please provide a title for your memory');
      return;
    }

    if (editingMemory) {
      onUpdateAppData((prev) => ({
        ...prev,
        workoutMemories: (prev.workoutMemories || []).map((m) =>
          m.id === editingMemory.id
            ? {
                ...m,
                title: memoryTitle.trim(),
                caption: memoryCaption.trim(),
                photoUrl: memoryPhotoUrl.trim() || undefined,
                memoryBadge,
                locationName: memoryLocation.trim() || undefined,
                moodRating: memoryMood,
              }
            : m
        ),
      }));
      onShowToast('Workout memory updated!');
    } else {
      const newMem: WorkoutMemory = {
        id: `mem-${Date.now()}`,
        date: selectedDateStr,
        title: memoryTitle.trim(),
        caption: memoryCaption.trim(),
        photoUrl: memoryPhotoUrl.trim() || PRESET_MEMORY_PHOTOS[0],
        memoryBadge,
        locationName: memoryLocation.trim() || undefined,
        moodRating: memoryMood,
        createdAt: Date.now(),
      };

      onUpdateAppData((prev) => ({
        ...prev,
        workoutMemories: [newMem, ...(prev.workoutMemories || [])],
      }));
      onShowToast('Saved workout memory to calendar!');
    }

    setIsMemoryModalOpen(false);
  };

  const handleDeleteMemory = (memId: string) => {
    onUpdateAppData((prev) => ({
      ...prev,
      workoutMemories: (prev.workoutMemories || []).filter((m) => m.id !== memId),
    }));
    onShowToast('Memory deleted.');
  };

  // Launch routine from plan
  const handleLaunchPlan = (plan: PlannedWorkout) => {
    if (plan.routineId) {
      const found = routines.find((r) => r.id === plan.routineId);
      if (found) {
        onStartRoutine(found);
        return;
      }
    }

    // Custom inline routine construction
    const tempRoutine: Routine = {
      id: `custom-plan-${Date.now()}`,
      title: plan.routineTitle,
      description: plan.targetFocusNotes || 'Planned calendar workout session',
      category: 'custom',
      estimatedMinutes: plan.estimatedMinutes || 45,
      difficulty: 'intermediate',
      items: (plan.plannedExercises || []).map((pe) => ({
        exerciseId: pe.exerciseId,
        defaultSets: pe.targetSets || 3,
        defaultTargetRepsOrSecs: pe.targetRepsOrSecs || 10,
        defaultRestSeconds: 90,
        notes: pe.notes,
      })),
    };

    onStartRoutine(tempRoutine);
  };

  const monthYearLabel = currentDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* View Header */}
      <div className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-bold mb-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Workout Planner & Memory Journal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
              Calendar & Training Memories
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Plan upcoming workout sessions for future dates and customize personal memories with reflections, photo memories, and milestones.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenScheduleModal()}
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-mono font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Schedule Plan</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenMemoryModal()}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer border border-zinc-700"
            >
              <Camera className="w-4 h-4 text-orange-400" />
              <span>Add Memory</span>
            </button>
          </div>
        </div>

        {/* View Switcher Subtabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setActiveSubTab('grid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'grid'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Monthly Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('memories')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'memories'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Memories Wall ({memories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('upcoming')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'upcoming'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming Plans ({plannedWorkouts.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid Left Side */}
          <div className="lg:col-span-2 p-5 bg-zinc-900/80 border border-zinc-800 rounded-3xl space-y-4 shadow-md">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">{monthYearLabel}</h2>
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-orange-400 text-[10px] font-mono font-bold transition cursor-pointer"
                >
                  Jump to Today
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-zinc-400 font-bold uppercase">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Calendar Grid Tiles */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, idx) => {
                const daySessions = sessionsByDate.get(cell.dateStr) || [];
                const dayPlans = plansByDate.get(cell.dateStr) || [];
                const dayMemories = memoriesByDate.get(cell.dateStr) || [];

                const isSelected = selectedDateStr === cell.dateStr;
                const isToday = todayStr === cell.dateStr;

                const hasCompleted = daySessions.length > 0;
                const hasPlan = dayPlans.length > 0;
                const hasMemory = dayMemories.length > 0;

                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`min-h-[72px] sm:min-h-[84px] p-1.5 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-950 border-orange-500 ring-2 ring-orange-500/50 shadow-lg'
                        : isToday
                        ? 'bg-orange-500/10 border-orange-500/40'
                        : cell.isCurrentMonth
                        ? 'bg-zinc-950/70 border-zinc-850 hover:border-zinc-700'
                        : 'bg-zinc-950/30 border-zinc-900 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isToday
                            ? 'w-5 h-5 rounded-full bg-orange-500 text-zinc-950 flex items-center justify-center text-[10px]'
                            : cell.isCurrentMonth
                            ? 'text-zinc-200'
                            : 'text-zinc-600'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {hasMemory && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Memory attached" />
                      )}
                    </div>

                    {/* Indicators */}
                    <div className="space-y-1 w-full mt-1">
                      {hasCompleted && (
                        <div className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 font-bold truncate flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{daySessions[0].routineTitle}</span>
                        </div>
                      )}

                      {hasPlan && (
                        <div className="px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-500/30 text-[9px] font-mono text-orange-400 font-bold truncate flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{dayPlans[0].routineTitle}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-800/80 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <span>Completed Session</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-orange-500" />
                <span>Scheduled Workout Plan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-400" />
                <span>Memory Attached</span>
              </div>
            </div>
          </div>

          {/* Selected Date Inspector Right Side */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-3xl space-y-5 shadow-md">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                Selected Date Inspector
              </span>
              <h3 className="text-lg font-bold text-white font-display mt-0.5">
                {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
            </div>

            {/* Scheduled Plans for Date */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Planned Workouts ({selectedPlans.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenScheduleModal()}
                  className="text-[11px] font-mono text-orange-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Plan</span>
                </button>
              </div>

              {selectedPlans.length === 0 ? (
                <div className="p-4 bg-zinc-950/60 border border-dashed border-zinc-800 rounded-2xl text-center space-y-2">
                  <p className="text-xs text-zinc-400">No workout plan scheduled for this date.</p>
                  <button
                    type="button"
                    onClick={() => handleOpenScheduleModal()}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-orange-400 rounded-xl text-xs font-mono font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Plan a Workout</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white font-display">
                            {plan.routineTitle}
                          </h4>
                          {plan.estimatedMinutes && (
                            <span className="text-[10px] text-zinc-400 font-mono">
                              ~{plan.estimatedMinutes} mins estimated
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenScheduleModal(plan)}
                            className="p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
                            title="Edit Plan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {plan.targetFocusNotes && (
                        <p className="text-xs text-zinc-300 bg-zinc-900/90 p-2 rounded-xl border border-zinc-800 font-mono">
                          💡 {plan.targetFocusNotes}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => handleLaunchPlan(plan)}
                        className="w-full py-2 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-mono font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Planned Workout Now</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Workout Logs for Date */}
            <div className="space-y-2.5 pt-3 border-t border-zinc-800/80">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed Logs ({selectedSessions.length})</span>
              </span>

              {selectedSessions.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No workouts logged on this date yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedSessions.map((s) => (
                    <div key={s.id} className="p-3 bg-zinc-950/80 border border-zinc-850 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
                        <span>{s.routineTitle}</span>
                        <span className="text-orange-400 font-mono">
                          {Math.round((s.durationSeconds || 0) / 60)} mins
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono">
                        <span>{s.totalSetsCompleted || 0} sets</span>
                        <span>•</span>
                        <span>{s.totalVolumeReps || 0} reps</span>
                        {s.totalHoldSeconds > 0 && <span>• {s.totalHoldSeconds}s holds</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Workout Memories for Date */}
            <div className="space-y-2.5 pt-3 border-t border-zinc-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Personal Memories ({selectedMemories.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenMemoryModal()}
                  className="text-[11px] font-mono text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Memory</span>
                </button>
              </div>

              {selectedMemories.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No personal memories tagged for this date.</p>
              ) : (
                <div className="space-y-3">
                  {selectedMemories.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2 overflow-hidden relative"
                    >
                      {mem.photoUrl && (
                        <div className="h-32 w-full rounded-xl overflow-hidden relative bg-zinc-900">
                          <img
                            src={mem.photoUrl}
                            alt={mem.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-zinc-950/80 text-[9px] font-mono font-bold text-amber-400 border border-amber-500/30">
                            {mem.memoryBadge}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white font-display">
                            {mem.title}
                          </h4>
                          {mem.locationName && (
                            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-orange-400" />
                              <span>{mem.locationName}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenMemoryModal(mem)}
                            className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMemory(mem.id)}
                            className="p-1 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed italic">{mem.caption}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Memories Wall View */}
      {activeSubTab === 'memories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" />
              <span>Training Memories Gallery Wall</span>
            </h2>

            <button
              type="button"
              onClick={() => handleOpenMemoryModal()}
              className="px-3.5 py-2 bg-orange-500 text-zinc-950 rounded-xl font-mono text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Memory</span>
            </button>
          </div>

          {memories.length === 0 ? (
            <div className="p-12 bg-zinc-900/80 border border-dashed border-zinc-800 rounded-3xl text-center space-y-3">
              <Camera className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Fitness Memories Created Yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Capture your outdoor park sessions, PR breakthroughs, and rank milestones with custom photos, badges, and reflections!
              </p>
              <button
                type="button"
                onClick={() => handleOpenMemoryModal()}
                className="px-4 py-2 bg-orange-500 text-zinc-950 font-mono font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Memory</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-3xl space-y-3 shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {mem.photoUrl && (
                      <div className="h-44 w-full rounded-2xl overflow-hidden relative bg-zinc-950">
                        <img
                          src={mem.photoUrl}
                          alt={mem.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                        <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-zinc-950/80 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                          {mem.memoryBadge}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400">
                          {mem.date}
                        </span>
                        {mem.locationName && (
                          <span className="text-[10px] text-orange-400 font-mono flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{mem.locationName}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white font-display">{mem.title}</h3>
                      <p className="text-xs text-zinc-300 italic leading-relaxed">{mem.caption}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= (mem.moodRating || 5) ? 'fill-current text-amber-400' : 'text-zinc-700'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenMemoryModal(mem)}
                        className="p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Plans List View */}
      {activeSubTab === 'upcoming' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <span>Scheduled Workout Plans</span>
            </h2>

            <button
              type="button"
              onClick={() => handleOpenScheduleModal()}
              className="px-3.5 py-2 bg-orange-500 text-zinc-950 rounded-xl font-mono text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Schedule Plan</span>
            </button>
          </div>

          {plannedWorkouts.length === 0 ? (
            <div className="p-12 bg-zinc-900/80 border border-dashed border-zinc-800 rounded-3xl text-center space-y-3">
              <Clock className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Upcoming Plans Scheduled</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Schedule your next calisthenics routine for tomorrow or later in the week to keep your momentum going!
              </p>
              <button
                type="button"
                onClick={() => handleOpenScheduleModal()}
                className="px-4 py-2 bg-orange-500 text-zinc-950 font-mono font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Plan</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plannedWorkouts.map((plan) => (
                <div
                  key={plan.id}
                  className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-3xl space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-mono font-bold">
                        Scheduled for {plan.date}
                      </span>
                      <h3 className="text-base font-bold text-white font-display mt-1">
                        {plan.routineTitle}
                      </h3>
                      {plan.estimatedMinutes && (
                        <p className="text-xs text-zinc-400 font-mono">
                          ~{plan.estimatedMinutes} mins estimated duration
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenScheduleModal(plan)}
                        className="p-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {plan.targetFocusNotes && (
                    <p className="text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 font-mono">
                      💡 {plan.targetFocusNotes}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => handleLaunchPlan(plan)}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-mono font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Workout</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Plan Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-bold text-white font-display">
                  {editingPlan ? 'Edit Workout Plan' : 'Schedule Workout Plan'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Target Date</label>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => setSelectedDateStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Select Routine Template</label>
                <select
                  value={planRoutineId}
                  onChange={(e) => {
                    setPlanRoutineId(e.target.value);
                    const selectedR = routines.find((r) => r.id === e.target.value);
                    if (selectedR) {
                      setPlanTitle(selectedR.title);
                      setPlanEstMinutes(selectedR.estimatedMinutes || 45);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none cursor-pointer"
                >
                  <option value="">-- Custom Plan --</option>
                  {routines.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Plan Title</label>
                <input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="e.g. Upper Body Explosive & Muscle-Up Target"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Focus Notes & Cues (Optional)
                </label>
                <textarea
                  value={planFocusNotes}
                  onChange={(e) => setPlanFocusNotes(e.target.value)}
                  placeholder="e.g. Focus on dead-stop strict form, hollow core, and 90s rest..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 font-mono text-xs rounded-xl hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-zinc-950 font-mono font-bold text-xs rounded-xl hover:bg-orange-400"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Memory Modal */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white font-display">
                  {editingMemory ? 'Edit Workout Memory' : 'Customize Workout Memory'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMemoryModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMemory} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Memory Title</label>
                <input
                  type="text"
                  value={memoryTitle}
                  onChange={(e) => setMemoryTitle(e.target.value)}
                  placeholder="e.g. Sunset Muscle-Up Breakthrough"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Personal Memory Reflection / Caption
                </label>
                <textarea
                  value={memoryCaption}
                  onChange={(e) => setMemoryCaption(e.target.value)}
                  placeholder="What made this workout memorable? Felt explosive, PR hit, clean form..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Memory Badge</label>
                <select
                  value={memoryBadge}
                  onChange={(e) => setMemoryBadge(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none cursor-pointer"
                >
                  {MEMORY_BADGES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Location Name (Optional)</label>
                <input
                  type="text"
                  value={memoryLocation}
                  onChange={(e) => setMemoryLocation(e.target.value)}
                  placeholder="e.g. Muscle Beach / Local Park"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Photo URL or Preset Background</label>
                <input
                  type="url"
                  value={memoryPhotoUrl}
                  onChange={(e) => setMemoryPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500 mb-2"
                />

                <div className="grid grid-cols-4 gap-2">
                  {PRESET_MEMORY_PHOTOS.map((url, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setMemoryPhotoUrl(url)}
                      className={`h-12 rounded-xl overflow-hidden border transition cursor-pointer ${
                        memoryPhotoUrl === url ? 'ring-2 ring-orange-500 border-orange-500' : 'border-zinc-800'
                      }`}
                    >
                      <img src={url} alt="Preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMemoryModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 font-mono text-xs rounded-xl hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-zinc-950 font-mono font-bold text-xs rounded-xl hover:bg-orange-400"
                >
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
