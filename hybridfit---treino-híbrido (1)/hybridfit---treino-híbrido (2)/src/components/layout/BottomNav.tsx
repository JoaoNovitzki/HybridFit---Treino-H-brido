import React from 'react';
import { Home, Dumbbell, TrendingUp, Settings } from 'lucide-react';
import { useFitness } from '../../context/FitnessContext';

export type TabType = 'home' | 'workouts' | 'evolution' | 'settings';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { activeSession } = useFitness();

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'workouts', label: 'Treinos', icon: Dumbbell },
    { id: 'evolution', label: 'Evolução', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1016] border-t border-[#19222D] select-none"
      style={{
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 transition-all duration-200 select-none ${
                isActive ? 'text-[#BEF264]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.id === 'workouts' && activeSession && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#BEF264] ring-2 ring-[#0B1016] animate-pulse" />
                )}
              </div>
              <span className={`text-[11px] mt-1 font-medium tracking-tight ${isActive ? 'font-bold text-[#BEF264]' : ''}`}>
                {item.label}
              </span>

              {/* Active pill dot indicator */}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#BEF264] mt-0.5 shadow-sm shadow-[#BEF264]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
