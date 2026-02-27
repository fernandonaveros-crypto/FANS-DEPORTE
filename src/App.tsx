import React, { useState } from 'react';
import { AppProvider, useApp } from './store';
import { Home } from './components/Home';
import { Workouts } from './components/Workouts';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { Onboarding } from './components/Onboarding';
import { ActiveSession } from './components/ActiveSession';
import { Home as HomeIcon, Dumbbell, History as HistoryIcon, User } from 'lucide-react';
import { cn } from './utils';
import { WORKOUT_TEMPLATES } from './data';
import { WorkoutTemplate } from './types';

const AppContent: React.FC = () => {
  const { profile } = useApp();
  const [activeTab, setActiveTab] = useState<'inicio' | 'entrenos' | 'historial' | 'perfil'>('inicio');
  const [quickStartWorkout, setQuickStartWorkout] = useState<WorkoutTemplate | null>(null);

  if (!profile.onboarded) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-24">
      {/* Main Content */}
      <main className="max-w-md mx-auto">
        {activeTab === 'inicio' && (
          <Home 
            onNavigateToWorkouts={() => setActiveTab('entrenos')} 
            onStartWorkout={(id) => {
              const workout = WORKOUT_TEMPLATES.find(w => w.id === id);
              if (workout) setQuickStartWorkout(workout);
            }}
          />
        )}
        {activeTab === 'entrenos' && <Workouts />}
        {activeTab === 'historial' && <History />}
        {activeTab === 'perfil' && <Profile />}
      </main>

      {/* Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-dark/80 backdrop-blur-xl border-t border-white/5 px-6 py-4 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <TabButton
            active={activeTab === 'inicio'}
            onClick={() => setActiveTab('inicio')}
            icon={<HomeIcon size={24} />}
            label="Inicio"
          />
          <TabButton
            active={activeTab === 'entrenos'}
            onClick={() => setActiveTab('entrenos')}
            icon={<Dumbbell size={24} />}
            label="Entrenos"
          />
          <TabButton
            active={activeTab === 'historial'}
            onClick={() => setActiveTab('historial')}
            icon={<HistoryIcon size={24} />}
            label="Historial"
          />
          <TabButton
            active={activeTab === 'perfil'}
            onClick={() => setActiveTab('perfil')}
            icon={<User size={24} />}
            label="Perfil"
          />
        </div>
      </nav>

      {/* Quick Start Session Modal */}
      {quickStartWorkout && (
        <ActiveSession
          template={quickStartWorkout}
          onClose={() => setQuickStartWorkout(null)}
        />
      )}
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1 transition-all",
      active ? "text-brand" : "text-gray-500"
    )}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
