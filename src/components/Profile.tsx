import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../store';
import { UserProfile } from '../types';
import { User, Phone, Calendar, Ruler, Weight, Target, Save, Edit2, Sparkles, Loader2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../utils';
import { generateExerciseImage } from '../services/geminiService';

export const Profile: React.FC = () => {
  const { profile, setProfile, history, templates, updateExerciseImage } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isRefreshingImages, setIsRefreshingImages] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState({ current: 0, total: 0 });

  const handleSave = () => {
    setProfile(formData);
    setIsEditing(false);
  };

  const handleRefreshAllImages = async () => {
    if (isRefreshingImages) return;
    
    const allExercises = templates.flatMap(t => t.exercises);
    const uniqueExercises = Array.from(new Map(allExercises.map(ex => [ex.name, ex])).values());
    
    setIsRefreshingImages(true);
    setRefreshProgress({ current: 0, total: uniqueExercises.length });

    for (let i = 0; i < uniqueExercises.length; i++) {
      const ex = uniqueExercises[i];
      try {
        const newUrl = await generateExerciseImage(ex.name, ex.muscleGroup);
        // Find all instances of this exercise across all templates and update them
        templates.forEach(t => {
          t.exercises.forEach(te => {
            if (te.name === ex.name) {
              updateExerciseImage(te.id, newUrl);
            }
          });
        });
      } catch (error) {
        console.error(`Failed to refresh image for ${ex.name}:`, error);
      }
      setRefreshProgress(prev => ({ ...prev, current: i + 1 }));
    }
    
    setIsRefreshingImages(false);
  };

  const totalMinutes = Math.floor(history.reduce((acc, s) => acc + s.duration, 0) / 60);
  const totalWorkouts = history.length;
  const totalWeight = history.reduce((acc, s) => 
    acc + s.exercises.reduce((exAcc, ex) => 
      exAcc + ex.sets.reduce((sAcc, set) => sAcc + (set.completed ? (set.weight * set.reps) : 0), 0)
    , 0)
  , 0);

  return (
    <div className="p-6 pb-24 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Perfil</h1>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="p-3 bg-card-dark rounded-2xl text-brand hover:bg-brand hover:text-black transition-all"
        >
          {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card-dark p-4 rounded-3xl text-center space-y-1">
          <span className="text-brand block"><Target size={20} className="mx-auto" /></span>
          <span className="text-2xl font-bold">{totalWorkouts}</span>
          <span className="text-[10px] text-gray-500 uppercase">Entrenos</span>
        </div>
        <div className="bg-card-dark p-4 rounded-3xl text-center space-y-1">
          <span className="text-blue-500 block"><Calendar size={20} className="mx-auto" /></span>
          <span className="text-2xl font-bold">{totalMinutes}</span>
          <span className="text-[10px] text-gray-500 uppercase">Minutos</span>
        </div>
        <div className="bg-card-dark p-4 rounded-3xl text-center space-y-1">
          <span className="text-orange-500 block"><Weight size={20} className="mx-auto" /></span>
          <span className="text-2xl font-bold">{totalWeight > 1000 ? (totalWeight / 1000).toFixed(1) + 'k' : totalWeight}</span>
          <span className="text-[10px] text-gray-500 uppercase">Kg Total</span>
        </div>
      </div>

      {/* Info Form */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Información Personal</h3>
        <div className="space-y-4">
          <InfoField
            icon={<User size={20} />}
            label="Nombre"
            value={formData.name}
            isEditing={isEditing}
            onChange={(v) => setFormData({ ...formData, name: v })}
          />
          <InfoField
            icon={<Calendar size={20} />}
            label="Edad"
            value={formData.age.toString()}
            isEditing={isEditing}
            type="number"
            onChange={(v) => setFormData({ ...formData, age: parseInt(v) || 0 })}
          />
          <InfoField
            icon={<Phone size={20} />}
            label="Teléfono"
            value={formData.phone}
            isEditing={isEditing}
            onChange={(v) => setFormData({ ...formData, phone: v })}
          />
          <div className="grid grid-cols-2 gap-4">
            <InfoField
              icon={<Ruler size={20} />}
              label="Altura (cm)"
              value={formData.height.toString()}
              isEditing={isEditing}
              type="number"
              onChange={(v) => setFormData({ ...formData, height: parseInt(v) || 0 })}
            />
            <InfoField
              icon={<Weight size={20} />}
              label="Peso (kg)"
              value={formData.weight.toString()}
              isEditing={isEditing}
              type="number"
              onChange={(v) => setFormData({ ...formData, weight: parseInt(v) || 0 })}
            />
          </div>
          <div className="bg-card-dark p-4 rounded-3xl space-y-3">
            <div className="flex items-center gap-3 text-gray-400">
              <Target size={20} />
              <span className="text-sm font-medium">Meta semanal</span>
            </div>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map(val => (
                <button
                  key={val}
                  disabled={!isEditing}
                  onClick={() => setFormData({ ...formData, weeklyGoal: val })}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                    formData.weeklyGoal === val ? "bg-brand text-black" : "bg-gray-800 text-gray-500",
                    !isEditing && "cursor-default"
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Tools Section */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Herramientas de IA</h3>
        <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand/10 rounded-2xl text-brand">
              <Sparkles size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg">Mejorar Fotografías</h4>
              <p className="text-sm text-gray-500">Genera imágenes cinematográficas ultra-realistas para todos los ejercicios usando Gemini 2.5 Flash.</p>
            </div>
          </div>
          
          {isRefreshingImages ? (
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-brand">Procesando...</span>
                <span className="text-gray-500">{refreshProgress.current} / {refreshProgress.total}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-brand"
                  initial={{ width: 0 }}
                  animate={{ width: `${(refreshProgress.current / refreshProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-600 text-center italic">Esto puede tardar unos minutos. No cierres la aplicación.</p>
            </div>
          ) : (
            <button
              onClick={handleRefreshAllImages}
              className="w-full bg-white/5 hover:bg-brand/10 text-white hover:text-brand border border-white/10 hover:border-brand/30 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <ImageIcon size={20} />
              Actualizar todas las fotos
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <button
          onClick={handleSave}
          className="w-full bg-brand text-black font-bold py-4 rounded-2xl shadow-lg shadow-brand/20"
        >
          Guardar cambios
        </button>
      )}
    </div>
  );
};

const InfoField: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing: boolean;
  type?: string;
  onChange: (v: string) => void;
}> = ({ icon, label, value, isEditing, type = 'text', onChange }) => (
  <div className="bg-card-dark p-4 rounded-3xl flex items-center gap-4">
    <div className="text-gray-500">{icon}</div>
    <div className="flex-1">
      <span className="block text-[10px] text-gray-500 uppercase">{label}</span>
      {isEditing ? (
        <input
          type={type}
          className="w-full bg-transparent border-none outline-none font-bold text-white p-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <span className="font-bold">{value || 'No establecido'}</span>
      )}
    </div>
  </div>
);
