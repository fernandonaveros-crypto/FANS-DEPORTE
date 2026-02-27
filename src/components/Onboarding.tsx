import React, { useState } from 'react';
import { useApp } from '../store';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { cn } from '../utils';

export const Onboarding: React.FC = () => {
  const { setProfile } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    age: 25,
    height: 175,
    weight: 70,
    phone: '',
    weeklyGoal: 4,
    onboarded: true,
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else setProfile(formData);
  };

  return (
    <div className="fixed inset-0 bg-bg-dark z-50 flex flex-col p-6">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={step}
        >
          {step === 1 && (
            <div className="space-y-6">
              <h1 className="text-4xl font-bold">¡Bienvenido a <span className="text-brand">StrongPulse</span>!</h1>
              <p className="text-gray-400">Comencemos con lo básico para personalizar tu experiencia.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nombre completo</label>
                  <input
                    type="text"
                    className="w-full bg-card-dark border-none rounded-xl p-4 focus:ring-2 focus:ring-brand outline-none"
                    placeholder="Ej. Juan Pérez"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    className="w-full bg-card-dark border-none rounded-xl p-4 focus:ring-2 focus:ring-brand outline-none"
                    placeholder="+34 600 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Tus medidas</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Edad</label>
                  <input
                    type="number"
                    className="w-full bg-card-dark border-none rounded-xl p-4 focus:ring-2 focus:ring-brand outline-none"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    className="w-full bg-card-dark border-none rounded-xl p-4 focus:ring-2 focus:ring-brand outline-none"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    className="w-full bg-card-dark border-none rounded-xl p-4 focus:ring-2 focus:ring-brand outline-none"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Tu meta semanal</h2>
              <p className="text-gray-400">¿Cuántos días a la semana planeas entrenar?</p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((val) => (
                  <button
                    key={val}
                    onClick={() => setFormData({ ...formData, weeklyGoal: val })}
                    className={cn(
                      "p-4 rounded-xl font-bold transition-all",
                      formData.weeklyGoal === val ? "bg-brand text-black" : "bg-card-dark text-white"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <button
        onClick={handleNext}
        disabled={step === 1 && !formData.name}
        className="w-full bg-brand text-black font-bold py-4 rounded-2xl disabled:opacity-50 mt-auto"
      >
        {step === 3 ? 'Empezar' : 'Siguiente'}
      </button>
    </div>
  );
};
