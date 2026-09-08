import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Dumbbell,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ChevronUp,
  ChevronDown,
  Copy,
  Info,
  Zap,
  Flame,
  Check,
} from 'lucide-react';
import { Exercise, Routine, RoutineItem } from '../types';
import { getAllExercises, findExercise } from '../data/exercises';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { CreateCustomExerciseModal } from './CreateCustomExerciseModal';

interface RoutineEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoutine: (routine: Routine) => void;
  initialRoutine?: Routine | null;
  customExercises?: Exercise[];
  onSaveCustomExercise?: (exercise: Exercise) => void;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const REST_PRESETS = [30, 45, 60, 90, 120, 180];

const TEMPLATE_PRESETS: {
  title: string;
  category: Routine['category'];
  difficulty: Routine['difficulty'];
  description: string;
  scheduleDays: string[];
  items: RoutineItem[];
}[] = [
  {
    title: 'Push & Handstand Power Split',
    category: 'upper',
    difficulty: 'intermediate',
    description: 'Fundamental horizontal and vertical pressing paired with shoulder endurance.',
    scheduleDays: ['Mon', 'Thu'],
    items: [
      { exerciseId: 'standard_push_up', defaultSets: 4, defaultTargetRepsOrSecs: 15, defaultRestSeconds: 60, notes: 'Strict chest-to-floor touch' },
      { exerciseId: 'parallel_bar_dip', defaultSets: 4, defaultTargetRepsOrSecs: 10, defaultRestSeconds: 90, notes: 'Full depth below 90 degrees' },
      { exerciseId: 'pike_push_up', defaultSets: 3, defaultTargetRepsOrSecs: 8, defaultRestSeconds: 90, notes: 'Hips high over shoulders' },
      { exerciseId: 'wall_handstand_chest_to_wall', defaultSets: 3, defaultTargetRepsOrSecs: 30, defaultRestSeconds: 90, notes: 'Hollow body alignment' },
    ],
  },
  {
    title: 'Pull & Back Lever Progression',
    category: 'upper',
    difficulty: 'advanced',
    description: 'Posterior chain, straight-arm scapular retraction, and heavy pulling volume.',
    scheduleDays: ['Tue', 'Fri'],
    items: [
      { exerciseId: 'standard_pull_up', defaultSets: 4, defaultTargetRepsOrSecs: 8, defaultRestSeconds: 90, notes: 'Full dead hang to chest-to-bar' },
      { exerciseId: 'tuck_back_lever', defaultSets: 4, defaultTargetRepsOrSecs: 15, defaultRestSeconds: 90, notes: 'Strong glute and lat squeeze' },
      { exerciseId: 'horizontal_row', defaultSets: 3, defaultTargetRepsOrSecs: 12, defaultRestSeconds: 60, notes: 'Retract scapulae firmly' },
      { exerciseId: 'chin_up', defaultSets: 3, defaultTargetRepsOrSecs: 8, defaultRestSeconds: 90, notes: 'Bicep & lat emphasis' },
    ],
  },
  {
    title: 'Full Body Calisthenics Routine',
    category: 'full_body',
    difficulty: 'intermediate',
    description: 'Balanced compound movements covering pushing, pulling, core, and lower body.',
    scheduleDays: ['Mon', 'Wed', 'Fri'],
    items: [
      { exerciseId: 'standard_pull_up', defaultSets: 3, defaultTargetRepsOrSecs: 8, defaultRestSeconds: 90 },
      { exerciseId: 'parallel_bar_dip', defaultSets: 3, defaultTargetRepsOrSecs: 10, defaultRestSeconds: 90 },
      { exerciseId: 'standard_push_up', defaultSets: 3, defaultTargetRepsOrSecs: 15, defaultRestSeconds: 60 },
      { exerciseId: 'pistol_squat_assisted', defaultSets: 3, defaultTargetRepsOrSecs: 8, defaultRestSeconds: 60 },
      { exerciseId: 'hanging_leg_raise', defaultSets: 3, defaultTargetRepsOrSecs: 10, defaultRestSeconds: 60 },
    ],
  },
];

