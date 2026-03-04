import React from 'react';
import { useApp } from '../store';
import { getGreeting, formatDuration } from '../utils';
import { motion } from 'motion/react';
import { Flame, Clock, Dumbbell, ChevronRight, Play, Trophy } from 'lucide-react';
import { WORKOUT_TEMPLATES } from '../data';
import { cn } from '../utils';

interface HomeProps {
  onNavigateToWorkouts: () => void;
  onStartWorkout: (id: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigateToWorkouts, onStartWorkout }) => {
  const { profile, history, templates } = useApp();
  const greeting = getGreeting();

  const lastWorkout = history[0];
  const weeklyWorkouts = history.filter(s => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
    startOfWeek.setHours(0, 0, 0, 0);
    return s.startTime >= startOfWeek.getTime();
  }).length;

  const totalMinutes = Math.floor(history.reduce((acc, s) => acc + s.duration, 0) / 60);
  const streak = 0; // Simplified for now

  return (
    <div className="p-6 pb-24 space-y-8">
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-gray-500 text-sm font-medium">{greeting}</p>
          <h1 className="text-4xl font-bold">¿Listo para entrenar?</h1>
        </div>
        <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-black shadow-lg shadow-brand/20">
          <Dumbbell size={28} />
        </div>
      </header>

      {/* Weekly Goal Card */}
      <div className="bg-card-dark p-6 rounded-[2rem] space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-brand">
            <Trophy size={20} />
            <span className="font-bold">Meta semanal</span>
          </div>
          <span className="text-brand font-bold">{weeklyWorkouts}/{profile.weeklyGoal}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((weeklyWorkouts / profile.weeklyGoal) * 100, 100)}%` }}
            className="h-full bg-brand"
          />
        </div>
        <div className="flex justify-between px-1">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-gray-500 font-bold">{day}</span>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                i < weeklyWorkouts ? "bg-brand" : "bg-gray-800"
              )} />
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Flame size={24} className="text-orange-500" />} value={streak} label="Racha" />
        <StatCard icon={<Clock size={24} className="text-blue-500" />} value={totalMinutes} label="Min totales" />
        <StatCard icon={<Dumbbell size={24} className="text-green-500" />} value={history.length} label="Entrenos" />
      </div>

      {/* Quick Start Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Inicio rápido</h2>
          <button 
            onClick={onNavigateToWorkouts} 
            className="bg-white/5 hover:bg-white/10 text-brand text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 transition-all border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95"
          >
            Ver todos <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid gap-4">
          {templates.map(workout => (
            <motion.div
              key={workout.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStartWorkout(workout.id)}
              className="bg-card-dark p-5 rounded-[2rem] flex items-center gap-4 cursor-pointer relative overflow-hidden group border border-white/5"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Dumbbell size={60} />
              </div>
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-lg relative">
                <img src={workout.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Play size={20} className="text-white fill-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">{workout.name}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><Clock size={12} /> {workout.duration} min</span>
                  <span className="flex items-center gap-1"><Dumbbell size={12} /> {workout.exercises.length} ej.</span>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-bold uppercase shrink-0",
                workout.difficulty === 'Principiante' ? "bg-green-500/20 text-green-500" :
                workout.difficulty === 'Intermedio' ? "bg-blue-500/20 text-blue-500" :
                "bg-red-500/20 text-red-500"
              )}>
                {workout.difficulty}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Last Workout */}
      {lastWorkout && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Último entreno</h2>
            <button 
              onClick={() => {
                // Assuming we can navigate to history, but for now let's just use a placeholder or navigation if available
                // If onNavigateToHistory is not in props, we might need to add it or just keep it as a UI element
              }} 
              className="bg-white/5 hover:bg-white/10 text-brand text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 transition-all border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95"
            >
              Ver historial <ChevronRight size={14} />
            </button>
          </div>
          <div className="bg-card-dark p-6 rounded-[2rem] flex items-center gap-4 border border-white/5">
            <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
              <Dumbbell size={32} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{lastWorkout.name}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1"><Clock size={14} /> {formatDuration(lastWorkout.duration)}</span>
                <span className="flex items-center gap-1"><Dumbbell size={14} /> {lastWorkout.exercises.length}</span>
              </div>
            </div>
            <ChevronRight className="text-gray-600" />
          </div>
        </section>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; value: number | string; label: string }> = ({ icon, value, label }) => (
  <div className="bg-card-dark p-5 rounded-[2rem] flex flex-col items-center justify-center space-y-3 border border-white/5 shadow-xl">
    <div className="p-3 bg-white/5 rounded-2xl">
      {icon}
    </div>
    <div className="text-center">
      <span className="text-2xl font-bold block">{value}</span>
      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</span>
    </div>
  </div>
);
