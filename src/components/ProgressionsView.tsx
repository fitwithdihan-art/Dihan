import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Trophy,
  ChevronRight,
  Flame,
  Shield,
  Zap,
  Target,
  Activity,
  Compass,
  ArrowUpCircle,
  Info,
} from 'lucide-react';
import { ProgressionMilestone, ProgressionTree } from '../types';
import { EXERCISES } from '../data/exercises';

interface ProgressionsViewProps {
  progressions: ProgressionTree[];
  onUpdateLevel: (treeId: string, newLevel: number) => void;
  onLaunchExerciseInWorkout?: (exerciseId: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  ArrowUpCircle: <ArrowUpCircle className="w-5 h-5 text-orange-400" />,
  Zap: <Zap className="w-5 h-5 text-orange-400" />,
  Shield: <Shield className="w-5 h-5 text-orange-400" />,
  Compass: <Compass className="w-5 h-5 text-orange-400" />,
  Flame: <Flame className="w-5 h-5 text-orange-400" />,
  Target: <Target className="w-5 h-5 text-orange-400" />,
  Activity: <Activity className="w-5 h-5 text-orange-400" />,
};

export const ProgressionsView: React.FC<ProgressionsViewProps> = ({
  progressions,
  onUpdateLevel,
  onLaunchExerciseInWorkout,
}) => {
  const [selectedTreeId, setSelectedTreeId] = useState<string>(progressions[0]?.id || '');
  const [activeMilestone, setActiveMilestone] = useState<ProgressionMilestone | null>(null);

  const activeTree = progressions.find((p) => p.id === selectedTreeId) || progressions[0];

  return (
    <div id="progressions-view" className="space-y-6">
      {/* Intro Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
            Skill Progression Ladders
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
          Master Movement Leverage
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
          Calisthenics strength is built by manipulating leverage and biomechanics. Advance through each step once you hit the strict mastery standard.
        </p>
      </div>

      {/* Ladder Navigation Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {progressions.map((tree) => {
          const isSelected = tree.id === activeTree?.id;
          const currentMilestone = tree.milestones.find((m) => m.level === tree.currentLevel);

          return (
            <button
              key={tree.id}
              id={`tree-select-btn-${tree.id}`}
              onClick={() => {
                setSelectedTreeId(tree.id);
                setActiveMilestone(null);
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-left transition shrink-0 ${
                isSelected
                  ? 'bg-zinc-800/90 border-orange-500/60 shadow-md shadow-orange-500/5'
                  : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/50 text-zinc-400'
              }`}
            >
              <div className="p-1.5 rounded-xl bg-zinc-950/60">
                {ICON_MAP[tree.iconName] || <Zap className="w-4 h-4 text-orange-400" />}
              </div>
              <div>
                <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                  {tree.title}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Lvl {tree.currentLevel}/{tree.milestones.length}: {currentMilestone?.name || 'In Progress'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Ladder Detail Display */}
      {activeTree && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Milestones Vertical Ladder */}
          <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white font-display">{activeTree.title}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-medium uppercase rounded bg-zinc-800 text-zinc-300">
                    {activeTree.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{activeTree.description}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Current Stage</span>
                <span className="text-sm font-mono font-extrabold text-orange-400">
                  Step {activeTree.currentLevel} of {activeTree.milestones.length}
                </span>
              </div>
            </div>

            {/* Ladder Steps */}
            <div className="relative pl-6 space-y-6 pt-2">
              {/* Vertical connector line */}
              <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-zinc-800" />

              {activeTree.milestones.map((milestone) => {
                const isMastered = milestone.level < activeTree.currentLevel;
                const isCurrent = milestone.level === activeTree.currentLevel;
                const isUpcoming = milestone.level > activeTree.currentLevel;
                const isDetailSelected = activeMilestone?.level === milestone.level;

                return (
                  <div
                    key={milestone.level}
                    id={`milestone-step-${activeTree.id}-${milestone.level}`}
                    onClick={() => setActiveMilestone(milestone)}
                    className={`relative flex items-start gap-4 p-3.5 rounded-2xl border cursor-pointer transition ${
                      isDetailSelected
                        ? 'bg-zinc-800 border-orange-500 shadow-md'
                        : isCurrent
                        ? 'bg-zinc-800/50 border-orange-500/40 shadow-sm'
                        : 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700'
                    }`}
                  >
                    {/* Node Dot */}
                    <div className="absolute -left-[30px] top-4 z-10">
                      {isMastered ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-md shadow-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4 fill-emerald-500 stroke-zinc-950" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-orange-500 text-zinc-950 flex items-center justify-center ring-4 ring-orange-500/20 shadow-md shadow-orange-500/20">
                          <span className="font-mono text-[10px] font-black">{milestone.level}</span>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 text-[10px] font-mono">
                          {milestone.level}
                        </div>
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-zinc-400">Step {milestone.level}</span>
                        <h4 className="text-sm font-bold text-white font-display">{milestone.name}</h4>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase bg-orange-500/20 text-orange-300 rounded border border-orange-500/30">
                            Current Goal
                          </span>
                        )}
                        {isMastered && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase bg-emerald-500/15 text-emerald-300 rounded">
                            Mastered
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{milestone.description}</p>

                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800/80">
                        <Trophy className="w-3 h-3 text-orange-400 shrink-0" />
                        <span className="text-zinc-400 font-sans">Requirement:</span>
                        <span className="text-orange-300 truncate">{milestone.masteryRequirement}</span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-zinc-500 self-center shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestone Detail Inspector */}
          <div className="lg:col-span-5 space-y-4">
            {(() => {
              const displayMilestone =
                activeMilestone || activeTree.milestones.find((m) => m.level === activeTree.currentLevel) || activeTree.milestones[0];
              const exDef = EXERCISES.find((e) => e.id === displayMilestone.exerciseId);

              return (
                <div
                  id="milestone-inspector-card"
                  className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                        Milestone Level {displayMilestone.level}
                      </span>
                      {displayMilestone.level === activeTree.currentLevel ? (
                        <span className="text-xs font-mono text-orange-400 font-semibold">Active Milestone</span>
                      ) : (
                        <button
                          id={`set-current-level-btn-${displayMilestone.level}`}
                          onClick={() => onUpdateLevel(activeTree.id, displayMilestone.level)}
                          className="text-xs text-orange-400 hover:text-orange-300 font-semibold underline"
                        >
                          Set as my current step
                        </button>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white font-display">{displayMilestone.name}</h3>
                    <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{displayMilestone.description}</p>
                  </div>

                  {/* Mastery Criteria Card */}
                  <div className="p-3.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 mb-1">
                      <Trophy className="w-4 h-4" />
                      <span>Progression Test Standard</span>
                    </div>
                    <p className="text-xs text-zinc-200 font-mono font-medium">
                      {displayMilestone.masteryRequirement}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Hit this standard with strict form before progressing to the next step.
                    </p>
                  </div>

                  {/* Form Cues */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase font-mono text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                      Strict Execution Cues
                    </h4>
                    <ul className="space-y-1.5">
                      {displayMilestone.keyCues.map((cue, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-zinc-300 bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/60"
                        >
                          <span className="w-4 h-4 flex items-center justify-center rounded-full bg-zinc-800 text-[10px] font-mono text-orange-400 shrink-0">
                            {idx + 1}
                          </span>
                          <span>{cue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Muscles Targeted */}
                  {exDef && (
                    <div className="pt-2 border-t border-zinc-800 text-xs">
                      <span className="text-zinc-400 block mb-1">Muscles Recruited:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {exDef.primaryMuscles.map((muscle) => (
                          <span
                            key={muscle}
                            className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px]"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Action */}
                  {displayMilestone.level !== activeTree.currentLevel && (
                    <button
                      onClick={() => onUpdateLevel(activeTree.id, displayMilestone.level)}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl transition"
                    >
                      Update My Milestone to Step {displayMilestone.level}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
