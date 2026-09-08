import React, { useState } from 'react';
import { Calendar, Clock, Award, Trash2, ChevronDown, ChevronUp, Dumbbell, Star, Sparkles, Zap, Edit3 } from 'lucide-react';
import { WorkoutSession, Exercise } from '../types';
import { EXERCISES, findExercise } from '../data/exercises';
import { EditSessionModal } from './EditSessionModal';

interface HistoryViewProps {
  sessions: WorkoutSession[];
  onDeleteSession: (sessionId: string) => void;
  weightUnit: 'kg' | 'lbs';
  customExercises?: Exercise[];
  onUpdateSession?: (updatedSession: WorkoutSession) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  onDeleteSession,
  weightUnit,
  customExercises = [],
  onUpdateSession,
}) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    sessions[0]?.id || null
  );
  const [sessionToEdit, setSessionToEdit] = useState<WorkoutSession | null>(null);

  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div id="history-view" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-5 sm:p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Workout Archive
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">Workout Logs</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Review your past training sessions, total volume, and personal milestones.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-mono text-zinc-400 block">Total Logged</span>
          <span className="text-2xl font-black font-mono text-amber-400">{sessions.length}</span>
        </div>
      </div>

      {/* History List */}
      {sessions.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-3xl text-zinc-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
          <h3 className="text-base font-bold text-zinc-300 font-display">No Workouts Logged Yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Complete your first calisthenics routine or free workout to start generating your training logs and progress history.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isExpanded = expandedSessionId === session.id;

            return (
              <div
                key={session.id}
                id={`session-log-card-${session.id}`}
                className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg transition"
              >
                {/* Session Main Summary Row */}
                <div
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-800/30 transition"
                  onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-amber-400/90 font-medium">
                        {formatDate(session.startTime)}
                      </span>
                      {session.rating && (
                        <div className="flex items-center text-amber-400 text-xs">
                          {Array.from({ length: session.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white font-display">{session.routineTitle}</h3>

                    {/* Nostalgic Memory Tagline */}
                    <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5 pt-0.5">
                      <span>🎞️</span>
                      <span>
                        {(() => {
                          const diffMs = Date.now() - session.startTime;
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          const dateObj = new Date(session.startTime);
                          const timeString = dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                          const weekday = dateObj.toLocaleDateString(undefined, { weekday: 'long' });

                          if (diffDays === 0) {
                            return `Today on a beautiful ${weekday} at ${timeString} — a fresh active memory!`;
                          }
                          if (diffDays === 1) {
                            return `Yesterday (${weekday}) at ${timeString} — a fantastic training memory!`;
                          }
                          if (diffDays < 7) {
                            return `${diffDays} days ago on a stellar ${weekday} at ${timeString} — keeping up the momentum!`;
                          }
                          const weeks = Math.floor(diffDays / 7);
                          if (weeks === 1) {
                            return `1 week ago on a ${weekday} at ${timeString} — a proud calisthenics memory!`;
                          }
                          if (weeks < 4) {
                            return `${weeks} weeks ago on a ${weekday} at ${timeString} — part of your consistent grind!`;
                          }
                          const months = Math.floor(diffDays / 30);
                          if (months === 1) {
                            return `1 month ago on a ${weekday} at ${timeString} — look how far you've come!`;
                          }
                          return `${months} months ago on a ${weekday} at ${timeString} — a historic milestone!`;
                        })()}
                      </span>
                    </div>

                    {/* PR highlights badge */}
                    {session.prsAchieved && session.prsAchieved.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-amber-300 font-medium pt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{session.prsAchieved.join(' • ')}</span>
                      </div>
                    )}

                    {/* Level-ups and XP badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {session.xpEarned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-zinc-800 text-amber-400 border border-zinc-700">
                          <Zap className="w-3 h-3 text-amber-400" /> +{session.xpEarned} XP
                        </span>
                      ) : null}

                      {session.levelUpsAchieved && session.levelUpsAchieved.length > 0 && (
                        session.levelUpsAchieved.map((lvl, lIdx) => (
                          <span
                            key={lIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          >
                            <Zap className="w-3 h-3 fill-current text-amber-400" />
                            {lvl.exerciseName} Leveled Up to Lvl {lvl.newLevel}!
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60">
                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block">Duration</span>
                      <span className="font-mono text-xs font-bold text-zinc-200">
                        {formatDuration(session.durationSeconds)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block">Sets</span>
                      <span className="font-mono text-xs font-bold text-zinc-200">{session.totalSetsCompleted}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block">Volume</span>
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {session.totalVolumeReps} reps
                        {session.totalHoldSeconds > 0 && ` +${session.totalHoldSeconds}s`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 pl-2">
                      <button
                        id={`edit-session-btn-${session.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToEdit(session);
                        }}
                        className="p-2 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition"
                        title="Edit & Correct Sets"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this workout log?')) {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="p-2 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="p-1 text-zinc-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Exercise Breakdown */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-950/40 space-y-4">
                    
                    {/* Calisthenics Nostalgic Memory Polaroid Box */}
                    <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col md:flex-row gap-4 items-start sm:items-center justify-between shadow-inner relative overflow-hidden group">
                      <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition duration-300" />
                      <div className="space-y-1 z-10">
                        <span className="text-[9px] font-mono font-bold tracking-widest text-amber-400 uppercase bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                          📸 Calisthenics Memories
                        </span>
                        <h4 className="text-sm font-black text-white font-display pt-1">
                          Training Journal Memory
                        </h4>
                        <p className="text-xs text-zinc-400">
                          This workout took place on{' '}
                          <span className="text-white font-bold">
                            {new Date(session.startTime).toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>{' '}
                          at{' '}
                          <span className="text-white font-mono">
                            {new Date(session.startTime).toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0 z-10 bg-zinc-950/60 border border-zinc-800 px-3 py-2 rounded-xl text-center">
                        <span className="text-[9px] text-zinc-500 uppercase font-mono block">Log Time Context</span>
                        <span className="text-xs font-black text-amber-300 font-mono">
                          {(() => {
                            const hr = new Date(session.startTime).getHours();
                            if (hr < 5) return '🌌 Late Night Session';
                            if (hr < 12) return '🌅 Morning Routine';
                            if (hr < 17) return '☀️ Afternoon Grind';
                            return '🌆 Evening Workout';
                          })()}
                        </span>
                      </div>
                    </div>

                    {session.notes && (
                      <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-300">
                        <span className="font-semibold text-zinc-400 block mb-0.5">Session Reflection:</span>
                        {session.notes}
                      </div>
                    )}

                    <div className="space-y-3">
                      {session.exercises.map((exLog, idx) => {
                        const exDef = findExercise(exLog.exerciseId, customExercises);
                        const completedSets = exLog.sets.filter((s) => s.isCompleted);
                        const isHold = exDef?.type === 'hold_seconds';

                        return (
                          <div
                            key={idx}
                            className="p-3 bg-zinc-900/70 border border-zinc-800/70 rounded-xl space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-zinc-200 font-display">
                                {exDef?.name || exLog.exerciseId}
                              </span>
                              <span className="text-xs text-zinc-400 font-mono">
                                {completedSets.length} sets completed
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              {completedSets.map((set, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 flex items-center gap-1.5"
                                >
                                  <span className="text-zinc-500 font-bold">#{set.setNumber}:</span>
                                  <span className="text-amber-400 font-bold">{set.completedRepsOrSecs}</span>
                                  <span>{isHold ? 's' : 'reps'}</span>
                                  {set.weightKg ? (
                                    <span className="text-emerald-400 font-semibold">
                                      (@+{set.weightKg}
                                      {weightUnit})
                                    </span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Correct Action in Expanded View */}
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setSessionToEdit(session)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Correct & Edit Sets</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Session Modal */}
      {sessionToEdit && (
        <EditSessionModal
          isOpen={Boolean(sessionToEdit)}
          onClose={() => setSessionToEdit(null)}
          session={sessionToEdit}
          onSaveSession={(updated) => {
            onUpdateSession?.(updated);
            setSessionToEdit(null);
          }}
          weightUnit={weightUnit}
          customExercises={customExercises}
        />
      )}
    </div>
  );
};
