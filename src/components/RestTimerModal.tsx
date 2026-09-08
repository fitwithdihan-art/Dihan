import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Plus, Minus, X, Minimize2, Maximize2, Timer } from 'lucide-react';
import { playTickSound, playTimerFinishChime } from '../utils/sound';

interface RestTimerProps {
  initialSeconds: number;
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  exerciseName?: string;
  nextExerciseName?: string;
}

export const RestTimerModal: React.FC<RestTimerProps> = ({
  initialSeconds,
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  exerciseName,
  nextExerciseName,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [totalDuration, setTotalDuration] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const lastTickRef = useRef<number>(initialSeconds);

  // Sync when initialSeconds changes
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(initialSeconds);
      setTotalDuration(initialSeconds);
      setIsRunning(true);
      lastTickRef.current = initialSeconds;
    }
  }, [isOpen, initialSeconds]);

  // Interval timer
  useEffect(() => {
    if (!isOpen || !isRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playTimerFinishChime(soundEnabled);
          return 0;
        }

        // Tick sounds for last 3 seconds
        if (prev <= 4 && prev > 1) {
          playTickSound(soundEnabled);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning, soundEnabled]);

  if (!isOpen) return null;

  const progressPercent = totalDuration > 0 ? Math.max(0, (secondsRemaining / totalDuration) * 100) : 0;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  const addTime = (secs: number) => {
    setSecondsRemaining((prev) => {
      const next = Math.max(5, prev + secs);
      if (next > totalDuration) {
        setTotalDuration(next);
      }
      return next;
    });
  };

  // Floating Minimized Bar at Bottom of Screen
  if (isMinimized) {
    return (
      <div
        id="rest-timer-minimized-bar"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-zinc-900/95 border border-orange-500/40 rounded-full shadow-2xl backdrop-blur-md text-zinc-100"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <Timer className={`w-4 h-4 ${isRunning ? 'text-orange-400 animate-pulse' : 'text-zinc-400'}`} />
          </div>
          <span className="text-xs text-zinc-400 font-medium">Resting:</span>
          <span className="font-mono text-base font-bold text-orange-400">{formatTime(secondsRemaining)}</span>
        </div>

        <div className="flex items-center gap-1 border-l border-zinc-700 pl-2">
          <button
            id="min-timer-play-pause-btn"
            onClick={() => setIsRunning(!isRunning)}
            className="p-1.5 text-zinc-300 hover:text-white rounded-md hover:bg-zinc-800"
            title={isRunning ? 'Pause' : 'Resume'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            id="min-timer-add-30-btn"
            onClick={() => addTime(30)}
            className="px-2 py-1 text-xs font-semibold text-zinc-300 hover:text-orange-400 rounded-md hover:bg-zinc-800"
          >
            +30s
          </button>
          <button
            id="min-timer-expand-btn"
            onClick={() => setIsMinimized(false)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800"
            title="Expand"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="min-timer-close-btn"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-md hover:bg-zinc-800"
            title="Skip Rest"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="rest-timer-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div
        id="rest-timer-modal"
        className="relative w-full max-w-sm p-6 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl text-zinc-100 flex flex-col items-center text-center"
      >
        {/* Top Controls */}
        <div className="w-full flex items-center justify-between text-zinc-400 mb-2">
          <button
            id="timer-toggle-sound-btn"
            onClick={onToggleSound}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-400/90 font-mono">Rest Interval</span>
          <div className="flex items-center gap-1">
            <button
              id="timer-minimize-btn"
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              title="Minimize to Floating Bar"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              id="timer-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
              title="Skip Rest"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current & Next Exercise Hints */}
        {exerciseName && (
          <p className="text-xs text-zinc-400 mb-4 truncate max-w-[260px]">
            Finished set of <span className="text-zinc-200 font-medium">{exerciseName}</span>
          </p>
        )}

        {/* Circular Progress Display */}
        <div className="relative my-4 flex items-center justify-center">
          <svg className="w-52 h-52 -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-zinc-800"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-orange-500 transition-all duration-300"
              strokeWidth="6"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
            />
          </svg>

          {/* Time digits in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              id="rest-timer-countdown-display"
              className={`font-mono text-5xl font-extrabold tracking-tight ${
                secondsRemaining <= 3 && secondsRemaining > 0
                  ? 'text-rose-500 scale-110 transition-transform'
                  : 'text-white'
              }`}
            >
              {formatTime(secondsRemaining)}
            </span>
            <span className="text-xs text-zinc-400 mt-1">
              {secondsRemaining === 0 ? 'Ready for Next Set!' : isRunning ? 'Recovery in progress' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Quick Stepper Buttons (-15s, +30s) */}
        <div className="flex items-center gap-2 mb-6">
          <button
            id="timer-minus-15-btn"
            onClick={() => addTime(-15)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition"
          >
            <Minus className="w-3 h-3" /> 15s
          </button>
          <button
            id="timer-add-30-btn"
            onClick={() => addTime(30)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition"
          >
            <Plus className="w-3 h-3" /> 30s
          </button>
          <button
            id="timer-add-60-btn"
            onClick={() => addTime(60)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition"
          >
            <Plus className="w-3 h-3" /> 60s
          </button>
        </div>

        {/* Action Controls */}
        <div className="w-full grid grid-cols-3 gap-3">
          <button
            id="timer-reset-btn"
            onClick={() => {
              setSecondsRemaining(totalDuration);
              setIsRunning(true);
            }}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>

          <button
            id="timer-pause-resume-btn"
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition ${
              isRunning
                ? 'bg-orange-500 hover:bg-orange-400 text-zinc-950 shadow-md'
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Resume
              </>
            )}
          </button>

          <button
            id="timer-skip-btn"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition"
          >
            Skip & Log
          </button>
        </div>

        {nextExerciseName && (
          <p className="mt-4 text-[11px] text-zinc-500">
            Up next: <span className="text-zinc-400 font-medium">{nextExerciseName}</span>
          </p>
        )}
      </div>
    </div>
  );
};
