import React from 'react';
import {
  X,
  Calendar,
  Clock,
  Dumbbell,
  Flame,
  CheckCircle2,
  Trash2,
  Award,
} from 'lucide-react';
import { WorkoutSession } from '../../types/fitness';

interface SessionDetailModalProps {
  session: WorkoutSession | null;
  onClose: () => void;
  onDeleteSession?: (sessionId: string) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  onClose,
  onDeleteSession,
}) => {
  if (!session) return null;

  const dateObj = new Date(session.finishedAt || session.startedAt);
  const formattedDate = dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[#19222D] border border-[#263342] p-5 shadow-2xl text-left max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#263342]">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#BEF264]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{session.isRestDayLogged ? 'Descanso' : 'Treino Concluído'}</span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5 leading-snug">{session.title}</h3>
            <p className="text-xs text-gray-400 capitalize">{formattedDate}</p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-[#0B1016] border border-[#263342]">
              <Clock className="w-4 h-4 text-[#BEF264] mx-auto mb-1" />
              <span className="text-[10px] text-gray-400 block">Duração Total</span>
              <strong className="text-xs text-white font-bold">{session.durationMinutes} minutos</strong>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0B1016] border border-[#263342]">
              <Dumbbell className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <span className="text-[10px] text-gray-400 block">Exercícios</span>
              <strong className="text-xs text-white font-bold">{session.exercises.length} realizados</strong>
            </div>
          </div>

          {/* If rest day */}
          {session.isRestDayLogged && (
            <div className="p-3 rounded-2xl bg-[#0B1016] border border-[#263342] text-xs text-gray-300">
              <p className="font-semibold text-white">Dia de Recuperação</p>
              <p className="text-gray-400 mt-1">{session.notes || 'Descanso programado ou recuperação de fadiga.'}</p>
            </div>
          )}

          {/* Exercises and Sets Detail */}
          {session.exercises.length > 0 && (
            <div className="space-y-3">
              <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider block">
                Detalhes das Cargas e Séries
              </span>

              {session.exercises.map((ex, exIdx) => (
                <div key={ex.exerciseId || exIdx} className="p-3 rounded-2xl bg-[#0B1016] border border-[#263342]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-white">{ex.exerciseName}</h4>
                    <span className="text-[10px] text-[#BEF264]">{ex.targetMuscle}</span>
                  </div>

                  <div className="space-y-1.5">
                    {ex.sets.map((s, sIdx) => (
                      <div
                        key={s.id || sIdx}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#19222D]/60"
                      >
                        <span className="text-gray-400 font-semibold">Série {s.setNumber}:</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">
                            {s.weightKg !== null && s.weightKg !== undefined ? `${s.weightKg} kg` : '—'}
                          </span>
                          <span className="text-gray-300 font-medium">
                            {s.reps !== null && s.reps !== undefined ? `${s.reps} reps` : '—'}
                          </span>
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${s.completed ? 'text-[#BEF264]' : 'text-gray-600'}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cardio session details */}
          {session.cardio && (
            <div className="p-3 rounded-2xl bg-[#0B1016] border border-orange-500/20 text-xs">
              <div className="flex items-center gap-1.5 text-orange-400 font-bold mb-1.5">
                <Flame className="w-4 h-4" />
                <span>Cardio: {session.cardio.type}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div>
                  <span className="text-[9px] text-gray-400 block">Tempo</span>
                  <strong className="text-xs text-white">{session.cardio.durationMinutes} min</strong>
                </div>
                {session.cardio.distanceKm !== undefined && (
                  <div>
                    <span className="text-[9px] text-gray-400 block">Distância</span>
                    <strong className="text-xs text-white">{session.cardio.distanceKm} km</strong>
                  </div>
                )}
                {session.cardio.avgPaceMinKm && (
                  <div>
                    <span className="text-[9px] text-gray-400 block">Ritmo</span>
                    <strong className="text-xs text-white">{session.cardio.avgPaceMinKm}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#263342] flex items-center justify-between gap-2">
          {onDeleteSession && (
            <button
              onClick={() => {
                if (window.confirm('Deseja excluir este treino do histórico?')) {
                  onDeleteSession(session.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 py-2 px-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-[#263342] text-xs font-bold text-white hover:bg-[#324357]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
