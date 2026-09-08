import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Trophy,
  Upload,
  Sparkles,
  Check,
  ChevronRight,
  TrendingUp,
  Share2,
  Copy,
  Plus,
  Flame,
  Dumbbell,
  ShieldCheck,
  Info,
  Clock,
  RotateCcw,
  Sliders,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  History as HistoryIcon,
  Trash2,
  Award,
} from 'lucide-react';
import { Exercise, PersonalRecord, UserPreferences, RepRankTestResult } from '../types';
import { EXERCISES } from '../data/exercises';
import { RankBadge } from './RankBadge';
import { calculateRepRank, getExerciseBenchmarks, CalculatedRepRank } from '../utils/repRankCalculator';
import { BadgeTier, TIER_CONFIG } from '../utils/rankService';

interface RepRankCalculatorViewProps {
  customExercises?: Exercise[];
  userPreferences: UserPreferences;
  repRankHistory?: RepRankTestResult[];
  onAddCustomExercise: (exercise: Exercise) => void;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onAddPR: (pr: PersonalRecord) => void;
  onSaveHistoryTest?: (test: RepRankTestResult) => void;
  onDeleteHistoryTest?: (testId: string) => void;
}

export const RepRankCalculatorView: React.FC<RepRankCalculatorViewProps> = ({
  customExercises = [],
  userPreferences,
  repRankHistory = [],
  onAddCustomExercise,
  onUpdatePreferences,
  onAddPR,
  onSaveHistoryTest,
  onDeleteHistoryTest,
}) => {
  // Combine core and custom exercises
  const allExercises = useMemo(() => {
    return [...EXERCISES, ...customExercises];
  }, [customExercises]);

  // Selected exercise state
  const defaultEx = allExercises.find((e) => e.id === 'standard_pull_up' || e.id === 'pull_up') || allExercises[0];
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(defaultEx.id);

  // Reps / Hold Seconds state
  const [repsOrSeconds, setRepsOrSeconds] = useState<number>(12);
  const [addedWeightKg, setAddedWeightKg] = useState<number>(0);
  const [strictForm, setStrictForm] = useState<boolean>(true);

  // Upload Custom Exercise Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<Exercise['category']>('pull');
  const [customType, setCustomType] = useState<Exercise['type']>('reps');
  const [customDifficulty, setCustomDifficulty] = useState<Exercise['difficulty']>('intermediate');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [customFormCue, setCustomFormCue] = useState<string>('');
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);

  // Notification toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Find currently active exercise
  const currentExercise = useMemo(() => {
    return allExercises.find((e) => e.id === selectedExerciseId) || allExercises[0];
  }, [allExercises, selectedExerciseId]);

  // Calculate live rank
  const rankResult: CalculatedRepRank = useMemo(() => {
    return calculateRepRank(currentExercise, repsOrSeconds, {
      addedWeightKg: addedWeightKg > 0 ? addedWeightKg : undefined,
      strictForm,
      bodyweightKg: 70,
    });
  }, [currentExercise, repsOrSeconds, addedWeightKg, strictForm]);

  // Handle image upload via FileReader
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast('Image must be smaller than 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle submitting new custom exercise
  const handleCreateCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      showToast('Please provide an exercise title');
      return;
    }

    const newExId = `custom_ex_${Date.now()}`;
    const newExercise: Exercise = {
      id: newExId,
      name: customName.trim(),
      category: customCategory,
      type: customType,
      primaryMuscles: [customCategory === 'pull' ? 'Back & Lats' : customCategory === 'push' ? 'Chest & Triceps' : 'Core'],
      difficulty: customDifficulty,
      description: customDescription.trim() || 'Custom uploaded calisthenics movement test.',
      formCues: customFormCue.trim() ? [customFormCue.trim()] : ['Full range of motion, controlled tempo'],
      supportsAddedWeight: true,
      supportsAssistance: true,
      isCustom: true,
      photoUrl: customImagePreview || undefined,
    };

    onAddCustomExercise(newExercise);
    setSelectedExerciseId(newExId);
    setIsUploadModalOpen(false);

    // Reset form
    setCustomName('');
    setCustomDescription('');
    setCustomFormCue('');
    setCustomImagePreview(null);

    showToast(`Uploaded "${newExercise.name}" to your exercise roster!`);
  };

  // Quick preset exercises for one-tap switching
  const quickPresets = [
    { id: 'standard_pull_up', label: 'Pull-Ups', category: 'pull' },
    { id: 'standard_push_up', label: 'Push-Ups', category: 'push' },
    { id: 'dip', label: 'Dips', category: 'push' },
    { id: 'muscle_up', label: 'Muscle-Ups', category: 'skills' },
    { id: 'handstand_push_up', label: 'HSPU', category: 'handstand' },
    { id: 'pistol_squat', label: 'Pistol Squats', category: 'legs' },
    { id: 'l_sit', label: 'L-Sit', category: 'core' },
    { id: 'front_lever', label: 'Front Lever', category: 'skills' },
  ];

  // Set as showcased best rank
  const handleSetAsBestRank = () => {
    onUpdatePreferences({
      bestRank: rankResult.rankTitle,
      bestRankTier: rankResult.tier,
    });
    showToast(`⭐ Set "${rankResult.rankTitle}" as your showcased best rank!`);
  };

  // Save as PR
  const handleSaveAsPR = () => {
    const newPR: PersonalRecord = {
      id: `pr_calc_${Date.now()}`,
      exerciseId: currentExercise.id,
      exerciseName: currentExercise.name,
      recordType: currentExercise.type === 'hold_seconds' ? 'max_hold' : 'max_reps',
      value: repsOrSeconds,
      secondaryValue: addedWeightKg > 0 ? addedWeightKg : undefined,
      achievedAt: Date.now(),
    };
    onAddPR(newPR);
    showToast(`🏆 Saved ${repsOrSeconds} ${currentExercise.type === 'hold_seconds' ? 's' : 'reps'} to Personal Records!`);
  };

  // Save to test history
  const handleSaveToHistory = () => {
    const newTest: RepRankTestResult = {
      id: `rep_test_${Date.now()}`,
      exerciseId: currentExercise.id,
      exerciseName: currentExercise.name,
      category: currentExercise.category,
      type: currentExercise.type,
      repsOrSeconds,
      addedWeightKg: addedWeightKg > 0 ? addedWeightKg : undefined,
      rankTitle: rankResult.rankTitle,
      tier: rankResult.tier,
      percentile: rankResult.percentile,
      testedAt: Date.now(),
    };
    if (onSaveHistoryTest) {
      onSaveHistoryTest(newTest);
    }
    showToast('Saved test calculation to your history!');
  };

  // Copy scorecard
  const handleCopyScorecard = () => {
    const text = `🔥 TEENTHENICS Rep-to-Rank Result\nMovement: ${currentExercise.name}\nScore: ${repsOrSeconds} ${
      currentExercise.type === 'hold_seconds' ? 'seconds' : 'strict reps'
    }${addedWeightKg > 0 ? ` (+${addedWeightKg}kg)` : ''}\nRank: ${rankResult.rankTitle} (${TIER_CONFIG[rankResult.tier].name})\nStanding: Top ${
      100 - Math.round(rankResult.percentile)
    }% worldwide\nCalculated on TEENTHENICS`;

    navigator.clipboard?.writeText(text);
    showToast('📋 Scorecard copied to clipboard!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-orange-500/80 text-white text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="p-5 sm:p-7 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/90 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              Rep-to-Rank Engine
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-zinc-800 text-zinc-400">
              International Standards
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
            Calisthenics Rep & Rank Calculator
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            Input or upload any calisthenics exercise and enter your maximum clean reps. Uncover your official athletic tier, international percentile, and next milestone target.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs sm:text-sm font-black font-mono tracking-tight transition active:scale-95 duration-100 shadow-lg shadow-orange-500/20 cursor-pointer self-start md:self-center shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Custom Exercise</span>
        </button>

        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Exercise Selector & Reps Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Preset Exercise Chips */}
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
                <span>Quick Select Movement</span>
              </label>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="text-[11px] font-mono text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Upload New
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
              {quickPresets.map((preset) => {
                const isSelected = selectedExerciseId.includes(preset.id);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      const found = allExercises.find((e) => e.id.includes(preset.id));
                      if (found) {
                        setSelectedExerciseId(found.id);
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition text-left flex items-center justify-between cursor-pointer border ${
                      isSelected
                        ? 'bg-orange-500 text-zinc-950 border-orange-500 shadow-md shadow-orange-500/10'
                        : 'bg-zinc-950/60 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Full Exercise Select Dropdown */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-1">
              <label className="text-[10px] font-mono uppercase text-zinc-400">All Exercises (Core & Uploaded)</label>
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium cursor-pointer"
              >
                {customExercises.length > 0 && (
                  <optgroup label="Custom Uploaded Exercises">
                    {customExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        ⭐ {ex.name} (Custom)
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Standard Calisthenics Library">
                  {EXERCISES.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.category})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Active Exercise Summary Card with Photo / Icon */}
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-start gap-3.5 shadow-md">
            {currentExercise.photoUrl ? (
              <img
                src={currentExercise.photoUrl}
                alt={currentExercise.name}
                className="w-14 h-14 rounded-xl object-cover border border-zinc-700 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 shrink-0">
                <Flame className="w-7 h-7" />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white font-display truncate">{currentExercise.name}</h3>
                {currentExercise.isCustom && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Uploaded Custom
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                <span className="capitalize">{currentExercise.category}</span>
                <span>•</span>
                <span className="capitalize text-orange-400">{currentExercise.difficulty} tier</span>
                <span>•</span>
                <span>{currentExercise.type === 'hold_seconds' ? 'Isometric hold' : 'Reps based'}</span>
              </div>
              <p className="text-[11px] text-zinc-300 line-clamp-2 italic">{currentExercise.description}</p>
            </div>
          </div>

          {/* Reps / Seconds Input Controller */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-400" />
                <span>
                  {currentExercise.type === 'hold_seconds' ? 'Hold Time (Seconds)' : 'Completed Reps'}
                </span>
              </label>
              <span className="text-xs font-mono text-orange-400 font-bold">
                {currentExercise.type === 'hold_seconds' ? `${repsOrSeconds}s` : `${repsOrSeconds} reps`}
              </span>
            </div>

            {/* Giant Number Display with Steppers */}
            <div className="flex items-center justify-between gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRepsOrSeconds((prev) => Math.max(0, prev - 5))}
                  className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                  title="Minus 5"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setRepsOrSeconds((prev) => Math.max(0, prev - 1))}
                  className="w-9 h-9 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-sm font-bold flex items-center justify-center transition cursor-pointer"
                  title="Minus 1"
                >
                  -1
                </button>
              </div>

              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  min={0}
                  max={250}
                  value={repsOrSeconds}
                  onChange={(e) => setRepsOrSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 text-center text-3xl sm:text-4xl font-black font-display text-white bg-transparent border-none focus:outline-none"
                />
                <span className="text-xs font-mono font-bold text-zinc-500 uppercase">
                  {currentExercise.type === 'hold_seconds' ? 'Sec' : 'Reps'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRepsOrSeconds((prev) => prev + 1)}
                  className="w-9 h-9 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-sm font-bold flex items-center justify-center transition cursor-pointer"
                  title="Plus 1"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setRepsOrSeconds((prev) => prev + 5)}
                  className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                  title="Plus 5"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={currentExercise.type === 'hold_seconds' ? 120 : 60}
                value={repsOrSeconds}
                onChange={(e) => setRepsOrSeconds(parseInt(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-zinc-950 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>0</span>
                <span>{currentExercise.type === 'hold_seconds' ? '30s' : '15 reps'}</span>
                <span>{currentExercise.type === 'hold_seconds' ? '60s' : '30 reps'}</span>
                <span>{currentExercise.type === 'hold_seconds' ? '120s+' : '60+'}</span>
              </div>
            </div>

            {/* Quick Benchmark Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-zinc-400 uppercase mr-1">Jump to:</span>
              {[5, 10, 15, 20, 25, 30, 40, 50].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRepsOrSeconds(val)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer ${
                    repsOrSeconds === val
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            {/* Additional Modifiers: Added Weight & Strict Form */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dead-Stop Strict Form</span>
                  </label>
                  <p className="text-[10px] text-zinc-500">Zero kipping, full ROM, and controlled tempo</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStrictForm((prev) => !prev)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    strictForm ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      strictForm ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Added Weight Input */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
                    Added Weight (+{userPreferences.unit})
                  </span>
                  <p className="text-[10px] text-zinc-500">For weighted dips, pull-ups, or vests</p>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={addedWeightKg || ''}
                    onChange={(e) => setAddedWeightKg(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="w-14 text-center text-xs font-mono font-bold text-white bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{userPreferences.unit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Rank Card & Visual Ladder (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Calculated Rank Showcase Card */}
          <div
            className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-2xl bg-gradient-to-br ${rankResult.badgeConfig.gradientClass} ${rankResult.badgeConfig.borderClass}`}
          >
            <div className="relative z-10 space-y-4">
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{rankResult.badgeConfig.icon}</span>
                    <span className="text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-950/70 border border-white/10 text-white">
                      {rankResult.badgeConfig.name} Tier
                    </span>
                    <span className="text-xs font-mono text-zinc-300">
                      • {rankResult.badgeConfig.label}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
                    {rankResult.rankTitle}
                  </h2>
                </div>

                <div className="shrink-0 text-right">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-950/80 border border-white/15 text-xs font-mono font-bold text-orange-400">
                    <Award className="w-3.5 h-3.5" />
                    <span>Top {Math.max(1, Math.min(99, 100 - Math.round(rankResult.percentile || 50)))}%</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Worldwide Calisthenics</p>
                </div>
              </div>

              {/* Badges and Score Comparison */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-zinc-950/75 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block">Visual Badge</span>
                  <div className="flex items-center pt-0.5">
                    <RankBadge rankTitle={rankResult.rankTitle} tier={rankResult.tier} size="md" />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/75 border border-white/10 space-y-0.5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block">Tested Volume</span>
                  <p className="text-lg font-mono font-black text-white">
                    {repsOrSeconds} {currentExercise.type === 'hold_seconds' ? 'Sec' : 'Reps'}
                  </p>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {addedWeightKg > 0 ? `+${addedWeightKg}kg weighted` : 'bodyweight only'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/75 border border-white/10 space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block">Next Milestone</span>
                  {rankResult.nextTier ? (
                    <>
                      <p className="text-sm font-mono font-bold text-orange-400 truncate">
                        +{rankResult.nextTier.diffReps} {currentExercise.type === 'hold_seconds' ? 's' : 'reps'}
                      </p>
                      <span className="text-[10px] text-zinc-400 truncate block">
                        for {TIER_CONFIG[rankResult.nextTier.tier].name}
                      </span>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-mono font-bold text-purple-300">Max Tier Reached</p>
                      <span className="text-[10px] text-zinc-400">Cosmic Legend status</span>
                    </>
                  )}
                </div>
              </div>

              {/* Coaching & Form Tips */}
              <div className="p-3 bg-zinc-950/65 rounded-2xl border border-white/10 flex items-start gap-2.5 text-xs text-zinc-300">
                <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-[11px] uppercase font-mono tracking-wider">
                    Form Standard & Coaching Cue
                  </span>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">{rankResult.coachingTip}</p>
                </div>
              </div>

              {/* Quick Actions Toolbar */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleSetAsBestRank}
                  className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-black font-mono transition flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Set as Best Rank</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAsPR}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold font-mono transition flex items-center gap-1.5 border border-zinc-700/80 active:scale-95 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-orange-400" />
                  <span>Save as PR</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToHistory}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold font-mono transition flex items-center gap-1.5 border border-zinc-700/80 active:scale-95 cursor-pointer"
                  title="Save to calculations log"
                >
                  <HistoryIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Save Test</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyScorecard}
                  className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition border border-zinc-700/80 active:scale-95 cursor-pointer"
                  title="Copy formatted scorecard to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Visual 8-Tier Calisthenics Progression Ladder */}
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3.5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span>Calisthenics Rep-to-Rank Ladder</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Official tier thresholds for {currentExercise.name}
                </p>
              </div>

              {rankResult.nextTier && (
                <div className="text-right text-[11px] font-mono text-orange-400">
                  <span>Need +{rankResult.nextTier.diffReps} reps for {TIER_CONFIG[rankResult.nextTier.tier].name}</span>
                </div>
              )}
            </div>

            {/* Step-by-Step Tier Ladder */}
            <div className="space-y-2">
              {rankResult.allBenchmarks.map((bench, idx) => {
                const isCurrent = idx === rankResult.tierIndex;
                const isPassed = idx < rankResult.tierIndex;
                const tierCfg = TIER_CONFIG[bench.tier];

                return (
                  <div
                    key={bench.tier}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                      isCurrent
                        ? `bg-zinc-950 border-orange-500/80 ring-1 ring-orange-500/40 shadow-md`
                        : isPassed
                        ? 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400'
                        : 'bg-zinc-950/20 border-zinc-850/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCurrent
                            ? 'bg-orange-500 text-zinc-950 shadow-sm'
                            : isPassed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${isCurrent ? 'text-white font-mono' : 'text-zinc-300'}`}>
                            {tierCfg.name} Tier
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            ({bench.rankTitle})
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase bg-orange-500 text-zinc-950">
                              YOU ARE HERE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          Top {Math.max(1, Math.min(99, 100 - Math.round(bench.percentile || 50)))}% percentile
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-orange-400' : 'text-zinc-300'}`}>
                        {bench.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Past Calculation History */}
          {repRankHistory && repRankHistory.length > 0 && (
            <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-bold text-white font-display">Recent Rep Rank Tests</h3>
                </div>
                <span className="text-xs font-mono text-zinc-400">{repRankHistory.length} logged tests</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {repRankHistory.slice(0, 5).map((test) => (
                  <div
                    key={test.id}
                    className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <RankBadge rankTitle={test.rankTitle} tier={test.tier} size="xs" />
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">{test.exerciseName}</h4>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {test.repsOrSeconds || 0} {test.type === 'hold_seconds' ? 's' : 'reps'}
                          {test.addedWeightKg ? ` (+${test.addedWeightKg}kg)` : ''} • Top {Math.max(1, Math.min(99, 100 - Math.round(test.percentile || 50)))}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(test.testedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {onDeleteHistoryTest && (
                        <button
                          type="button"
                          onClick={() => onDeleteHistoryTest(test.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                          title="Delete test log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Custom Exercise Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-400">
                <Upload className="w-4 h-4" />
                <span>Upload Custom Exercise</span>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomExercise} className="space-y-4">
              {/* Exercise Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 font-mono uppercase">Exercise Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Archer Pull-Up, Ring Muscle-Up, Dragon Flag"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Category & Measurement Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 font-mono uppercase">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as Exercise['category'])}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                  >
                    <option value="pull">Pull</option>
                    <option value="push">Push</option>
                    <option value="core">Core</option>
                    <option value="legs">Legs</option>
                    <option value="skills">Skills</option>
                    <option value="handstand">Handstand</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 font-mono uppercase">Measurement</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as Exercise['type'])}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                  >
                    <option value="reps">Reps</option>
                    <option value="hold_seconds">Hold Time (Seconds)</option>
                  </select>
                </div>
              </div>

              {/* Difficulty Tier */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 font-mono uppercase">
                  Baseline Difficulty Rating
                </label>
                <select
                  value={customDifficulty}
                  onChange={(e) => setCustomDifficulty(e.target.value as Exercise['difficulty'])}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                >
                  <option value="beginner">Beginner (Higher rep requirements)</option>
                  <option value="intermediate">Intermediate (Standard requirements)</option>
                  <option value="advanced">Advanced (Rigorous bar strength)</option>
                  <option value="elite">Elite (Strict gymnastics skill level)</option>
                </select>
              </div>

              {/* Exercise Photo Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 font-mono uppercase flex items-center justify-between">
                  <span>Exercise Image / Demonstration Photo</span>
                  <span className="text-[10px] text-zinc-500 font-normal lowercase">(optional)</span>
                </label>

                <div className="flex items-center gap-3">
                  {customImagePreview ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-orange-500 shrink-0">
                      <img src={customImagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => setCustomImagePreview(null)}
                        className="absolute top-0.5 right-0.5 bg-black/80 text-white rounded-full p-0.5 text-[9px]"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-zinc-950 border border-dashed border-zinc-750 flex flex-col items-center justify-center text-zinc-500 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[8px] font-mono mt-0.5">Preview</span>
                    </div>
                  )}

                  <label className="flex-1 px-3.5 py-2.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs text-zinc-300 cursor-pointer flex items-center justify-center gap-2 transition">
                    <Upload className="w-4 h-4 text-orange-400" />
                    <span>Upload Exercise Photo...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Form Cue / Tip */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 font-mono uppercase">
                  Form Cue or Technique Tip
                </label>
                <input
                  type="text"
                  placeholder="e.g. Keep chest parallel to bar, lock elbows at top"
                  value={customFormCue}
                  onChange={(e) => setCustomFormCue(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 font-mono uppercase">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description of this variation and progression purpose."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-xs font-mono rounded-xl shadow-lg transition active:scale-95 duration-100 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save & Calculate Rank</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
