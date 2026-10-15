import React, { useState } from 'react';
import {
  Settings,
  User,
  Clock,
  Timer,
  Volume2,
  Vibrate,
  FileDown,
  FileUp,
  RotateCcw,
  Trash2,
  Dumbbell,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowUp,
  ArrowDown,
  Info,
  Scale,
} from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';
import { downloadBackupFile } from '../../services/storage';
import { WorkoutDayPlan, Exercise } from '../../types/fitness';
import { PWAInstallButton } from '../common/PWAInstallButton';

export const SettingsView: React.FC = () => {
  const {
    data,
    updateUserSettings,
    updateWorkoutPlans,
    resetPlansToDefault,
    resetAllData,
    importBackup,
    addWeightLog,
  } = useFitness();

  const [userName, setUserName] = useState(data.settings.userName);
  const [defaultDuration, setDefaultDuration] = useState(data.settings.defaultWorkoutDurationMin);
  const [defaultRest, setDefaultRest] = useState(data.settings.defaultRestTimerSeconds);
  const [autoStartTimer, setAutoStartTimer] = useState(data.settings.autoStartRestTimer);
  const [soundEnabled, setSoundEnabled] = useState(data.settings.soundEnabled);
  const [vibrationEnabled, setVibrationEnabled] = useState(data.settings.vibrationEnabled);

  const [savedFeedback, setSavedFeedback] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null);

  // Routine editor state
  const [selectedDayPlanIndex, setSelectedDayPlanIndex] = useState<number>(1); // Monday default
  const [showRoutineEditor, setShowRoutineEditor] = useState<boolean>(false);
  const [editingPlans, setEditingPlans] = useState<WorkoutDayPlan[]>(() =>
    JSON.parse(JSON.stringify(data.plans))
  );

  // New exercise inputs
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('');
  const [newExSets, setNewExSets] = useState(2);
  const [newExReps, setNewExReps] = useState('8-10');

  // Handle general settings save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserSettings({
      userName: userName.trim() || 'Atleta',
      defaultWorkoutDurationMin: Number(defaultDuration) || 40,
      defaultRestTimerSeconds: Number(defaultRest) || 60,
      autoStartRestTimer: autoStartTimer,
      soundEnabled,
      vibrationEnabled,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  // Routine editor actions
  const currentPlan = editingPlans[selectedDayPlanIndex];

  const handleUpdateExField = (exIndex: number, field: keyof Exercise, value: any) => {
    const copy = JSON.parse(JSON.stringify(editingPlans));
    copy[selectedDayPlanIndex].exercises[exIndex][field] = value;
    setEditingPlans(copy);
  };

  const handleMoveEx = (exIndex: number, direction: 'up' | 'down') => {
    const copy = JSON.parse(JSON.stringify(editingPlans));
    const list = copy[selectedDayPlanIndex].exercises;
    const targetIdx = direction === 'up' ? exIndex - 1 : exIndex + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[exIndex];
    list[exIndex] = list[targetIdx];
    list[targetIdx] = temp;
    setEditingPlans(copy);
  };

  const handleDeleteEx = (exIndex: number) => {
    const copy = JSON.parse(JSON.stringify(editingPlans));
    copy[selectedDayPlanIndex].exercises.splice(exIndex, 1);
    setEditingPlans(copy);
  };

  const handleAddNewExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const copy = JSON.parse(JSON.stringify(editingPlans));
    const newEx: Exercise = {
      id: `custom-${Date.now()}`,
      name: newExName.trim(),
      targetMuscle: newExMuscle.trim() || 'Geral',
      defaultSets: Number(newExSets) || 2,
      targetRepsRange: newExReps.trim() || '8-10',
    };

    copy[selectedDayPlanIndex].exercises.push(newEx);
    setEditingPlans(copy);
    setNewExName('');
    setNewExMuscle('');
  };

  const handleSaveRoutineChanges = () => {
    updateWorkoutPlans(editingPlans);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  // Export JSON
  const handleExport = () => {
    downloadBackupFile(data);
  };

  // Import JSON via file reader
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importBackup(content);
      if (res.success) {
        setImportStatus({ message: 'Backup importado com sucesso!', isError: false });
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus({ message: res.error || 'Erro ao importar.', isError: true });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto space-y-5 animate-fade-in text-left">
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">Configurações</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Personalize preferências, ficha semanal e gerencie backups locais
        </p>
      </div>

      {/* PWA Install Promotion Box if installable */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#19222D] to-[#131A22] border border-[#BEF264]/30 shadow-md">
        <div className="flex items-center gap-2 mb-1 text-[#BEF264]">
          <Settings className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Aplicativo no Celular</h3>
        </div>
        <p className="text-xs text-gray-300 mb-3">
          Instale o HybridFit na tela inicial para usar offline e sem a barra do navegador.
        </p>
        <PWAInstallButton variant="full" />
      </div>

      {/* GENERAL PREFERENCES FORM */}
      <form onSubmit={handleSaveSettings} className="rounded-3xl bg-[#19222D] border border-[#263342] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-[#BEF264]" />
          <span>Preferências do Atleta</span>
        </h3>

        {/* User Name */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Seu Nome / Apelido</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full bg-[#0B1016] border border-[#263342] rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-[#BEF264]"
          />
        </div>

        {/* Default Workout Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Duração Prevista</label>
            <div className="relative">
              <input
                type="number"
                min="15"
                max="120"
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(Number(e.target.value))}
                className="w-full bg-[#0B1016] border border-[#263342] rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-[#BEF264]"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-500">min</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Descanso Padrão</label>
            <select
              value={defaultRest}
              onChange={(e) => setDefaultRest(Number(e.target.value))}
              className="w-full bg-[#0B1016] border border-[#263342] rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-[#BEF264]"
            >
              <option value={45}>45 segundos</option>
              <option value={60}>60 segundos</option>
              <option value={90}>90 segundos</option>
              <option value={120}>120 segundos</option>
            </select>
          </div>
        </div>

        {/* Toggle options */}
        <div className="space-y-3 pt-2 border-t border-[#263342]">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-gray-300">Iniciar descanso automático ao concluir série</span>
            <input
              type="checkbox"
              checked={autoStartTimer}
              onChange={(e) => setAutoStartTimer(e.target.checked)}
              className="w-4 h-4 accent-[#BEF264] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-gray-300">Efeitos sonoros (chime e contagem regressiva)</span>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#BEF264] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-gray-300">Vibração háptica no celular</span>
            <input
              type="checkbox"
              checked={vibrationEnabled}
              onChange={(e) => setVibrationEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#BEF264] rounded cursor-pointer"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-[#BEF264] text-[#0B1016] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
        >
          {savedFeedback ? <Check className="w-4 h-4 stroke-[3]" /> : null}
          <span>{savedFeedback ? 'Preferências Salvas!' : 'Salvar Preferências'}</span>
        </button>
      </form>

      {/* ROUTINE & EXERCISE EDITOR */}
      <div className="rounded-3xl bg-[#19222D] border border-[#263342] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-[#BEF264]" />
            <h3 className="text-sm font-bold text-white">Editar Ficha de Exercícios</h3>
          </div>
          <button
            onClick={() => setShowRoutineEditor(!showRoutineEditor)}
            className="text-xs text-[#BEF264] font-semibold flex items-center gap-1"
          >
            <span>{showRoutineEditor ? 'Ocultar' : 'Personalizar'}</span>
            {showRoutineEditor ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Você pode trocar exercícios, alterar séries e reordenar. (As edições não alteram treinos já concluídos no histórico).
        </p>

        {showRoutineEditor && (
          <div className="space-y-4 pt-2 border-t border-[#263342]">
            {/* Day selector */}
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Escolha o treino para editar:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {editingPlans.map((p, idx) => (
                  <button
                    key={p.dayOfWeek}
                    type="button"
                    onClick={() => setSelectedDayPlanIndex(idx)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                      selectedDayPlanIndex === idx
                        ? 'bg-[#BEF264] text-[#0B1016]'
                        : 'bg-[#0B1016] text-gray-400 border border-[#263342]'
                    }`}
                  >
                    {p.dayName.split('-')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Current day details */}
            <div className="p-3 rounded-2xl bg-[#0B1016] border border-[#263342]">
              <h4 className="text-xs font-bold text-white">{currentPlan.title}</h4>
              <p className="text-[11px] text-gray-400">{currentPlan.goal}</p>
            </div>

            {/* List of exercises in current plan */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                Exercícios Cadastrados ({currentPlan.exercises.length})
              </span>

              {currentPlan.exercises.map((ex, exIdx) => (
                <div
                  key={ex.id}
                  className="p-3 rounded-2xl bg-[#0B1016] border border-[#263342] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex-1">{ex.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveEx(exIdx, 'up')}
                        disabled={exIdx === 0}
                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveEx(exIdx, 'down')}
                        disabled={exIdx === currentPlan.exercises.length - 1}
                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEx(exIdx)}
                        className="p-1 text-red-400 hover:text-red-300"
                        title="Excluir exercício"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-gray-400 block">Séries</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={ex.defaultSets}
                        onChange={(e) => handleUpdateExField(exIdx, 'defaultSets', Number(e.target.value))}
                        className="w-full bg-[#19222D] border border-[#263342] rounded-lg py-1 px-2 text-xs font-semibold text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block">Faixa de Reps</label>
                      <input
                        type="text"
                        value={ex.targetRepsRange}
                        onChange={(e) => handleUpdateExField(exIdx, 'targetRepsRange', e.target.value)}
                        placeholder="8-10"
                        className="w-full bg-[#19222D] border border-[#263342] rounded-lg py-1 px-2 text-xs font-semibold text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new exercise form */}
            <form onSubmit={handleAddNewExercise} className="p-3 rounded-2xl bg-[#0B1016]/60 border border-dashed border-[#263342] space-y-2">
              <span className="text-xs font-bold text-gray-300 block">+ Adicionar Novo Exercício</span>
              <input
                type="text"
                placeholder="Nome do Exercício (ex: Crossover na polia)"
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                className="w-full bg-[#19222D] border border-[#263342] rounded-xl py-1.5 px-3 text-xs text-white"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Músculo (ex: Peitoral)"
                  value={newExMuscle}
                  onChange={(e) => setNewExMuscle(e.target.value)}
                  className="bg-[#19222D] border border-[#263342] rounded-xl py-1.5 px-2 text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Séries"
                  min="1"
                  max="10"
                  value={newExSets}
                  onChange={(e) => setNewExSets(Number(e.target.value))}
                  className="bg-[#19222D] border border-[#263342] rounded-xl py-1.5 px-2 text-xs text-white text-center"
                />
                <input
                  type="text"
                  placeholder="Reps (8-10)"
                  value={newExReps}
                  onChange={(e) => setNewExReps(e.target.value)}
                  className="bg-[#19222D] border border-[#263342] rounded-xl py-1.5 px-2 text-xs text-white text-center"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 rounded-xl bg-[#263342] hover:bg-[#324357] text-white text-xs font-bold"
              >
                Inserir no Treino
              </button>
            </form>

            {/* Save routine changes button */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Restaurar todas as fichas para a versão original de fábrica?')) {
                    resetPlansToDefault();
                    setEditingPlans(JSON.parse(JSON.stringify(data.plans)));
                  }
                }}
                className="text-xs text-gray-400 hover:text-white underline"
              >
                Restaurar padrão
              </button>

              <button
                type="button"
                onClick={handleSaveRoutineChanges}
                className="py-2 px-4 rounded-xl bg-[#BEF264] text-[#0B1016] text-xs font-bold shadow-sm"
              >
                Salvar Alterações na Ficha
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BACKUP & RESTORE SECTION */}
      <div className="rounded-3xl bg-[#19222D] border border-[#263342] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileDown className="w-4 h-4 text-[#BEF264]" />
          <span>Backup & Exportação dos Dados</span>
        </h3>

        <div className="p-3 rounded-2xl bg-[#0B1016] border border-[#263342] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Seus dados ficam armazenados localmente no navegador deste dispositivo. Recomendamos exportar um backup periodicamente para transferir ou restaurar quando trocar de celular.
          </p>
        </div>

        {importStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-bold ${
              importStatus.isError
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {importStatus.message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#0B1016] border border-[#263342] text-xs font-bold text-white hover:border-[#BEF264]/40 transition active:scale-95"
          >
            <FileDown className="w-4 h-4 text-[#BEF264]" />
            <span>Exportar JSON</span>
          </button>

          <label className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#0B1016] border border-[#263342] text-xs font-bold text-white hover:border-[#BEF264]/40 transition active:scale-95 cursor-pointer">
            <FileUp className="w-4 h-4 text-blue-400" />
            <span>Importar JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* DANGER ZONE: RESET DATA */}
      <div className="rounded-3xl bg-[#19222D] border border-red-500/30 p-5 space-y-3">
        <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>Zona de Perigo</span>
        </h3>
        <p className="text-xs text-gray-400">
          Limpa todo o histórico de treinos, cargas e pesagens salvos neste aparelho.
        </p>

        {showResetConfirm ? (
          <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-3">
            <p className="text-xs font-bold text-red-200">
              Tem certeza absoluta? Esta ação não pode ser desfeita.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-2 rounded-xl bg-[#263342] text-xs font-bold text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                }}
                className="py-2 rounded-xl bg-red-600 text-xs font-bold text-white"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold transition"
          >
            Limpar todos os dados do aplicativo
          </button>
        )}
      </div>

      {/* App Version Info */}
      <div className="text-center text-[10px] text-gray-600 pb-4">
        <p>HybridFit • Versão 1.0.0 (Offline PWA)</p>
        <p>Desenvolvido para smartphones e alta performance</p>
      </div>
    </div>
  );
};
