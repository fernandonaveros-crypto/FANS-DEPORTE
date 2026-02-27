export type Difficulty = 'Principiante' | 'Intermedio' | 'Avanzado';
export type Category = 'Fuerza' | 'Cardio' | 'Todos';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: number; // seconds
  weight?: number;
  muscleGroup: string;
  image: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  duration: number; // estimated minutes
  difficulty: Difficulty;
  category: Category;
  exercises: Exercise[];
  image: string;
}

export interface CompletedSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  templateId: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration: number; // seconds
  exercises: {
    exerciseId: string;
    name: string;
    sets: CompletedSet[];
  }[];
}

export interface UserProfile {
  name: string;
  age: number;
  height: number;
  weight: number;
  phone: string;
  weeklyGoal: number; // workouts per week
  onboarded: boolean;
}

export interface AppState {
  profile: UserProfile;
  history: WorkoutSession[];
  activeSession: WorkoutSession | null;
}
