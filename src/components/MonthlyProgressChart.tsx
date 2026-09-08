import React, { useState, useMemo } from 'react';
import { Calendar, Activity, Clock, Award, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { WorkoutSession } from '../types';
import { motion } from 'motion/react';

interface MonthlyProgressChartProps {
  sessions: WorkoutSession[];
}

type MetricType = 'workouts' | 'volume' | 'duration';

export const MonthlyProgressChart: React.FC<MonthlyProgressChartProps> = ({ sessions }) => {
  const [metric, setMetric] = useState<MetricType>('workouts');
  const [hoveredDay, setHoveredDay] = useState<any | null>(null);

  // Compute month properties
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-indexed
  const monthName = now.toLocaleString('default', { month: 'long' });

  // Compute data for all days in the current month
  const monthlyData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
    const daysList = [];

    let totalWorkouts = 0;
    let totalReps = 0;
    let totalMinutes = 0;
    let peakValue = 0;
    let peakDayNum = 1;

    for (let day = 1; day <= daysInMonth; day++) {
      // Find all sessions on this specific day of the month
      const startOfDay = new Date(currentYear, currentMonthIdx, day, 0, 0, 0).getTime();
      const endOfDay = new Date(currentYear, currentMonthIdx, day, 23, 59, 59).getTime();

      const daySessions = sessions.filter(
        (s) => s.startTime >= startOfDay && s.startTime <= endOfDay
      );

      const workoutsCount = daySessions.length;
      const repsCount = daySessions.reduce((acc, s) => acc + (s.totalVolumeReps || 0) + (s.totalHoldSeconds || 0), 0);
      const durationMins = daySessions.reduce((acc, s) => acc + Math.round((s.durationSeconds || 0) / 60), 0);

      totalWorkouts += workoutsCount;
      totalReps += repsCount;
      totalMinutes += durationMins;

      // Track metric to determine peak
      const val = metric === 'workouts' ? workoutsCount : metric === 'volume' ? repsCount : durationMins;
      if (val > peakValue) {
        peakValue = val;
        peakDayNum = day;
      }

      daysList.push({
        day,
        workoutsCount,
        repsCount,
        durationMins,
        sessions: daySessions.map(s => ({
          title: s.routineTitle,
          duration: Math.round((s.durationSeconds || 0) / 60)
        }))
      });
    }

    return {
      days: daysList,
      totalWorkouts,
      totalReps,
      totalMinutes,
      peakValue,
      peakDayNum,
      daysInMonth
    };
  }, [sessions, currentMonthIdx, currentYear, metric]);

  // Determine the active metric label and color
  const metricConfig = {
    workouts: {
      label: 'Workout Sessions',
      color: '#f97316', // brand orange
      barColor: 'bg-orange-500 hover:bg-orange-400',
      shadowColor: 'shadow-orange-500/10',
      unit: 'sessions'
    },
    volume: {
      label: 'Volume (Reps & Holds)',
      color: '#e11d48', // crimson / dark-red
      barColor: 'bg-rose-500 hover:bg-rose-400',
      shadowColor: 'shadow-rose-500/10',
      unit: 'pts'
    },
    duration: {
      label: 'Training Duration',
      color: '#fbbf24', // amber
      barColor: 'bg-amber-500 hover:bg-amber-400',
      shadowColor: 'shadow-amber-500/10',
      unit: 'min'
    }
  };

  const activeConfig = metricConfig[metric];

  // Helper to get bar height percent
  const getBarHeight = (dayData: any) => {
    if (!monthlyData.peakValue || monthlyData.peakValue <= 0) return '4%';
    const val = metric === 'workouts' 
      ? (dayData.workoutsCount || 0) 
      : metric === 'volume' 
        ? (dayData.repsCount || 0) 
        : (dayData.durationMins || 0);
    
    if (val <= 0) return '4%'; // Minimum height to show the day baseline
    const ratio = (val / monthlyData.peakValue) * 100;
    const safePercent = Number.isFinite(ratio) ? Math.min(100, Math.max(12, Math.round(ratio))) : 4;
    return `${safePercent}%`;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
      
      {/* Chart Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-black tracking-tight text-white font-display">
              Monthly Progress Calendar
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Training analytics and overload volume across <span className="text-white font-bold">{monthName} {currentYear}</span>
          </p>
        </div>

        {/* Metric Selector Toggles */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950/80 border border-zinc-800 rounded-2xl shrink-0">
          <button
            onClick={() => setMetric('workouts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metric === 'workouts'
                ? 'bg-orange-500 text-zinc-950 font-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Workouts</span>
          </button>

          <button
            onClick={() => setMetric('volume')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metric === 'volume'
                ? 'bg-rose-500 text-white font-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Volume</span>
          </button>

          <button
            onClick={() => setMetric('duration')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metric === 'duration'
                ? 'bg-amber-500 text-zinc-950 font-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Duration</span>
          </button>
        </div>
      </div>

      {/* Monthly Statistics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Sessions */}
        <div className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            Workouts Finished
          </div>
          <div className="text-xl font-black font-mono text-white flex items-baseline gap-1">
            {monthlyData.totalWorkouts}
            <span className="text-xs font-bold text-zinc-500">sessions</span>
          </div>
        </div>

        {/* Stat 2: Total Volume */}
        <div className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            Overload Volume
          </div>
          <div className="text-xl font-black font-mono text-rose-400 flex items-baseline gap-1">
            {monthlyData.totalReps.toLocaleString()}
            <span className="text-xs font-bold text-zinc-500">reps/secs</span>
          </div>
        </div>

        {/* Stat 3: Total Active Time */}
        <div className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            Time Under Tension
          </div>
          <div className="text-xl font-black font-mono text-amber-400 flex items-baseline gap-1">
            {monthlyData.totalMinutes}
            <span className="text-xs font-bold text-zinc-500">mins</span>
          </div>
        </div>

        {/* Stat 4: Peak Activity Day */}
        <div className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            Peak Training Day
          </div>
          <div className="text-xl font-black font-mono text-orange-400 flex items-baseline gap-1">
            Day {monthlyData.peakValue > 0 ? monthlyData.peakDayNum : '--'}
            <span className="text-xs font-bold text-zinc-500">
              ({monthlyData.peakValue > 0 ? `${monthlyData.peakValue} ${activeConfig.unit}` : 'no data'})
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization Container */}
      <div className="relative p-4 rounded-3xl bg-zinc-950/90 border border-zinc-800/60 shadow-inner">
        
        {/* Y Axis Gridlines Guide */}
        <div className="absolute inset-0 p-4 pb-14 flex flex-col justify-between pointer-events-none opacity-10">
          <div className="border-b border-white w-full" />
          <div className="border-b border-white w-full" />
          <div className="border-b border-white w-full" />
          <div className="border-b border-white w-full" />
        </div>

        {/* Scrollable Horizontal Chart Wrapper */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <div className="min-w-[640px] h-56 flex items-end justify-between gap-1.5 pt-6 pb-2 px-1 relative">
            {monthlyData.days.map((d) => {
              const height = getBarHeight(d);
              const val = metric === 'workouts' ? d.workoutsCount : metric === 'volume' ? d.repsCount : d.durationMins;
              const hasActivity = val > 0;

              return (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center h-full group relative cursor-pointer"
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Dynamic Tooltip on Hover */}
                  {hoveredDay?.day === d.day && (
                    <div className="absolute bottom-full mb-2 z-10 w-44 bg-zinc-900 border border-zinc-700/80 p-3 rounded-xl shadow-2xl text-left pointer-events-none animate-in fade-in-50 zoom-in-95 duration-150">
                      <p className="text-xs font-extrabold text-white border-b border-zinc-800 pb-1 mb-1.5">
                        Day {d.day} • {monthName}
                      </p>
                      <ul className="space-y-1 font-mono text-[10px]">
                        <li className="flex items-center justify-between text-zinc-300">
                          <span>Workouts:</span>
                          <span className="font-bold text-orange-400">{d.workoutsCount}</span>
                        </li>
                        <li className="flex items-center justify-between text-zinc-300">
                          <span>Volume:</span>
                          <span className="font-bold text-rose-400">{d.repsCount} pts</span>
                        </li>
                        <li className="flex items-center justify-between text-zinc-300">
                          <span>Active Time:</span>
                          <span className="font-bold text-amber-400">{d.durationMins} min</span>
                        </li>
                      </ul>
                      {d.sessions.length > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-zinc-850">
                          <p className="text-[9px] text-zinc-500 uppercase font-mono font-bold tracking-wider mb-0.5">Routines Done:</p>
                          {d.sessions.map((s: any, idx: number) => (
                            <p key={idx} className="text-[9px] text-zinc-300 truncate font-semibold">
                              ✓ {s.title}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visual Bar Column */}
                  <div className="w-full h-full flex flex-col justify-end relative">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height }}
                      transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                      className={`w-full rounded-t-md transition-all duration-150 relative ${
                        hasActivity 
                          ? `${activeConfig.barColor} shadow-md ${activeConfig.shadowColor}` 
                          : 'bg-zinc-800/40 hover:bg-zinc-750'
                      }`}
                    >
                      {/* Interactive glowing overlay on hover */}
                      <div className="absolute inset-0 w-full h-full rounded-t-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </div>

                  {/* X-Axis Date Indicator Tag */}
                  <span className={`text-[9px] font-mono mt-2 font-bold ${hasActivity ? 'text-white' : 'text-zinc-600'}`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart Footer Tips */}
      <div className="text-[10px] text-zinc-500 font-medium text-center italic">
        * Hover or tap on any calendar day block to view precise workout logs, duration metrics, and overload capacity.
      </div>
    </div>
  );
};
