import React, { useState } from 'react';
import {
  Trophy,
  Award,
  TrendingUp,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  CheckCircle2,
  Flame,
  Calendar,
  Activity,
  X,
  Zap,
  Settings,
  Timer,
  LogOut,
  Cloud,
  ShieldCheck,
  Calculator,
} from 'lucide-react';
import { PersonalRecord, UserPreferences, WorkoutSession } from '../types';
import { EXERCISES } from '../data/exercises';
import { ExerciseLevelsView } from './ExerciseLevelsView';
import { MonthlyProgressChart } from './MonthlyProgressChart';
import { useAuth } from '../utils/authContext';

interface PRsAndStatsViewProps {
  prs: PersonalRecord[];
  sessions: WorkoutSession[];
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onAddPR: (pr: PersonalRecord) => void;
  onDeletePR: (prId: string) => void;
  onExportData: () => void;
  onImportData: (fileContent: string) => void;
  onResetData: () => void;
  onNavigateToCalculator?: () => void;
}

export const PRsAndStatsView: React.FC<PRsAndStatsViewProps> = ({
  prs,
  sessions,
  preferences,
  onUpdatePreferences,
  onAddPR,
  onDeletePR,
  onExportData,
  onImportData,
  onResetData,
  onNavigateToCalculator,
}) => {
  const { user, signInWithGoogle, signInWithFacebook, logOut, error, clearError } = useAuth();
  const [isAddPROpen, setIsAddPROpen] = useState<boolean>(false);
  const [subSection, setSubSection] = useState<'levels' | 'prs' | 'monthly' | 'settings'>('levels');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(EXERCISES[0].id);
  const [recordType, setRecordType] = useState<PersonalRecord['recordType']>('max_reps');
  const [recordValue, setRecordValue] = useState<number>(10);
  const [secondaryValue, setSecondaryValue] = useState<number>(5);

  // Compute lifetime metrics
  const lifetimeStats = React.useMemo(() => {
    let totalReps = 0;
    let totalHoldSecs = 0;
    let totalSets = 0;
    let totalMinutes = 0;

    sessions.forEach((s) => {
      totalReps += s.totalVolumeReps || 0;
      totalHoldSecs += s.totalHoldSeconds || 0;
      totalSets += s.totalSetsCompleted || 0;
      totalMinutes += Math.round((s.durationSeconds || 0) / 60);
    });

    return {
      totalWorkouts: sessions.length,
      totalReps,
      totalHoldSecs,
      totalSets,
      totalMinutes,
    };
  }, [sessions]);

  // Last 7 days activity dots
  const last7Days = React.useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = sessions.filter((s) => new Date(s.startTime).toISOString().slice(0, 10) === dateStr).length;
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        dateStr,
        hasWorkout: count > 0,
        count,
      });
    }
    return days;
  }, [sessions]);

  const handleCreatePR = (e: React.FormEvent) => {
    e.preventDefault();
    const exDef = EXERCISES.find((e) => e.id === selectedExerciseId);
    if (!exDef) return;

    const newPr: PersonalRecord = {
      id: `pr_${Date.now()}`,
      exerciseId: exDef.id,
      exerciseName: exDef.name,
      recordType,
      value: recordValue,
      secondaryValue: recordType === 'max_weight_reps' ? secondaryValue : undefined,
      achievedAt: Date.now(),
    };

    onAddPR(newPr);
    setIsAddPROpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string') {
        try {
          onImportData(content);
        } catch {
          alert('Failed to import file. Make sure it is a valid calisthenics backup JSON.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div id="prs-and-stats-view" className="space-y-6">
      {/* Sub-Navigation Switcher */}
      <div className="flex items-center gap-1.5 p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl">
        <button
          id="prs-subtab-levels"
          onClick={() => setSubSection('levels')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            subSection === 'levels'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Exercise Levels & Mastery</span>
        </button>

        <button
          id="prs-subtab-trophy"
          onClick={() => setSubSection('prs')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            subSection === 'prs'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span className="hidden sm:inline">PR Trophy Case</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              subSection === 'prs' ? 'bg-zinc-950/20 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {prs.length}
          </span>
        </button>

        <button
          id="prs-subtab-monthly"
          onClick={() => setSubSection('monthly')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            subSection === 'monthly'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Monthly Progress</span>
        </button>

        <button
          id="prs-subtab-settings"
          onClick={() => setSubSection('settings')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            subSection === 'settings'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Preferences</span>
        </button>
      </div>

      {/* Tab Content: Exercise Levels */}
      {subSection === 'levels' && (
        <ExerciseLevelsView sessions={sessions} weightUnit={preferences.unit} />
      )}

      {/* Tab Content: Monthly Progress Chart */}
      {subSection === 'monthly' && (
        <MonthlyProgressChart sessions={sessions} />
      )}

      {/* Tab Content: PRs & Lifetime Volume */}
      {subSection === 'prs' && (
        <>
          {/* Top Banner */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
              Athletic Metrics & PRs
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
            Personal Records & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Celebrate calisthenics milestones and track total training volume over time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {onNavigateToCalculator && (
            <button
              type="button"
              onClick={onNavigateToCalculator}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-orange-400 hover:text-orange-300 border border-orange-500/30 text-xs sm:text-sm font-bold font-mono transition shadow-sm cursor-pointer active:scale-95"
              title="Calculate athletic rank from reps"
            >
              <Calculator className="w-4 h-4" />
              <span>Rank Calculator</span>
            </button>
          )}

          <button
            id="open-add-pr-modal-btn"
            onClick={() => setIsAddPROpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-xs sm:text-sm font-bold text-zinc-950 shadow-md shadow-orange-500/10 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log New PR</span>
          </button>
        </div>
      </div>

      {/* Lifetime Stats Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Total Sessions</span>
            <Activity className="w-4 h-4 text-orange-400" />
          </div>
          <p className="font-mono text-2xl font-black text-white">{lifetimeStats.totalWorkouts}</p>
          <span className="text-[11px] text-zinc-500">logged workouts</span>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Completed Sets</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-mono text-2xl font-black text-white">{lifetimeStats.totalSets}</p>
          <span className="text-[11px] text-zinc-500">strict volume sets</span>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Total Reps</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <p className="font-mono text-2xl font-black text-white">{lifetimeStats.totalReps.toLocaleString()}</p>
          <span className="text-[11px] text-zinc-500">pushes & pulls</span>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Hold Time</span>
            <Award className="w-4 h-4 text-[#f97316]" />
          </div>
          <p className="font-mono text-2xl font-black text-white">
            {Math.round(lifetimeStats.totalHoldSecs / 60)}m
          </p>
          <span className="text-[11px] text-zinc-500">{lifetimeStats.totalHoldSecs}s statics/levers</span>
        </div>
      </div>

      {/* Weekly Activity Dot Matrix */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white font-display">Weekly Training Frequency</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Active days across the trailing 7 days</p>
        </div>

        <div className="flex items-center gap-2.5">
          {last7Days.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition ${
                  day.hasWorkout
                    ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                    : 'bg-zinc-800/80 text-zinc-500 border border-zinc-700/50'
                }`}
                title={`${day.dateStr}: ${day.count} workout(s)`}
              >
                {day.label}
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>

      {/* PRs Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-400" />
            <h3 className="text-base font-bold text-white font-display">Personal Records Trophy Case</h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">{prs.length} Records</span>
        </div>

        {prs.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-500">
            <p className="text-xs">No PRs recorded yet. Tap "Log New PR" to celebrate your best set!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {prs.map((pr) => {
              const dateStr = new Date(pr.achievedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={pr.id}
                  id={`pr-card-${pr.id}`}
                  className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col justify-between space-y-3 shadow-md hover:border-zinc-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold">
                        {pr.recordType === 'max_reps'
                          ? 'Max Reps'
                          : pr.recordType === 'max_hold'
                          ? 'Max Static Hold'
                          : 'Weighted PR'}
                      </span>
                      <h4 className="text-sm font-bold text-white font-display mt-1.5">{pr.exerciseName}</h4>
                    </div>

                    <button
                      onClick={() => onDeletePR(pr.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 rounded transition"
                      title="Delete PR"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t border-zinc-800/80">
                    <div>
                      <span className="font-mono text-2xl font-black text-orange-400">
                        {pr.value}
                        {pr.recordType === 'max_hold'
                          ? 's'
                          : pr.recordType === 'max_weight_reps'
                          ? `+${preferences.unit}`
                          : ' reps'}
                      </span>
                      {pr.recordType === 'max_weight_reps' && pr.secondaryValue && (
                        <span className="text-xs text-zinc-400 font-mono ml-1.5">for {pr.secondaryValue} reps</span>
                      )}
                    </div>

                    <span className="text-[10px] text-zinc-500 font-mono">{dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  )}

      {/* Preferences & Data Management */}
      {subSection === 'settings' && (
        <div className="space-y-6">
          {/* Cloud Save & Account Authentication */}
          <div className="p-5 sm:p-6 bg-zinc-900/70 border border-zinc-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider font-mono">
                  Cloud Save & Backup
                </h3>
                <p className="text-[11px] text-zinc-400">Secure your training data and access it from any device</p>
              </div>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs text-rose-300 font-medium">{error}</span>
                <button 
                  onClick={clearError} 
                  className="p-1 hover:bg-rose-500/15 rounded text-rose-400 hover:text-rose-300 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {user ? (
              /* Logged In View */
              <div className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full border-2 border-orange-500/40 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 font-bold font-mono text-sm">
                      {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-extrabold text-white leading-tight">
                        {user.displayName || 'Athlete'}
                      </h4>
                      <div className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase font-mono">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>Synced</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{user.email}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      UID: {user.uid.slice(0, 12)}...
                    </p>
                  </div>
                </div>

                <button
                  id="auth-logout-btn"
                  onClick={logOut}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs rounded-xl border border-zinc-700/60 transition active:scale-95 duration-100 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Account</span>
                </button>
              </div>
            ) : (
              /* Logged Out Options */
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Connect your profile to automatically save your custom routines, workout histories, trophies, coins, and leveling progress to secure cloud databases.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Google Login Button */}
                  <button
                    id="auth-google-login-btn"
                    onClick={signInWithGoogle}
                    className="flex items-center justify-center gap-2.5 px-4 py-3 bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-black rounded-xl transition duration-150 shadow-md select-none active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M5.26620003,9.76453951 C6.19875004,6.93810444 8.85468754,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4242188,6.50113636 L19.905,3.02036364 C17.79975,1.15011364 15.0272727,0 12,0 C7.33008753,0 3.30210002,4.02951475 1.58153751,9.30136364 L5.26620003,9.76453951 Z"
                      />
                      <path
                        fill="#34A853"
                        d="M16.0407563,17.1358636 C14.9030625,17.9001818 13.5132188,18.3511364 12,18.3511364 C8.85468754,18.3511364 6.19875004,16.3221229 5.26620003,13.4956878 L1.58153751,13.9588636 C3.30210002,19.2307125 7.33008753,23.2602273 12,23.2602273 C14.9359063,23.2602273 17.6536313,22.18125 19.6734563,20.3563636 L16.0407563,17.1358636 Z"
                      />
                      <path
                        fill="#4285F4"
                        d="M24,12.2727273 C24,11.4545455 23.9181818,10.6363636 23.7727273,9.81818182 L12,9.81818182 L12,14.4136364 L18.7554563,14.4136364 C18.4645438,15.9681818 17.5187125,17.3181818 16.0407563,18.3090909 L19.6734563,21.5298636 C22.1969625,19.2065364 24,15.7533636 24,12.2727273 Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.26620003,9.76453951 C5.01170627,10.5369666 4.87012502,11.3615965 4.87012502,12.2202273 C4.87012502,13.078858 5.01170627,13.9034879 5.26620003,14.675915 L1.58153751,14.2127391 C0.57395626,12.2229545 0,9.98613636 0,7.60113636 C0,5.21613636 0.57395626,2.97931818 1.58153751,0.989545455 L5.26620003,1.45272132 Z"
                      />
                    </svg>
                    <span>Connect Google</span>
                  </button>

                  {/* Facebook Login Button */}
                  <button
                    id="auth-facebook-login-btn"
                    onClick={signInWithFacebook}
                    className="flex items-center justify-center gap-2.5 px-4 py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-black rounded-xl transition duration-150 shadow-md select-none active:scale-[0.98]"
                  >
                    <svg className="w-4.5 h-4.5 shrink-0 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Connect Facebook</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 bg-zinc-900/70 border border-zinc-800 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider font-mono">
              Preferences & Data Sync
            </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auto Rest Timer Preference */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-800/70 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${preferences.autoRestTimerEnabled !== false ? 'bg-zinc-800 text-orange-400' : 'bg-zinc-900 text-zinc-500'}`}>
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Auto Rest Timer</h4>
                  <p className="text-[11px] text-zinc-400">Launch rest timer automatically after a set</p>
                </div>
              </div>
              <button
                onClick={() => onUpdatePreferences({ autoRestTimerEnabled: preferences.autoRestTimerEnabled === false })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  preferences.autoRestTimerEnabled !== false ? 'bg-orange-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {preferences.autoRestTimerEnabled !== false ? 'On' : 'Off'}
              </button>
            </div>

            {/* Audio Chime Preference */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-800/70 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-zinc-800 text-orange-400">
                  {preferences.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Timer Sound & Beeps</h4>
                  <p className="text-[11px] text-zinc-400">Audio cues when rest periods complete</p>
                </div>
              </div>
              <button
                onClick={() => onUpdatePreferences({ soundEnabled: !preferences.soundEnabled })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  preferences.soundEnabled ? 'bg-orange-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {preferences.soundEnabled ? 'On' : 'Muted'}
              </button>
            </div>

            {/* Unit Switch (kg vs lbs) */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-800/70 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-zinc-800 text-orange-400 font-mono text-xs font-bold">
                  {preferences.unit.toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Weight Units</h4>
                  <p className="text-[11px] text-zinc-400">For weighted pull-ups, dips, vests</p>
                </div>
              </div>
              <div className="flex items-center bg-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => onUpdatePreferences({ unit: 'kg' })}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    preferences.unit === 'kg' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400'
                  }`}
                >
                  kg
                </button>
                <button
                  onClick={() => onUpdatePreferences({ unit: 'lbs' })}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    preferences.unit === 'lbs' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400'
                  }`}
                >
                  lbs
                </button>
              </div>
            </div>
          </div>

          {/* Export / Import & Reset Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-800/80">
            <button
              id="export-data-btn"
              onClick={onExportData}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
            >
              <Download className="w-3.5 h-3.5" /> Export Backup (JSON)
            </button>

            <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore Backup</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => {
                if (confirm('Reset tracker data to factory defaults? This will restore sample routines and PRs.')) {
                  onResetData();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 text-xs font-semibold ml-auto transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Manual PR Entry Modal */}
      {isAddPROpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white font-display">Log Personal Record</h3>
              <button onClick={() => setIsAddPROpen(false)} className="p-1 text-zinc-400 hover:text-white rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePR} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Exercise</label>
                <select
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white"
                >
                  {EXERCISES.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Record Type</label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value as PersonalRecord['recordType'])}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white"
                >
                  <option value="max_reps">Max Reps (Unbroken)</option>
                  <option value="max_hold">Max Hold (Seconds)</option>
                  <option value="max_weight_reps">Added Weight (+{preferences.unit})</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    {recordType === 'max_hold'
                      ? 'Seconds'
                      : recordType === 'max_weight_reps'
                      ? `Weight (+${preferences.unit})`
                      : 'Reps'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={recordValue}
                    onChange={(e) => setRecordValue(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-white text-center"
                  />
                </div>

                {recordType === 'max_weight_reps' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Reps Completed</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={secondaryValue}
                      onChange={(e) => setSecondaryValue(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-white text-center"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddPROpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-xs rounded-xl transition"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