export const RoutineEditorModal: React.FC<RoutineEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveRoutine,
  initialRoutine,
  customExercises = [],
  onSaveCustomExercise,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Routine['category']>('full_body');
  const [difficulty, setDifficulty] = useState<Routine['difficulty']>('intermediate');
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isCreateCustomOpen, setIsCreateCustomOpen] = useState(false);

  // Sync state whenever initialRoutine or open status changes
  useEffect(() => {
    if (isOpen) {
      if (initialRoutine) {
        setTitle(initialRoutine.title);
        setDescription(initialRoutine.description || '');
        setCategory(initialRoutine.category);
        setDifficulty(initialRoutine.difficulty);
        setScheduleDays(initialRoutine.scheduleDays || []);
        setItems(initialRoutine.items || []);
      } else {
        // Defaults for fresh custom plan
        setTitle('');
        setDescription('');
        setCategory('custom');
        setDifficulty('intermediate');
        setScheduleDays(['Mon', 'Wed', 'Fri']);
        setItems([
          { exerciseId: 'standard_pull_up', defaultSets: 3, defaultTargetRepsOrSecs: 8, defaultRestSeconds: 90 },
          { exerciseId: 'parallel_bar_dip', defaultSets: 3, defaultTargetRepsOrSecs: 10, defaultRestSeconds: 90 },
          { exerciseId: 'standard_push_up', defaultSets: 3, defaultTargetRepsOrSecs: 12, defaultRestSeconds: 60 },
        ]);
      }
    }
  }, [isOpen, initialRoutine]);

  const allAvailableExercises = useMemo(() => {
    return getAllExercises(customExercises);
  }, [customExercises]);

  // Calculations for live plan stats
  const totalPlannedSets = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.defaultSets || 0), 0);
  }, [items]);

  const estimatedMinutes = useMemo(() => {
    return Math.round(
      items.reduce((acc, item) => {
        const setSeconds = (item.defaultRestSeconds || 60) + 30;
        return acc + (item.defaultSets || 3) * (setSeconds / 60);
      }, 0)
    );
  }, [items]);

  const targetedMuscles = useMemo(() => {
    const muscles = new Set<string>();
    items.forEach((item) => {
      const ex = findExercise(item.exerciseId, customExercises);
      if (ex) {
        ex.primaryMuscles.forEach((m) => muscles.add(m));
      }
    });
    return Array.from(muscles);
  }, [items, customExercises]);

  if (!isOpen) return null;

  const toggleDay = (day: string) => {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleApplyTemplate = (tmpl: (typeof TEMPLATE_PRESETS)[0]) => {
    setTitle(tmpl.title);
    setDescription(tmpl.description);
    setCategory(tmpl.category);
    setDifficulty(tmpl.difficulty);
    setScheduleDays(tmpl.scheduleDays);
    setItems(tmpl.items);
  };

  const handleAddExercise = (exercise: Exercise) => {
    setItems((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        defaultSets: 3,
        defaultTargetRepsOrSecs: exercise.type === 'hold_seconds' ? 20 : 10,
        defaultRestSeconds: 90,
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateItem = (index: number) => {
    const toDuplicate = items[index];
    const newItems = [...items];
    newItems.splice(index + 1, 0, { ...toDuplicate });
    setItems(newItems);
  };

  const handleUpdateItem = (index: number, updates: Partial<RoutineItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setItems(newItems);
  };

  const handleSaveCustomExerciseFromModal = (exercise: Exercise) => {
    if (onSaveCustomExercise) {
      onSaveCustomExercise(exercise);
    }
    handleAddExercise(exercise);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (items.length === 0) return;

    const routine: Routine = {
      id: initialRoutine?.id || `custom_routine_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Custom created calisthenics workout plan',
      category,
      difficulty,
      estimatedMinutes: Math.max(15, estimatedMinutes),
      scheduleDays: scheduleDays.length > 0 ? scheduleDays : undefined,
      items,
      isCustom: true,
    };

    onSaveRoutine(routine);
    onClose();
  };

  return (
    <>
      <div
        id="routine-editor-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          id="routine-editor-modal"
          className="relative w-full max-w-3xl max-h-[94vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-white">
                  {initialRoutine ? 'Edit Workout Plan' : 'Create Custom Workout Plan'}
                </h2>
                <p className="text-xs text-zinc-400">
                  Build custom calisthenics splits, exercises, rep schemes, and rest cycles
                </p>
              </div>
            </div>

            <button
              id="close-routine-editor-btn"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Quick Template Presets Bar */}
            {!initialRoutine && (
              <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Start from a proven calisthenics template or design from scratch:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_PRESETS.map((tmpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{tmpl.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Plan Identity: Title, Category, Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Workout Plan Title <span className="text-amber-400">*</span>
                </label>
                <input
                  id="routine-title-input"
                  type="text"
                  required
                  placeholder="e.g., Push & Back Lever Focus, Weighted Calisthenics 4-Day"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700/70 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Split Category</label>
                <select
                  id="routine-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Routine['category'])}
                  className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700/70 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="custom">Custom Program</option>
                  <option value="upper">Upper Body</option>
                  <option value="full_body">Full Body</option>
                  <option value="skills">Skills & Static Levers</option>
                  <option value="core">Core & Compression</option>
                  <option value="lower">Lower Body</option>
                </select>
              </div>
            </div>

            {/* Description & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Goal & Description</label>
                <input
                  id="routine-desc-input"
                  type="text"
                  placeholder="e.g., Strict form emphasis with progressive overload on working sets"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700/70 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Target Level</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-semibold capitalize transition ${
                        difficulty === d
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                          : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target Training Days Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scheduled Training Days</span>
                </label>
                <span className="text-[11px] text-zinc-500">
                  {scheduleDays.length > 0 ? `${scheduleDays.join(' • ')}` : 'Flexible (No set days)'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = scheduleDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                          : 'bg-zinc-800/70 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Plan Metrics Summary Card */}
            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold">Movements</span>
                <p className="text-base sm:text-lg font-black text-white font-mono">{items.length}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold">Total Sets</span>
                <p className="text-base sm:text-lg font-black text-amber-400 font-mono">{totalPlannedSets}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold">Est. Duration</span>
                <p className="text-base sm:text-lg font-black text-white font-mono">~{estimatedMinutes} min</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold">Primary Muscles</span>
                <p className="text-xs font-bold text-zinc-300 truncate mt-0.5">
                  {targetedMuscles.slice(0, 3).join(', ') || 'Various'}
                </p>
              </div>
            </div>

            {/* Exercises List in Routine */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white font-display">
                    Plan Exercises & Progression Order ({items.length})
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsCreateCustomOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Custom Exercise</span>
                  </button>

                  <button
                    type="button"
                    id="open-add-exercise-to-routine-btn"
                    onClick={() => setIsExercisePickerOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 transition"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Exercise</span>
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-400 space-y-3">
                  <Dumbbell className="w-8 h-8 mx-auto text-zinc-600" />
                  <div>
                    <p className="text-sm font-medium text-white">No exercises in this workout plan yet</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Choose from push-ups, levers, pull-ups, dips, or create custom movements.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExercisePickerOpen(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Browse Exercise Library
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const ex = findExercise(item.exerciseId, customExercises);
                    const isHold = ex?.type === 'hold_seconds';

                    return (
                      <div
                        key={`${item.exerciseId}_${index}`}
                        id={`routine-item-${index}`}
                        className="p-4 bg-zinc-800/70 border border-zinc-700/60 rounded-2xl space-y-3 shadow-md transition hover:border-zinc-600"
                      >
                        {/* Card Header: Exercise Name, tags & Reordering */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-700/80 text-xs font-mono font-bold text-amber-300">
                              {index + 1}
                            </span>
                            <span className="text-sm sm:text-base font-bold text-white font-display">
                              {ex?.name || item.exerciseId}
                            </span>
                            {ex?.isCustom && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Custom
                              </span>
                            )}
                            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                              {ex?.category?.toUpperCase()}
                            </span>
                            {isHold && (
                              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                Hold (Seconds)
                              </span>
                            )}
                          </div>

                          {/* Action Controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveItem(index, 'up')}
                              disabled={index === 0}
                              className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-20 rounded-lg hover:bg-zinc-700 transition"
                              title="Move Up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveItem(index, 'down')}
                              disabled={index === items.length - 1}
                              className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-20 rounded-lg hover:bg-zinc-700 transition"
                              title="Move Down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateItem(index)}
                              className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-700 transition"
                              title="Duplicate Exercise in Routine"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-700 transition ml-0.5"
                              title="Remove Exercise"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Set Parameters: Sets, Target Reps/Secs, Rest Timer */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          {/* Sets Input */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-400 uppercase font-mono font-semibold">
                              Target Sets
                            </label>
                            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateItem(index, { defaultSets: Math.max(1, item.defaultSets - 1) })
                                }
                                className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="999"
                                value={item.defaultSets}
                                onChange={(e) =>
                                  handleUpdateItem(index, {
                                    defaultSets: Math.max(1, parseInt(e.target.value) || 1),
                                  })
                                }
                                className="flex-1 bg-transparent py-2 text-center text-xs font-mono font-bold text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateItem(index, { defaultSets: item.defaultSets + 1 })
                                }
                                className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Target Reps / Hold Secs */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-400 uppercase font-mono font-semibold">
                              {isHold ? 'Target Duration (s)' : 'Target Reps / Set'}
                            </label>
                            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateItem(index, {
                                    defaultTargetRepsOrSecs: Math.max(1, item.defaultTargetRepsOrSecs - (isHold ? 5 : 1)),
                                  })
                                }
                                className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="300"
                                value={item.defaultTargetRepsOrSecs}
                                onChange={(e) =>
                                  handleUpdateItem(index, {
                                    defaultTargetRepsOrSecs: Math.max(1, parseInt(e.target.value) || 1),
                                  })
                                }
                                className="flex-1 bg-transparent py-2 text-center text-xs font-mono font-bold text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateItem(index, {
                                    defaultTargetRepsOrSecs: item.defaultTargetRepsOrSecs + (isHold ? 5 : 1),
                                  })
                                }
                                className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Rest Timer with Quick Presets */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] text-zinc-400 uppercase font-mono font-semibold">
                                Rest Period (Secs)
                              </label>
                              <span className="text-[10px] font-mono text-amber-400 font-bold">
                                {item.defaultRestSeconds}s
                              </span>
                            </div>
                            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                              {REST_PRESETS.map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handleUpdateItem(index, { defaultRestSeconds: preset })}
                                  className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-mono font-semibold transition ${
                                    item.defaultRestSeconds === preset
                                      ? 'bg-amber-500 text-zinc-950 font-bold'
                                      : 'bg-zinc-900 border border-zinc-700/60 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {preset}s
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Exercise Specific Notes & Cues */}
                        <div className="pt-1">
                          <input
                            type="text"
                            placeholder="Technique cue or tempo note (e.g. 3s eccentric, hollow body, wide grip)..."
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateItem(index, { notes: e.target.value })}
                            className="w-full px-3 py-1.5 bg-zinc-900/90 border border-zinc-700/50 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <div className="text-xs text-zinc-400">
                {items.length === 0 ? (
                  <span className="text-amber-400/90">Add at least 1 exercise to save your plan</span>
                ) : (
                  <span>Ready to train: {items.length} movements • {totalPlannedSets} sets</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-routine-submit-btn"
                  disabled={!title.trim() || items.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{initialRoutine ? 'Save Changes' : 'Create Workout Plan'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Exercise Selection Modal */}
      <ExerciseLibraryModal
        isOpen={isExercisePickerOpen}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelectExercise={handleAddExercise}
        alreadySelectedIds={items.map((i) => i.exerciseId)}
        title="Add Exercise to Workout Plan"
        customExercises={customExercises}
        onSaveCustomExercise={handleSaveCustomExerciseFromModal}
      />

      {/* Dedicated Custom Exercise Creator */}
      <CreateCustomExerciseModal
        isOpen={isCreateCustomOpen}
        onClose={() => setIsCreateCustomOpen(false)}
        onSaveCustomExercise={handleSaveCustomExerciseFromModal}
      />
    </>
  );
};
