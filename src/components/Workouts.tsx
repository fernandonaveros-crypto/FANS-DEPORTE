import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Clock, Dumbbell, ChevronRight, Play } from 'lucide-react';
import { WORKOUT_TEMPLATES } from '../data';
import { WorkoutTemplate, Category, Difficulty } from '../types';
import { cn } from '../utils';
import { ActiveSession } from './ActiveSession';

export const Workouts: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('Todos');
  const [difficulty, setDifficulty] = useState<Difficulty | 'Todos'>('Todos');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const filteredWorkouts = WORKOUT_TEMPLATES.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'Todos' || w.category === category;
    const matchesDifficulty = difficulty === 'Todos' || w.difficulty === difficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="pb-24">
      <div className="p-6 space-y-6">
        <h1 className="text-4xl font-bold">Entrenamientos</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Buscar entreno..."
            className="w-full bg-card-dark border-none rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['Todos', 'Fuerza', 'Cardio'] as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-full whitespace-nowrap font-medium transition-all",
                  category === cat ? "bg-brand text-black" : "bg-card-dark text-gray-400"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['Todos', 'Principiante', 'Intermedio', 'Avanzado'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={cn(
                  "px-6 py-2 rounded-full whitespace-nowrap font-medium transition-all text-sm",
                  difficulty === diff ? "border-brand text-brand border" : "bg-card-dark text-gray-500"
                )}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Workout List */}
        <div className="grid gap-4">
          {filteredWorkouts.map(workout => (
            <motion.div
              key={workout.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedWorkout(workout)}
              className="bg-card-dark rounded-3xl overflow-hidden cursor-pointer group"
            >
              <div className="relative h-40">
                <img
                  src={workout.image}
                  alt={workout.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-bold">{workout.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-300 mt-1">
                      <span className="flex items-center gap-1"><Clock size={14} /> {workout.duration} min</span>
                      <span className="flex items-center gap-1"><Dumbbell size={14} /> {workout.exercises.length} ejercicios</span>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold uppercase",
                    workout.difficulty === 'Principiante' ? "bg-green-500/20 text-green-500" :
                    workout.difficulty === 'Intermedio' ? "bg-blue-500/20 text-blue-500" :
                    "bg-red-500/20 text-red-500"
                  )}>
                    {workout.difficulty}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Workout Detail Modal */}
      <AnimatePresence>
        {selectedWorkout && !isStarting && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-bg-dark z-50 flex flex-col"
          >
            <div className="relative h-72">
              <img src={selectedWorkout.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-dark to-transparent" />
              <button
                onClick={() => setSelectedWorkout(null)}
                className="absolute top-6 left-6 p-2 bg-black/50 rounded-full backdrop-blur-md"
              >
                <ChevronRight className="rotate-180" />
              </button>
            </div>

            <div className="flex-1 px-6 -mt-12 relative z-10 overflow-y-auto pb-32">
              <h2 className="text-4xl font-bold mb-2">{selectedWorkout.name}</h2>
              <div className="flex gap-4 mb-8">
                <div className="bg-card-dark p-4 rounded-2xl flex-1 text-center">
                  <span className="block text-xs text-gray-500 uppercase">Tiempo</span>
                  <span className="font-bold">{selectedWorkout.duration} min</span>
                </div>
                <div className="bg-card-dark p-4 rounded-2xl flex-1 text-center">
                  <span className="block text-xs text-gray-500 uppercase">Dificultad</span>
                  <span className="font-bold">{selectedWorkout.difficulty}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4">Ejercicios</h3>
              <div className="space-y-4">
                {selectedWorkout.exercises.map((ex, i) => (
                  <div key={ex.id} className="flex items-center gap-4 bg-card-dark/50 p-3 rounded-2xl">
                    <img src={ex.image} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <h4 className="font-bold">{ex.name}</h4>
                      <p className="text-sm text-gray-500">{ex.sets} series • {ex.reps} reps</p>
                    </div>
                    <span className="text-brand text-xs font-bold uppercase">{ex.muscleGroup}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-dark via-bg-dark to-transparent">
              <button
                onClick={() => setIsStarting(true)}
                className="w-full bg-brand text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                <Play size={20} fill="currentColor" />
                Iniciar entreno
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isStarting && selectedWorkout && (
        <ActiveSession
          template={selectedWorkout}
          onClose={() => {
            setIsStarting(false);
            setSelectedWorkout(null);
          }}
        />
      )}
    </div>
  );
};
