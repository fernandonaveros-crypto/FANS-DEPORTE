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
  const { profile, templates, activeSession, setActiveSession } = useApp();
  const [activeTab, setActiveTab] = useState<'inicio' | 'entrenos' | 'historial' | 'perfil'>('inicio');

  if (!profile.onboarded) {
    return <Onboarding />;
  }

  const activeTemplate = activeSession 
    ? templates.find(t => t.id === activeSession.templateId) 
    || templates.find(t => t.name === activeSession.name) // Fallback to name if ID fails
    : null;

  return (
    <div className="min-h-screen bg-bg-dark text-white pb-24">
      {/* Main Content */}
      <main className="max-w-md mx-auto">
        {activeTab === 'inicio' && (
          <Home 
            onNavigateToWorkouts={() => setActiveTab('entrenos')} 
            onStartWorkout={(id) => {
              const workout = templates.find(w => w.id === id);
              if (workout) {
                setActiveSession({
                  id: Math.random().toString(36).substr(2, 9),
                  templateId: workout.id,
                  name: workout.name,
                  startTime: Date.now(),
                  duration: 0,
                  exercises: workout.exercises.map(ex => ({
                    exerciseId: ex.id,
                    name: ex.name,
                    sets: Array.from({ length: ex.sets }).map(() => ({
                      reps: parseInt(ex.reps) || 10,
                      weight: 0,
                      completed: false
                    }))
                  }))
                });
              }
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

      {/* Active Session Modal */}
      {activeSession && activeTemplate && (
        <ActiveSession
          template={activeTemplate}
          onClose={() => setActiveSession(null)}
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
      "flex flex-col items-center gap-1.5 transition-all duration-300",
      active ? "text-brand scale-110" : "text-gray-500 hover:text-gray-400"
    )}
  >
    <div className={cn(
      "p-2 rounded-xl transition-colors",
      active ? "bg-brand/10" : "bg-transparent"
    )}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 26 })}
    </div>
    <span className={cn(
      "text-[10px] font-bold uppercase tracking-wider",
      active ? "opacity-100" : "opacity-60"
    )}>{label}</span>
  </button>
);

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
