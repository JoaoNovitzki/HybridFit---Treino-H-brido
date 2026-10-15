import React from 'react';
import { Dumbbell, Play, Flame } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { useFitness } from '../../context/FitnessContext';

interface HeaderProps {
  onOpenActiveSession?: () => void;
  currentTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenActiveSession, currentTab }) => {
  const { activeSession } = useFitness();

  return (
    <header
      className="relative w-full bg-[#0B1016] border-b border-[#19222D] px-4 pb-3 select-none"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#19222D] border border-[#BEF264]/40 flex items-center justify-center text-[#BEF264] shadow-sm shadow-[#BEF264]/10">
            <Dumbbell className="w-5 h-5 text-[#BEF264]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-lg leading-tight">HybridFit</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#BEF264] animate-pulse" />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Musculação & Cardio</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Workout Banner if session is currently active and not in workout view */}
          {activeSession && currentTab !== 'workout_active' && (
            <button
              onClick={onOpenActiveSession}
              className="flex items-center gap-1.5 bg-[#BEF264] text-[#0B1016] text-xs font-bold px-2.5 py-1.5 rounded-lg animate-bounce transition active:scale-95 shadow-md shadow-[#BEF264]/30"
              title="Continuar treino em andamento"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Em Treino</span>
            </button>
          )}

          <PWAInstallButton variant="compact" />
        </div>
      </div>
    </header>
  );
};
