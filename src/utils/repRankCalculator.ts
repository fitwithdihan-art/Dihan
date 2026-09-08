import { Exercise, MeasurementType } from '../types';
import { BadgeTier, TIER_CONFIG } from './rankService';

export interface TierBenchmark {
  tier: BadgeTier;
  minRepsOrSecs: number;
  maxRepsOrSecs: number;
  rankTitle: string;
  percentile: number;
  description: string;
}

export interface CalculatedRepRank {
  exerciseId: string;
  exerciseName: string;
  category: string;
  type: MeasurementType;
  repsOrSeconds: number;
  effectiveScore: number;
  addedWeightKg?: number;
  strictForm: boolean;
  tier: BadgeTier;
  rankTitle: string;
  percentile: number;
  badgeConfig: (typeof TIER_CONFIG)[BadgeTier];
  tierIndex: number; // 0 to 7
  allBenchmarks: TierBenchmark[];
  nextTier?: {
    tier: BadgeTier;
    rankTitle: string;
    repsNeeded: number;
    diffReps: number;
  };
  coachingTip: string;
}

// Preset benchmark profiles for prominent calisthenics movements
const EXERCISE_BENCHMARKS: Record<string, { reps: [number, number, number, number, number, number, number, number]; titles: string[]; tip: string }> = {
  pull_up: {
    reps: [1, 4, 8, 14, 20, 26, 33, 40],
    titles: [
      'Novice Bar Gripper',
      'Bronze Pull Apprentice',
      'Silver Pull-Up Practitioner',
      'Gold Bar Adept',
      'Platinum Elite Specialist',
      'Diamond Master of Bars',
      'Red Diamond Champion',
      'Cosmic Obsidian Pull-Up Legend',
    ],
    tip: 'Initiate from an active dead hang, retract scapulae smoothly, and drive elbows down until chin clears the bar with zero kipping.',
  },
  standard_push_up: {
    reps: [1, 10, 25, 45, 65, 85, 105, 125],
    titles: [
      'Novice Floor Striker',
      'Bronze Push Apprentice',
      'Silver Push-Up Practitioner',
      'Gold Chest & Core Adept',
      'Platinum Push-Up Specialist',
      'Diamond Floor Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Push Legend',
    ],
    tip: 'Maintain posterior pelvic tilt (hollow body), tuck elbows at 45 degrees, and lock out with full scapular protraction at the apex.',
  },
  dip: {
    reps: [1, 5, 15, 25, 40, 55, 70, 85],
    titles: [
      'Novice Dip Initiate',
      'Bronze Dip Apprentice',
      'Silver Parallel Practitioner',
      'Gold Bar Adept',
      'Platinum Dip Specialist',
      'Diamond Triceps Master',
      'Red Diamond Dip Champion',
      'Cosmic Obsidian Dip Legend',
    ],
    tip: 'Lean slightly forward to recruit upper chest and delts; hit full 90-degree depth without flaring elbows out excessively.',
  },
  muscle_up: {
    reps: [0, 1, 3, 6, 10, 15, 20, 25],
    titles: [
      'Transition Seeker',
      'Bronze Muscle-Up Initiate',
      'Silver Bar Practitioner',
      'Gold Clean Muscle Adept',
      'Platinum High-Pull Specialist',
      'Diamond Bar Dominator',
      'Red Diamond Grandmaster',
      'Cosmic Obsidian Muscle-Up God',
    ],
    tip: 'Focus on explosive c-curve hollow body pull toward the sternum, aggressive head snap over the bar, and instant transition.',
  },
  handstand_push_up: {
    reps: [1, 3, 6, 10, 15, 20, 26, 32],
    titles: [
      'Novice Inverted Presser',
      'Bronze Handstand Apprentice',
      'Silver Inverted Practitioner',
      'Gold Overhead Adept',
      'Platinum Inversion Specialist',
      'Diamond Vertical Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Inversion Legend',
    ],
    tip: 'Create a tripod shape at the bottom between your head and hands; brace your glutes and press through the palms to lock out.',
  },
  pistol_squat: {
    reps: [1, 4, 8, 15, 22, 30, 40, 50],
    titles: [
      'Novice Balance Stepper',
      'Bronze Pistol Apprentice',
      'Silver Unilateral Practitioner',
      'Gold Leg Stability Adept',
      'Platinum Pistol Specialist',
      'Diamond Single-Leg Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Quad Titan',
    ],
    tip: 'Keep arms reached forward for counterbalance, drive knee outward over toes, and maintain ankle dorsiflexion flexibility.',
  },
  l_sit: {
    reps: [3, 8, 18, 30, 45, 65, 85, 110],
    titles: [
      'Novice Tuck Holder',
      'Bronze L-Sit Apprentice',
      'Silver Compression Practitioner',
      'Gold Straight Leg Adept',
      'Platinum Core Specialist',
      'Diamond Static Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Iron Core Legend',
    ],
    tip: 'Depress shoulders strongly through parallel bars or floor, point toes, and flex quads to lock knees completely straight.',
  },
  front_lever: {
    reps: [3, 6, 12, 20, 30, 45, 60, 80],
    titles: [
      'Novice Tuck Lever',
      'Bronze Lever Apprentice',
      'Silver Straddle Practitioner',
      'Gold Horizontal Adept',
      'Platinum Tension Specialist',
      'Diamond Lever Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Gravity Defier',
    ],
    tip: 'Drive straight arms downward like a straight-arm lat pulldown, engage posterior chain, and keep hips level with shoulders.',
  },
  hanging_leg_raise: {
    reps: [1, 6, 12, 20, 30, 42, 55, 70],
    titles: [
      'Novice Core Striker',
      'Bronze Compression Apprentice',
      'Silver Leg Raise Practitioner',
      'Gold Toes-to-Bar Adept',
      'Platinum Core Specialist',
      'Diamond Abdominal Master',
      'Red Diamond Core Champion',
      'Cosmic Obsidian Midsection Titan',
    ],
    tip: 'Avoid swinging from hips; lift with lower abs and hip flexors, curling the pelvis upward to touch toes directly to the bar.',
  },
  chin_up: {
    reps: [1, 5, 10, 16, 22, 28, 35, 42],
    titles: [
      'Novice Underhand Puller',
      'Bronze Chin-Up Apprentice',
      'Silver Biceps Practitioner',
      'Gold Chin-Up Adept',
      'Platinum Supinated Specialist',
      'Diamond Bar Champion',
      'Red Diamond Grandmaster',
      'Cosmic Obsidian Chin Legend',
    ],
    tip: 'Supinated grip with full dead hang at the bottom; drive elbows back and touch chest to the bar with controlled descent.',
  },
  pike_push_up: {
    reps: [1, 6, 14, 22, 32, 44, 56, 70],
    titles: [
      'Novice Pike Initiate',
      'Bronze Shoulder Apprentice',
      'Silver Overhead Practitioner',
      'Gold Pike Adept',
      'Platinum Deltoid Specialist',
      'Diamond Inverted Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Shoulder Titan',
    ],
    tip: 'Keep hips high in a tight inverted V shape, gaze slightly forward, and track elbows backward to load the anterior deltoids.',
  },
  planche: {
    reps: [2, 5, 10, 18, 28, 40, 55, 75],
    titles: [
      'Novice Lean Holder',
      'Bronze Tuck Planche Apprentice',
      'Silver Advanced Tuck Practitioner',
      'Gold Straddle Planche Adept',
      'Platinum Straight-Arm Specialist',
      'Diamond Full Planche Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Anti-Gravity Legend',
    ],
    tip: 'Protracted and depressed scapulae with locked straight elbows; lean shoulders well past the wrists with glutes squeezed.',
  },
  australian_pull_up: {
    reps: [1, 10, 20, 32, 45, 60, 75, 95],
    titles: [
      'Novice Horizontal Puller',
      'Bronze Row Apprentice',
      'Silver Inverted Practitioner',
      'Gold Back Thickness Adept',
      'Platinum Bodyweight Row Specialist',
      'Diamond Rhomboid Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Horizontal Row Titan',
    ],
    tip: 'Maintain a rigid straight plank line through heels and neck; touch low sternum to bar with full scapular retraction.',
  },
  wall_handstand: {
    reps: [5, 15, 30, 45, 60, 90, 120, 180],
    titles: [
      'Novice Wall Stacker',
      'Bronze Inversion Apprentice',
      'Silver Handstand Practitioner',
      'Gold Overhead Adept',
      'Platinum Balance Specialist',
      'Diamond Vertical Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Inversion God',
    ],
    tip: 'Elevate scapulae completely (push the ground away), tuck ribs, point toes upward, and grip the floor with fingertips.',
  },
  bulgarian_split_squat: {
    reps: [1, 8, 16, 26, 38, 50, 65, 80],
    titles: [
      'Novice Unilateral Stepper',
      'Bronze Split Squat Apprentice',
      'Silver Leg Balance Practitioner',
      'Gold Quad Stability Adept',
      'Platinum Unilateral Specialist',
      'Diamond Single-Leg Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Leg Titan',
    ],
    tip: 'Elevate rear foot on a bench, keep torso upright, and descend until front quad is parallel with deep hip flexor stretch.',
  },
  diamond_push_up: {
    reps: [1, 8, 18, 30, 45, 60, 75, 95],
    titles: [
      'Novice Diamond Presser',
      'Bronze Diamond Apprentice',
      'Silver Triceps Practitioner',
      'Gold Diamond Adept',
      'Platinum Inner-Chest Specialist',
      'Diamond Lockout Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Diamond Legend',
    ],
    tip: 'Form a triangle index and thumbs under chest center; keep elbows tracking back alongside ribcage.',
  },
  archer_push_up: {
    reps: [1, 4, 8, 14, 20, 28, 36, 45],
    titles: [
      'Novice Archer Presser',
      'Bronze Wing Apprentice',
      'Silver Archer Practitioner',
      'Gold Unilateral Adept',
      'Platinum Asymmetric Specialist',
      'Diamond Lateral Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Archer Titan',
    ],
    tip: 'Keep the straight assist arm completely extended, descend deep on the pressing side, and push powerfully through the floor.',
  },
  one_arm_push_up: {
    reps: [1, 3, 6, 10, 16, 22, 30, 40],
    titles: [
      'Novice Single-Arm Striker',
      'Bronze One-Arm Apprentice',
      'Silver Unilateral Practitioner',
      'Gold Anti-Rotation Adept',
      'Platinum Single-Arm Specialist',
      'Diamond Unilateral Master',
      'Red Diamond Champion',
      'Cosmic Obsidian One-Arm God',
    ],
    tip: 'Spread feet wider than shoulder-width, keep shoulders parallel to the floor to resist rotation, and press through palm center.',
  },
  pseudo_planche_push_up: {
    reps: [1, 5, 10, 18, 28, 38, 50, 65],
    titles: [
      'Novice Lean Presser',
      'Bronze PPPU Apprentice',
      'Silver Planche Practitioner',
      'Gold Forward-Torque Adept',
      'Platinum Straight-Arm Prep Specialist',
      'Diamond PPPU Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Planche Titan',
    ],
    tip: 'Turn hands out 45 degrees, lean shoulders far ahead of wrists, and push into full scapular protraction at the top.',
  },
  explosive_clapping_push_up: {
    reps: [1, 4, 10, 18, 26, 36, 48, 60],
    titles: [
      'Novice Pop Striker',
      'Bronze Clap Initiate',
      'Silver Airborne Practitioner',
      'Gold Plyometric Adept',
      'Platinum Explosive Specialist',
      'Diamond Power Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Plyo Legend',
    ],
    tip: 'Explode with maximal acceleration from the bottom, snap hands together quickly, and absorb landing with elastic arms.',
  },
  ring_push_up: {
    reps: [1, 6, 14, 24, 36, 50, 65, 80],
    titles: [
      'Novice Suspended Presser',
      'Bronze Ring Apprentice',
      'Silver Instability Practitioner',
      'Gold Ring Adept',
      'Platinum RTO Specialist',
      'Diamond Ring Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Ring Titan',
    ],
    tip: 'Turn rings out 45° at lockout (RTO), descend until thumbs touch armpits, and actively fight shaking throughout.',
  },
  hand_release_push_up: {
    reps: [1, 8, 18, 32, 48, 65, 80, 100],
    titles: [
      'Novice Deadstop Presser',
      'Bronze Hand-Release Apprentice',
      'Silver Military Practitioner',
      'Gold Deadstop Adept',
      'Platinum Combat Specialist',
      'Diamond Zero-Momentum Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Deadstop Legend',
    ],
    tip: 'Lift hands fully off the floor at the bottom to kill elastic momentum, then drive upward with rigid hollow body plank.',
  },
  decline_push_up: {
    reps: [1, 8, 20, 36, 52, 70, 90, 110],
    titles: [
      'Novice Inverted Presser',
      'Bronze Decline Apprentice',
      'Silver Upper-Pec Practitioner',
      'Gold Incline Angle Adept',
      'Platinum Clavicular Specialist',
      'Diamond Upper-Chest Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Decline Titan',
    ],
    tip: 'Elevate feet 12-24 inches, lock core tight in a hollow body to prevent lumbar sag, and lock out with full protraction.',
  },
  archer_pull_up: {
    reps: [1, 3, 6, 10, 16, 22, 30, 40],
    titles: [
      'Novice Wing Puller',
      'Bronze Archer Pull Apprentice',
      'Silver Asymmetric Practitioner',
      'Gold Archer Adept',
      'Platinum Unilateral Specialist',
      'Diamond Archer Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Archer Titan',
    ],
    tip: 'Roll the straight arm over the bar, pull chin cleanly to the working hand, and lower with smooth control.',
  },
  one_arm_pull_up: {
    reps: [1, 2, 4, 7, 11, 15, 20, 26],
    titles: [
      'Novice Single-Arm Seeker',
      'Bronze OAP Initiate',
      'Silver One-Arm Practitioner',
      'Gold OAP Adept',
      'Platinum Single-Arm Specialist',
      'Diamond One-Arm Master',
      'Red Diamond Champion',
      'Cosmic Obsidian One-Arm God',
    ],
    tip: 'Start from strict deadhang without swinging, drive lat violently, and pull chin clearly over the bar.',
  },
  one_arm_chin_up: {
    reps: [1, 2, 5, 8, 12, 16, 22, 28],
    titles: [
      'Novice Single-Arm Puller',
      'Bronze OAC Initiate',
      'Silver Supinated Practitioner',
      'Gold OAC Adept',
      'Platinum Single-Arm Specialist',
      'Diamond One-Arm Chin Master',
      'Red Diamond Champion',
      'Cosmic Obsidian OAC Legend',
    ],
    tip: 'Supinated grip, pack the active shoulder immediately from deadhang, and drive elbow tight to ribs.',
  },
  chest_to_bar_pull_up: {
    reps: [1, 4, 8, 14, 20, 28, 36, 45],
    titles: [
      'Novice High Puller',
      'Bronze Sternum Apprentice',
      'Silver High-Pull Practitioner',
      'Gold Chest-to-Bar Adept',
      'Platinum Explosive Specialist',
      'Diamond High-Pull Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Sternum Titan',
    ],
    tip: 'Pull explosively from deadhang, drive elbows back behind ribcage, and touch sternum directly to the bar.',
  },
  l_sit_pull_up: {
    reps: [1, 3, 7, 12, 18, 24, 32, 40],
    titles: [
      'Novice L-Puller',
      'Bronze L-Sit Apprentice',
      'Silver Compression Practitioner',
      'Gold L-Pull Adept',
      'Platinum Strict Specialist',
      'Diamond L-Sit Pull Master',
      'Red Diamond Champion',
      'Cosmic Obsidian L-Pull Titan',
    ],
    tip: 'Lock legs straight at 90 degrees with pointed toes, pull chin over bar without letting hips drop.',
  },
  wide_grip_pull_up: {
    reps: [1, 4, 8, 13, 19, 25, 32, 40],
    titles: [
      'Novice Wide Grip Puller',
      'Bronze Wing Apprentice',
      'Silver Wide Lat Practitioner',
      'Gold Teres Adept',
      'Platinum Wide Grip Specialist',
      'Diamond Lat Master',
      'Red Diamond Champion',
      'Cosmic Obsidian Wide Pull Legend',
    ],
    tip: 'Grip 1.5x shoulder width, pull elbows straight down to ribcage, and focus purely on outer lat contraction.',
  },
};

