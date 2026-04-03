export interface Set {
  reps: number;
  weight: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  category: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Cardio' | 'Other';
}

export interface Workout {
  id: string;
  date: string;
  exercises: Exercise[];
  notes?: string;
}

export type ExerciseCategory = Exercise['category'];
