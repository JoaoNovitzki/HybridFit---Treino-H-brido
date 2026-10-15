import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  Circle,
  Timer,
  ChevronLeft,
  Flame,
  Award,
  Plus,
  Trash2,
  History,
  Check,
  AlertCircle,
  Activity,
  Heart,
  Save,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { RestTimerModal } from './RestTimerModal';
import { triggerHaptic } from '../../services/audio';

interface ActiveWorkoutSessionProps {
  onBackToHome: () => void;
}

export const ActiveWorkoutSession: React.FC<ActiveWorkoutSessionProps> = ({ onBackToHome }) => {
  const {
    activeSession,
    updateActiveSession,
    finishActiveSession,
    cancelActiveSession,
    data,
    getExerciseHistory,
  } = useFitness();

  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(data.settings.defaultRestTimerSeconds || 60);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedExHistoryModal, setSelectedExHistoryModal] = useState<{ id: string; name: string } | null>(null);

  // Synchronize elapsed time with startedAt
  useEffect(() => {
    if (!activeSession) return;
    const startTime = new Date(activeSession.startedAt).getTime();

    const updateTimer = () => {
      if (isPaused) return;
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession, isPaused]);

  if (!activeSession) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Nenhum treino em andamento no momento.</p>
        <button
          onClick={onBackToHome}
          className="mt-4 px-4 py-2 bg-[#BEF264] text-[#0B1016] rounded-xl font-bold text-sm"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle set completion toggle
  const handleToggleSet = (exIndex: number, setIndex: number) => {
    const sessionCopy = JSON.parse(JSON.stringify(activeSession));
    const targetSet = sessionCopy.exercises[exIndex].sets[setIndex];
    const newStatus = !targetSet.completed;
    targetSet.completed = newStatus;
    targetSet.completedAt = newStatus ? new Date().toISOString() : undefined;

    // Check if whole exercise is completed
    const allSetsCompleted = sessionCopy.exercises[exIndex].sets.every((s: any) => s.completed);
    sessionCopy.exercises[exIndex].completed = allSetsCompleted;

    updateActiveSession(sessionCopy);
    triggerHaptic(50);

    // Auto start rest timer on completion if enabled in user settings
    if (newStatus && data.settings.autoStartRestTimer) {
      setRestSeconds(data.settings.defaultRestTimerSeconds || 60);
      setIsRestTimerOpen(true);
    }
  };

  // Handle weight change
  const handleWeightChange = (exIndex: number, setIndex: number, valStr: string) => {
    const sessionCopy = JSON.parse(JSON.stringify(activeSession));
    const val = valStr === '' ? null : parseFloat(valStr);
    sessionCopy.exercises[exIndex].sets[setIndex].weightKg = isNaN(val as number) ? null : val;
    updateActiveSession(sessionCopy);
  };

  // Handle reps change
  const handleRepsChange = (exIndex: number, setIndex: number, valStr: string) => {
    const sessionCopy = JSON.parse(JSON.stringify(activeSession));
    const val = valStr === '' ? null : parseInt(valStr, 10);
    sessionCopy.exercises[exIndex].sets[setIndex].reps = isNaN(val as number) ? null : val;
    updateActiveSession(sessionCopy);
  };

  // Add a new set to an exercise
  const handleAddSet = (exIndex: number) => {
    const sessionCopy = JSON.parse(JSON.stringify(activeSession));
    const ex = sessionCopy.exercises[exIndex];
    const newSetNum = ex.sets.length + 1;
    const lastSet = ex.sets[ex.sets.length - 1];

    ex.sets.push({
      id: `${ex.exerciseId}-set-${newSetNum}-${Date.now()}`,
      setNumber: newSetNum,
      weightKg: lastSet ? lastSet.weightKg : null,
      reps: lastSet ? lastSet.reps : null,
      targetReps: ex.sets[0]?.targetReps || '8-10',
      completed: false,
    });

    ex.completed = false;
    updateActiveSession(sessionCopy);
    triggerHaptic(30);
  };

  // Remove set
  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    const sessionCopy = JSON.parse(JSON.stringify(activeSession));
    const ex = sessionCopy.exercises[exIndex];
    if (ex.sets.length <= 1) return;

    ex.sets.splice(setIndex, 1);
    // Re-index set numbers
    ex.sets.forEach((s: any, idx: number) => {
      s.setNumber = idx + 1;
    });

    ex.completed = ex.sets.every((s: any) => s.completed);
    updateActiveSession(sessionCopy);
  };

  // Mark all sets of an exercise completed
  const handleCompleteExercise = (exIndex: number) => {
    const sessionCopy = JSON.parse(JSON.stringify(activeSession));
    const ex = sessionCopy.exercises[exIndex];
    ex.sets.forEach((s: any) => {
      s.completed = true;
      if (!s.completedAt) s.completedAt = new Date().toISOString();
    });
    ex.completed = true;
    updateActiveSession(sessionCopy);
    triggerHaptic(60);
  };

  // Cardio updates
  const handleCardioChange = (field: string, value: any) => {
    const sessionCopy = JSON.parse(JSON.stringify(activeSession));
    if (!sessionCopy.cardio) {
      sessionCopy.cardio = {
        enabled: true,
        type: 'Esteira',
        durationMinutes: 10,
        completed: false,
      };
    }
    sessionCopy.cardio[field] = value;
    updateActiveSession(sessionCopy);
  };

  // Calculate progress
  let totalTasks = 0;
  let completedTasks = 0;

  activeSession.exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      totalTasks += 1;
      if (s.completed) completedTasks += 1;
    });
  });

  if (activeSession.cardio?.enabled) {
    totalTasks += 1;
    if (activeSession.cardio.completed) completedTasks += 1;
  }

  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Finalize session
  const handleFinish = () => {
    const finalSession = {
      ...activeSession,
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
    };
    finishActiveSession(finalSession);
    onBackToHome();
  };

  return (
    <div className="min-h-screen pb-28 pt-2 px-3 sm:px-4 max-w-md mx-auto">
      {/* Top Session Bar */}
      <div className="relative z-10 bg-[#0B1016] pt-2 pb-3 border-b border-[#19222D]">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          {/* Stopwatch with play/pause */}
          <div className="flex items-center gap-2 bg-[#19222D] border border-[#263342] rounded-full px-3 py-1 shadow-sm">
            <Timer className="w-3.5 h-3.5 text-[#BEF264]" />
            <span className="font-mono text-sm font-bold text-white tracking-wider">
              {formatElapsed(elapsedSeconds)}
            </span>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 text-gray-400 hover:text-white transition"
              title={isPaused ? 'Retomar' : 'Pausar'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-[#BEF264] text-[#BEF264]" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Rest Timer Quick Opener */}
          <button
            onClick={() => setIsRestTimerOpen(true)}
            className="flex items-center gap-1.5 bg-[#19222D] text-[#BEF264] border border-[#BEF264]/40 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-[#BEF264]/10 transition active:scale-95"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Descanso</span>
          </button>
        </div>

        {/* Title and Progress Bar */}
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-lg font-extrabold text-white leading-tight">{activeSession.title}</h1>
            <p className="text-xs text-gray-400 line-clamp-1">{activeSession.goal}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-[#BEF264]">{completionPercent}%</span>
            <p className="text-[10px] text-gray-400">{completedTasks}/{totalTasks} feitos</p>
          </div>
        </div>

        <div className="w-full bg-[#19222D] h-2 rounded-full mt-2 overflow-hidden border border-[#263342]">
          <div
            className="bg-[#BEF264] h-full transition-all duration-300 rounded-full"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Exercises Execution List */}
      <div className="mt-4 space-y-4">
        {activeSession.exercises.map((exercise, exIdx) => {
          const stats = getExerciseHistory(exercise.exerciseId, exercise.exerciseName);

          return (
            <div
              key={exercise.exerciseId}
              className={`rounded-2xl bg-[#19222D] border transition-all overflow-hidden ${
                exercise.completed ? 'border-[#BEF264]/40 shadow-sm shadow-[#BEF264]/10' : 'border-[#263342]'
              }`}
            >
              {/* Exercise Header */}
              <div className="p-3.5 bg-[#131A22] border-b border-[#263342]/70 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#263342] text-[11px] font-bold text-gray-300 flex items-center justify-center shrink-0">
                      {exIdx + 1}
                    </span>
                    <h3 className="font-bold text-white text-sm leading-snug">{exercise.exerciseName}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                    <span className="text-[#BEF264] font-medium">{exercise.targetMuscle}</span>
                    <span>•</span>
                    <span>{exercise.sets.length} séries</span>
                  </div>
                </div>

                {/* Exercise Record Badge & History Modal Trigger */}
                <div className="flex items-center gap-1.5">
                  {stats && (
                    <button
                      onClick={() => setSelectedExHistoryModal({ id: exercise.exerciseId, name: exercise.exerciseName })}
                      className="flex items-center gap-1 bg-[#0B1016] border border-[#263342] rounded-lg px-2 py-1 text-[10px] text-gray-300 hover:text-white hover:border-[#BEF264]/50 transition"
                      title="Ver histórico de cargas deste exercício"
                    >
                      <History className="w-3 h-3 text-[#BEF264]" />
                      <span>PR: {stats.maxWeightKg}kg</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleCompleteExercise(exIdx)}
                    className="p-1.5 rounded-lg bg-[#263342]/70 hover:bg-[#BEF264]/20 hover:text-[#BEF264] text-gray-400 transition"
                    title="Concluir exercício inteiro"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Previous reference banner */}
              {stats && (
                <div className="px-3.5 py-1.5 bg-[#0B1016]/40 border-b border-[#263342]/40 text-[11px] flex items-center justify-between text-gray-400">
                  <span>Último treino: <strong className="text-white font-medium">{stats.lastWeightKg} kg × {stats.lastReps} reps</strong></span>
                  <span className="text-[#BEF264] font-medium">Recorde: {stats.maxWeightKg} kg</span>
                </div>
              )}

              {/* Table of Sets */}
              <div className="p-3">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 pb-1.5">
                  <span className="col-span-2 text-center">Série</span>
                  <span className="col-span-4 text-center">Peso (kg)</span>
                  <span className="col-span-4 text-center">Reps</span>
                  <span className="col-span-2 text-center">Feito</span>
                </div>

                <div className="space-y-2">
                  {exercise.sets.map((set, setIdx) => {
                    const isDone = set.completed;
                    return (
                      <div
                        key={set.id}
                        className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-[#BEF264]/10 border-[#BEF264]/40 text-white'
                            : 'bg-[#0B1016]/70 border-[#263342] text-gray-200'
                        }`}
                      >
                        {/* Set index */}
                        <div className="col-span-2 flex items-center justify-center font-bold text-xs">
                          <span className={isDone ? 'text-[#BEF264]' : 'text-gray-300'}>
                            {set.setNumber}
                          </span>
                        </div>

                        {/* Weight input */}
                        <div className="col-span-4">
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              inputMode="decimal"
                              placeholder={stats?.lastWeightKg ? String(stats.lastWeightKg) : 'kg'}
                              value={set.weightKg ?? ''}
                              onChange={(e) => handleWeightChange(exIdx, setIdx, e.target.value)}
                              className="w-full bg-[#19222D] border border-[#263342] focus:border-[#BEF264] focus:outline-none rounded-lg py-1.5 px-2 text-center text-sm font-semibold text-white transition"
                            />
                            <span className="absolute right-1.5 text-[9px] text-gray-500 pointer-events-none">kg</span>
                          </div>
                        </div>

                        {/* Reps input */}
                        <div className="col-span-4">
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min="1"
                              inputMode="numeric"
                              placeholder={set.targetReps || 'reps'}
                              value={set.reps ?? ''}
                              onChange={(e) => handleRepsChange(exIdx, setIdx, e.target.value)}
                              className="w-full bg-[#19222D] border border-[#263342] focus:border-[#BEF264] focus:outline-none rounded-lg py-1.5 px-2 text-center text-sm font-semibold text-white transition"
                            />
                          </div>
                        </div>

                        {/* Checkbox / Done button */}
                        <div className="col-span-2 flex items-center justify-center">
                          <button
                            onClick={() => handleToggleSet(exIdx, setIdx)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition active:scale-90 ${
                              isDone
                                ? 'bg-[#BEF264] text-[#0B1016] shadow-sm shadow-[#BEF264]/30'
                                : 'bg-[#263342] text-gray-400 hover:text-white hover:bg-[#324357]'
                            }`}
                            title={isDone ? 'Desmarcar' : 'Concluir série'}
                          >
                            <Check className={`w-4 h-4 stroke-[3] ${isDone ? 'text-[#0B1016]' : 'text-transparent'}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add / Remove Set buttons */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#263342]/60">
                  <button
                    onClick={() => handleAddSet(exIdx)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#BEF264] hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Série</span>
                  </button>

                  {exercise.sets.length > 1 && (
                    <button
                      onClick={() => handleRemoveSet(exIdx, exercise.sets.length - 1)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover Última</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Cardio Section (when planned or available) */}
        {activeSession.cardio?.enabled && (
          <div
            className={`rounded-2xl bg-[#19222D] border transition-all p-4 ${
              activeSession.cardio.completed
                ? 'border-[#BEF264]/40 bg-[#19222D]'
                : 'border-[#263342]'
            }`}
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#263342]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cardio: {activeSession.cardio.type}</h3>
                  <p className="text-xs text-gray-400">{activeSession.cardio.notes || 'Meta aeróbica do dia'}</p>
                </div>
              </div>

              <button
                onClick={() => handleCardioChange('completed', !activeSession.cardio?.completed)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                  activeSession.cardio.completed
                    ? 'bg-[#BEF264] text-[#0B1016]'
                    : 'bg-[#263342] text-gray-300 hover:text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{activeSession.cardio.completed ? 'Concluído' : 'Concluir'}</span>
              </button>
            </div>

            {/* Cardio Inputs: Duração, Distância, Velocidade/Ritmo */}
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Duração (min)</label>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={activeSession.cardio.durationMinutes || ''}
                  onChange={(e) => handleCardioChange('durationMinutes', parseInt(e.target.value, 10) || 0)}
                  placeholder="min"
                  className="w-full bg-[#0B1016] border border-[#263342] focus:border-[#BEF264] focus:outline-none rounded-xl py-2 px-2.5 text-center text-sm font-bold text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Distância (km)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={activeSession.cardio.distanceKm ?? ''}
                  onChange={(e) => handleCardioChange('distanceKm', parseFloat(e.target.value) || undefined)}
                  placeholder="km"
                  className="w-full bg-[#0B1016] border border-[#263342] focus:border-[#BEF264] focus:outline-none rounded-xl py-2 px-2.5 text-center text-sm font-bold text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Velocidade / Ritmo</label>
                <input
                  type="text"
                  value={activeSession.cardio.avgPaceMinKm || (activeSession.cardio.avgSpeedKmh ? `${activeSession.cardio.avgSpeedKmh} km/h` : '')}
                  onChange={(e) => handleCardioChange('avgPaceMinKm', e.target.value)}
                  placeholder="ex: 5:40 / 8km/h"
                  className="w-full bg-[#0B1016] border border-[#263342] focus:border-[#BEF264] focus:outline-none rounded-xl py-2 px-2.5 text-center text-xs font-bold text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer Bar */}
      <div className="mt-8 space-y-3">
        <button
          onClick={handleFinish}
          className="w-full py-4 rounded-2xl bg-[#BEF264] text-[#0B1016] font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#BEF264]/25 transition active:scale-98"
        >
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          <span>Finalizar Treino</span>
        </button>

        <button
          onClick={() => setShowCancelConfirm(true)}
          className="w-full py-2.5 text-xs text-red-400/80 hover:text-red-300 transition"
        >
          Descartar treino em andamento
        </button>
      </div>

      {/* Rest Timer Modal */}
      <RestTimerModal
        isOpen={isRestTimerOpen}
        initialSeconds={restSeconds}
        onClose={() => setIsRestTimerOpen(false)}
      />

      {/* Exercise PR & History Modal */}
      {selectedExHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#19222D] border border-[#263342] p-5 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#263342]">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#BEF264]" />
                <h3 className="font-bold text-white text-sm">{selectedExHistoryModal.name}</h3>
              </div>
              <button
                onClick={() => setSelectedExHistoryModal(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {(() => {
              const rec = getExerciseHistory(selectedExHistoryModal.id, selectedExHistoryModal.name);
              if (!rec) {
                return <p className="text-xs text-gray-400 py-4 text-center">Nenhum histórico registrado ainda.</p>;
              }
              return (
                <div className="mt-4 space-y-3">
                  <div className="p-3 rounded-xl bg-[#0B1016] border border-[#263342]">
                    <span className="text-[10px] uppercase font-bold text-[#BEF264]">Maior Carga (PR)</span>
                    <p className="text-xl font-extrabold text-white mt-0.5">{rec.maxWeightKg} kg</p>
                    <p className="text-xs text-gray-400">{rec.maxWeightReps} repetições</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0B1016] border border-[#263342]">
                    <span className="text-[10px] uppercase font-bold text-blue-400">Última Carga Registrada</span>
                    <p className="text-xl font-extrabold text-white mt-0.5">{rec.lastWeightKg} kg</p>
                    <p className="text-xs text-gray-400">{rec.lastReps} repetições</p>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => setSelectedExHistoryModal(null)}
              className="mt-4 w-full py-2 bg-[#263342] text-xs font-bold text-white rounded-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs rounded-2xl bg-[#19222D] border border-red-500/30 p-5 shadow-2xl text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <h4 className="font-bold text-white text-base">Descartar treino?</h4>
            <p className="text-xs text-gray-400 mt-1">
              Os dados desta sessão em andamento não serão salvos no histórico.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="py-2 rounded-xl bg-[#263342] text-xs font-bold text-gray-200"
              >
                Continuar
              </button>
              <button
                onClick={() => {
                  cancelActiveSession();
                  setShowCancelConfirm(false);
                  onBackToHome();
                }}
                className="py-2 rounded-xl bg-red-500 text-xs font-bold text-white"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
