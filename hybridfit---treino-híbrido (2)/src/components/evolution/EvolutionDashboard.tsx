import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Scale,
  Dumbbell,
  Flame,
  Plus,
  Calendar,
  Award,
  Activity,
  Milestone,
  Clock,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useFitness } from '../../context/FitnessContext';
import { WorkoutHistory } from '../history/WorkoutHistory';

export const EvolutionDashboard: React.FC = () => {
  const { data, addWeightLog, deleteWeightLog } = useFitness();

  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'calendar'>('metrics');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toLocaleDateString('en-CA'));
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  // Extract all unique exercises from history to populate selector
  const availableExercises = useMemo(() => {
    const map = new Map<string, string>();
    // First from plans
    data.plans.forEach((p) => {
      p.exercises.forEach((ex) => {
        map.set(ex.id, ex.name);
      });
    });
    // Then from history if any custom ones exist
    data.sessions.forEach((s) => {
      s.exercises.forEach((ex) => {
        map.set(ex.exerciseId, ex.exerciseName);
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data.plans, data.sessions]);

  // Set default exercise if not selected
  const currentSelectedExId = selectedExerciseId || availableExercises[0]?.id || '';

  // Calculate Aggregated Metrics (Real data only)
  const totalCompletedWorkouts = useMemo(() => {
    return data.sessions.filter((s) => !s.isRestDayLogged).length;
  }, [data.sessions]);

  const { totalCardioMinutes, totalCardioDistanceKm } = useMemo(() => {
    let minutes = 0;
    let km = 0;
    data.sessions.forEach((s) => {
      if (s.cardio && s.cardio.completed) {
        minutes += s.cardio.durationMinutes || 0;
        km += s.cardio.distanceKm || 0;
      }
    });
    return {
      totalCardioMinutes: minutes,
      totalCardioDistanceKm: Math.round(km * 10) / 10,
    };
  }, [data.sessions]);

  // Weight chart data
  const weightChartData = useMemo(() => {
    const sorted = [...data.weightLogs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return sorted.map((item) => {
      const parts = item.date.split('-');
      const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
      return {
        date: formatted,
        rawDate: item.date,
        peso: item.weightKg,
      };
    });
  }, [data.weightLogs]);

  // Exercise progression data for selected exercise
  const exerciseProgressionData = useMemo(() => {
    if (!currentSelectedExId) return [];

    const historyPoints: { date: string; carga: number; reps: number }[] = [];

    // Chronological order
    const chronologicalSessions = [...data.sessions].sort(
      (a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime()
    );

    chronologicalSessions.forEach((s) => {
      const ex = s.exercises.find((e) => e.exerciseId === currentSelectedExId);
      if (ex && ex.sets) {
        // Find max weight in that session
        let maxWeight = 0;
        let associatedReps = 0;
        ex.sets.forEach((set) => {
          if (set.completed && set.weightKg && set.weightKg > maxWeight) {
            maxWeight = set.weightKg;
            associatedReps = set.reps || 0;
          }
        });

        if (maxWeight > 0) {
          const d = new Date(s.finishedAt);
          const formatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
          historyPoints.push({
            date: formatted,
            carga: maxWeight,
            reps: associatedReps,
          });
        }
      }
    });

    return historyPoints;
  }, [currentSelectedExId, data.sessions]);

  // Weekly workouts frequency (last 6 weeks)
  const weeklyFrequencyData = useMemo(() => {
    const weeksMap = new Map<string, number>();

    // Prepare buckets for past 4-6 weeks
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekLabel = `Sem -${i}`;
      weeksMap.set(weekLabel, 0);
    }

    data.sessions.forEach((s) => {
      if (s.isRestDayLogged) return;
      const sDate = new Date(s.finishedAt);
      const diffDays = Math.floor((now.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);

      if (weekIndex <= 4 && weekIndex >= 0) {
        const label = `Sem -${weekIndex}`;
        weeksMap.set(label, (weeksMap.get(label) || 0) + 1);
      }
    });

    return Array.from(weeksMap.entries())
      .reverse()
      .map(([semana, treinos]) => ({
        semana,
        treinos,
      }));
  }, [data.sessions]);

  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightInput);
    if (!isNaN(w) && w > 20 && w < 300) {
      addWeightLog(w, dateInput);
      setWeightInput('');
      setShowWeightModal(false);
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-5 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">Evolução & Histórico</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Acompanhamento de cargas, pesagens e calendário de treinos
        </p>

        {/* Sub-tab Pill Switch */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#19222D] border border-[#263342] mt-4">
          <button
            onClick={() => setActiveSubTab('metrics')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeSubTab === 'metrics'
                ? 'bg-[#BEF264] text-[#0B1016] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Gráficos & Cargas</span>
          </button>

          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeSubTab === 'calendar'
                ? 'bg-[#BEF264] text-[#0B1016] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendário Mensal</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'calendar' ? (
        <WorkoutHistory />
      ) : (
        <>
          {/* Highlights Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-[#19222D] border border-[#263342] flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[#BEF264]">
            <Dumbbell className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Treinos Feitos</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{totalCompletedWorkouts}</span>
            <p className="text-[10px] text-gray-400 mt-0.5">sessões registradas</p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-[#19222D] border border-[#263342] flex flex-col justify-between">
          <div className="flex items-center gap-2 text-orange-400">
            <Flame className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Cardio Acumulado</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{totalCardioMinutes} <span className="text-xs font-normal text-gray-400">min</span></span>
            <p className="text-[10px] text-gray-400 mt-0.5">{totalCardioDistanceKm} km percorridos</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: EVOLUÇÃO DE CARGA DOS EXERCÍCIOS */}
      <div className="rounded-3xl bg-[#19222D] border border-[#263342] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#BEF264]" />
            <h3 className="text-sm font-bold text-white">Evolução de Cargas</h3>
          </div>
        </div>

        {/* Exercise Selector */}
        <div className="mb-4">
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
            Selecione o exercício
          </label>
          <select
            value={currentSelectedExId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full bg-[#0B1016] border border-[#263342] rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-[#BEF264]"
          >
            {availableExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {/* Line Chart */}
        {exerciseProgressionData.length >= 2 ? (
          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exerciseProgressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263342" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} unit="kg" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1016',
                    borderColor: '#263342',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                  formatter={(value: any) => [`${value} kg`, 'Carga']}
                />
                <Line
                  type="monotone"
                  dataKey="carga"
                  stroke="#BEF264"
                  strokeWidth={3}
                  dot={{ fill: '#BEF264', r: 4 }}
                  activeDot={{ r: 6, fill: '#FFFFFF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-8 px-4 text-center rounded-2xl bg-[#0B1016]/40 border border-dashed border-[#263342]">
            <Dumbbell className="w-7 h-7 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">
              {exerciseProgressionData.length === 1
                ? 'Apenas 1 registro neste exercício. Registre mais treinos para gerar o gráfico.'
                : 'Nenhum registro para este exercício ainda.'}
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: PESO CORPORAL */}
      <div className="rounded-3xl bg-[#19222D] border border-[#263342] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#BEF264]" />
            <h3 className="text-sm font-bold text-white">Peso Corporal</h3>
          </div>
          <button
            onClick={() => setShowWeightModal(true)}
            className="flex items-center gap-1 bg-[#BEF264] text-[#0B1016] text-xs font-bold px-2.5 py-1 rounded-xl transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar</span>
          </button>
        </div>

        {weightChartData.length >= 2 ? (
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263342" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  unit="kg"
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1016',
                    borderColor: '#263342',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                  formatter={(value: any) => [`${value} kg`, 'Peso']}
                />
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke="#38BDF8"
                  strokeWidth={3}
                  dot={{ fill: '#38BDF8', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-6 px-4 text-center rounded-2xl bg-[#0B1016]/40 border border-dashed border-[#263342]">
            <p className="text-xs text-gray-400">
              {weightChartData.length === 1
                ? `1 pesagem salva (${weightChartData[0].peso} kg). Adicione outra data para ver a curva de evolução.`
                : 'Nenhuma pesagem cadastrada ainda. Toque em "Registrar" para adicionar.'}
            </p>
          </div>
        )}

        {/* Recent weights list */}
        {data.weightLogs.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#263342]/70 space-y-1.5 max-h-36 overflow-y-auto">
            {[...data.weightLogs]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 4)
              .map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-[#0B1016]/60"
                >
                  <span className="text-gray-400">{log.date}</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-white font-bold">{log.weightKg} kg</strong>
                    <button
                      onClick={() => deleteWeightLog(log.id)}
                      className="text-gray-500 hover:text-red-400 p-1"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* SECTION 3: FREQUÊNCIA SEMANAL DE TREINOS */}
      <div className="rounded-3xl bg-[#19222D] border border-[#263342] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#BEF264]" />
            <h3 className="text-sm font-bold text-white">Treinos por Semana</h3>
          </div>
        </div>

        <div className="h-44 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyFrequencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#263342" />
              <XAxis dataKey="semana" stroke="#94A3B8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B1016',
                  borderColor: '#263342',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                }}
                formatter={(value: any) => [`${value} treinos`, 'Total']}
              />
              <Bar dataKey="treinos" fill="#BEF264" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
        </>
      )}

      {/* Add Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleAddWeight}
            className="w-full max-w-xs rounded-3xl bg-[#19222D] border border-[#263342] p-5 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#263342]">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#BEF264]" />
                <h3 className="text-sm font-bold text-white">Cadastrar Peso</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWeightModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-3 space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  Data da Pesagem
                </label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full bg-[#0B1016] border border-[#263342] rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  Peso em kg
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  inputMode="decimal"
                  placeholder="ex: 78.4"
                  autoFocus
                  required
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full bg-[#0B1016] border border-[#263342] rounded-xl py-2.5 px-3 text-center text-lg font-bold text-white"
                />
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
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
