import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, UserProfile, WorkoutSession, WorkoutTemplate } from './types';
import { WORKOUT_TEMPLATES } from './data';

interface AppContextType extends AppState {
  setProfile: (profile: UserProfile) => void;
  addHistory: (session: WorkoutSession) => void;
  setActiveSession: (session: WorkoutSession | null) => void;
  updateActiveSession: (session: WorkoutSession) => void;
  updateExerciseImage: (exerciseId: string, newImageUrl: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'strongpulse_app_state';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: 0,
  height: 0,
  weight: 0,
  phone: '',
  weeklyGoal: 4,
  onboarded: false,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure templates are present and merge new ones from data.ts
        if (!parsed.templates) {
          parsed.templates = WORKOUT_TEMPLATES;
        } else {
          // Merge new templates that might have been added to data.ts
          const existingIds = new Set(parsed.templates.map((t: any) => t.id));
          const newTemplates = WORKOUT_TEMPLATES.filter(t => !existingIds.has(t.id));
          if (newTemplates.length > 0) {
            parsed.templates = [...parsed.templates, ...newTemplates];
          }
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return {
      profile: DEFAULT_PROFILE,
      history: [],
      activeSession: null,
      templates: WORKOUT_TEMPLATES,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setProfile = useCallback((profile: UserProfile) => {
    setState((prev) => ({ ...prev, profile }));
  }, []);

  const addHistory = useCallback((session: WorkoutSession) => {
    setState((prev) => ({ ...prev, history: [session, ...prev.history] }));
  }, []);

  const setActiveSession = useCallback((session: WorkoutSession | null) => {
    setState((prev) => ({ ...prev, activeSession: session }));
  }, []);

  const updateActiveSession = useCallback((session: WorkoutSession) => {
    setState((prev) => ({ ...prev, activeSession: session }));
  }, []);

  const updateExerciseImage = useCallback((exerciseId: string, newImageUrl: string) => {
    setState((prev) => ({
      ...prev,
      templates: prev.templates.map((template) => ({
        ...template,
        exercises: template.exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, image: newImageUrl } : ex
        ),
      })),
    }));
  }, []);

  const value = useMemo(() => ({
    ...state,
    setProfile,
    addHistory,
    setActiveSession,
    updateActiveSession,
    updateExerciseImage,
  }), [state, setProfile, addHistory, setActiveSession, updateActiveSession, updateExerciseImage]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
