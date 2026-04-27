export type WorkoutStatus = "planned" | "completed" | "skipped";
export type WorkoutType = "push" | "pull" | "legs" | "cardio" | "other";

export type WorkoutSession = {
  id: string;
  user_id: string;
  day_of_week: number;
  exercise: string;
  session_time: string | null;
  workout_type: WorkoutType;
  sets: number;
  reps: number;
  status: WorkoutStatus;
  created_at: string;
};

export type WeightLog = {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  note: string | null;
  created_at: string;
};

export type PersonalRecord = {
  id: string;
  user_id: string;
  exercise: string;
  value: number;
  unit: string;
  achieved_on: string;
  created_at: string;
};

export type Measurement = {
  id: string;
  user_id: string;
  date: string;
  biceps_cm: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  thigh_cm: number | null;
  created_at: string;
};
