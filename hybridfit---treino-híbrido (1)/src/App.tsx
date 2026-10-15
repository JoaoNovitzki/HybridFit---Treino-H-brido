import React, { useState } from 'react';
import { FitnessProvider, useFitness } from './context/FitnessContext';
import { Header } from './components/layout/Header';
import { BottomNav, TabType } from './components/layout/BottomNav';
import { HomeDashboard } from './components/home/HomeDashboard';
import { WorkoutsList } from './components/workout/WorkoutsList';
import { EvolutionDashboard } from './components/evolution/EvolutionDashboard';
import { SettingsView } from './components/settings/SettingsView';
import { ActiveWorkoutSession } from './components/workout/ActiveWorkoutSession';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { WorkoutDayPlan } from './types/fitness';

function MainApp() {
  const { activeSession, startWorkout } = useFitness();
  const [currentTab, setCurrentTab] = useState<TabType | 'workout_active'>('home');

  const handleStartWorkout = (plan: WorkoutDayPlan) => {
    // If not already in an active session, initiate it
    if (!activeSession) {
      startWorkout(plan);
    }
    setCurrentTab('workout_active');
  };

  const handleOpenActiveSession = () => {
    setCurrentTab('workout_active');
  };

  const handleBackToHome = () => {
    setCurrentTab('home');
  };

  return (
    <div className="min-h-screen bg-[#0B1016] text-white flex flex-col selection:bg-[#BEF264] selection:text-[#0B1016]">
      {/* Offline Status indicator */}
      <OfflineIndicator />

      {/* Header bar */}
      <Header
        currentTab={currentTab}
        onOpenActiveSession={handleOpenActiveSession}
      />

      {/* Main Screen Content */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {currentTab === 'workout_active' && (
          <ActiveWorkoutSession onBackToHome={handleBackToHome} />
        )}

        {currentTab === 'home' && (
          <HomeDashboard
            onStartWorkout={handleStartWorkout}
            onOpenEvolution={() => setCurrentTab('evolution')}
            onOpenWorkouts={() => setCurrentTab('workouts')}
          />
        )}

        {currentTab === 'workouts' && (
          <WorkoutsList onStartWorkout={handleStartWorkout} />
        )}

        {currentTab === 'evolution' && (
          <EvolutionDashboard />
        )}

        {currentTab === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Fixed Bottom Navigation (hidden during active workout to maximize focus, or accessible via back) */}
      {currentTab !== 'workout_active' && (
        <BottomNav
          currentTab={currentTab as TabType}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <FitnessProvider>
      <MainApp />
    </FitnessProvider>
  );
}