export const TIERS_IN_ORDER: BadgeTier[] = [
  'copper',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'red_diamond',
  'cosmic_obsidian',
];

export const TIER_PERCENTILES: Record<BadgeTier, number> = {
  copper: 35,
  bronze: 55,
  silver: 75,
  gold: 88,
  platinum: 95,
  diamond: 98,
  red_diamond: 99.3,
  cosmic_obsidian: 99.9,
};

export interface LevelUpMilestone {
  tier: BadgeTier;
  tierIndex: number;
  tierName: string;
  rankTitle: string;
  minReps: number;
  maxReps: number;
  unit: string;
  repsToLevelUpFromPrev: number;
  repsNeededFromCurrent?: number;
  isCompleted: boolean;
  isCurrentTier: boolean;
  isNextTarget: boolean;
  percentile: number;
  badgeConfig: (typeof TIER_CONFIG)[BadgeTier];
  description: string;
}

/**
 * Returns detailed step-by-step level up milestones for any movement and optional current reps.
 */
export function getMovementLevelUpMilestones(
  exercise: Exercise,
  currentReps?: number
): {
  exercise: Exercise;
  currentReps: number;
  currentTierIndex: number;
  currentTier: BadgeTier;
  milestones: LevelUpMilestone[];
  nextTargetMilestone?: LevelUpMilestone;
} {
  const benchmarks = getExerciseBenchmarks(exercise);
  const safeReps =
    typeof currentReps === 'number' && Number.isFinite(currentReps) && !Number.isNaN(currentReps)
      ? Math.max(0, currentReps)
      : 0;
  const unit = exercise.type === 'hold_seconds' ? 's' : ' reps';

  // Determine current tier
  let curIndex = 0;
  for (let i = benchmarks.length - 1; i >= 0; i--) {
    if (safeReps >= benchmarks[i].minRepsOrSecs) {
      curIndex = i;
      break;
    }
  }

  const milestones: LevelUpMilestone[] = benchmarks.map((b, idx) => {
    const prevMin = idx > 0 ? benchmarks[idx - 1].minRepsOrSecs : 0;
    const rawPrevDiff = idx > 0 ? b.minRepsOrSecs - prevMin : b.minRepsOrSecs;
    const repsToLevelUpFromPrev = Math.max(0, Number.isFinite(rawPrevDiff) ? rawPrevDiff : 0);
    const isCompleted = safeReps >= b.minRepsOrSecs;
    const isCurrentTier = idx === curIndex;
    const isNextTarget = idx === curIndex + 1;
    const rawRepsNeeded = b.minRepsOrSecs - safeReps;
    const repsNeededFromCurrent = Math.max(0, Number.isFinite(rawRepsNeeded) ? rawRepsNeeded : 0);

    return {
      tier: b.tier,
      tierIndex: idx,
      tierName: TIER_CONFIG[b.tier].name,
      rankTitle: b.rankTitle,
      minReps: b.minRepsOrSecs,
      maxReps: b.maxRepsOrSecs,
      unit,
      repsToLevelUpFromPrev,
      repsNeededFromCurrent: isCompleted ? 0 : repsNeededFromCurrent,
      isCompleted,
      isCurrentTier,
      isNextTarget,
      percentile: Number.isFinite(b.percentile) ? b.percentile : TIER_PERCENTILES[b.tier] || 50,
      badgeConfig: TIER_CONFIG[b.tier],
      description: b.description,
    };
  });

  const nextTargetMilestone = milestones[curIndex + 1] || undefined;

  return {
    exercise,
    currentReps: safeReps,
    currentTierIndex: curIndex,
    currentTier: benchmarks[curIndex].tier,
    milestones,
    nextTargetMilestone,
  };
}

