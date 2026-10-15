import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Dumbbell,
  CheckCircle2,
  BedDouble,
  ChevronRight as ChevronRightIcon,
  Flame,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { WorkoutSession } from '../../types/fitness';
import { SessionDetailModal } from './SessionDetailModal';

export const WorkoutHistory: React.FC = () => {
  const { data, deleteSession } = useFitness();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Map sessions by local date string YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    data.sessions.forEach((s) => {
      const d = new Date(s.finishedAt || s.startedAt);
      const key = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const existing = map.get(key) || [];
      existing.push(s);
      map.set(key, existing);
    });
    return map;
  }, [data.sessions]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Leading empty days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: '' });
    }
    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ day, dateStr });
    }
    return days;
  }, [year, month]);

  const todayStr = new Date().toLocaleDateString('en-CA');

  // Filter sessions in current month
  const currentMonthSessions = useMemo(() => {
    return data.sessions.filter((s) => {
      const d = new Date(s.finishedAt || s.startedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [data.sessions, year, month]);

  return (
    <div className="space-y-4">
      {/* Monthly Calendar Card */}
      <div className="rounded-3xl bg-[#19222D] border border-[#263342] p-5 shadow-sm">
        {/* Month Selector */}
        <div className="flex items-center justify-between pb-3 border-b border-[#263342]">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#BEF264]" />
            <span>
              {monthNames[month]} {year}
            </span>
          </h3>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl bg-[#0B1016] border border-[#263342] text-gray-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl bg-[#0B1016] border border-[#263342] text-gray-300 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center py-2 text-[10px] uppercase font-bold text-gray-400">
          <span>Dom</span>
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sáb</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((item, idx) => {
            if (!item.day) {
              return <div key={`empty-${idx}`} className="h-10" />;
            }

            const sessionsOnDay = sessionsByDate.get(item.dateStr) || [];
            const hasWorkout = sessionsOnDay.some((s) => !s.isRestDayLogged);
            const hasRest = sessionsOnDay.some((s) => s.isRestDayLogged);
            const isToday = item.dateStr === todayStr;

            return (
              <button
                key={item.dateStr}
                onClick={() => {
                  if (sessionsOnDay.length > 0) {
                    setSelectedSession(sessionsOnDay[0]);
                  }
                }}
                disabled={sessionsOnDay.length === 0}
                className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition select-none ${
                  hasWorkout
                    ? 'bg-[#BEF264]/20 border border-[#BEF264] text-white hover:bg-[#BEF264]/30'
                    : hasRest
                    ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                    : isToday
                    ? 'bg-[#0B1016] border border-gray-600 text-white'
                    : 'bg-[#0B1016]/40 text-gray-400 border border-transparent'
                }`}
              >
                <span className={`text-xs font-bold ${isToday ? 'text-[#BEF264]' : ''}`}>
                  {item.day}
                </span>

                {/* Status indicator dot */}
                {hasWorkout && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BEF264] mt-0.5 shadow-sm shadow-[#BEF264]" />
                )}
                {hasRest && !hasWorkout && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 pt-3 mt-3 border-t border-[#263342]/60">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#BEF264]" /> Treino Realizado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Descanso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-600" /> Sem registro
          </span>
        </div>
      </div>

      {/* Monthly Sessions List */}
      <div className="rounded-3xl bg-[#19222D] border border-[#263342] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Treinos em {monthNames[month]}</h3>
          <span className="text-xs font-bold text-[#BEF264]">
            {currentMonthSessions.filter((s) => !s.isRestDayLogged).length} realizados
          </span>
        </div>

        {currentMonthSessions.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400 rounded-2xl bg-[#0B1016]/40 border border-dashed border-[#263342]">
            Nenhum treino registrado neste mês.
          </div>
        ) : (
          <div className="space-y-2">
            {[...currentMonthSessions]
              .sort(
                (a, b) =>
                  new Date(b.finishedAt || b.startedAt).getTime() -
                  new Date(a.finishedAt || a.startedAt).getTime()
              )
              .map((session) => {
                const sDate = new Date(session.finishedAt || session.startedAt);
                const dayOfMonth = sDate.getDate();
                const dayName = sDate.toLocaleDateString('pt-BR', { weekday: 'short' });

                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className="w-full p-3 rounded-2xl bg-[#0B1016] border border-[#263342] hover:border-[#BEF264]/40 flex items-center justify-between text-left transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#19222D] border border-[#263342] flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{dayOfMonth}</span>
                        <span className="text-[9px] uppercase text-gray-400 font-semibold">{dayName}</span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">{session.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#BEF264]" />
                            {session.durationMinutes} min
                          </span>
                          <span>•</span>
                          <span>{session.exercises.length} exercícios</span>
                          {session.cardio && (
                            <>
                              <span>•</span>
                              <span className="text-orange-400">Cardio</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      <SessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onDeleteSession={deleteSession}
      />
    </div>
  );
};
