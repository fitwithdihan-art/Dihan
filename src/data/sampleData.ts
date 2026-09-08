import { PersonalRecord, WorkoutSession } from '../types';

export const INITIAL_PRS: PersonalRecord[] = [
  {
    id: 'pr_pullup_reps',
    exerciseId: 'standard_pull_up',
    exerciseName: 'Standard Pull-Up',
    recordType: 'max_reps',
    value: 12,
    achievedAt: Date.now() - 86400000 * 2, // 2 days ago
  },
  {
    id: 'pr_dip_reps',
    exerciseId: 'parallel_bar_dip',
    exerciseName: 'Parallel Bar Dip',
    recordType: 'max_reps',
    value: 16,
    achievedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'pr_pullup_weight',
    exerciseId: 'standard_pull_up',
    exerciseName: 'Weighted Pull-Up',
    recordType: 'max_weight_reps',
    value: 15, // +15kg
    secondaryValue: 5, // 5 reps
    achievedAt: Date.now() - 86400000 * 6,
  },
  {
    id: 'pr_lsit_hold',
    exerciseId: 'l_sit_hold',
    exerciseName: 'L-Sit Hold',
    recordType: 'max_hold',
    value: 22, // 22 seconds
    achievedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'pr_handstand_hold',
    exerciseId: 'wall_handstand_hold',
    exerciseName: 'Chest-to-Wall Handstand',
    recordType: 'max_hold',
    value: 45, // 45 seconds
    achievedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'pr_pushup_reps',
    exerciseId: 'standard_push_up',
    exerciseName: 'Standard Push-Up',
    recordType: 'max_reps',
    value: 28,
    achievedAt: Date.now() - 86400000 * 8,
  },
];

export const INITIAL_SESSIONS: WorkoutSession[] = [
  {
    id: 'session_sample_1',
    routineId: 'routine_rr',
    routineTitle: 'The Recommended Routine (Full Body)',
    startTime: Date.now() - 86400000 * 2 - 3600000,
    endTime: Date.now() - 86400000 * 2,
    durationSeconds: 3120, // 52 mins
    rating: 5,
    notes: 'Felt incredible on pull-ups today! Hit 12 reps on first set for a new personal record. Clean L-sit compression.',
    totalVolumeReps: 114,
    totalHoldSeconds: 48,
    totalSetsCompleted: 15,
    prsAchieved: ['12 Reps on Standard Pull-Up'],
    exercises: [
      {
        exerciseId: 'standard_pull_up',
        sets: [
          { id: 's1', setNumber: 1, type: 'normal', targetRepsOrSecs: 8, completedRepsOrSecs: 12, isCompleted: true, rpe: 9 },
          { id: 's2', setNumber: 2, type: 'normal', targetRepsOrSecs: 8, completedRepsOrSecs: 9, isCompleted: true, rpe: 9 },
          { id: 's3', setNumber: 3, type: 'normal', targetRepsOrSecs: 8, completedRepsOrSecs: 8, isCompleted: true, rpe: 9.5 },
        ],
      },
      {
        exerciseId: 'parallel_bar_dip',
        sets: [
          { id: 's4', setNumber: 1, type: 'normal', targetRepsOrSecs: 8, completedRepsOrSecs: 10, isCompleted: true, rpe: 8 },
          { id: 's5', setNumber: 2, type: 'normal', targetRepsOrSecs: 8, completedRepsOrSecs: 10, isCompleted: true, rpe: 8.5 },
          { id: 's6', setNumber: 3, type: 'normal', targetRepsOrSecs: 8, completedRepsOrSecs: 9, isCompleted: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'full_pistol_squat',
        sets: [
          { id: 's7', setNumber: 1, type: 'normal', targetRepsOrSecs: 6, completedRepsOrSecs: 6, isCompleted: true, rpe: 8 },
          { id: 's8', setNumber: 2, type: 'normal', targetRepsOrSecs: 6, completedRepsOrSecs: 6, isCompleted: true, rpe: 8.5 },
          { id: 's9', setNumber: 3, type: 'normal', targetRepsOrSecs: 6, completedRepsOrSecs: 6, isCompleted: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'l_sit_hold',
        sets: [
          { id: 's10', setNumber: 1, type: 'normal', targetRepsOrSecs: 15, completedRepsOrSecs: 18, isCompleted: true, rpe: 8.5 },
          { id: 's11', setNumber: 2, type: 'normal', targetRepsOrSecs: 15, completedRepsOrSecs: 15, isCompleted: true, rpe: 9 },
          { id: 's12', setNumber: 3, type: 'normal', targetRepsOrSecs: 15, completedRepsOrSecs: 15, isCompleted: true, rpe: 9.5 },
        ],
      },
      {
        exerciseId: 'standard_push_up',
        sets: [
          { id: 's13', setNumber: 1, type: 'normal', targetRepsOrSecs: 12, completedRepsOrSecs: 14, isCompleted: true, rpe: 7 },
          { id: 's14', setNumber: 2, type: 'normal', targetRepsOrSecs: 12, completedRepsOrSecs: 12, isCompleted: true, rpe: 8 },
          { id: 's15', setNumber: 3, type: 'normal', targetRepsOrSecs: 12, completedRepsOrSecs: 12, isCompleted: true, rpe: 8.5 },
        ],
      },
    ],
  },
  {
    id: 'session_sample_2',
    routineId: 'routine_skills_statics',
    routineTitle: 'Skill & Statics Mastery',
    startTime: Date.now() - 86400000 * 4 - 2800000,
    endTime: Date.now() - 86400000 * 4,
    durationSeconds: 2640, // 44 mins
    rating: 4,
    notes: 'Good handstand line against the wall. Tuck front lever holds felt solid for 12 seconds with flat back.',
    totalVolumeReps: 48,
    totalHoldSeconds: 156,
    totalSetsCompleted: 14,
    prsAchieved: [],
    exercises: [
      {
        exerciseId: 'wall_handstand_hold',
        sets: [
          { id: 's20', setNumber: 1, type: 'normal', targetRepsOrSecs: 30, completedRepsOrSecs: 35, isCompleted: true },
          { id: 's21', setNumber: 2, type: 'normal', targetRepsOrSecs: 30, completedRepsOrSecs: 30, isCompleted: true },
          { id: 's22', setNumber: 3, type: 'normal', targetRepsOrSecs: 30, completedRepsOrSecs: 30, isCompleted: true },
        ],
      },
      {
        exerciseId: 'tuck_front_lever',
        sets: [
          { id: 's23', setNumber: 1, type: 'normal', targetRepsOrSecs: 12, completedRepsOrSecs: 12, isCompleted: true },
          { id: 's24', setNumber: 2, type: 'normal', targetRepsOrSecs: 12, completedRepsOrSecs: 12, isCompleted: true },
          { id: 's25', setNumber: 3, type: 'normal', targetRepsOrSecs: 12, completedRepsOrSecs: 11, isCompleted: true },
        ],
      },
      {
        exerciseId: 'pseudo_planche_push_up',
        sets: [
          { id: 's26', setNumber: 1, type: 'normal', targetRepsOrSecs: 8, completedRepsOrSecs: 8, isCompleted: true },
          { id: 's27', setNumber: 2, type: 'normal', targetRepsOrSecs: 8, completedRepsOrSecs: 8, isCompleted: true },
          { id: 's28', setNumber: 3, type: 'normal', targetRepsOrSecs: 8, completedRepsOrSecs: 7, isCompleted: true },
        ],
      },
    ],
  },
];
