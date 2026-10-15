import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  HybridFitData,
  WorkoutDayPlan,
  WorkoutSession,
  WeightLog,
  UserSettings,
  ExerciseRecord,
  DayOfWeek,
  WorkoutExerciseExecution,
} from '../types/fitness';
import {
  loadAppData,
  saveAppData,
  saveActiveSession,
  getActiveSession,
  getExerciseRecord,
  getDefaultAppData,
  validateAndImportJSON,
} from '../services/storage';
import { DEFAULT_WORKOUT_PLANS } from '../data/defaultPlans';
import { playSuccessChime, triggerHaptic } from '../services/audio';

interface FitnessContextValue {
  data: HybridFitData;
  activeSession: WorkoutSession | null;
  todayPlan: WorkoutDayPlan;
  todayCompletedSession?: WorkoutSession;
  weeklyCompletedCount: number;
  weeklyTotalDurationMin: number;
  weeklyCompletedDays: number[]; // DayOfWeek (0 to 6)
  latestWeight: WeightLog | null;
  startWorkout: (plan: WorkoutDayPlan) => void;
  updateActiveSession: (session: WorkoutSession) => void;
  finishActiveSession: (finalSession?: WorkoutSession) => void;
  cancelActiveSession: () => void;
  logRestDay: (dayOfWeek?: DayOfWeek) => void;
  addWeightLog: (weightKg: number, date?: string, notes?: string) => void;
  deleteWeightLog: (id: string) => void;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  updateWorkoutPlans: (plans: WorkoutDayPlan[]) => void;
  resetPlansToDefault: () => void;
  resetAllData: () => void;
  importBackup: (jsonStr: string) => { success: boolean; error?: string };
  deleteSession: (id: string) => void;
  getExerciseHistory: (exerciseId: string, exerciseName: string) => ExerciseRecord | null;
  recentExerciseRecords: ExerciseRecord[];
  seedSampleHistory: () => void;
}

const FitnessContext = createContext<FitnessContextValue | null>(null);

