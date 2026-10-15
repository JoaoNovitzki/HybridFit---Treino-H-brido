import React, { useState, useEffect, useRef } from 'react';
import { Timer, X, Play, Pause, RotateCcw, Plus, Minus, Volume2, VolumeX } from 'lucide-react';
import { playCountdownTick, playTimerCompleteSound, triggerHaptic } from '../../services/audio';
import { useFitness } from '../../context/FitnessContext';

interface RestTimerModalProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  initialSeconds = 60,
  isOpen,
  onClose,
}) => {
  const { data } = useFitness();
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isMuted, setIsMuted] = useState(!data.settings.soundEnabled);

  const prevRemainingRef = useRef(remainingSeconds);

  // Sync initial seconds when opened
  useEffect(() => {
    if (isOpen) {
      setTotalSeconds(initialSeconds);
      setRemainingSeconds(initialSeconds);
      setIsRunning(true);
    }
  }, [isOpen, initialSeconds]);

  // Timer interval
  useEffect(() => {
    if (!isOpen || !isRunning) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);

          // Completion alert
          if (!isMuted) {
            playTimerCompleteSound();
          }
          if (data.settings.vibrationEnabled) {
            triggerHaptic([300, 100, 300, 100, 400]);
          }
          return 0;
        }

        // Countdown tick for last 3 seconds (3, 2, 1)
        if (prev <= 4 && prev > 1 && !isMuted) {
          playCountdownTick();
          if (data.settings.vibrationEnabled) {
            triggerHaptic(40);
          }
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning, isMuted, data.settings.vibrationEnabled]);

  if (!isOpen) return null;

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 100;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectPreset = (sec: number) => {
    setTotalSeconds(sec);
    setRemainingSeconds(sec);
    setIsRunning(true);
  };

  const adjustTime = (delta: number) => {
    setRemainingSeconds((prev) => Math.max(5, prev + delta));
    setTotalSeconds((prev) => Math.max(5, prev + delta));
  };

  const handleReset = () => {
    setRemainingSeconds(totalSeconds);
    setIsRunning(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[#19222D] border border-[#263342] p-6 shadow-2xl relative text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2 text-[#BEF264]">
            <Timer className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-wider">Descanso Entre Séries</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition"
              title={isMuted ? 'Ativar som' : 'Silenciar som'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#BEF264]" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Circular / Big Timer Display */}
        <div className="relative my-6 flex flex-col items-center justify-center">
          <div className="w-44 h-44 rounded-full border-4 border-[#263342] flex items-center justify-center relative overflow-hidden bg-[#0B1016]/80 shadow-inner">
            {/* SVG circle progress */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="80"
                stroke="#BEF264"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 80}
                strokeDashoffset={2 * Math.PI * 80 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                className="transition-all duration-500 ease-linear"
              />
            </svg>

            <div className="relative z-10 flex flex-col items-center">
              <span
                className={`text-4xl font-extrabold tracking-tight font-mono ${
                  remainingSeconds === 0 ? 'text-[#BEF264] animate-bounce' : 'text-white'
                }`}
              >
                {formatTime(remainingSeconds)}
              </span>
              <span className="text-xs uppercase tracking-wider text-gray-400 mt-1 font-semibold">
                {remainingSeconds === 0 ? 'PRONTO PARA A SÉRIE!' : isRunning ? 'DESCANSANDO' : 'PAUSADO'}
              </span>
            </div>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[45, 60, 90, 120].map((sec) => (
            <button
              key={sec}
              onClick={() => handleSelectPreset(sec)}
              className={`py-2 px-1 text-xs font-semibold rounded-xl border transition ${
                totalSeconds === sec
                  ? 'bg-[#BEF264] text-[#0B1016] border-[#BEF264]'
                  : 'bg-[#0B1016]/60 text-gray-300 border-[#263342] hover:border-gray-500'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>

        {/* Adjust Buttons (+/- 15s) and Play/Pause */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={() => adjustTime(-15)}
            className="p-2.5 rounded-xl bg-[#0B1016] border border-[#263342] text-gray-300 hover:text-white active:scale-95 transition"
            title="Diminuir 15s"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition active:scale-95 ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-[#BEF264] text-[#0B1016] shadow-md shadow-[#BEF264]/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span className="text-xs">Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span className="text-xs">Continuar</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-[#0B1016] border border-[#263342] text-gray-300 hover:text-white active:scale-95 transition"
            title="Reiniciar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => adjustTime(15)}
            className="p-2.5 rounded-xl bg-[#0B1016] border border-[#263342] text-gray-300 hover:text-white active:scale-95 transition"
            title="Aumentar 15s"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#263342] text-xs font-semibold text-gray-200 hover:bg-[#324357] transition"
        >
          Minimizar / Voltar ao Treino
        </button>
      </div>
    </div>
  );
};
