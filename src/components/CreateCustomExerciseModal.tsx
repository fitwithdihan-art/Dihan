import React, { useState } from 'react';
import { X, Plus, Sparkles, Dumbbell, Target, Check } from 'lucide-react';
import { Exercise, ExerciseCategory, MeasurementType } from '../types';

interface CreateCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomExercise: (exercise: Exercise) => void;
  initialCategory?: ExerciseCategory;
}

const MUSCLE_OPTIONS = [
  'Chest',
  'Back / Lats',
  'Upper Back',
  'Shoulders / Delts',
  'Triceps',
  'Biceps',
  'Forearms / Grip',
  'Core / Abs',
  'Obliques',
  'Lower Back',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
];

export const CreateCustomExerciseModal: React.FC<CreateCustomExerciseModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomExercise,
  initialCategory = 'push',
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>(initialCategory);
  const [type, setType] = useState<MeasurementType>('reps');
  const [difficulty, setDifficulty] = useState<Exercise['difficulty']>('intermediate');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(['Chest', 'Triceps']);
  const [description, setDescription] = useState('');
  const [formCuesText, setFormCuesText] = useState('');
  const [supportsWeight, setSupportsWeight] = useState(true);
  const [supportsAssistance, setSupportsAssistance] = useState(false);

  if (!isOpen) return null;

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formCues = formCuesText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const newExercise: Exercise = {
      id: `custom_ex_${Date.now()}`,
      name: name.trim(),
      category,
      type,
      difficulty,
      primaryMuscles: selectedMuscles.length > 0 ? selectedMuscles : ['Full Body'],
      description: description.trim() || `Custom ${category} calisthenics movement`,
      formCues:
        formCues.length > 0
          ? formCues
          : ['Maintain strict form with steady tempo', 'Control both eccentric and concentric phases'],
      supportsAddedWeight: supportsWeight,
      supportsAssistance: supportsAssistance,
      isCustom: true,
    };

    onSaveCustomExercise(newExercise);
    setName('');
    setDescription('');
    setFormCuesText('');
    onClose();
  };

  return (
    <div
      id="custom-exercise-modal-backdrop"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="custom-exercise-modal-container"
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white">Create Custom Exercise</h2>
              <p className="text-xs text-zinc-400">Add any movement to your calisthenics database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Movement Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300">
              Exercise Name <span className="text-orange-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Archer Push-Up, Korean Dip, Dragon Flag"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-800/90 border border-zinc-700/70 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          {/* Category & Measurement Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
                className="w-full px-3 py-2 bg-zinc-800/90 border border-zinc-700/70 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="push">Push (Chest/Triceps/Delts)</option>
                <option value="pull">Pull (Lats/Biceps/Back)</option>
                <option value="core">Core & Compression</option>
                <option value="legs">Legs & Lower Body</option>
                <option value="skills">Skills & Levers</option>
                <option value="handstand">Handstand & Balance</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-300">Tracking Metric</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MeasurementType)}
                className="w-full px-3 py-2 bg-zinc-800/90 border border-zinc-700/70 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="reps">Repetitions (Reps)</option>
                <option value="hold_seconds">Static Hold (Seconds)</option>
              </select>
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300">Difficulty Level</label>
            <div className="grid grid-cols-4 gap-2">
              {(['beginner', 'intermediate', 'advanced', 'elite'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold capitalize transition ${
                    difficulty === d
                      ? 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
                      : 'bg-zinc-800/70 text-zinc-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Target Muscles */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300">Target Muscles</label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_OPTIONS.map((m) => {
                const isSelected = selectedMuscles.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMuscle(m)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition ${
                      isSelected
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                        : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    {isSelected ? `✓ ${m}` : m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300">Description / Technique Focus</label>
            <textarea
              rows={2}
              placeholder="e.g. Wide push-up moving horizontally side to side with extended opposite arm..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800/90 border border-zinc-700/70 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          {/* Form Cues (one per line) */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300">
              Form Cues <span className="text-zinc-500">(one per line)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g.&#10;Lock out straight arm&#10;Keep hips square to floor"
              value={formCuesText}
              onChange={(e) => setFormCuesText(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800/90 border border-zinc-700/70 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-mono"
            />
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 p-2.5 bg-zinc-800/50 rounded-xl border border-zinc-700/40 cursor-pointer">
              <input
                type="checkbox"
                checked={supportsWeight}
                onChange={(e) => setSupportsWeight(e.target.checked)}
                className="rounded accent-orange-500"
              />
              <span className="text-zinc-300 text-[11px] font-medium">Supports Added Weight / Vest</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-zinc-800/50 rounded-xl border border-zinc-700/40 cursor-pointer">
              <input
                type="checkbox"
                checked={supportsAssistance}
                onChange={(e) => setSupportsAssistance(e.target.checked)}
                className="rounded accent-orange-500"
              />
              <span className="text-zinc-300 text-[11px] font-medium">Supports Band Assistance</span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Create Exercise</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