export const FitnessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<HybridFitData>(() => loadAppData());
  const [activeSession, setActiveSessionState] = useState<WorkoutSession | null>(() => getActiveSession());

  // Keep state synced with localStorage
  const updateData = useCallback((updater: (prev: HybridFitData) => HybridFitData) => {
    setData((prev) => {
      const next = updater(prev);
      saveAppData(next);
      return next;
    });
  }, []);

  const setActiveSession = useCallback((session: WorkoutSession | null) => {
    setActiveSessionState(session);
    saveActiveSession(session);
  }, []);

  // Identify today's plan using local device time (0 = Domingo, 1 = Segunda, ...)
  const todayDayOfWeek = useMemo(() => {
    const localDay = new Date().getDay() as DayOfWeek;
    return localDay;
  }, []);

  const todayPlan = useMemo(() => {
    const found = data.plans.find((p) => p.dayOfWeek === todayDayOfWeek);
    return found || DEFAULT_WORKOUT_PLANS[todayDayOfWeek] || DEFAULT_WORKOUT_PLANS[1];
  }, [data.plans, todayDayOfWeek]);

  // Check if today already has a completed session (local calendar day check)
  const todayCompletedSession = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    return data.sessions.find((s) => {
      if (!s.finishedAt) return false;
      const sDateStr = new Date(s.finishedAt).toLocaleDateString('en-CA');
      return sDateStr === todayStr && !s.isRestDayLogged;
    });
  }, [data.sessions]);

  // Weekly stats calculation (Monday to Sunday of current week)
  const { weeklyCompletedCount, weeklyTotalDurationMin, weeklyCompletedDays } = useMemo(() => {
    const now = new Date();
    // Calculate Monday of current week
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = (currentDay + 6) % 7; // days since Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const thisWeekSessions = data.sessions.filter((s) => {
      if (!s.finishedAt) return false;
      const finishedDate = new Date(s.finishedAt);
      return finishedDate >= monday && finishedDate <= sunday && !s.isRestDayLogged;
    });

    const daysSet = new Set<number>();
    let totalMinutes = 0;

    thisWeekSessions.forEach((s) => {
      totalMinutes += s.durationMinutes || 0;
      daysSet.add(s.dayOfWeek);
    });

    return {
      weeklyCompletedCount: thisWeekSessions.length,
      weeklyTotalDurationMin: totalMinutes,
      weeklyCompletedDays: Array.from(daysSet),
    };
  }, [data.sessions]);

  // Latest weight log
  const latestWeight = useMemo(() => {
    if (!data.weightLogs.length) return null;
    const sorted = [...data.weightLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sorted[0];
  }, [data.weightLogs]);

  // Helper to get stats for a specific exercise
  const getExerciseHistory = useCallback(
    (exerciseId: string, exerciseName: string): ExerciseRecord | null => {
      return getExerciseRecord(exerciseId, exerciseName, data.sessions);
    },
    [data.sessions]
  );

  // Recent exercise records across past sessions for quick dashboard review
  const recentExerciseRecords = useMemo(() => {
    const map = new Map<string, ExerciseRecord>();
    const sortedSessions = [...data.sessions].sort(
      (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
    );

    for (const session of sortedSessions) {
      for (const ex of session.exercises) {
        if (!map.has(ex.exerciseId)) {
          const rec = getExerciseRecord(ex.exerciseId, ex.exerciseName, data.sessions);
          if (rec) {
            map.set(ex.exerciseId, rec);
          }
        }
      }
    }
    return Array.from(map.values()).slice(0, 5);
  }, [data.sessions]);

  // Start workout session
  const startWorkout = useCallback(
    (plan: WorkoutDayPlan) => {
      const exerciseExecutions: WorkoutExerciseExecution[] = plan.exercises.map((ex) => {
        // Find previous record to assist user
        const prevRecord = getExerciseRecord(ex.id, ex.name, data.sessions);

        const sets = Array.from({ length: ex.defaultSets }, (_, idx) => ({
          id: `${ex.id}-set-${idx + 1}-${Date.now()}`,
          setNumber: idx + 1,
          weightKg: prevRecord?.lastWeightKg ?? null,
          reps: prevRecord?.lastReps ?? null,
          targetReps: ex.targetRepsRange,
          completed: false, // Rule: never auto-mark completed
        }));

        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          targetMuscle: ex.targetMuscle,
          sets,
          notes: ex.notes,
          completed: false,
        };
      });

      const newSession: WorkoutSession = {
        id: `session-${Date.now()}`,
        planId: `${plan.dayOfWeek}`,
        dayOfWeek: plan.dayOfWeek,
        title: plan.title,
        goal: plan.goal,
        startedAt: new Date().toISOString(),
        finishedAt: '',
        durationMinutes: 0,
        exercises: exerciseExecutions,
        cardio: plan.cardioPlan
          ? {
              enabled: true,
              type: plan.cardioPlan.type,
              durationMinutes: plan.cardioPlan.targetMinutes,
              distanceKm: undefined,
              avgSpeedKmh: undefined,
              avgPaceMinKm: undefined,
              completed: false,
              notes: plan.cardioPlan.description,
            }
          : undefined,
      };

      setActiveSession(newSession);
    },
    [data.sessions, setActiveSession]
  );

  // Update active session in-place
  const updateActiveSession = useCallback(
    (updated: WorkoutSession) => {
      setActiveSession(updated);
    },
    [setActiveSession]
  );

  // Finish active workout
  const finishActiveSession = useCallback(
    (sessionToSave?: WorkoutSession) => {
      const session = sessionToSave || activeSession;
      if (!session) return;

      const finishTime = new Date();
      const startTime = new Date(session.startedAt);
      const calculatedDurationMin = Math.max(
        1,
        Math.round((finishTime.getTime() - startTime.getTime()) / 60000)
      );

      const finalized: WorkoutSession = {
        ...session,
        finishedAt: finishTime.toISOString(),
        durationMinutes: session.durationMinutes > 0 ? session.durationMinutes : calculatedDurationMin,
      };

      updateData((prev) => ({
        ...prev,
        sessions: [finalized, ...prev.sessions],
      }));

      setActiveSession(null);

      // Sound & Celebration
      if (data.settings.soundEnabled) {
        playSuccessChime();
      }
      if (data.settings.vibrationEnabled) {
        triggerHaptic([100, 50, 150]);
      }

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#BEF264', '#10B981', '#38BDF8', '#FFFFFF'],
        });
      } catch {
        // confetti fallback
      }
    },
    [activeSession, data.settings.soundEnabled, data.settings.vibrationEnabled, setActiveSession, updateData]
  );

  // Cancel / Abort active session
  const cancelActiveSession = useCallback(() => {
    setActiveSession(null);
  }, [setActiveSession]);

  // Log rest day (e.g. Sunday fatigue or user deliberate rest)
  const logRestDay = useCallback(
    (day?: DayOfWeek) => {
      const targetDay = day ?? todayDayOfWeek;
      const targetPlan = data.plans.find((p) => p.dayOfWeek === targetDay) || todayPlan;
      const restSession: WorkoutSession = {
        id: `rest-${Date.now()}`,
        dayOfWeek: targetDay,
        title: `Descanso / Recuperação (${targetPlan.dayName})`,
        goal: 'Dia de descanso e recuperação muscular ativa.',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMinutes: 0,
        exercises: [],
        isRestDayLogged: true,
        notes: 'Marcado descanso por fadiga ou opção de descanso programado.',
      };

      updateData((prev) => ({
        ...prev,
        sessions: [restSession, ...prev.sessions],
      }));
    },
    [data.plans, todayDayOfWeek, todayPlan, updateData]
  );

  // Weight logs
  const addWeightLog = useCallback(
    (weightKg: number, date?: string, notes?: string) => {
      const logDate = date || new Date().toLocaleDateString('en-CA');
      const newLog: WeightLog = {
        id: `weight-${Date.now()}`,
        date: logDate,
        weightKg,
        notes,
      };

      updateData((prev) => {
        // If an entry for this exact date already exists, update it, else append
        const filtered = prev.weightLogs.filter((w) => w.date !== logDate);
        return {
          ...prev,
          weightLogs: [...filtered, newLog].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
        };
      });
    },
    [updateData]
  );

  const deleteWeightLog = useCallback(
    (id: string) => {
      updateData((prev) => ({
        ...prev,
        weightLogs: prev.weightLogs.filter((w) => w.id !== id),
      }));
    },
    [updateData]
  );

  // Settings
  const updateUserSettings = useCallback(
    (newSettings: Partial<UserSettings>) => {
      updateData((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings },
      }));
    },
    [updateData]
  );

  // Update Workout Plans (without modifying historical completed sessions)
  const updateWorkoutPlans = useCallback(
    (newPlans: WorkoutDayPlan[]) => {
      updateData((prev) => ({
        ...prev,
        plans: newPlans,
      }));
    },
    [updateData]
  );

  const resetPlansToDefault = useCallback(() => {
    updateData((prev) => ({
      ...prev,
      plans: DEFAULT_WORKOUT_PLANS,
    }));
  }, [updateData]);

  const resetAllData = useCallback(() => {
    const fresh = getDefaultAppData();
    setData(fresh);
    saveAppData(fresh);
    saveActiveSession(null);
    setActiveSessionState(null);
  }, []);

  const importBackup = useCallback(
    (jsonStr: string) => {
      const res = validateAndImportJSON(jsonStr);
      if (res.success && res.data) {
        setData(res.data);
        setActiveSessionState(res.data.activeSession || null);
        return { success: true };
      }
      return { success: false, error: res.error || 'Erro na importação' };
    },
    []
  );

  const deleteSession = useCallback(
    (sessionId: string) => {
      updateData((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((s) => s.id !== sessionId),
      }));
    },
    [updateData]
  );

  const seedSampleHistory = useCallback(() => {
    const now = new Date();
    
    // Sample 1: 3 days ago - Push + Cardio
    const date1 = new Date(now);
    date1.setDate(now.getDate() - 3);
    date1.setHours(18, 30, 0, 0);

    // Sample 2: 2 days ago - Pull + Cardio
    const date2 = new Date(now);
    date2.setDate(now.getDate() - 2);
    date2.setHours(19, 0, 0, 0);

    // Sample 3: Yesterday - Legs
    const date3 = new Date(now);
    date3.setDate(now.getDate() - 1);
    date3.setHours(18, 15, 0, 0);

    const sampleSessions: WorkoutSession[] = [
      {
        id: `sample-session-3-${Date.now()}`,
        dayOfWeek: 4,
        title: 'Legs',
        goal: 'Pernas completas',
        startedAt: new Date(date3.getTime() - 42 * 60000).toISOString(),
        finishedAt: date3.toISOString(),
        durationMinutes: 42,
        exercises: [
          {
            exerciseId: 'legs-leg-press',
            exerciseName: 'Leg press',
            targetMuscle: 'Quadríceps e Glúteos',
            completed: true,
            sets: [
              { id: 's1', setNumber: 1, weightKg: 160, reps: 10, targetReps: '8-10', completed: true },
              { id: 's2', setNumber: 2, weightKg: 180, reps: 8, targetReps: '8-10', completed: true },
            ],
          },
          {
            exerciseId: 'legs-cadeira-extensora',
            exerciseName: 'Cadeira extensora',
            targetMuscle: 'Quadríceps',
            completed: true,
            sets: [
              { id: 's3', setNumber: 1, weightKg: 45, reps: 12, targetReps: '10-12', completed: true },
              { id: 's4', setNumber: 2, weightKg: 50, reps: 10, targetReps: '10-12', completed: true },
            ],
          },
          {
            exerciseId: 'legs-mesa-flexora',
            exerciseName: 'Mesa flexora',
            targetMuscle: 'Isquiotibiais',
            completed: true,
            sets: [
              { id: 's5', setNumber: 1, weightKg: 40, reps: 12, targetReps: '10-12', completed: true },
              { id: 's6', setNumber: 2, weightKg: 40, reps: 11, targetReps: '10-12', completed: true },
            ],
          },
        ],
      },
      {
        id: `sample-session-2-${Date.now()}`,
        dayOfWeek: 2,
        title: 'Pull + Cardio',
        goal: 'Costas e bíceps',
        startedAt: new Date(date2.getTime() - 38 * 60000).toISOString(),
        finishedAt: date2.toISOString(),
        durationMinutes: 38,
        exercises: [
          {
            exerciseId: 'pull-puxada-alta',
            exerciseName: 'Puxada alta',
            targetMuscle: 'Dorsais / Costas',
            completed: true,
            sets: [
              { id: 's7', setNumber: 1, weightKg: 50, reps: 10, targetReps: '8-10', completed: true },
              { id: 's8', setNumber: 2, weightKg: 55, reps: 8, targetReps: '8-10', completed: true },
            ],
          },
          {
            exerciseId: 'pull-remada-articulada',
            exerciseName: 'Remada articulada',
            targetMuscle: 'Meio das costas',
            completed: true,
            sets: [
              { id: 's9', setNumber: 1, weightKg: 40, reps: 10, targetReps: '8-10', completed: true },
              { id: 's10', setNumber: 2, weightKg: 45, reps: 9, targetReps: '8-10', completed: true },
            ],
          },
          {
            exerciseId: 'pull-rosca-direta',
            exerciseName: 'Rosca direta',
            targetMuscle: 'Bíceps',
            completed: true,
            sets: [
              { id: 's11', setNumber: 1, weightKg: 12, reps: 10, targetReps: '8-12', completed: true },
              { id: 's12', setNumber: 2, weightKg: 14, reps: 8, targetReps: '8-12', completed: true },
            ],
          },
        ],
        cardio: {
          enabled: true,
          type: 'Bicicleta',
          durationMinutes: 10,
          distanceKm: 3.2,
          avgSpeedKmh: 19.2,
          completed: true,
        },
      },
      {
        id: `sample-session-1-${Date.now()}`,
        dayOfWeek: 1,
        title: 'Push + Cardio',
        goal: 'Peito, ombros e tríceps',
        startedAt: new Date(date1.getTime() - 40 * 60000).toISOString(),
        finishedAt: date1.toISOString(),
        durationMinutes: 40,
        exercises: [
          {
            exerciseId: 'push-supino-reto',
            exerciseName: 'Supino reto (máquina ou barra)',
            targetMuscle: 'Peito',
            completed: true,
            sets: [
              { id: 's13', setNumber: 1, weightKg: 30, reps: 10, targetReps: '8-10', completed: true },
              { id: 's14', setNumber: 2, weightKg: 32, reps: 8, targetReps: '8-10', completed: true },
            ],
          },
          {
            exerciseId: 'push-supino-inclinado',
            exerciseName: 'Supino inclinado com halteres',
            targetMuscle: 'Peito superior',
            completed: true,
            sets: [
              { id: 's15', setNumber: 1, weightKg: 20, reps: 10, targetReps: '8-10', completed: true },
              { id: 's16', setNumber: 2, weightKg: 22, reps: 8, targetReps: '8-10', completed: true },
            ],
          },
          {
            exerciseId: 'push-elevacao-lateral',
            exerciseName: 'Elevação lateral',
            targetMuscle: 'Ombros',
            completed: true,
            sets: [
              { id: 's17', setNumber: 1, weightKg: 10, reps: 12, targetReps: '10-12', completed: true },
              { id: 's18', setNumber: 2, weightKg: 10, reps: 12, targetReps: '10-12', completed: true },
            ],
          },
          {
            exerciseId: 'push-triceps-polia',
            exerciseName: 'Tríceps na polia',
            targetMuscle: 'Tríceps',
            completed: true,
            sets: [
              { id: 's19', setNumber: 1, weightKg: 25, reps: 12, targetReps: '10-12', completed: true },
              { id: 's20', setNumber: 2, weightKg: 27, reps: 10, targetReps: '10-12', completed: true },
            ],
          },
        ],
        cardio: {
          enabled: true,
          type: 'Esteira',
          durationMinutes: 10,
          distanceKm: 1.45,
          avgSpeedKmh: 8.7,
          completed: true,
        },
      },
    ];

    const sampleWeights: WeightLog[] = [
      { id: 'w1', date: date1.toLocaleDateString('en-CA'), weightKg: 79.4 },
      { id: 'w2', date: date3.toLocaleDateString('en-CA'), weightKg: 78.8 },
      { id: 'w3', date: now.toLocaleDateString('en-CA'), weightKg: 78.5 },
    ];

    updateData((prev) => ({
      ...prev,
      sessions: [...sampleSessions, ...prev.sessions],
      weightLogs: [...sampleWeights, ...prev.weightLogs],
    }));
  }, [updateData]);

  const value = useMemo(
    () => ({
      data,
      activeSession,
      todayPlan,
      todayCompletedSession,
      weeklyCompletedCount,
      weeklyTotalDurationMin,
      weeklyCompletedDays,
      latestWeight,
      startWorkout,
      updateActiveSession,
      finishActiveSession,
      cancelActiveSession,
      logRestDay,
      addWeightLog,
      deleteWeightLog,
      updateUserSettings,
      updateWorkoutPlans,
      resetPlansToDefault,
      resetAllData,
      importBackup,
      deleteSession,
      getExerciseHistory,
      recentExerciseRecords,
      seedSampleHistory,
    }),
    [
      data,
      activeSession,
      todayPlan,
      todayCompletedSession,
      weeklyCompletedCount,
      weeklyTotalDurationMin,
      weeklyCompletedDays,
      latestWeight,
      startWorkout,
      updateActiveSession,
      finishActiveSession,
      cancelActiveSession,
      logRestDay,
      addWeightLog,
      deleteWeightLog,
      updateUserSettings,
      updateWorkoutPlans,
      resetPlansToDefault,
      resetAllData,
      importBackup,
      deleteSession,
      getExerciseHistory,
      recentExerciseRecords,
      seedSampleHistory,
    ]
  );

  return <FitnessContext.Provider value={value}>{children}</FitnessContext.Provider>;
};

export function useFitness() {
  const ctx = useContext(FitnessContext);
  if (!ctx) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return ctx;
}
