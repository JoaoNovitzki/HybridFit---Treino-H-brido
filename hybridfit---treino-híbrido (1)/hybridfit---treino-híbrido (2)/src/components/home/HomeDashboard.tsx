import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  Calendar,
  Clock,
  Dumbbell,
  Flame,
  TrendingUp,
  Scale,
  Award,
  ChevronRight,
  Sparkles,
  BedDouble,
  Activity,
  Plus,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { WorkoutDayPlan } from '../../types/fitness';

interface HomeDashboardProps {
  onStartWorkout: (plan: WorkoutDayPlan) => void;
  onOpenEvolution: () => void;
  onOpenWorkouts: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onStartWorkout,
  onOpenEvolution,
  onOpenWorkouts,
}) => {
  const {
    data,
    todayPlan,
    todayCompletedSession,
    activeSession,
    weeklyCompletedCount,
    weeklyTotalDurationMin,
    weeklyCompletedDays,
    latestWeight,
    addWeightLog,
    recentExerciseRecords,
    logRestDay,
  } = useFitness();

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [inputWeight, setInputWeight] = useState(latestWeight ? String(latestWeight.weightKg) : '');

  // Formatted date and greeting
  const today = new Date();
  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const formattedDate = `${daysOfWeek[today.getDay()]}, ${today.getDate()} de ${months[today.getMonth()]}`;

  const currentHour = today.getHours();
  let greeting = 'Bom dia';
  if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Boa tarde';
  } else if (currentHour >= 18 || currentHour < 5) {
    greeting = 'Boa noite';
  }

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputWeight);
    if (!isNaN(val) && val > 20 && val < 300) {
      addWeightLog(val);
      setShowWeightModal(false);
    }
  };

  const dayLetters = [
    { label: 'D', day: 0 },
    { label: 'S', day: 1 },
    { label: 'T', day: 2 },
    { label: 'Q', day: 3 },
    { label: 'Q', day: 4 },
    { label: 'S', day: 5 },
    { label: 'S', day: 6 },
  ];

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-5 animate-fade-in">
      {/* User Greeting & Date Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-[#BEF264] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {greeting}, {data.settings.userName}
          </span>
          <h1 className="text-xl font-extrabold text-white mt-0.5 tracking-tight">Pronto para treinar?</h1>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{formattedDate}</p>
        </div>

        {/* Quick weight indicator pill */}
        <button
          onClick={() => setShowWeightModal(true)}
          className="flex items-center gap-1.5 bg-[#19222D] border border-[#263342] hover:border-[#BEF264]/40 rounded-2xl px-3 py-2 transition active:scale-95 text-left"
          title="Registrar peso corporal"
        >
          <Scale className="w-4 h-4 text-[#BEF264]" />
          <div>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">Peso</span>
            <span className="text-xs font-bold text-white">
              {latestWeight ? `${latestWeight.weightKg} kg` : '+ Reg.'}
            </span>
          </div>
        </button>
      </div>

      {/* TODAY'S WORKOUT HERO CARD */}
      <div className="rounded-3xl bg-gradient-to-b from-[#19222D] to-[#121820] border border-[#263342] p-5 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#BEF264]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Badge: Status / Today */}
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0B1016]/80 border border-[#263342] text-[11px] font-semibold text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-[#BEF264]" />
            <span>Treino do Dia ({todayPlan.dayName})</span>
          </div>

          {todayCompletedSession ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Concluído hoje</span>
            </span>
          ) : activeSession ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#BEF264]/20 text-[#BEF264] border border-[#BEF264]/40 text-[10px] font-bold animate-pulse">
              <Activity className="w-3 h-3" />
              <span>Em andamento</span>
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Pendente</span>
          )}
        </div>

        {/* Workout Title and Goal */}
        <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
          {todayPlan.title}
        </h2>
        <p className="text-xs text-gray-300 mt-1 line-clamp-2 leading-relaxed">
          {todayPlan.goal}
        </p>

        {/* Workout Metrics Specs */}
        <div className="grid grid-cols-3 gap-2 my-4 pt-3 border-t border-[#263342]/70 text-center">
          <div className="bg-[#0B1016]/50 rounded-xl p-2 border border-[#263342]/40">
            <Clock className="w-3.5 h-3.5 text-[#BEF264] mx-auto mb-1" />
            <span className="text-[10px] text-gray-400 block font-medium">Duração</span>
            <strong className="text-xs text-white font-bold">{todayPlan.estimatedDurationMin} min</strong>
          </div>

          <div className="bg-[#0B1016]/50 rounded-xl p-2 border border-[#263342]/40">
            <Dumbbell className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
            <span className="text-[10px] text-gray-400 block font-medium">Exercícios</span>
            <strong className="text-xs text-white font-bold">{todayPlan.exercises.length}</strong>
          </div>

          <div className="bg-[#0B1016]/50 rounded-xl p-2 border border-[#263342]/40">
            <Flame className="w-3.5 h-3.5 text-orange-400 mx-auto mb-1" />
            <span className="text-[10px] text-gray-400 block font-medium">Cardio</span>
            <strong className="text-xs text-white font-bold">
              {todayPlan.cardioPlan ? `${todayPlan.cardioPlan.targetMinutes}m` : '0m'}
            </strong>
          </div>
        </div>

        {/* Action Button: Iniciar Treino */}
        <div className="space-y-2">
          {activeSession ? (
            <button
              onClick={() => onStartWorkout(todayPlan)}
              className="w-full py-3.5 rounded-2xl bg-[#BEF264] text-[#0B1016] font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#BEF264]/20 transition active:scale-98"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Continuar Treino em Andamento</span>
            </button>
          ) : todayCompletedSession ? (
            <button
              onClick={() => onStartWorkout(todayPlan)}
              className="w-full py-3.5 rounded-2xl bg-[#263342] hover:bg-[#324357] text-gray-200 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-98"
            >
              <Play className="w-4 h-4" />
              <span>Treinar Novamente</span>
            </button>
          ) : (
            <button
              onClick={() => onStartWorkout(todayPlan)}
              className="w-full py-3.5 rounded-2xl bg-[#BEF264] text-[#0B1016] font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#BEF264]/25 transition active:scale-98"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Treino</span>
            </button>
          )}

          {/* Optional Rest Day button (e.g., Domingo or fatigue) */}
          {!todayCompletedSession && !activeSession && (
            <button
              onClick={() => logRestDay()}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-200 flex items-center justify-center gap-1.5 transition"
            >
              <BedDouble className="w-3.5 h-3.5 text-gray-400" />
              <span>Registrar dia de descanso / recuperação</span>
            </button>
          )}
        </div>
      </div>

      {/* WEEKLY ACTIVITY & PROGRESS */}
      <div className="rounded-3xl bg-[#19222D] border border-[#263342] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#BEF264]" />
            <h3 className="text-sm font-bold text-white">Consistência Semanal</h3>
          </div>
          <span className="text-xs font-extrabold text-[#BEF264]">
            {weeklyCompletedCount} / 7 treinos
          </span>
        </div>

        {/* 7 Days of the week bubbles */}
        <div className="grid grid-cols-7 gap-1.5 my-3">
          {dayLetters.map((item) => {
            const isToday = today.getDay() === item.day;
            const isDone = weeklyCompletedDays.includes(item.day);

            return (
              <div
                key={item.day}
                className={`flex flex-col items-center justify-center py-2 rounded-xl text-center border transition ${
                  isDone
                    ? 'bg-[#BEF264] text-[#0B1016] border-[#BEF264] font-black shadow-sm'
                    : isToday
                    ? 'bg-[#0B1016] border-[#BEF264] text-white'
                    : 'bg-[#0B1016]/60 border-[#263342] text-gray-400'
                }`}
              >
                <span className="text-[10px] font-bold uppercase">{item.label}</span>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 fill-current" />
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isToday ? 'bg-[#BEF264]' : 'bg-gray-600'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Weekly Stats Bar */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#263342]/70">
          <div className="bg-[#0B1016]/40 p-3 rounded-2xl border border-[#263342]/40">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">Tempo Total Semanal</span>
            <p className="text-lg font-black text-white mt-0.5">{weeklyTotalDurationMin} <span className="text-xs font-normal text-gray-400">min</span></p>
          </div>

          <div className="bg-[#0B1016]/40 p-3 rounded-2xl border border-[#263342]/40">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">Frequência Semanal</span>
            <p className="text-lg font-black text-[#BEF264] mt-0.5">{Math.round((weeklyCompletedCount / 7) * 100)}%</p>
          </div>
        </div>
      </div>

      {/* LATEST LOADS WIDGET */}
      <div className="rounded-3xl bg-[#19222D] border border-[#263342] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#BEF264]" />
            <h3 className="text-sm font-bold text-white">Últimas Cargas Registradas</h3>
          </div>
          <button
            onClick={onOpenEvolution}
            className="text-xs text-[#BEF264] font-semibold hover:underline flex items-center gap-0.5"
          >
            <span>Ver Evolução</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentExerciseRecords.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-2xl bg-[#0B1016]/50 border border-dashed border-[#263342]">
            <Dumbbell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">Nenhuma carga registrada ainda.</p>
            <p className="text-[11px] text-gray-400 mt-1">Conclua um treino para começar a acompanhar o aumento de carga!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentExerciseRecords.map((rec) => (
              <div
                key={rec.exerciseId}
                className="p-3 rounded-2xl bg-[#0B1016] border border-[#263342] flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{rec.exerciseName}</h4>
                  <span className="text-[10px] text-gray-400">
                    Último: {rec.lastWeightKg} kg × {rec.lastReps} reps
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Recorde (PR)</span>
                  <span className="text-xs font-black text-[#BEF264]">{rec.maxWeightKg} kg</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Link to full weekly plan */}
      <button
        onClick={onOpenWorkouts}
        className="w-full p-4 rounded-2xl bg-[#19222D] border border-[#263342] flex items-center justify-between text-left hover:border-[#BEF264]/40 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0B1016] border border-[#263342] flex items-center justify-center text-[#BEF264]">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Ver Ficha Completa da Semana</h4>
            <p className="text-[11px] text-gray-400">7 treinos estruturados de musculação e cardio</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveWeight}
            className="w-full max-w-xs rounded-3xl bg-[#19222D] border border-[#263342] p-5 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#263342]">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#BEF264]" />
                <h3 className="text-sm font-bold text-white">Registrar Peso Corporal</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWeightModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-4">
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                Peso atual (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  inputMode="decimal"
                  autoFocus
                  required
                  placeholder="ex: 78.5"
                  value={inputWeight}
                  onChange={(e) => setInputWeight(e.target.value)}
                  className="w-full bg-[#0B1016] border border-[#263342] focus:border-[#BEF264] focus:outline-none rounded-xl py-3 px-3 text-lg font-bold text-white text-center"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">kg</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowWeightModal(false)}
                className="py-2.5 rounded-xl bg-[#263342] text-xs font-bold text-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-[#BEF264] text-xs font-bold text-[#0B1016]"
              >
                Salvar Peso
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
