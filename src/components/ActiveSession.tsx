import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Check, Play, Square, Timer } from 'lucide-react';
import { useApp } from '../store';
import { WorkoutTemplate, WorkoutSession, CompletedSet } from '../types';
import { cn, formatDuration } from '../utils';

interface ActiveSessionProps {
  template: WorkoutTemplate;
  onClose: () => void;
}

export const ActiveSession: React.FC<ActiveSessionProps> = ({ template, onClose }) => {
  const { addHistory, setActiveSession } = useApp();
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionData, setSessionData] = useState<WorkoutSession>(() => ({
    id: Math.random().toString(36).substr(2, 9),
    templateId: template.id,
    name: template.name,
    startTime: Date.now(),
    duration: 0,
    exercises: template.exercises.map(ex => ({
      exerciseId: ex.id,
      name: ex.name,
      sets: Array.from({ length: ex.sets }).map(() => ({
        reps: parseInt(ex.reps) || 10,
        weight: 0,
        completed: false
      }))
    }))
  }));

  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showSatisfaction, setShowSatisfaction] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const currentExercise = template.exercises[currentExerciseIndex];
  const currentExerciseData = sessionData.exercises[currentExerciseIndex];

  const toggleSet = (setIndex: number) => {
    // Haptic feedback simulation
    if (window.navigator.vibrate) window.navigator.vibrate(50);

    const newExercises = [...sessionData.exercises];
    newExercises[currentExerciseIndex].sets[setIndex].completed = !newExercises[currentExerciseIndex].sets[setIndex].completed;
    setSessionData({ ...sessionData, exercises: newExercises });
  };

  const updateSetData = (setIndex: number, field: keyof CompletedSet, value: number) => {
    const newExercises = [...sessionData.exercises];
    (newExercises[currentExerciseIndex].sets[setIndex] as any)[field] = value;
    setSessionData({ ...sessionData, exercises: newExercises });
  };

  const handleFinish = () => {
    const finalSession = {
      ...sessionData,
      endTime: Date.now(),
      duration: elapsed
    };
    addHistory(finalSession);
    setShowSatisfaction(true);
  };

  if (showSatisfaction) {
    return (
      <div className="fixed inset-0 bg-bg-dark z-[60] flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
          <div className="w-24 h-24 bg-brand rounded-full flex items-center justify-center mx-auto">
            <Check size={48} className="text-black" />
          </div>
          <h2 className="text-4xl font-bold">¡Entreno completado!</h2>
          <p className="text-gray-400">Has entrenado durante {formatDuration(elapsed)}. ¡Buen trabajo!</p>
          
          <div className="space-y-4 pt-8">
            <p className="text-sm uppercase tracking-widest text-gray-500">¿Cómo te has sentido?</p>
            <div className="flex justify-center gap-4">
              {['😫', '😕', '😐', '🙂', '🤩'].map((emoji, i) => (
                <button key={i} className="text-4xl hover:scale-125 transition-transform">
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-brand text-black font-bold py-4 rounded-2xl mt-8"
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-bg-dark z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <button onClick={() => setShowFinishConfirm(true)} className="p-2 bg-card-dark rounded-full">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Tiempo</span>
          <span className="text-2xl font-mono font-bold text-brand">{formatDuration(elapsed)}</span>
        </div>
        <button onClick={() => setShowFinishConfirm(true)} className="px-4 py-2 bg-brand text-black rounded-full font-bold text-sm">
          Finalizar
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-4">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand"
            initial={{ width: 0 }}
            animate={{ width: `${((currentExerciseIndex + 1) / template.exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise Info */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="mb-8">
          <img
            src={currentExercise.image}
            alt={currentExercise.name}
            className="w-full h-48 object-cover rounded-3xl mb-4"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-3xl font-bold">{currentExercise.name}</h2>
          <p className="text-brand font-medium">{currentExercise.muscleGroup}</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-4 text-xs font-bold text-gray-500 uppercase tracking-widest px-4">
            <span>Serie</span>
            <span>Peso (kg)</span>
            <span>Reps</span>
            <span className="text-right">Estado</span>
          </div>

          {currentExerciseData.sets.map((set, i) => (
            <motion.div
              key={i}
              layout
              className={cn(
                "grid grid-cols-4 items-center p-4 rounded-2xl transition-colors",
                set.completed ? "bg-brand/10" : "bg-card-dark"
              )}
            >
              <span className="font-bold">#{i + 1}</span>
              <input
                type="number"
                className="bg-transparent border-none outline-none font-bold text-lg w-16"
                value={set.weight || ''}
                placeholder="0"
                onChange={(e) => updateSetData(i, 'weight', parseFloat(e.target.value))}
              />
              <input
                type="number"
                className="bg-transparent border-none outline-none font-bold text-lg w-16"
                value={set.reps || ''}
                placeholder="0"
                onChange={(e) => updateSetData(i, 'reps', parseInt(e.target.value))}
              />
              <div className="flex justify-end">
                <button
                  onClick={() => toggleSet(i)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    set.completed ? "bg-brand text-black" : "bg-gray-800 text-gray-400"
                  )}
                >
                  <Check size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-dark via-bg-dark to-transparent">
        <div className="flex items-center justify-between gap-4">
          <button
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex(prev => prev - 1)}
            className="flex-1 bg-card-dark p-4 rounded-2xl flex items-center justify-center disabled:opacity-30"
          >
            <ChevronLeft />
          </button>
          <div className="text-center px-4">
            <span className="text-xs text-gray-500">{currentExerciseIndex + 1} de {template.exercises.length}</span>
          </div>
          <button
            disabled={currentExerciseIndex === template.exercises.length - 1}
            onClick={() => setCurrentExerciseIndex(prev => prev + 1)}
            className="flex-1 bg-card-dark p-4 rounded-2xl flex items-center justify-center disabled:opacity-30"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Finish Confirmation Modal */}
      <AnimatePresence>
        {showFinishConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-card-dark p-8 rounded-3xl w-full max-w-sm space-y-6"
            >
              <h3 className="text-2xl font-bold text-center">¿Terminar entreno?</h3>
              <p className="text-gray-400 text-center">Asegúrate de haber registrado todas tus series.</p>
              <div className="space-y-3">
                <button
                  onClick={handleFinish}
                  className="w-full bg-brand text-black font-bold py-4 rounded-2xl"
                >
                  Sí, finalizar
                </button>
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="w-full bg-gray-800 text-white font-bold py-4 rounded-2xl"
                >
                  Continuar entrenando
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-red-500 font-bold py-2"
                >
                  Cancelar entreno
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
