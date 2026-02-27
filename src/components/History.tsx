import React from 'react';
import { useApp } from '../store';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Dumbbell, Weight, Calendar } from 'lucide-react';
import { formatDuration } from '../utils';

export const History: React.FC = () => {
  const { history } = useApp();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-6 text-center space-y-4">
        <div className="w-20 h-20 bg-card-dark rounded-full flex items-center justify-center text-gray-500">
          <Calendar size={40} />
        </div>
        <h2 className="text-2xl font-bold">Sin historial aún</h2>
        <p className="text-gray-400">Tus entrenamientos completados aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 space-y-8">
      <h1 className="text-4xl font-bold">Historial</h1>

      <div className="space-y-6">
        {history.map((session) => (
          <div key={session.id} className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              {format(session.startTime, "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
            <div className="bg-card-dark rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold">{session.name}</h4>
                  <div className="flex items-center gap-2 text-brand text-sm font-medium mt-1">
                    <Clock size={14} />
                    <span>{formatDuration(session.duration)}</span>
                  </div>
                </div>
                <div className="bg-brand/10 text-brand px-3 py-1 rounded-lg text-xs font-bold">
                  Completado
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/5">
                <div className="text-center">
                  <span className="block text-[10px] text-gray-500 uppercase mb-1">Ejercicios</span>
                  <span className="font-bold">{session.exercises.length}</span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] text-gray-500 uppercase mb-1">Series</span>
                  <span className="font-bold">
                    {session.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] text-gray-500 uppercase mb-1">Volumen</span>
                  <span className="font-bold">
                    {session.exercises.reduce((acc, ex) => 
                      acc + ex.sets.reduce((sAcc, s) => sAcc + (s.completed ? (s.weight * s.reps) : 0), 0)
                    , 0)} kg
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {session.exercises.map((ex, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-400">{ex.name}</span>
                    <span className="font-medium">{ex.sets.filter(s => s.completed).length} series</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
