import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Clock, Dumbbell, ChevronRight, Play, Edit2, Sparkles, Loader2, Circle, CircleDot, CheckCircle2, Share2, Check } from 'lucide-react';
import { useApp } from '../store';
import { WorkoutTemplate, Category, Difficulty } from '../types';
import { cn, imageUrlToBase64 } from '../utils';
import { ActiveSession } from './ActiveSession';
import { editExerciseImage, getExerciseTechnique, generateSpeech, generateExerciseImage } from '../services/geminiService';
import { Wand2, Image as ImageIcon } from 'lucide-react';

const WorkoutImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && <div className="absolute inset-0 shimmer bg-card-dark z-10" />}
      <motion.img
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: isLoading ? 0 : 1, scale: isLoading ? 1.1 : 1 }}
        transition={{ duration: 0.6 }}
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 vignette opacity-30 pointer-events-none" />
    </div>
  );
};

export const Workouts: React.FC = () => {
  const { templates, updateExerciseImage, activeSession, setActiveSession } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('Todos');
  const [difficulty, setDifficulty] = useState<Difficulty | 'Todos'>('Todos');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);
  const [isMagicLoading, setIsMagicLoading] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleShare = async (workout: WorkoutTemplate) => {
    const text = `💪 ¡Mira mi entrenamiento en StrongPulse!
    
🔥 Rutina: ${workout.name}
⏱️ Duración: ${workout.duration} min
📊 Dificultad: ${workout.difficulty}

Ejercicios:
${workout.exercises.map((ex, i) => `${i + 1}. ${ex.name} (${ex.sets} series x ${ex.reps} reps)`).join('\n')}

¡A darle duro! 🏋️‍♂️`;

    try {
      await navigator.clipboard.writeText(text);
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const filteredWorkouts = templates.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'Todos' || w.category === category;
    const matchesDifficulty = difficulty === 'Todos' || w.difficulty === difficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleUpdateImage = (exerciseId: string, currentImage: string) => {
    const newUrl = prompt('Introduce la nueva URL de la imagen para este ejercicio:', currentImage);
    if (newUrl && newUrl !== currentImage) {
      updateExerciseImage(exerciseId, newUrl);
      if (selectedWorkout) {
        const newExercises = selectedWorkout.exercises.map(ex => 
          ex.id === exerciseId ? { ...ex, image: newUrl } : ex
        );
        setSelectedWorkout({ ...selectedWorkout, exercises: newExercises });
      }
    }
  };

  const handleMagicEdit = async (exerciseId: string, currentImage: string) => {
    const promptText = prompt('¿Qué quieres cambiar de la imagen? (ej: "Añade un filtro retro", "Ponlo en un gimnasio futurista")');
    if (!promptText) return;

    setIsMagicLoading(exerciseId);
    try {
      const base64 = await imageUrlToBase64(currentImage);
      const newImageUrl = await editExerciseImage(base64, promptText);
      updateExerciseImage(exerciseId, newImageUrl);
      if (selectedWorkout) {
        const newExercises = selectedWorkout.exercises.map(ex => 
          ex.id === exerciseId ? { ...ex, image: newImageUrl } : ex
        );
        setSelectedWorkout({ ...selectedWorkout, exercises: newExercises });
      }
    } catch (error) {
      console.error('Magic edit failed:', error);
      alert('No se pudo editar la imagen con IA. Inténtalo de nuevo.');
    } finally {
      setIsMagicLoading(null);
    }
  };

  const handleGenerateImage = async (exerciseId: string, exerciseName: string, muscleGroup: string) => {
    setIsGeneratingImage(exerciseId);
    try {
      const newImageUrl = await generateExerciseImage(exerciseName, muscleGroup);
      updateExerciseImage(exerciseId, newImageUrl);
      if (selectedWorkout) {
        const newExercises = selectedWorkout.exercises.map(ex => 
          ex.id === exerciseId ? { ...ex, image: newImageUrl } : ex
        );
        setSelectedWorkout({ ...selectedWorkout, exercises: newExercises });
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      alert('No se pudo generar la imagen con IA. Inténtalo de nuevo.');
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const handleCoachClick = async (exerciseName: string, muscleGroup: string, exerciseId: string) => {
    if (isCoachLoading || isSpeaking) return;
    
    // Unlock audio immediately in the click handler
    const silentAudio = new Audio();
    silentAudio.play().catch(() => {});

    setIsCoachLoading(exerciseId);
    try {
      const technique = await getExerciseTechnique(exerciseName, muscleGroup);
      
      // Speak logic
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      setIsSpeaking(true);
      const audioUrl = await generateSpeech(technique);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
    } catch (error) {
      console.warn('Coach speech failed (likely browser policy):', error);
      setIsSpeaking(false);
      audioRef.current = null;
    } finally {
      setIsCoachLoading(null);
    }
  };

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
            {(['Todos', 'Fuerza', 'Cardio', 'Golf', 'Fútbol', 'Tenis'] as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-full whitespace-nowrap font-medium transition-all border shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95",
                  category === cat 
                    ? "bg-brand text-black border-brand" 
                    : "bg-white/5 text-gray-400 border-white/10"
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
                  "px-6 py-2 rounded-full whitespace-nowrap font-medium transition-all text-sm border shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95",
                  difficulty === diff 
                    ? "border-brand text-brand bg-brand/10" 
                    : "bg-white/5 text-gray-500 border-white/10"
                )}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Workout List */}
        <div className="grid gap-4">
          {filteredWorkouts.map(workout => {
            const isActive = activeSession?.templateId === workout.id;
            return (
              <motion.div
                key={workout.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedWorkout(workout)}
                className="bg-card-dark rounded-3xl overflow-hidden cursor-pointer group"
              >
                <div className="relative h-48">
                  <WorkoutImage
                    src={workout.image}
                    alt={workout.name}
                    className="w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                  
                  {isActive && (
                    <div className="absolute top-4 left-4 bg-brand text-black px-3 py-1.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 animate-pulse shadow-xl shadow-brand/20">
                      <CircleDot size={10} />
                      En progreso
                    </div>
                  )}

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
          );
        })}
      </div>
    </div>

      {/* Workout Detail Modal */}
      <AnimatePresence>
        {selectedWorkout && !activeSession && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-bg-dark z-50 flex flex-col"
          >
            <div className="relative h-80 overflow-hidden">
              <WorkoutImage src={selectedWorkout.image} alt={selectedWorkout.name} className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent h-24" />
              <button
                onClick={() => setSelectedWorkout(null)}
                className="absolute top-6 left-6 p-2 bg-black/50 rounded-full backdrop-blur-md"
              >
                <ChevronRight className="rotate-180" />
              </button>
              <button
                onClick={() => selectedWorkout && handleShare(selectedWorkout)}
                className={cn(
                  "absolute top-6 right-6 p-2 rounded-full backdrop-blur-md transition-all",
                  isShared ? "bg-green-500 text-white" : "bg-black/50 text-white"
                )}
              >
                {isShared ? <Check size={20} /> : <Share2 size={20} />}
              </button>
            </div>

            <div className="flex-1 px-6 -mt-12 relative z-10 overflow-y-auto pb-32">
              <h2 className="text-4xl font-bold mb-2">{selectedWorkout.name}</h2>
              <div className="flex gap-4 mb-8">
                <div className="bg-card-dark p-4 rounded-2xl flex-1 text-center flex flex-col items-center gap-1">
                  <Clock size={16} className="text-gray-500" />
                  <span className="block text-[10px] text-gray-500 uppercase font-bold">Tiempo</span>
                  <span className="font-bold">{selectedWorkout.duration} min</span>
                </div>
                <div className="bg-card-dark p-4 rounded-2xl flex-1 text-center flex flex-col items-center gap-1">
                  <Dumbbell size={16} className="text-gray-500" />
                  <span className="block text-[10px] text-gray-500 uppercase font-bold">Dificultad</span>
                  <span className="font-bold">{selectedWorkout.difficulty}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4">Ejercicios</h3>
              <div className="space-y-4">
                {selectedWorkout.exercises.map((ex, i) => {
                  const sessionExercise = activeSession?.templateId === selectedWorkout.id 
                    ? activeSession.exercises.find(se => se.exerciseId === ex.id)
                    : null;
                  
                  let status: 'pending' | 'in-progress' | 'completed' = 'pending';
                  if (sessionExercise) {
                    const completedSets = sessionExercise.sets.filter(s => s.completed).length;
                    if (completedSets === sessionExercise.sets.length) {
                      status = 'completed';
                    } else if (completedSets > 0) {
                      status = 'in-progress';
                    }
                  }

                  return (
                    <div key={ex.id} className="flex items-start gap-4 bg-card-dark/50 p-4 rounded-[32px] relative group/item border border-white/5 hover:border-brand/30 transition-colors">
                      <div className="relative overflow-hidden rounded-2xl shrink-0">
                        <WorkoutImage src={ex.image} alt={ex.name} className="w-20 h-20 shadow-lg" />
                        <div className="absolute -top-2 -left-2 bg-bg-dark rounded-full p-1.5 shadow-xl border border-white/10 z-20">
                          {status === 'pending' && <Circle size={16} className="text-gray-600" />}
                          {status === 'in-progress' && <CircleDot size={16} className="text-brand animate-pulse" />}
                          {status === 'completed' && <CheckCircle2 size={16} className="text-green-500" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h4 className="font-bold text-lg leading-tight">{ex.name}</h4>
                            <p className="text-sm text-gray-500">{ex.sets} series • {ex.reps} reps</p>
                          </div>
                          <span className="text-brand text-[10px] font-black uppercase tracking-widest bg-brand/10 px-2 py-1 rounded-md">{ex.muscleGroup}</span>
                        </div>
                        
                        <div className="mt-3 space-y-2">
                          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-black mb-1 tracking-widest">Descripción</p>
                            <p className="text-xs text-gray-400 leading-relaxed italic">
                              {ex.description || 'Descripción no disponible.'}
                            </p>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <motion.button 
                              whileTap={{ scale: 0.95 }}
                              disabled={isCoachLoading === ex.id || isSpeaking}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCoachClick(ex.name, ex.muscleGroup, ex.id);
                              }}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg disabled:opacity-50",
                                isCoachLoading === ex.id || isSpeaking ? "bg-brand text-black" : "bg-brand/10 text-brand hover:bg-brand/20"
                              )}
                            >
                              {isCoachLoading === ex.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              Coach IA
                            </motion.button>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              disabled={isGeneratingImage === ex.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateImage(ex.id, ex.name, ex.muscleGroup);
                              }}
                              className="p-2.5 bg-brand/10 rounded-xl text-brand hover:bg-brand/20 transition-all shadow-lg disabled:opacity-50"
                              title="Generar nueva imagen (IA)"
                            >
                              {isGeneratingImage === ex.id ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                            </motion.button>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              disabled={isMagicLoading === ex.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMagicEdit(ex.id, ex.image);
                              }}
                              className="p-2.5 bg-gray-800/80 rounded-xl text-gray-300 hover:text-brand hover:bg-brand/10 transition-all shadow-lg disabled:opacity-50"
                              title="Edición Mágica (IA)"
                            >
                              {isMagicLoading === ex.id ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                            </motion.button>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateImage(ex.id, ex.image);
                              }}
                              className="p-2.5 bg-gray-800/80 rounded-xl text-gray-300 hover:text-brand hover:bg-brand/10 transition-all shadow-lg"
                              title="Cambiar imagen (URL)"
                            >
                              <Edit2 size={16} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-dark via-bg-dark to-transparent">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Unlock audio
                  const unlockAudio = new Audio();
                  unlockAudio.play().catch(() => {});
                  
                  if (selectedWorkout) {
                    const newSession = {
                      id: Math.random().toString(36).substr(2, 9),
                      templateId: selectedWorkout.id,
                      name: selectedWorkout.name,
                      startTime: Date.now(),
                      duration: 0,
                      exercises: selectedWorkout.exercises.map(ex => ({
                        exerciseId: ex.id,
                        name: ex.name,
                        sets: Array.from({ length: ex.sets }).map(() => ({
                          reps: parseInt(ex.reps) || 10,
                          weight: 0,
                          completed: false
                        }))
                      }))
                    };
                    setActiveSession(newSession);
                    setSelectedWorkout(null);
                  }
                }}
                className="w-full bg-brand text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl shadow-brand/20 relative z-50"
              >
                <Play size={20} fill="currentColor" />
                Iniciar entreno
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
