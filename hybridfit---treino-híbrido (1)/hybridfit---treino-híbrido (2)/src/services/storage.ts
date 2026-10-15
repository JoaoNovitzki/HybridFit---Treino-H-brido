import {
  HybridFitData,
  UserSettings,
  WorkoutDayPlan,
  WorkoutSession,
  WeightLog,
  ExerciseRecord,
} from '../types/fitness';
import { DEFAULT_WORKOUT_PLANS } from '../data/defaultPlans';

const STORAGE_KEY = 'hybridfit_app_data_v1';
const ACTIVE_SESSION_KEY = 'hybridfit_active_session_v1';

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Atleta',
  defaultWorkoutDurationMin: 40,
  defaultRestTimerSeconds: 60,
  autoStartRestTimer: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

export function getDefaultAppData(): HybridFitData {
  return {
    version: 1,
    settings: DEFAULT_SETTINGS,
    plans: DEFAULT_WORKOUT_PLANS,
    sessions: [],
    weightLogs: [],
    activeSession: null,
  };
}

export function loadAppData(): HybridFitData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultAppData();
      saveAppData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    // Validate required fields
    return {
      version: parsed.version || 1,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      plans: Array.isArray(parsed.plans) && parsed.plans.length === 7 ? parsed.plans : DEFAULT_WORKOUT_PLANS,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      weightLogs: Array.isArray(parsed.weightLogs) ? parsed.weightLogs : [],
      activeSession: getActiveSession(),
    };
  } catch (err) {
    console.error('Error loading HybridFit data from localStorage:', err);
    return getDefaultAppData();
  }
}

export function saveAppData(data: HybridFitData): void {
  try {
    const { activeSession, ...dataToPersist } = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToPersist));
  } catch (err) {
    console.error('Error saving HybridFit data to localStorage:', err);
  }
}

export function getStorageStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { totalSessions: 0, totalWeights: 0, bytesUsed: 0 };
    const parsed = JSON.parse(raw);
    return {
      totalSessions: Array.isArray(parsed.sessions) ? parsed.sessions.length : 0,
      totalWeights: Array.isArray(parsed.weightLogs) ? parsed.weightLogs.length : 0,
      bytesUsed: new Blob([raw]).size,
    };
  } catch {
    return { totalSessions: 0, totalWeights: 0, bytesUsed: 0 };
  }
}

export function saveActiveSession(session: WorkoutSession | null): void {
  try {
    if (session) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch (err) {
    console.error('Error saving active session:', err);
  }
}

export function getActiveSession(): WorkoutSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading active session:', err);
    return null;
  }
}

/**
 * Derives previous performance records for an exercise across all completed historical sessions
 */
export function getExerciseRecord(
  exerciseId: string,
  exerciseName: string,
  sessions: WorkoutSession[]
): ExerciseRecord | null {
  // Sort sessions chronologically descending
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
  );

  let lastWeightKg: number | null = null;
  let lastReps: number | null = null;
  let lastDate: string = '';

  let maxWeightKg = 0;
  let maxWeightReps = 0;
  let maxDate = '';

  for (const session of sortedSessions) {
    // Match by ID or clean name
    const foundEx = session.exercises.find(
      (e) => e.exerciseId === exerciseId || e.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    );

    if (foundEx && foundEx.sets && foundEx.sets.length > 0) {
      for (const set of foundEx.sets) {
        if (set.completed && set.weightKg !== null && set.weightKg > 0 && set.reps !== null && set.reps > 0) {
          // Set last recorded set if not yet found
          if (lastWeightKg === null) {
            lastWeightKg = set.weightKg;
            lastReps = set.reps;
            lastDate = session.finishedAt;
          }

          // Check personal record (PR)
          if (set.weightKg > maxWeightKg) {
            maxWeightKg = set.weightKg;
            maxWeightReps = set.reps;
            maxDate = session.finishedAt;
          } else if (set.weightKg === maxWeightKg && set.reps > maxWeightReps) {
            maxWeightReps = set.reps;
            maxDate = session.finishedAt;
          }
        }
      }
    }
  }

  if (lastWeightKg === null) {
    return null;
  }

  return {
    exerciseId,
    exerciseName,
    lastWeightKg,
    lastReps: lastReps ?? 0,
    lastDate,
    maxWeightKg,
    maxWeightReps,
    maxDate,
  };
}

export function exportBackupJSON(data: HybridFitData): string {
  return JSON.stringify(data, null, 2);
}

export function downloadBackupFile(data: HybridFitData): void {
  const json = exportBackupJSON(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `hybridfit-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateAndImportJSON(jsonStr: string): { success: boolean; data?: HybridFitData; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'O arquivo não contém um objeto JSON válido.' };
    }

    if (!Array.isArray(parsed.plans) || parsed.plans.length !== 7) {
      return { success: false, error: 'A estrutura de planos de treino está corrompida ou incompleta.' };
    }

    const validatedData: HybridFitData = {
      version: parsed.version || 1,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      plans: parsed.plans,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      weightLogs: Array.isArray(parsed.weightLogs) ? parsed.weightLogs : [],
      activeSession: parsed.activeSession || null,
    };

    saveAppData(validatedData);
    return { success: true, data: validatedData };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao processar arquivo JSON.' };
  }
}
