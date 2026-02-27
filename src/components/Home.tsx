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
  const { profile, history } = useApp();
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
        <StatCard icon={<Flame className="text-orange-500" />} value={streak} label="Racha" />
        <StatCard icon={<Clock className="text-blue-500" />} value={totalMinutes} label="Min totales" />
        <StatCard icon={<Dumbbell className="text-green-500" />} value={history.length} label="Entrenos" />
      </div>

      {/* Quick Start Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Inicio rápido</h2>
          <button onClick={onNavigateToWorkouts} className="text-brand text-sm font-bold flex items-center gap-1">
            Ver todos <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
          {WORKOUT_TEMPLATES.slice(0, 3).map(workout => (
            <motion.div
              key={workout.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStartWorkout(workout.id)}
              className="min-w-[240px] bg-card-dark p-5 rounded-[2rem] space-y-4 cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Dumbbell size={80} />
              </div>
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand">
                <Play size={24} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{workout.name}</h3>
                <p className="text-sm text-gray-500">{workout.duration} min • {workout.exercises.length} ejercicios</p>
              </div>
              <div className={cn(
                "inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase",
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
          <h2 className="text-2xl font-bold">Último entreno</h2>
          <div className="bg-card-dark p-6 rounded-[2rem] flex items-center gap-4">
            <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
              <Dumbbell size={32} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{lastWorkout.name}</h3>
              <p className="text-sm text-gray-500">{formatDuration(lastWorkout.duration)} • {lastWorkout.exercises.length} ejercicios</p>
            </div>
            <ChevronRight className="text-gray-600" />
          </div>
        </section>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; value: number | string; label: string }> = ({ icon, value, label }) => (
  <div className="bg-card-dark p-4 rounded-3xl flex flex-col items-center justify-center space-y-2">
    {icon}
    <span className="text-2xl font-bold">{value}</span>
    <span className="text-[10px] text-gray-500 uppercase font-bold">{label}</span>
  </div>
);
