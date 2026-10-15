import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Dumbbell,
  Flame,
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { WorkoutDayPlan, DayOfWeek } from '../../types/fitness';

interface WorkoutsListProps {
  onStartWorkout: (plan: WorkoutDayPlan) => void;
}

export const WorkoutsList: React.FC<WorkoutsListProps> = ({ onStartWorkout }) => {
  const { data, activeSession, getExerciseHistory } = useFitness();
  const currentDayOfWeek = new Date().getDay() as DayOfWeek;

  // Track expanded cards
  const [expandedDay, setExpandedDay] = useState<number>(currentDayOfWeek);

  // Order days from Monday (1) to Sunday (0) for natural weekly view
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];
  const sortedPlans = orderedDays
    .map((dayNum) => data.plans.find((p) => p.dayOfWeek === dayNum))
    .filter((p): p is WorkoutDayPlan => p !== undefined);

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">Plano Semanal de Treinos</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Ficha completa de musculação híbrida e cardio para os 7 dias
        </p>
      </div>

      {/* Plans List */}
      <div className="space-y-3">
        {sortedPlans.map((plan) => {
          const isToday = plan.dayOfWeek === currentDayOfWeek;
          const isExpanded = expandedDay === plan.dayOfWeek;

          return (
            <div
              key={plan.dayOfWeek}
              className={`rounded-3xl bg-[#19222D] border transition-all overflow-hidden ${
                isToday
                  ? 'border-[#BEF264]/60 shadow-md shadow-[#BEF264]/10'
                  : 'border-[#263342]'
              }`}
            >
              {/* Card Header (clickable to expand/collapse) */}
              <div
                onClick={() => setExpandedDay(isExpanded ? -1 : plan.dayOfWeek)}
                className="p-4 cursor-pointer select-none flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                        isToday
                          ? 'bg-[#BEF264] text-[#0B1016]'
                          : 'bg-[#0B1016] text-gray-400 border border-[#263342]'
                      }`}
                    >
                      {plan.dayName} {isToday && '• HOJE'}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      ~{plan.estimatedDurationMin} min
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white tracking-tight">{plan.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{plan.goal}</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartWorkout(plan);
                    }}
                    className="p-2 rounded-xl bg-[#BEF264] text-[#0B1016] font-bold text-xs hover:bg-[#a8e84a] transition active:scale-90 shadow-sm"
                    title="Iniciar este treino"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                  <div className="text-gray-400 p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-[#263342]/70 space-y-3">
                  {/* Summary row */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#BEF264]" />
                      Aquecimento: {plan.warmupMinutes}m
                    </span>
                    {plan.exercises.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                        {plan.exercises.length} exercícios
                      </span>
                    )}
                    {plan.cardioPlan && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        {plan.cardioPlan.targetMinutes}m cardio
                      </span>
                    )}
                  </div>

                  {/* Exercises breakdown */}
                  {plan.exercises.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                        Exercícios de Musculação
                      </span>
                      {plan.exercises.map((ex, idx) => {
                        const rec = getExerciseHistory(ex.id, ex.name);
                        return (
                          <div
                            key={ex.id}
                            className="p-2.5 rounded-xl bg-[#0B1016]/80 border border-[#263342] flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-[#19222D] text-gray-400 font-bold text-[10px] flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="font-semibold text-white">{ex.name}</h4>
                                <span className="text-[10px] text-gray-400">
                                  {ex.defaultSets} séries de {ex.targetRepsRange} reps
                                </span>
                              </div>
                            </div>

                            {rec && (
                              <div className="text-right">
                                <span className="text-[9px] uppercase tracking-wider text-[#BEF264] font-bold block">
                                  PR: {rec.maxWeightKg}kg
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  Últ: {rec.lastWeightKg}kg
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Cardio details */}
                  {plan.cardioPlan && (
                    <div className="p-3 rounded-2xl bg-[#0B1016]/80 border border-orange-500/20 text-xs mt-2">
                      <div className="flex items-center gap-1.5 text-orange-400 font-bold mb-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Cardio: {plan.cardioPlan.type} ({plan.cardioPlan.targetMinutes} min)</span>
                      </div>
                      <p className="text-gray-300 text-[11px]">{plan.cardioPlan.description}</p>
                      {plan.cardioPlan.intervals && (
                        <div className="mt-2 space-y-1 pl-1 border-l-2 border-orange-500/40">
                          {plan.cardioPlan.intervals.map((step, sIdx) => (
                            <p key={sIdx} className="text-[10px] text-gray-400">
                              • {step}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Big Start Button */}
                  <button
                    onClick={() => onStartWorkout(plan)}
                    className="w-full mt-3 py-3 rounded-2xl bg-[#BEF264] text-[#0B1016] font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#BEF264]/20 transition active:scale-98"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Iniciar Treino de {plan.dayName}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