/**
 * Derives the 8 benchmark thresholds for any given exercise.
 */
export function getExerciseBenchmarks(exercise: Exercise): TierBenchmark[] {
  const exKey = exercise.id.toLowerCase();
  const matchedKey = Object.keys(EXERCISE_BENCHMARKS).find((k) => exKey.includes(k));

  let thresholds: number[] = [];
  let baseTitles: string[] = [];
  let coachingTip = 'Execute clean, controlled reps with full range of motion and no momentum.';

  if (matchedKey && EXERCISE_BENCHMARKS[matchedKey]) {
    thresholds = [...EXERCISE_BENCHMARKS[matchedKey].reps];
    baseTitles = [...EXERCISE_BENCHMARKS[matchedKey].titles];
    coachingTip = EXERCISE_BENCHMARKS[matchedKey].tip;
  } else {
    // Dynamic generation based on measurement type and difficulty
    if (exercise.type === 'hold_seconds') {
      thresholds = [3, 8, 15, 25, 40, 60, 80, 105];
    } else {
      switch (exercise.difficulty) {
        case 'elite':
          thresholds = [0, 1, 3, 6, 10, 15, 20, 26];
          break;
        case 'advanced':
          thresholds = [1, 3, 7, 13, 20, 28, 36, 45];
          break;
        case 'intermediate':
          thresholds = [1, 5, 12, 22, 35, 50, 65, 80];
          break;
        case 'beginner':
        default:
          thresholds = [1, 10, 25, 45, 65, 85, 105, 125];
          break;
      }
    }

    baseTitles = [
      `Novice ${exercise.name} Initiator`,
      `Bronze ${exercise.name} Apprentice`,
      `Silver ${exercise.name} Practitioner`,
      `Gold ${exercise.name} Adept`,
      `Platinum ${exercise.name} Specialist`,
      `Diamond ${exercise.name} Master`,
      `Red Diamond ${exercise.name} Champion`,
      `Cosmic Obsidian ${exercise.name} Legend`,
    ];
  }

  return TIERS_IN_ORDER.map((tier, idx) => {
    const minVal = thresholds[idx];
    const maxVal = idx < TIERS_IN_ORDER.length - 1 ? thresholds[idx + 1] - 1 : 999;
    const unit = exercise.type === 'hold_seconds' ? 's' : ' reps';
    return {
      tier,
      minRepsOrSecs: minVal,
      maxRepsOrSecs: maxVal,
      rankTitle: baseTitles[idx] || `${TIER_CONFIG[tier].name} ${exercise.name} Athlete`,
      percentile: TIER_PERCENTILES[tier],
      description:
        idx === 7
          ? `${minVal}+${unit} (World-class master)`
          : `${minVal}-${maxVal}${unit}`,
    };
  });
}

