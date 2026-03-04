import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Check, Play, Square, Timer, Volume2, Loader2, Plus, Minus, Sparkles } from 'lucide-react';
import { useApp } from '../store';
import { WorkoutTemplate, WorkoutSession, CompletedSet } from '../types';
import { cn, formatDuration } from '../utils';
import { generateSpeech, getExerciseTechnique } from '../services/geminiService';

interface ActiveSessionProps {
  template: WorkoutTemplate;
  onClose: () => void;
}

export const ActiveSession: React.FC<ActiveSessionProps> = ({ template, onClose }) => {
  const { addHistory, setActiveSession, activeSession } = useApp();
  const [startTime] = useState(activeSession?.startTime || Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionData, setSessionData] = useState<WorkoutSession>(() => activeSession || ({
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
  const [restTimeLeft, setRestTimeLeft] = useState<number | null>(null);
  const [exerciseRestTime, setExerciseRestTime] = useState(template.exercises[0]?.rest || 60);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useState(true);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    setIsImageLoading(true);
  }, [currentExerciseIndex]);

  useEffect(() => {
    if (template.exercises[currentExerciseIndex]) {
      setExerciseRestTime(template.exercises[currentExerciseIndex].rest);
    }
  }, [currentExerciseIndex, template.exercises]);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  const unlockAudio = () => {
    if (isAudioUnlocked) return;
    const audio = new Audio();
    audio.play().then(() => {
      setIsAudioUnlocked(true);
    }).catch(() => {
      // Still blocked, will try again on next interaction
    });
  };

  // Sound effects
  const playSound = (type: 'set' | 'rest' | 'finish' | 'start') => {
    unlockAudio();
    const sounds = {
      set: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      rest: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      finish: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
      start: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.play().catch(e => {
      console.log('Audio play blocked', e);
      // If blocked, we can't do much but log it
    });
  };

  const speak = async (text: string, priority: boolean = false) => {
    if (isSpeaking && !priority) return;
    unlockAudio();
    
    if (isSpeaking && priority) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
    
    setIsSpeaking(true);
    try {
      const audioUrl = await generateSpeech(text);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Use a promise to handle play() errors gracefully
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
    } catch (error) {
      console.warn('Speech playback failed (likely browser policy):', error);
      setIsSpeaking(false);
      audioRef.current = null;
    }
  };

  useEffect(() => {
    // Auto-speak exercise when it changes
    if (!voiceAssistantEnabled) return;
    
    const exercise = template.exercises[currentExerciseIndex];
    if (exercise) {
      playSound('start');
      const phrases = [
        `Siguiente ejercicio: ${exercise.name}. Vamos a por esas ${exercise.sets} series.`,
        `Prepárate para ${exercise.name}. Enfócate en la técnica para tus ${exercise.reps} repeticiones.`,
        `Es el turno de ${exercise.name}. ¡Tú puedes con esto!`
      ];
      speak(phrases[Math.floor(Math.random() * phrases.length)]);
    }
  }, [currentExerciseIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (restTimeLeft !== null && restTimeLeft > 0) {
      timer = setInterval(() => {
        setRestTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (restTimeLeft === 0) {
      playSound('rest');
      setRestTimeLeft(null);
      if (voiceAssistantEnabled) {
        speak("¡Tiempo de descanso terminado! A por la siguiente serie.", true);
      }
    }
    return () => clearInterval(timer);
  }, [restTimeLeft]);

  const currentExercise = template.exercises[currentExerciseIndex];
  const currentExerciseData = sessionData.exercises[currentExerciseIndex];

  const toggleSet = (setIndex: number) => {
    unlockAudio();
    // Haptic feedback simulation
    if (window.navigator.vibrate) window.navigator.vibrate(50);

    const newExercises = [...sessionData.exercises];
    const isCompleting = !newExercises[currentExerciseIndex].sets[setIndex].completed;
    newExercises[currentExerciseIndex].sets[setIndex].completed = isCompleting;
    
    if (isCompleting) {
      playSound('set');
      // Start rest timer if it's not the last set of the last exercise
      const isLastSet = setIndex === currentExerciseData.sets.length - 1;
      const isLastExercise = currentExerciseIndex === template.exercises.length - 1;
      
      if (!(isLastSet && isLastExercise)) {
        setRestTimeLeft(exerciseRestTime);
        if (voiceAssistantEnabled) {
          const motivationalPhrases = [
            "¡Buen trabajo! Tómate un respiro.",
            "¡Excelente serie! Recupera fuerzas.",
            "¡Así se hace! Respira profundo.",
            "¡Sigue así! Estás dándolo todo."
          ];
          speak(motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)], true);
        }
      } else if (isLastSet && isLastExercise) {
        if (voiceAssistantEnabled) {
          speak("¡Última serie completada! Entrenamiento finalizado con éxito. ¡Increíble trabajo!", true);
        }
      }
    } else {
      setRestTimeLeft(null);
    }

    const updatedSession = { ...sessionData, exercises: newExercises };
    setSessionData(updatedSession);
    setActiveSession(updatedSession);
  };

  const adjustRestTime = (delta: number) => {
    setExerciseRestTime(prev => Math.max(0, prev + delta));
    if (restTimeLeft !== null) {
      setRestTimeLeft(prev => Math.max(0, (prev || 0) + delta));
    }
  };

  const updateSetData = (setIndex: number, field: keyof CompletedSet, value: number) => {
    const newExercises = [...sessionData.exercises];
    (newExercises[currentExerciseIndex].sets[setIndex] as any)[field] = value;
    const updatedSession = { ...sessionData, exercises: newExercises };
    setSessionData(updatedSession);
    setActiveSession(updatedSession);
  };

  const handleFinish = () => {
    const finalSession = {
      ...sessionData,
      endTime: Date.now(),
      duration: elapsed
    };
    addHistory(finalSession);
    playSound('finish');
    setShowSatisfaction(true);
  };

  if (showSatisfaction) {
    return (
      <div className="fixed inset-0 bg-bg-dark z-[60] flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-sm w-full">
          <div className="w-32 h-32 bg-brand/10 rounded-[40px] flex items-center justify-center mx-auto shadow-2xl shadow-brand/10 border border-brand/20">
            <Check size={64} className="text-brand" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black">¡Entreno completado!</h2>
            <p className="text-gray-400">Has entrenado durante <span className="text-brand font-bold">{formatDuration(elapsed)}</span>. ¡Buen trabajo!</p>
          </div>
          
          <div className="space-y-6 pt-4">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">¿Cómo te has sentido hoy?</p>
            <div className="flex justify-center gap-4">
              {['😫', '😕', '😐', '🙂', '🤩'].map((emoji, i) => (
                <button key={i} className="text-5xl hover:scale-125 transition-transform active:scale-90 p-2">
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-brand text-black font-black py-5 rounded-3xl mt-8 shadow-xl shadow-brand/20 active:scale-95 transition-transform"
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  const handleCoachClick = async () => {
    unlockAudio();
    if (isCoachLoading) return;
    setIsCoachLoading(true);
    try {
      const technique = await getExerciseTechnique(currentExercise.name, currentExercise.muscleGroup);
      await speak(technique, true);
    } catch (error) {
      console.error('Coach failed:', error);
    } finally {
      setIsCoachLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bg-dark z-[60] flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between bg-bg-dark/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20">
        <button onClick={() => { unlockAudio(); setShowFinishConfirm(true); }} className="p-2.5 bg-card-dark rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
          <X size={22} />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
            <Timer size={12} className="text-brand" />
            <span className="text-[9px] uppercase tracking-[0.2em] font-black">Tiempo</span>
          </div>
          <span className="text-2xl font-mono font-black text-brand tabular-nums tracking-tighter">{formatDuration(elapsed)}</span>
        </div>
        {restTimeLeft !== null && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="flex flex-col items-center bg-brand/10 px-5 py-2 rounded-2xl border border-brand/20 shadow-xl shadow-brand/10"
          >
            <span className="text-[9px] text-brand uppercase font-black tracking-widest mb-0.5">Descanso</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => adjustRestTime(-5)}
                className="p-1 hover:bg-brand/20 rounded-lg text-brand transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="text-2xl font-mono font-black text-brand tabular-nums">{restTimeLeft}s</span>
              <button 
                onClick={() => adjustRestTime(5)}
                className="p-1 hover:bg-brand/20 rounded-lg text-brand transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </motion.div>
        )}
        <button onClick={() => { unlockAudio(); setShowFinishConfirm(true); }} className="px-6 py-2.5 bg-brand text-black rounded-2xl font-bold text-sm shadow-lg shadow-brand/20 active:scale-95 transition-transform">
          Finalizar
        </button>
        <button 
          onClick={() => {
            unlockAudio();
            setVoiceAssistantEnabled(!voiceAssistantEnabled);
          }}
          className={cn(
            "p-2.5 rounded-2xl transition-all border",
            voiceAssistantEnabled 
              ? "bg-brand/10 text-brand border-brand/20" 
              : "bg-card-dark text-gray-400 border-white/5"
          )}
          title={voiceAssistantEnabled ? "Desactivar Asistente de Voz" : "Activar Asistente de Voz"}
        >
          {isSpeaking ? <Loader2 size={22} className="animate-spin" /> : <Volume2 size={22} />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-6">
        <div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
          <motion.div
            className="h-full bg-brand shadow-[0_0_20px_rgba(0,255,0,0.4)]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentExerciseIndex + 1) / template.exercises.length) * 100}%` }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          />
        </div>
      </div>

      {/* Exercise Info */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="mb-8">
          <div className="relative group overflow-hidden rounded-[40px]">
            {isImageLoading && (
              <div className="absolute inset-0 shimmer bg-card-dark z-10" />
            )}
            <motion.img
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ 
                scale: isImageLoading ? 1.1 : 1, 
                opacity: isImageLoading ? 0 : 1 
              }}
              transition={{ duration: 0.8 }}
              src={currentExercise.image}
              alt={currentExercise.name}
              onLoad={() => setIsImageLoading(false)}
              className="w-full h-56 object-cover mb-6 shadow-2xl transition-transform duration-700 group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 vignette opacity-40 pointer-events-none" />
            <div className="absolute bottom-10 left-6">
              <span className="bg-brand text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">En curso</span>
            </div>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Ejercicio</span>
              <h2 className="text-4xl font-black leading-tight tracking-tight">{currentExercise.name}</h2>
            </div>
            <button 
              onClick={handleCoachClick}
              disabled={isCoachLoading || isSpeaking}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl",
                isCoachLoading || isSpeaking 
                  ? "bg-brand/20 text-brand border border-brand/30" 
                  : "bg-brand text-black hover:scale-105 active:scale-95 shadow-brand/20"
              )}
            >
              {isCoachLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Coach IA
            </button>
          </div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <span className="text-[10px] text-brand uppercase font-black tracking-widest mb-1">Grupo Muscular</span>
              <p className="text-white font-black text-xl">{currentExercise.muscleGroup}</p>
            </div>
            <div className="flex items-center gap-3 bg-card-dark px-5 py-3 rounded-[24px] border border-white/5 shadow-2xl">
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-black text-gray-500 tracking-[0.1em] mb-1">Descanso</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => adjustRestTime(-5)}
                    className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-xl text-gray-400 hover:text-brand transition-colors active:scale-90"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-lg font-black min-w-[32px] text-center tabular-nums text-brand">{exerciseRestTime}s</span>
                  <button 
                    onClick={() => adjustRestTime(5)}
                    className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-xl text-gray-400 hover:text-brand transition-colors active:scale-90"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {currentExerciseData.sets.map((set, i) => (
            <motion.div
              key={i}
              layout
              className={cn(
                "grid grid-cols-4 items-center p-6 rounded-[32px] transition-all border",
                set.completed 
                  ? "bg-brand/5 border-brand/20 shadow-2xl shadow-brand/5" 
                  : "bg-card-dark border-white/5"
              )}
            >
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Serie</span>
                <span className="font-black text-2xl">#{i + 1}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Peso</span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    className="bg-transparent border-none outline-none font-black text-2xl w-14 tabular-nums text-white"
                    value={set.weight || ''}
                    placeholder="0"
                    onChange={(e) => updateSetData(i, 'weight', parseFloat(e.target.value))}
                  />
                  <span className="text-[10px] text-gray-600 font-bold">kg</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Reps</span>
                <input
                  type="number"
                  className="bg-transparent border-none outline-none font-black text-2xl w-14 tabular-nums text-white"
                  value={set.reps || ''}
                  placeholder="0"
                  onChange={(e) => updateSetData(i, 'reps', parseInt(e.target.value))}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => toggleSet(i)}
                  className={cn(
                    "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all shadow-2xl",
                    set.completed 
                      ? "bg-brand text-black scale-105 shadow-brand/40" 
                      : "bg-white/5 text-gray-500 hover:bg-white/10"
                  )}
                >
                  <Check size={32} strokeWidth={4} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="p-6 bg-bg-dark/80 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-between gap-4">
          <button
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex(prev => prev - 1)}
            className="flex-1 bg-card-dark p-4 rounded-2xl flex items-center justify-center disabled:opacity-30 transition-all active:scale-95 border border-white/5"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-center px-4">
            <span className="text-xs text-gray-500 font-black uppercase tracking-widest">{currentExerciseIndex + 1} / {template.exercises.length}</span>
          </div>
          <button
            disabled={currentExerciseIndex === template.exercises.length - 1}
            onClick={() => setCurrentExerciseIndex(prev => prev + 1)}
            className="flex-1 bg-card-dark p-4 rounded-2xl flex items-center justify-center disabled:opacity-30 transition-all active:scale-95 border border-white/5"
          >
            <ChevronRight size={24} />
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
              className="bg-card-dark p-8 rounded-[40px] w-full max-w-sm space-y-6 border border-white/5 shadow-2xl"
            >
              <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Check size={32} className="text-brand" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black">¿Terminar entreno?</h3>
                <p className="text-gray-400 text-sm">Asegúrate de haber registrado todas tus series antes de finalizar.</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleFinish}
                  className="w-full bg-brand text-black font-black py-4 rounded-2xl shadow-lg shadow-brand/20 active:scale-95 transition-transform"
                >
                  Sí, finalizar
                </button>
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="w-full bg-white/5 text-white font-bold py-4 rounded-2xl border border-white/5 active:scale-95 transition-transform"
                >
                  Continuar entrenando
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-red-500/60 hover:text-red-500 font-bold py-2 transition-colors text-sm"
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
