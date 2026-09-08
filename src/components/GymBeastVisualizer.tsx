import React, { useState } from 'react';

interface GymBeastVisualizerProps {
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  exerciseName?: string;
  compact?: boolean;
}

export const GymBeastVisualizer: React.FC<GymBeastVisualizerProps> = ({
  primaryMuscles = [],
  secondaryMuscles = [],
  exerciseName = '',
  compact = false,
}) => {
  const [activeView, setActiveView] = useState<'both' | 'front' | 'back'>('both');

  // Match exercise muscle strings to standard anatomical muscle groups
  const getIntensity = (muscleKey: string): 'none' | 'primary' | 'secondary' => {
    const key = muscleKey.toLowerCase();

    const isMatched = (targetList: string[]) => {
      return targetList.some(m => {
        const target = m.toLowerCase();

        // Chest / Pectorals
        if (key === 'chest' && (target.includes('chest') || target.includes('pec') || target.includes('push-up') || target.includes('dip'))) return true;
        if (key === 'upper_chest' && (target.includes('upper chest') || target.includes('clavicular') || target.includes('incline'))) return true;
        if (key === 'lower_chest' && (target.includes('lower chest') || target.includes('decline') || target.includes('dip'))) return true;

        // Shoulders / Deltoids
        if (key === 'shoulders' && (target.includes('shoulder') || target.includes('delt') || target.includes('overhead') || target.includes('pike') || target.includes('handstand') || target.includes('planche'))) return true;
        if (key === 'front_delts' && (target.includes('anterior') || target.includes('front delt') || target.includes('shoulder'))) return true;
        if (key === 'rear_delts' && (target.includes('posterior') || target.includes('rear delt') || target.includes('face pull'))) return true;

        // Arms
        if (key === 'biceps' && (target.includes('bicep') || target.includes('chin-up') || target.includes('curl') || target.includes('pull-up'))) return true;
        if (key === 'triceps' && (target.includes('tricep') || target.includes('dip') || target.includes('pushdown') || target.includes('skull') || target.includes('extension'))) return true;
        if (key === 'forearms' && (target.includes('forearm') || target.includes('wrist') || target.includes('grip') || target.includes('false grip'))) return true;

        // Back
        if (key === 'lats' && (target.includes('lat') || target.includes('back') || target.includes('pull-up') || target.includes('row') || target.includes('muscle-up') || target.includes('front lever'))) return true;
        if (key === 'traps' && (target.includes('trap') || target.includes('shrug') || target.includes('scapular') || target.includes('rhomboid') || target.includes('upper back'))) return true;
        if (key === 'lower_back' && (target.includes('lower back') || target.includes('erector') || target.includes('hyperextension') || target.includes('back extension') || target.includes('lumbar'))) return true;

        // Core
        if (key === 'abs' && (target.includes('ab') || target.includes('core') || target.includes('rectus') || target.includes('l-sit') || target.includes('hollow') || target.includes('crunch') || target.includes('plank') || target.includes('hanging leg raise'))) return true;
        if (key === 'obliques' && (target.includes('oblique') || target.includes('side plank') || target.includes('twist') || target.includes('serratus'))) return true;

        // Lower Body
        if (key === 'quads' && (target.includes('quad') || target.includes('thigh') || target.includes('squat') || target.includes('lunge') || target.includes('pistol') || target.includes('leg ext'))) return true;
        if (key === 'hamstrings' && (target.includes('hamstring') || target.includes('nordic') || target.includes('deadlift') || target.includes('glute-ham'))) return true;
        if (key === 'glutes' && (target.includes('glute') || target.includes('butt') || target.includes('hip') || target.includes('bridge') || target.includes('thrust'))) return true;
        if (key === 'calves' && (target.includes('calf') || target.includes('calves') || target.includes('gastrocnemius') || target.includes('soleus'))) return true;

        return false;
      });
    };

    if (isMatched(primaryMuscles)) return 'primary';
    if (isMatched(secondaryMuscles)) return 'secondary';
    return 'none';
  };

  // Human Anatomical Theme Styling
  const getMuscleStyle = (muscleKey: string) => {
    const intensity = getIntensity(muscleKey);

    if (intensity === 'primary') {
      return {
        fill: 'url(#orange-primary-gradient)',
        stroke: '#ffedd5', // Warm light cream edge for high definition
        strokeWidth: '1.2',
        filter: 'url(#primary-glow)',
        opacity: 1,
        transition: 'all 0.35s ease',
      };
    }
    if (intensity === 'secondary') {
      return {
        fill: 'url(#amber-secondary-gradient)',
        stroke: '#fef3c7',
        strokeWidth: '1.1',
        filter: 'url(#secondary-glow)',
        opacity: 0.95,
        transition: 'all 0.35s ease',
      };
    }

    // Inactive human athlete muscle: realistic deep charcoal tone with subtle gradient
    return {
      fill: 'url(#resting-muscle-gradient)',
      stroke: '#383b4c',
      strokeWidth: '0.8',
      opacity: 0.9,
      transition: 'all 0.35s ease',
    };
  };

  const skinBase = '#1a1c26'; // Deep athletic skin undertone
  const skinStroke = '#2d3142';
  const hairColor = '#12131a';
  const hairStroke = '#32374a';

  return (
    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 flex flex-col items-center justify-center select-none shadow-xl overflow-hidden relative">
      {/* Header with Exercise Info & App Theme Legend */}
      <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-zinc-800/60 px-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-display truncate block">
              {exerciseName || 'Target Muscles'}
            </span>
          </div>
        </div>

        {/* View Switcher for responsive flexibility */}
        <div className="flex items-center gap-1 bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setActiveView('both')}
            className={`px-2 py-0.5 rounded transition ${
              activeView === 'both'
                ? 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Both
          </button>
          <button
            type="button"
            onClick={() => setActiveView('front')}
            className={`px-2 py-0.5 rounded transition ${
              activeView === 'front'
                ? 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setActiveView('back')}
            className={`px-2 py-0.5 rounded transition ${
              activeView === 'back'
                ? 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Back
          </button>
        </div>
      </div>

      {/* Muscle Indicators Legend in App Theme */}
      <div className="w-full flex items-center justify-center gap-4 text-[10px] font-mono pb-2 text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]" />
          <span className="text-orange-300 font-semibold">Primary Target</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
          <span className="text-amber-300 font-semibold">Secondary</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#2b2d3c] border border-zinc-700" />
          <span className="text-zinc-500">Resting</span>
        </div>
      </div>

      {/* SVG Container with Realistic Human Calisthenics Physique */}
      <div className="flex items-center justify-center gap-4 sm:gap-10 py-1 transition-all">
        
        {/* ========================================================= */}
        {/* ===================== FRONT VIEW ======================== */}
        {/* ========================================================= */}
        {(activeView === 'both' || activeView === 'front') && (
          <div className="flex flex-col items-center">
            <svg
              className={compact ? 'w-32 h-56 sm:w-40 sm:h-68' : 'w-40 h-68 sm:w-48 sm:h-80'}
              viewBox="0 0 170 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Teenthenics Flame Orange Primary Gradient */}
                <linearGradient id="orange-primary-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ff7a1a" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>

                {/* Golden Amber Secondary Gradient */}
                <linearGradient id="amber-secondary-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>

                {/* Resting Muscle Shaded Gradient */}
                <linearGradient id="resting-muscle-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#303345" />
                  <stop offset="100%" stopColor="#20222f" />
                </linearGradient>

                {/* Shading for natural depth */}
                <filter id="primary-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#f97316" floodOpacity="0.75" />
                </filter>
                <filter id="secondary-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* HUMAN SILHOUETTE BASE - Smooth natural curves */}
              <path
                d="M 85,28 C 76,28 72,34 70,41 C 66,45 61,48 56,52 C 48,58 41,74 37,92 C 34,106 31,126 27,144 C 25,152 23,160 26,164 C 29,168 35,165 38,158 C 42,148 45,134 47,122 C 49,144 51,170 52,192 C 53,218 51,244 51,262 C 51,272 59,276 66,274 C 73,272 75,258 78,228 C 81,202 82,190 85,190 C 88,190 89,202 92,228 C 95,258 97,272 104,274 C 111,276 119,272 119,262 C 119,244 117,218 118,192 C 119,170 121,144 123,122 C 125,134 128,148 132,158 C 135,165 141,168 144,164 C 147,160 145,152 143,144 C 139,126 136,106 133,92 C 129,74 122,58 114,52 C 109,48 104,45 100,41 C 98,34 94,28 85,28 Z"
                fill={skinBase}
                stroke={skinStroke}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />

              {/* REALISTIC HUMAN HEAD, FACE & HAIR */}
              <g id="human-head-front">
                {/* Neck Base / Sternocleidomastoid */}
                <path
                  d="M 80,42 C 78,48 76,56 75,60 C 81,62 89,62 95,60 C 94,56 92,48 90,42 Z"
                  fill="#252736"
                  stroke="#35384c"
                  strokeWidth="0.8"
                />
                {/* Clavicle bones */}
                <path
                  d="M 85,61 C 77,59 66,54 58,56 M 85,61 C 93,59 104,54 112,56"
                  stroke="#4f546b"
                  strokeWidth="1"
                  strokeLinecap="round"
                />

                {/* Smooth Human Face Silhouette */}
                <path
                  d="M 76,26 C 74,32 75,41 80,45 C 83,47 87,47 90,45 C 95,41 96,32 94,26 C 93,22 89,20 85,20 C 81,20 77,22 76,26 Z"
                  fill="#2e3144"
                  stroke="#42465e"
                  strokeWidth="1"
                />
                {/* Human Ears */}
                <path d="M 75,30 C 73,32 73,38 75,40" stroke="#42465e" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M 95,30 C 97,32 97,38 95,40" stroke="#42465e" strokeWidth="1.2" strokeLinecap="round" />

                {/* Stylish Athletic Hair with natural flowing strands */}
                <path
                  d="M 74,27 C 72,21 75,14 81,11 C 86,9 93,10 97,14 C 100,18 99,25 96,28 C 96,24 94,18 89,17 C 84,16 79,20 77,25 Z"
                  fill={hairColor}
                  stroke={hairStroke}
                  strokeWidth="1.2"
                />
                <path
                  d="M 78,16 C 82,14 87,14 91,17"
                  stroke="#474d66"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                />
              </g>

              {/* TRAPEZIUS (FRONT) */}
              <g style={getMuscleStyle('traps')}>
                <path
                  d="M 77,46 C 73,48 67,52 64,57 C 69,57 74,58 77,55 Z"
                />
                <path
                  d="M 93,46 C 97,48 103,52 106,57 C 101,57 96,58 93,55 Z"
                />
              </g>

              {/* SHOULDERS (DELTOIDS - Rounded Anatomical Caps) */}
              <g style={getMuscleStyle('shoulders')}>
                {/* Left Deltoid */}
                <path
                  d="M 64,57 C 56,58 48,67 50,78 C 53,82 58,82 63,77 C 65,71 65,64 64,57 Z"
                />
                {/* Right Deltoid */}
                <path
                  d="M 106,57 C 114,58 122,67 120,78 C 117,82 112,82 107,77 C 105,71 105,64 106,57 Z"
                />
              </g>

              {/* CHEST (PECTORALS - Organic Curved Muscle Bellies) */}
              <g style={getMuscleStyle('chest')}>
                {/* Left Pec */}
                <path
                  d="M 66,61 C 73,61 82,62 84,65 C 84,77 82,88 71,90 C 62,91 60,80 65,67 Z"
                />
                {/* Right Pec */}
                <path
                  d="M 104,61 C 97,61 88,62 86,65 C 86,77 88,88 99,90 C 108,91 110,80 105,67 Z"
                />
              </g>

              {/* BICEPS (FRONT - Bulging Calisthenics Biceps) */}
              <g style={getMuscleStyle('biceps')}>
                {/* Left Bicep */}
                <path
                  d="M 52,80 C 46,86 47,100 54,106 C 57,100 58,92 57,84 Z"
                />
                {/* Right Bicep */}
                <path
                  d="M 118,80 C 124,86 123,100 116,106 C 113,100 112,92 113,84 Z"
                />
              </g>

              {/* FOREARMS (FRONT - Curved Brachioradialis & Flexors) */}
              <g style={getMuscleStyle('forearms')}>
                {/* Left Forearm */}
                <path
                  d="M 53,107 C 47,114 44,130 47,143 C 51,138 54,124 55,111 Z"
                />
                {/* Right Forearm */}
                <path
                  d="M 117,107 C 123,114 126,130 123,143 C 119,138 116,124 115,111 Z"
                />
              </g>

              {/* NATURAL HUMAN HANDS */}
              <g id="human-hands-front">
                {/* Left Hand with natural thumb & relaxed fingers */}
                <path
                  d="M 47,144 C 44,147 38,154 34,161 C 32,165 35,168 39,165 C 42,162 44,155 47,150 C 48,156 50,158 52,154 C 53,150 51,146 49,144 Z"
                  fill="#252737"
                  stroke="#393d52"
                  strokeWidth="0.9"
                />
                {/* Right Hand */}
                <path
                  d="M 123,144 C 126,147 132,154 136,161 C 138,165 135,168 131,165 C 128,162 126,155 123,150 C 122,156 120,158 118,154 C 117,150 119,146 121,144 Z"
                  fill="#252737"
                  stroke="#393d52"
                  strokeWidth="0.9"
                />
              </g>

              {/* ABDOMINALS (6-PACK ABS & SERRATUS - Natural Organic Segments) */}
              <g style={getMuscleStyle('abs')}>
                {/* Upper Abs (Rounded, not rectangular!) */}
                <path
                  d="M 72,93 C 76,92 82,92 84,93 C 84,101 77,103 72,101 C 70,98 70,94 72,93 Z"
                />
                <path
                  d="M 98,93 C 94,92 88,92 86,93 C 86,101 93,103 98,101 C 100,98 100,94 98,93 Z"
                />
                {/* Mid Abs */}
                <path
                  d="M 73,103 C 77,103 82,103 84,104 C 84,113 77,115 72,113 C 71,110 71,105 73,103 Z"
                />
                <path
                  d="M 97,103 C 93,103 88,103 86,104 C 86,113 93,115 98,113 C 99,110 99,105 97,103 Z"
                />
                {/* Lower Abs / Core Taper */}
                <path
                  d="M 74,115 C 78,115 82,115 84,116 C 84,129 76,128 73,123 C 72,120 72,117 74,115 Z"
                />
                <path
                  d="M 96,115 C 92,115 88,115 86,116 C 86,129 94,128 97,123 C 98,120 98,117 96,115 Z"
                />
              </g>

              {/* OBLIQUES (V-TAPER WAIST & ADONIS BELT) */}
              <g style={getMuscleStyle('obliques')}>
                {/* Left Obliques */}
                <path
                  d="M 67,96 C 64,103 66,114 71,126 C 72,116 71,106 69,96 Z"
                />
                {/* Right Obliques */}
                <path
                  d="M 103,96 C 106,103 104,114 99,126 C 98,116 99,106 101,96 Z"
                />
              </g>

              {/* PELVIS & HIPS */}
              <path
                d="M 73,128 C 80,133 90,133 97,128 C 96,138 91,146 85,146 C 79,146 74,138 73,128 Z"
                fill="#20222f"
                stroke="#33374a"
                strokeWidth="0.8"
              />

              {/* QUADS (THIGHS - Vastus Medialis Teardrop & Lateralis) */}
              <g style={getMuscleStyle('quads')}>
                {/* Left Outer Quad (Vastus Lateralis) */}
                <path
                  d="M 67,136 C 58,150 57,178 63,205 C 67,202 70,188 69,165 C 69,150 68,140 67,136 Z"
                />
                {/* Left Inner Quad (Teardrop Vastus Medialis) */}
                <path
                  d="M 70,165 C 71,188 67,202 75,210 C 81,202 83,184 81,165 C 80,146 75,136 73,136 C 71,144 70,154 70,165 Z"
                />
                {/* Right Outer Quad */}
                <path
                  d="M 103,136 C 112,150 113,178 107,205 C 103,202 100,188 101,165 C 101,150 102,140 103,136 Z"
                />
                {/* Right Inner Quad */}
                <path
                  d="M 100,165 C 99,188 103,202 95,210 C 89,202 87,184 89,165 C 90,146 95,136 97,136 C 99,144 100,154 100,165 Z"
                />
              </g>

              {/* KNEES (Patella) */}
              <ellipse cx="72" cy="213" rx="3.5" ry="4" fill="#252737" stroke="#393d52" strokeWidth="0.9" />
              <ellipse cx="98" cy="213" rx="3.5" ry="4" fill="#252737" stroke="#393d52" strokeWidth="0.9" />

              {/* CALVES (FRONT - Gastrocnemius & Tibialis) */}
              <g style={getMuscleStyle('calves')}>
                {/* Left Calf */}
                <path
                  d="M 67,218 C 60,227 59,250 65,268 C 70,260 74,244 74,228 C 74,220 72,217 67,218 Z"
                />
                {/* Right Calf */}
                <path
                  d="M 103,218 C 110,227 111,250 105,268 C 100,260 96,244 96,228 C 96,220 98,217 103,218 Z"
                />
              </g>

              {/* HUMAN FEET */}
              <g id="human-feet-front">
                {/* Left Foot */}
                <path
                  d="M 64,269 C 63,275 56,284 48,285 C 46,286 48,289 54,288 C 63,287 69,280 69,271 Z"
                  fill="#252737"
                  stroke="#393d52"
                  strokeWidth="0.9"
                />
                {/* Right Foot */}
                <path
                  d="M 106,269 C 107,275 114,284 122,285 C 124,286 122,289 116,288 C 107,287 101,280 101,271 Z"
                  fill="#252737"
                  stroke="#393d52"
                  strokeWidth="0.9"
                />
              </g>
            </svg>
            <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-1">
              Front View
            </span>
          </div>
        )}

        {/* ========================================================= */}
        {/* ===================== BACK VIEW ========================= */}
        {/* ========================================================= */}
        {(activeView === 'both' || activeView === 'back') && (
          <div className="flex flex-col items-center">
            <svg
              className={compact ? 'w-32 h-56 sm:w-40 sm:h-68' : 'w-40 h-68 sm:w-48 sm:h-80'}
              viewBox="0 0 170 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* HUMAN SILHOUETTE BASE - Back View */}
              <path
                d="M 85,28 C 76,28 72,34 70,41 C 66,45 61,48 56,52 C 48,58 41,74 37,92 C 34,106 31,126 27,144 C 25,152 23,160 26,164 C 29,168 35,165 38,158 C 42,148 45,134 47,122 C 49,144 51,170 52,192 C 53,218 51,244 51,262 C 51,272 59,276 66,274 C 73,272 75,258 78,228 C 81,202 82,190 85,190 C 88,190 89,202 92,228 C 95,258 97,272 104,274 C 111,276 119,272 119,262 C 119,244 117,218 118,192 C 119,170 121,144 123,122 C 125,134 128,148 132,158 C 135,165 141,168 144,164 C 147,160 145,152 143,144 C 139,126 136,106 133,92 C 129,74 122,58 114,52 C 109,48 104,45 100,41 C 98,34 94,28 85,28 Z"
                fill={skinBase}
                stroke={skinStroke}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />

              {/* REALISTIC BACK OF HEAD & NECK */}
              <g id="human-head-back">
                {/* Back of Head Hair Mass */}
                <path
                  d="M 75,25 C 72,17 76,10 83,8 C 90,6 97,10 98,18 C 99,25 97,33 93,37 C 90,41 86,43 85,43 C 84,43 80,41 77,37 C 73,33 71,25 75,25 Z"
                  fill={hairColor}
                  stroke={hairStroke}
                  strokeWidth="1.2"
                />
                {/* Nape of neck */}
                <path d="M 79,42 C 83,43 87,43 91,42" stroke="#42465e" strokeWidth="1" strokeLinecap="round" />
                {/* Ears from behind */}
                <path d="M 74,31 C 72,33 72,37 74,39" stroke="#42465e" strokeWidth="1" />
                <path d="M 96,31 C 98,33 98,37 96,39" stroke="#42465e" strokeWidth="1" />
              </g>

              {/* TRAPEZIUS (UPPER & MID TRAPS - Diamond/Kite Contour) */}
              <g style={getMuscleStyle('traps')}>
                <path
                  d="M 79,43 C 83,44 87,44 91,43 C 94,51 103,55 105,60 C 97,68 90,78 85,82 C 80,78 73,68 65,60 C 67,55 76,51 79,43 Z"
                />
              </g>

              {/* REAR DELTOIDS (SHOULDERS BACK) */}
              <g style={getMuscleStyle('shoulders')}>
                {/* Left Rear Delt */}
                <path
                  d="M 64,59 C 55,59 49,68 51,79 C 56,76 62,73 66,66 Z"
                />
                {/* Right Rear Delt */}
                <path
                  d="M 106,59 C 115,59 121,68 119,79 C 114,76 108,73 104,66 Z"
                />
              </g>

              {/* LATS (LATISSIMUS DORSI - Sweeping V-Taper Wings) */}
              <g style={getMuscleStyle('lats')}>
                {/* Left Lat Wing */}
                <path
                  d="M 65,66 C 56,76 58,97 69,113 C 73,107 80,101 85,84 C 77,74 71,68 65,66 Z"
                />
                {/* Right Lat Wing */}
                <path
                  d="M 105,66 C 114,76 112,97 101,113 C 97,107 90,101 85,84 C 93,74 99,68 105,66 Z"
                />
              </g>

              {/* TRICEPS (HORSESHOE TRICEPS - Lateral & Long Heads) */}
              <g style={getMuscleStyle('triceps')}>
                {/* Left Tricep */}
                <path
                  d="M 51,79 C 45,85 46,99 53,105 C 55,99 57,93 56,82 Z"
                />
                {/* Right Tricep */}
                <path
                  d="M 119,79 C 125,85 124,99 117,105 C 115,99 113,93 114,82 Z"
                />
              </g>

              {/* FOREARMS (BACK - Extensors) */}
              <g style={getMuscleStyle('forearms')}>
                {/* Left Forearm Back */}
                <path
                  d="M 53,107 C 47,114 44,130 47,143 C 51,138 54,124 55,111 Z"
                />
                {/* Right Forearm Back */}
                <path
                  d="M 117,107 C 123,114 126,130 123,143 C 119,138 116,124 115,111 Z"
                />
              </g>

              {/* HANDS BACK */}
              <g id="human-hands-back">
                <path
                  d="M 47,144 C 44,147 38,154 34,161 C 32,165 35,168 39,165 C 42,162 44,155 47,150 C 48,156 50,158 52,154 C 53,150 51,146 49,144 Z"
                  fill="#252737"
                  stroke="#393d52"
                  strokeWidth="0.9"
                />
                <path
                  d="M 123,144 C 126,147 132,154 136,161 C 138,165 135,168 131,165 C 128,162 126,155 123,150 C 122,156 120,158 118,154 C 117,150 119,146 121,144 Z"
                  fill="#252737"
                  stroke="#393d52"
                  strokeWidth="0.9"
                />
              </g>

              {/* LOWER BACK (ERECTOR SPINAE) */}
              <g style={getMuscleStyle('lower_back')}>
                <path
                  d="M 73,112 C 77,110 82,110 84,111 C 84,130 75,130 73,124 Z"
                />
                <path
                  d="M 97,112 C 93,110 88,110 86,111 C 86,130 95,130 97,124 Z"
                />
              </g>

              {/* GLUTES (GLUTEUS MAXIMUS - Full Anatomical Curves) */}
              <g style={getMuscleStyle('glutes')}>
                {/* Left Glute */}
                <path
                  d="M 69,129 C 63,139 67,153 82,153 C 84,146 84,136 84,129 Z"
                />
                {/* Right Glute */}
                <path
                  d="M 101,129 C 107,139 103,153 88,153 C 86,146 86,136 86,129 Z"
                />
              </g>

              {/* HAMSTRINGS (Biceps Femoris & Semitendinosus) */}
              <g style={getMuscleStyle('hamstrings')}>
                {/* Left Hamstring */}
                <path
                  d="M 69,155 C 62,168 64,190 70,201 C 76,194 82,179 82,155 Z"
                />
                {/* Right Hamstring */}
                <path
                  d="M 101,155 C 108,168 106,190 100,201 C 94,194 88,179 88,155 Z"
                />
              </g>

              {/* BACK OF KNEES (Popliteal Fossa) */}
              <path d="M 68,203 C 73,204 77,204 81,203" stroke="#393d52" strokeWidth="0.8" strokeLinecap="round" />
              <path d="M 89,203 C 93,204 97,204 102,203" stroke="#393d52" strokeWidth="0.8" strokeLinecap="round" />

              {/* CALVES (BACK - Twin Gastrocnemius Bellies & Achilles Tendon) */}
              <g style={getMuscleStyle('calves')}>
                {/* Left Calf Bellies */}
                <path
                  d="M 67,207 C 59,217 60,239 65,257 C 70,249 74,233 74,218 C 74,210 71,207 67,207 Z"
                />
                {/* Right Calf Bellies */}
                <path
                  d="M 103,207 C 111,217 110,239 105,257 C 100,249 96,233 96,218 C 96,210 99,207 103,207 Z"
                />
              </g>

              {/* HEELS & ACHILLES */}
              <g id="human-heels-back">
                {/* Left Heel */}
                <path
                  d="M 65,258 C 64,266 59,275 51,277 C 49,278 51,281 57,280 C 65,279 70,272 70,263 Z"
                  fill="#252737"
                  stroke="#393d52"
                  strokeWidth="0.9"
                />
                {/* Right Heel */}
                <path
                  d="M 105,258 C 106,266 111,275 119,277 C 121,278 119,281 113,280 C 105,279 100,272 100,263 Z"
                  fill="#252737"
                  stroke="#393d52"
                  strokeWidth="0.9"
                />
              </g>
            </svg>
            <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-1">
              Back View
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
