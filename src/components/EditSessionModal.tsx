import React, { useState } from 'react';
import { X, Check, Plus, Trash2, Dumbbell, Clock, Edit3, Sparkles } from 'lucide-react';
import { WorkoutSession, WorkoutExerciseLog, WorkoutSet, Exercise } from '../types';
import { EXERCISES, getAllExercises, findExercise } from '../data/exercises';

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkoutSession | null;
  onSaveSession: (updatedSession: WorkoutSession) => void;
  weightUnit: 'kg' | 'lbs';
  customExercises?: Exercise[];
}

export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  isOpen,
  onClose,
  session,
  onSaveSession,
  weightUnit,
  customExercises = [],
}) => {
  if (!isOpen || !session) return null;

  return (
    <EditSessionModalContent
      session={session}
      onClose={onClose}
      onSaveSession={onSaveSession}
      weightUnit={weightUnit}
      customExercises={customExercises}
    />
  );
};

const EditSessionModalContent: React.FC<{
  session: WorkoutSession;
  onClose: () => void;
  onSaveSession: (updatedSession: WorkoutSession) => void;
  weightUnit: 'kg' | 'lbs';
  customExercises: Exercise[];
}> = ({ session, onClose, onSaveSession, weightUnit, customExercises }) => {
  const [exercises, setExercises] = useState<WorkoutExerciseLog[]>(() =>
    session.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({ ...s })),
    }))
  );
  const [notes, setNotes] = useState<string>(session.notes || '');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(session.rating || 5);

  const handleUpdateSet = (
    exIdx: number,
    setIdx: number,
    updates: Partial<WorkoutSet>
  ) => {
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const sets = [...ex.sets];
      sets[setIdx] = { ...sets[setIdx], ...updates };
      ex.sets = sets;
      next[exIdx] = ex;
      return next;
    });
  };

  const handleAddSet = (exIdx: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const lastSet = ex.sets[ex.sets.length - 1];
      const newNumber = ex.sets.length + 1;

      const newSet: WorkoutSet = {
        id: `set_corrected_${ex.exerciseId}_${newNumber}_${Date.now()}`,
        setNumber: newNumber,
        type: 'normal',
        targetRepsOrSecs: lastSet ? lastSet.targetRepsOrSecs : 10,
        completedRepsOrSecs: lastSet ? lastSet.completedRepsOrSecs : 10,
        weightKg: lastSet ? lastSet.weightKg : 0,
        isCompleted: true,
      };

      ex.sets = [...ex.sets, newSet];
      next[exIdx] = ex;
      return next;
    });
  };

  const handleAddMultipleSets = (exIdx: number, count: number) => {
    if (count <= 0) return;
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const lastSet = ex.sets[ex.sets.length - 1];
      const startingCount = ex.sets.length;

      const newSets: WorkoutSet[] = Array.from({ length: count }, (_, i) => {
        const num = startingCount + i + 1;
        return {
          id: `set_corrected_${ex.exerciseId}_${num}_${Date.now()}_${i}`,
          setNumber: num,
          type: 'normal',
          targetRepsOrSecs: lastSet ? lastSet.targetRepsOrSecs : 10,
          completedRepsOrSecs: lastSet ? lastSet.completedRepsOrSecs : 10,
          weightKg: lastSet ? lastSet.weightKg : 0,
          isCompleted: true,
        };
      });

      ex.sets = [...ex.sets, ...newSets];
      next[exIdx] = ex;
      return next;
    });
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      if (ex.sets.length <= 1) return prev;
      const filtered = ex.sets.filter((_, idx) => idx !== setIdx);
      ex.sets = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      next[exIdx] = ex;
      return next;
    });
  };

  const calculateLiveMetrics = () => {
    let totalVolumeReps = 0;
    let totalHoldSeconds = 0;
    let totalSetsCompleted = 0;

    exercises.forEach((exLog) => {
      const exDef = findExercise(exLog.exerciseId, customExercises);
      const isHold = exDef?.type === 'hold_seconds';

      exLog.sets.forEach((set) => {
        if (set.isCompleted) {
          totalSetsCompleted += 1;
          if (isHold) {
            totalHoldSeconds += set.completedRepsOrSecs || 0;
          } else {
            totalVolumeReps += set.completedRepsOrSecs || 0;
          }
        }
      });
    });

    return { totalVolumeReps, totalHoldSeconds, totalSetsCompleted };
  };

  const metrics = calculateLiveMetrics();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSession: WorkoutSession = {
      ...session,
      exercises,
      notes: notes.trim() || undefined,
      rating,
      totalSetsCompleted: metrics.totalSetsCompleted,
      totalVolumeReps: metrics.totalVolumeReps,
      totalHoldSeconds: metrics.totalHoldSeconds,
    };

    onSaveSession(updatedSession);
    onClose();
  };

  return (
    <div
      id="edit-session-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="edit-session-modal"
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/95">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-white">
                Correct Workout Sets & Log
              </h2>
              <p className="text-xs text-zinc-400">
                {session.routineTitle} • {new Date(session.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <button
            id="close-edit-session-modal-btn"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Recalculated Summary Banner */}
        <div className="px-5 py-3 bg-zinc-950/70 border-b border-zinc-800 flex items-center justify-around text-center text-xs font-mono">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">Completed Sets</span>
            <span className="text-orange-400 font-bold text-sm">{metrics.totalSetsCompleted}</span>
          </div>
          <div className="border-x border-zinc-800 px-4">
            <span className="text-[10px] text-zinc-500 block uppercase">Total Reps</span>
            <span className="text-white font-bold text-sm">{metrics.totalVolumeReps}</span>
          </div>
          {metrics.totalHoldSeconds > 0 && (
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Hold Time</span>
              <span className="text-emerald-400 font-bold text-sm">{metrics.totalHoldSeconds}s</span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-6">
          {exercises.map((exLog, exIdx) => {
            const exDef = findExercise(exLog.exerciseId, customExercises);
            const isHold = exDef?.type === 'hold_seconds';

            return (
              <div
                key={`${exLog.exerciseId}_${exIdx}`}
                id={`correct-ex-group-${exIdx}`}
                className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3"
              >
                {/* Exercise Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-bold text-white font-display">
                      {exDef?.name || exLog.exerciseId}
                    </span>
                    {isHold && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-orange-500/15 text-orange-300">
                        Hold (Seconds)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddSet(exIdx)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-orange-300 rounded-lg transition"
                      title="Add 1 Set"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+1 Set</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddMultipleSets(exIdx, 2)}
                      className="px-2 py-1 bg-zinc-800/80 hover:bg-zinc-700 text-xs font-mono font-semibold text-zinc-300 hover:text-white rounded-lg transition"
                      title="Add 2 Sets"
                    >
                      +2
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddMultipleSets(exIdx, 3)}
                      className="px-2 py-1 bg-zinc-800/80 hover:bg-zinc-700 text-xs font-mono font-semibold text-zinc-300 hover:text-white rounded-lg transition"
                      title="Add 3 Sets"
                    >
                      +3
                    </button>
                  </div>
                </div>

                {/* Sets Table Header */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-2 pb-1 border-b border-zinc-800/80">
                  <div className="col-span-2 text-center">Set</div>
                  <div className="col-span-3 text-center">Weight ({weightUnit})</div>
                  <div className="col-span-4 text-center">{isHold ? 'Seconds' : 'Reps'}</div>
                  <div className="col-span-3 text-center">Status / Delete</div>
                </div>

                {/* Sets Rows */}
                <div className="space-y-1.5">
                  {exLog.sets.map((set, setIdx) => {
                    return (
                      <div
                        key={set.id}
                        id={`correct-set-row-${exIdx}-${setIdx}`}
                        className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition ${
                          set.isCompleted
                            ? 'bg-zinc-900/90 border-zinc-800'
                            : 'bg-zinc-950/40 border-zinc-800/50 opacity-60'
                        }`}
                      >
                        {/* Set # */}
                        <div className="col-span-2 flex items-center justify-center">
                          <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-800 text-xs font-mono font-bold text-zinc-200">
                            #{set.setNumber}
                          </span>
                        </div>

                        {/* Weight */}
                        <div className="col-span-3 flex items-center justify-center">
                          <input
                            type="number"
                            step="0.5"
                            value={set.weightKg === 0 ? '' : set.weightKg}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateSet(exIdx, setIdx, {
                                weightKg: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full max-w-[70px] py-1 px-2 bg-zinc-800/90 border border-zinc-700/60 rounded-lg text-xs font-mono text-center text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>

                        {/* Reps/Duration Stepper */}
                        <div className="col-span-4 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSet(exIdx, setIdx, {
                                completedRepsOrSecs: Math.max(0, set.completedRepsOrSecs - (isHold ? 5 : 1)),
                              })
                            }
                            className="w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="999"
                            value={set.completedRepsOrSecs}
                            onChange={(e) =>
                              handleUpdateSet(exIdx, setIdx, {
                                completedRepsOrSecs: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="w-12 py-1 bg-zinc-950 border border-zinc-700/80 rounded text-xs font-mono font-bold text-center text-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSet(exIdx, setIdx, {
                                completedRepsOrSecs: set.completedRepsOrSecs + (isHold ? 5 : 1),
                              })
                            }
                            className="w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 font-bold"
                          >
                            +
                          </button>
                        </div>

                        {/* Completed Check & Delete */}
                        <div className="col-span-3 flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSet(exIdx, setIdx, {
                                isCompleted: !set.isCompleted,
                              })
                            }
                            className={`px-2 py-1 rounded-lg text-[11px] font-mono font-semibold transition ${
                              set.isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {set.isCompleted ? 'Done' : 'Skip'}
                          </button>

                          {exLog.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(exIdx, setIdx)}
                              className="p-1 text-zinc-500 hover:text-rose-400 rounded transition"
                              title="Delete this set"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Session Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Workout Notes & Reflections</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add or correct your workout reflection..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-corrected-session-btn"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Corrected Sets</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
