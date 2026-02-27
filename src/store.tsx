import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, UserProfile, WorkoutSession } from './types';

interface AppContextType extends AppState {
  setProfile: (profile: UserProfile) => void;
  addHistory: (session: WorkoutSession) => void;
  setActiveSession: (session: WorkoutSession | null) => void;
  updateActiveSession: (session: WorkoutSession) => void;
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
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return {
      profile: DEFAULT_PROFILE,
      history: [],
      activeSession: null,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setProfile = (profile: UserProfile) => {
    setState((prev) => ({ ...prev, profile }));
  };

  const addHistory = (session: WorkoutSession) => {
    setState((prev) => ({ ...prev, history: [session, ...prev.history] }));
  };

  const setActiveSession = (session: WorkoutSession | null) => {
    setState((prev) => ({ ...prev, activeSession: session }));
  };

  const updateActiveSession = (session: WorkoutSession) => {
    setState((prev) => ({ ...prev, activeSession: session }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        setProfile,
        addHistory,
        setActiveSession,
        updateActiveSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
