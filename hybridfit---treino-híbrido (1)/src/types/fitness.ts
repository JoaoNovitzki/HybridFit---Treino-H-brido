/**
 * HybridFit Data Models & Type Definitions
 */

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

export interface ExerciseSet {
  id: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  targetReps: string; // e.g. "8-10" or "10-12"
  completed: boolean;
  completedAt?: string;
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  defaultSets: number;
  targetRepsRange: string; // e.g. "8-10"
  notes?: string;
}

export interface WorkoutExerciseExecution {
  exerciseId: string;
  exerciseName: string;
  targetMuscle: string;
  sets: ExerciseSet[];
  notes?: string;
  completed: boolean;
}

export interface CardioSession {
  enabled: boolean;
  type: string; // 'Esteira', 'Bicicleta', 'Caminhada na Rua', 'Caminhada rápida', etc.
  durationMinutes: number;
  distanceKm?: number;
  avgSpeedKmh?: number; // km/h
  avgPaceMinKm?: string; // min/km, e.g. "6:30"
  completed: boolean;
  notes?: string;
}

export interface WorkoutDayPlan {
  dayOfWeek: DayOfWeek;
  dayName: string; // "Segunda-feira", etc.
  title: string; // "Push + Cardio", "Legs", etc.
  goal: string; // "Peito, ombros e tríceps"
  estimatedDurationMin: number; // 40
  warmupMinutes: number; // 5
  strengthDurationMin?: number; // 25
  isCardioOnly?: boolean;
  isRestOptional?: boolean;
  exercises: Exercise[];
  cardioPlan?: {
    type: string;
    description: string;
    targetMinutes: number;
    intervals?: string[];
  };
}

export interface WorkoutSession {
  id: string;
  planId?: string;
  dayOfWeek: DayOfWeek;
  title: string;
  goal: string;
  startedAt: string; // ISO string
  finishedAt: string; // ISO string
  durationMinutes: number;
  exercises: WorkoutExerciseExecution[];
  cardio?: CardioSession;
  feeling?: 'otimo' | 'bom' | 'cansado' | 'dificil';
  notes?: string;
  isRestDayLogged?: boolean;
}

export interface WeightLog {
  id: string;
  date: string; // "YYYY-MM-DD"
  weightKg: number;
  notes?: string;
}

export interface ExerciseRecord {
  exerciseId: string;
  exerciseName: string;
  lastWeightKg: number;
  lastReps: number;
  lastDate: string;
  maxWeightKg: number;
  maxWeightReps: number;
  maxDate: string;
}

export interface UserSettings {
  userName: string;
  defaultWorkoutDurationMin: number;
  defaultRestTimerSeconds: number; // 60, 90, 120
  autoStartRestTimer: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface HybridFitData {
  version: number;
  settings: UserSettings;
  plans: WorkoutDayPlan[];
  sessions: WorkoutSession[];
  weightLogs: WeightLog[];
  activeSession: WorkoutSession | null;
}
