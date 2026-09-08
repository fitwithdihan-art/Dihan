import React, { useState } from 'react';
import {
  Play,
  Plus,
  Clock,
  Dumbbell,
  Flame,
  Sparkles,
  ChevronRight,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  Layers,
  FileText,
  Eye,
  X,
  Target,
  Trophy,
} from 'lucide-react';
import { Exercise, Routine } from '../types';
import { findExercise } from '../data/exercises';
import { GymBeastVisualizer } from './GymBeastVisualizer';

interface RoutinesViewProps {
  routines: Routine[];
  onStartRoutine: (routine: Routine) => void;
  onStartFreeWorkout: () => void;
  onOpenRoutineEditor: (routine?: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  customExercises?: Exercise[];
}

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  routines,
  onStartRoutine,
  onStartFreeWorkout,
  onOpenRoutineEditor,
  onDeleteRoutine,
  customExercises = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewingRoutine, setPreviewingRoutine] = useState<Routine | null>(null);

  const customCount = routines.filter((r) => r.isCustom).length;

  const filteredRoutines = routines.filter((r) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'custom') return r.isCustom;
    return r.category === selectedCategory;
  });

  const handleDuplicateRoutine = (routine: Routine) => {
    const cloned: Routine = {
      ...routine,
      id: `custom_routine_${Date.now()}`,
      title: `${routine.title} (Customized)`,
      isCustom: true,
      items: routine.items.map((it) => ({ ...it })),
    };
    onOpenRoutineEditor(cloned);
  };

  // Helper to extract unique target muscles for the whole routine split
  const getRoutineMuscleGroups = (routine: Routine) => {
    const primary: string[] = [];
    const secondary: string[] = [];

    routine.items.forEach((item) => {
      const ex = findExercise(item.exerciseId, customExercises);
      if (ex) {
        ex.primaryMuscles.forEach((m) => {
          if (!primary.includes(m)) primary.push(m);
        });
        if (ex.secondaryMuscles) {
          ex.secondaryMuscles.forEach((m) => {
            if (!secondary.includes(m) && !primary.includes(m)) {
              secondary.push(m);
            }
          });
        }
      }
    });

    return { primary, secondary };
  };

  return (
    <div id="routines-view" className="space-y-6">
      {/* Hero Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
              Calisthenics Programs & Splits
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
            Workout Plans & Routines
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Design your own custom workout plans, set target reps and rest timers, or train with structured calisthenics progressions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="quick-start-empty-workout-btn"
            onClick={onStartFreeWorkout}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs sm:text-sm font-semibold text-zinc-200 transition"
          >
            <Dumbbell className="w-4 h-4 text-zinc-400" />
            <span>Free Workout</span>
          </button>
          <button
            id="create-custom-routine-btn"
            onClick={() => onOpenRoutineEditor()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-xs sm:text-sm font-bold text-zinc-950 shadow-md shadow-orange-500/10 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Workout Plan</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs with Custom Count Badge */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: 'All Programs', value: 'all', count: routines.length },
          { label: 'My Custom Plans', value: 'custom', count: customCount },
          { label: 'Full Body', value: 'full_body' },
          { label: 'Upper Body', value: 'upper' },
          { label: 'Skills & Statics', value: 'skills' },
          { label: 'Lower Body', value: 'lower' },
        ].map((cat) => {
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              id={`routine-filter-${cat.value}`}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>{cat.label}</span>
              {typeof cat.count === 'number' && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-zinc-950/20 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty State for Custom Category */}
      {selectedCategory === 'custom' && filteredRoutines.length === 0 && (
        <div className="p-8 sm:p-12 text-center bg-zinc-900/60 border-2 border-dashed border-zinc-800 rounded-3xl space-y-4">
          <div className="p-3 w-12 h-12 mx-auto rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white font-display">No Custom Workout Plans Yet</h3>
            <p className="text-xs text-zinc-400">
              Create your personalized training split with specific exercises, sets, reps, and scheduled training days.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenRoutineEditor()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-xs sm:text-sm font-bold text-zinc-950 shadow-lg shadow-orange-500/10 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Custom Workout Plan</span>
            </button>
            <button
              onClick={() => setSelectedCategory('all')}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs sm:text-sm font-semibold text-zinc-200 transition"
            >
              Browse & Clone Pre-Built Routines
            </button>
          </div>
        </div>
      )}

      {/* Routines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRoutines.map((routine) => {
          return (
            <div
              key={routine.id}
              id={`routine-card-${routine.id}`}
              className="flex flex-col justify-between p-5 bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl shadow-lg transition group"
            >
              <div>
                {/* Routine Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md ${
                          routine.difficulty === 'beginner'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : routine.difficulty === 'intermediate'
                            ? 'bg-orange-500/15 text-orange-300'
                            : 'bg-red-950/50 text-red-600 border border-red-900/45 font-black'
                        }`}
                      >
                        {routine.difficulty}
                      </span>

                      {routine.isCustom ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Custom Plan
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-mono text-zinc-400 uppercase rounded-md bg-zinc-800/60">
                          Standard
                        </span>
                      )}

                      {routine.scheduleDays && routine.scheduleDays.length > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-zinc-300 rounded-md bg-zinc-800 border border-zinc-700/50">
                          <Calendar className="w-2.5 h-2.5 text-orange-400" />
                          <span>{routine.scheduleDays.join(' • ')}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white font-display group-hover:text-orange-400 transition">
                      {routine.title}
                    </h3>
                  </div>

                  {/* Top Right Action Icons */}
                  <div className="flex items-center gap-1">
                    {routine.isCustom ? (
                      <>
                        <button
                          onClick={() => onOpenRoutineEditor(routine)}
                          className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                          title="Edit Workout Plan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateRoutine(routine)}
                          className="p-1.5 text-zinc-400 hover:text-orange-400 rounded-lg hover:bg-zinc-800 transition"
                          title="Duplicate Plan"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete workout plan "${routine.title}"?`)) {
                              onDeleteRoutine(routine.id);
                            }
                          }}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDuplicateRoutine(routine)}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:text-orange-300 rounded-lg hover:bg-zinc-800 transition"
                        title="Customize as Custom Plan"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Customize</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{routine.description}</p>

                {/* Exercises Preview List */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                    <span>Exercises ({routine.items.length})</span>
                    <span>Target Volume</span>
                  </div>
                  <div className="space-y-1">
                    {routine.items.map((item, idx) => {
                      const ex = findExercise(item.exerciseId, customExercises);
                      const isHold = ex?.type === 'hold_seconds';

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-zinc-950/40 text-zinc-300 border border-zinc-800/40"
                        >
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <span className="text-[10px] font-mono text-zinc-500">#{idx + 1}</span>
                            <span className="truncate">{ex?.name || item.exerciseId}</span>
                            {item.notes && (
                              <span className="hidden sm:inline text-[10px] text-zinc-500 italic truncate max-w-[120px]">
                                • {item.notes}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-zinc-400">
                            <span className="text-orange-400/90 font-bold">
                              {item.defaultSets} × {item.defaultTargetRepsOrSecs}
                              {isHold ? 's' : ''}
                            </span>
                            <span className="text-[10px] text-zinc-600">({item.defaultRestSeconds}s rest)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Routine Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  <span>~{routine.estimatedMinutes} min</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`view-routine-btn-${routine.id}`}
                    onClick={() => setPreviewingRoutine(routine)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white font-bold text-xs rounded-xl transition"
                    title="Preview Workout Plan"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Plan</span>
                  </button>

                  {routine.isCustom && (
                    <button
                      onClick={() => onOpenRoutineEditor(routine)}
                      className="px-3 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs rounded-xl transition"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    id={`start-routine-btn-${routine.id}`}
                    onClick={() => onStartRoutine(routine)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Routine</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Immersive Workout Plan Preview Modal */}
      {previewingRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-850 rounded-3xl shadow-2xl my-8">
            {/* Modal Header */}
            <div className="sticky top-0 bg-zinc-900/95 backdrop-blur px-6 py-4.5 border-b border-zinc-800 flex items-center justify-between rounded-t-3xl z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white font-display uppercase tracking-tight">
                    {previewingRoutine.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      Estimated Time: <span className="text-orange-400 font-bold">~{previewingRoutine.estimatedMinutes} Mins</span>
                    </span>
                    <span className="text-[10px] text-zinc-500">•</span>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      Difficulty: <span className="text-orange-400 font-bold">{previewingRoutine.difficulty}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewingRoutine(null)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Plan Description */}
              <div className="p-4 bg-zinc-950/40 rounded-2xl border border-zinc-850 space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 block">
                  Program Overview
                </span>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {previewingRoutine.description}
                </p>
              </div>

              {/* Routine Muscular Impact Map */}
              {(() => {
                const { primary, secondary } = getRoutineMuscleGroups(previewingRoutine);
                return (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 block px-1">
                      Routine Muscular Impact Map
                    </span>
                    <GymBeastVisualizer
                      primaryMuscles={primary}
                      secondaryMuscles={secondary}
                      exerciseName={previewingRoutine.title}
                    />
                  </div>
                );
              })()}

              {/* Exercises List Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                    Training Circuit ({previewingRoutine.items.length} Movements)
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Target Reps & Sets</span>
                </div>

                <div className="space-y-2.5">
                  {previewingRoutine.items.map((item, idx) => {
                    const ex = findExercise(item.exerciseId, customExercises);
                    const isHold = ex?.type === 'hold_seconds';

                    return (
                      <div
                        key={idx}
                        className="p-4 bg-zinc-950/50 border border-zinc-850/65 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-800 transition"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-400 shrink-0 font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                              {ex?.name || item.exerciseId}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[9px] font-mono">
                                {ex?.category || 'Skills'}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-mono font-bold">
                                {ex?.type === 'hold_seconds' ? 'Static Hold' : 'Dynamic Reps'}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-[10px] text-zinc-400 font-mono italic">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4.5 shrink-0 self-end sm:self-auto">
                          <div className="text-right leading-none">
                            <span className="text-xs sm:text-sm font-black text-orange-400 font-mono">
                              {item.defaultSets} Sets × {item.defaultTargetRepsOrSecs}
                              {isHold ? 's' : ''}
                            </span>
                            <span className="text-[10px] text-zinc-500 block mt-1 font-mono">
                              {item.defaultRestSeconds}s rest timer
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-zinc-800/80 flex items-center justify-end gap-3.5">
              <button
                onClick={() => setPreviewingRoutine(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white font-bold text-xs rounded-xl transition"
              >
                Close Preview
              </button>
              <button
                id="modal-preview-start-workout-btn"
                onClick={() => {
                  onStartRoutine(previewingRoutine);
                  setPreviewingRoutine(null);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 duration-100"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Workout Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