/**
 * Calculates rank, tier, percentile, and progression for given reps/seconds.
 */
export function calculateRepRank(
  exercise: Exercise,
  rawRepsOrSeconds: number,
  options?: {
    addedWeightKg?: number;
    strictForm?: boolean;
    bodyweightKg?: number;
  }
): CalculatedRepRank {
  const addedWeight = Math.max(0, options?.addedWeightKg || 0);
  const strict = options?.strictForm ?? true;
  const userBw = Math.max(40, options?.bodyweightKg || 68);

  // Calculate weighted multiplier if weight added
  let weightMultiplier = 1;
  if (addedWeight > 0) {
    // Relative strength formula: +kg increases effective reps by proportion of bodyweight
    weightMultiplier = 1 + (addedWeight / userBw) * 1.6;
  }

  // Strict form bonus: +8% effective score for genuine dead-stop strictness
  const strictBonus = strict ? 1.08 : 1.0;

  const effectiveScore = Math.max(0, Math.round(rawRepsOrSeconds * weightMultiplier * strictBonus));

  const benchmarks = getExerciseBenchmarks(exercise);

  // Find tier matching effectiveScore
  let currentTierIndex = 0;
  for (let i = benchmarks.length - 1; i >= 0; i--) {
    if (effectiveScore >= benchmarks[i].minRepsOrSecs) {
      currentTierIndex = i;
      break;
    }
  }

  const currentBenchmark = benchmarks[currentTierIndex];
  const tier = currentBenchmark.tier;
  const rankTitle = currentBenchmark.rankTitle;

  // Calculate next tier target
  let nextTier: CalculatedRepRank['nextTier'];
  if (currentTierIndex < benchmarks.length - 1) {
    const nextBenchmark = benchmarks[currentTierIndex + 1];
    const targetScore = nextBenchmark.minRepsOrSecs;
    // Back-calculate required raw reps
    const requiredRaw = Math.ceil(targetScore / (weightMultiplier * strictBonus));
    const diffReps = Math.max(1, requiredRaw - rawRepsOrSeconds);

    nextTier = {
      tier: nextBenchmark.tier,
      rankTitle: nextBenchmark.rankTitle,
      repsNeeded: requiredRaw,
      diffReps,
    };
  }

  // Calculate fine percentile within tier
  const basePercentile = currentBenchmark.percentile;
  const nextPercentile =
    currentTierIndex < benchmarks.length - 1
      ? benchmarks[currentTierIndex + 1].percentile
      : 99.9;
  
  const tierRange = currentBenchmark.maxRepsOrSecs - currentBenchmark.minRepsOrSecs;
  const progressInTier =
    tierRange > 0
      ? Math.min(1, Math.max(0, (effectiveScore - currentBenchmark.minRepsOrSecs) / tierRange))
      : 0;

  const finePercentile = Math.min(
    99.9,
    Math.round((basePercentile + progressInTier * (nextPercentile - basePercentile)) * 10) / 10
  );

  // Determine tip
  const exKey = exercise.id.toLowerCase();
  const matchedKey = Object.keys(EXERCISE_BENCHMARKS).find((k) => exKey.includes(k));
  const coachingTip =
    matchedKey && EXERCISE_BENCHMARKS[matchedKey]
      ? EXERCISE_BENCHMARKS[matchedKey].tip
      : exercise.formCues && exercise.formCues.length > 0
      ? exercise.formCues[0]
      : 'Maintain strict scapular control, hollow core engagement, and zero momentum.';

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    category: exercise.category,
    type: exercise.type,
    repsOrSeconds: rawRepsOrSeconds,
    effectiveScore,
    addedWeightKg: addedWeight > 0 ? addedWeight : undefined,
    strictForm: strict,
    tier,
    rankTitle,
    percentile: finePercentile,
    badgeConfig: TIER_CONFIG[tier],
    tierIndex: currentTierIndex,
    allBenchmarks: benchmarks,
    nextTier,
    coachingTip,
  };
}
