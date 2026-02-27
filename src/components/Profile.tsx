import React, { useState } from 'react';
import { useApp } from '../store';
import { UserProfile } from '../types';
import { User, Phone, Calendar, Ruler, Weight, Target, Save, Edit2 } from 'lucide-react';
import { cn } from '../utils';

export const Profile: React.FC = () => {
  const { profile, setProfile, history } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);

  const handleSave = () => {
    setProfile(formData);
    setIsEditing(false);
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
