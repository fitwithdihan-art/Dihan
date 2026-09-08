import React, { useState, useMemo } from 'react';
import { Search, X, Dumbbell, Sparkles, Filter, ChevronRight, Check, Plus } from 'lucide-react';
import { Exercise, ExerciseCategory } from '../types';
import { EXERCISES, getAllExercises } from '../data/exercises';
import { CreateCustomExerciseModal } from './CreateCustomExerciseModal';

interface ExerciseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  alreadySelectedIds?: string[];
  title?: string;
  customExercises?: Exercise[];
  onSaveCustomExercise?: (exercise: Exercise) => void;
}

const CATEGORIES: { label: string; value: ExerciseCategory | 'all' | 'custom' | 'bands' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Bands', value: 'bands' },
  { label: 'Push', value: 'push' },
  { label: 'Pull', value: 'pull' },
  { label: 'Core', value: 'core' },
  { label: 'Legs', value: 'legs' },
  { label: 'Skills', value: 'skills' },
  { label: 'Handstand', value: 'handstand' },
  { label: 'Custom', value: 'custom' },
];

export const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectExercise,
  alreadySelectedIds = [],
  title = 'Select Exercise',
  customExercises = [],
  onSaveCustomExercise,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all' | 'custom' | 'bands'>('all');
  const [activePreview, setActivePreview] = useState<Exercise | null>(null);
  const [isCreateCustomOpen, setIsCreateCustomOpen] = useState(false);

  const allAvailableExercises = useMemo(() => {
    return getAllExercises(customExercises);
  }, [customExercises]);

  const filteredExercises = useMemo(() => {
    return allAvailableExercises.filter((ex) => {
      if (selectedCategory === 'bands') {
        const isBand = ex.id.startsWith('band_') || ex.name.toLowerCase().includes('band');
        if (!isBand) return false;
      } else if (selectedCategory === 'custom') {
        if (!ex.isCustom) return false;
      } else if (selectedCategory !== 'all' && ex.category !== selectedCategory) {
        return false;
      }
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        ex.name.toLowerCase().includes(query) ||
        ex.primaryMuscles.some((m) => m.toLowerCase().includes(query)) ||
        ex.description.toLowerCase().includes(query);

      return matchesSearch;
    });
  }, [allAvailableExercises, searchQuery, selectedCategory]);

  const handleCustomExerciseCreated = (newExercise: Exercise) => {
    if (onSaveCustomExercise) {
      onSaveCustomExercise(newExercise);
    }
    onSelectExercise(newExercise);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        id="exercise-library-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          id="exercise-library-modal-container"
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight font-display text-white">{title}</h2>
                <p className="text-xs text-zinc-400">
                  Choose from {allAvailableExercises.length} calisthenics movements
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="library-create-custom-exercise-btn"
                onClick={() => setIsCreateCustomOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">New Custom Exercise</span>
                <span className="sm:hidden">New</span>
              </button>

              <button
                id="close-exercise-library-btn"
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="p-4 border-b border-zinc-800 space-y-3 bg-zinc-900/50">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="exercise-search-input"
                type="text"
                placeholder="Search exercise by name or muscle (e.g., Pull-Up, Back Lever, Chest)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    id={`filter-category-${cat.value}`}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      isActive
                        ? 'bg-amber-500 text-zinc-950 shadow-sm font-bold'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exercise List & Preview */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-zinc-800/50">
            {filteredExercises.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 space-y-3">
                <Filter className="w-8 h-8 mx-auto text-zinc-600" />
                <div>
                  <p className="text-sm font-medium text-white">No movements match "{searchQuery}"</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Want to track a unique exercise or variation?</p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:text-white"
                  >
                    Reset filters
                  </button>
                  <button
                    onClick={() => setIsCreateCustomOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Create "{searchQuery || 'Custom'}" Exercise</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredExercises.map((exercise) => {
                const isAlreadyAdded = alreadySelectedIds.includes(exercise.id);
                const isSelectedForPreview = activePreview?.id === exercise.id;

                return (
                  <div
                    key={exercise.id}
                    id={`exercise-card-${exercise.id}`}
                    className={`pt-2.5 pb-2.5 rounded-xl transition ${
                      isSelectedForPreview ? 'bg-zinc-800/50 p-3' : 'hover:bg-zinc-800/30 px-2'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setActivePreview(isSelectedForPreview ? null : exercise)}
                      >
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-sm font-semibold text-white hover:text-amber-400 transition font-display">
                            {exercise.name}
                          </span>
                          {exercise.isCustom && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Custom
                            </span>
                          )}
                          {exercise.type === 'hold_seconds' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Hold (Sec)
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded uppercase ${
                              exercise.difficulty === 'beginner'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : exercise.difficulty === 'intermediate'
                                ? 'bg-amber-500/15 text-amber-300'
                                : exercise.difficulty === 'advanced'
                                ? 'bg-red-950/50 text-red-600 border border-red-900/45 font-black'
                                : 'bg-rose-500/15 text-rose-300'
                            }`}
                          >
                            {exercise.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                          <span className="capitalize text-zinc-300">{exercise.category}</span>
                          <span>•</span>
                          <span className="truncate">{exercise.primaryMuscles.join(', ')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          id={`preview-exercise-${exercise.id}`}
                          onClick={() => setActivePreview(isSelectedForPreview ? null : exercise)}
                          className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800/60"
                        >
                          {isSelectedForPreview ? 'Hide Cues' : 'Cues'}
                        </button>
                        <button
                          id={`select-exercise-${exercise.id}`}
                          onClick={() => {
                            onSelectExercise(exercise);
                            onClose();
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            isAlreadyAdded
                              ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                              : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold'
                          }`}
                        >
                          {isAlreadyAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Add Again</span>
                            </>
                          ) : (
                            <>
                              <span>Add</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Form Cues & Description */}
                    {isSelectedForPreview && (
                      <div className="mt-3 pt-3 border-t border-zinc-700/60 text-xs space-y-2 bg-zinc-950/40 p-3 rounded-lg">
                        <p className="text-zinc-300">{exercise.description}</p>
                        <div>
                          <p className="font-semibold text-amber-400 mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Form Cues:
                          </p>
                          <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                            {exercise.formCues.map((cue, idx) => (
                              <li key={idx}>{cue}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <CreateCustomExerciseModal
        isOpen={isCreateCustomOpen}
        onClose={() => setIsCreateCustomOpen(false)}
        onSaveCustomExercise={handleCustomExerciseCreated}
      />
    </>
  );
};

