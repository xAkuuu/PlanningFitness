"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ProgressChart } from "@/components/ProgressChart";
import { supabase } from "@/lib/supabase";
import type { Measurement, PersonalRecord, WeightLog, WorkoutSession } from "@/types/fitness";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const TABS = ["Dashboard", "Aujourd'hui", "Planning", "Poids", "PR", "Mensurations"] as const;
type TabKey = (typeof TABS)[number];

const initialWorkout = {
  day_of_week: 1,
  exercise: "",
  session_time: "18:00",
  workout_type: "other" as const,
  sets: 3,
  reps: 10,
  status: "planned" as const,
};
const initialWeight = { date: "", weight_kg: 70, note: "" };
const initialPr = { exercise: "", value: 100, unit: "kg", achieved_on: "" };
const initialMeasurement = { date: "", biceps_cm: "", waist_cm: "", chest_cm: "", thigh_cm: "" };
const PUBLIC_USER = "public-demo";

const panelClass =
  "rounded-3xl border border-zinc-200/70 bg-white/70 p-5 shadow-[0_18px_36px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/55";
const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white/90 px-3 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-zinc-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/60";
const typeBadgeClass: Record<string, string> = {
  push: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  pull: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  legs: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  cardio: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  other: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
};

const publicWorkouts: WorkoutSession[] = [
  { id: "public-w1", user_id: PUBLIC_USER, day_of_week: 1, exercise: "Pectoraux + Triceps", session_time: "18:00", workout_type: "push", sets: 4, reps: 8, status: "planned", created_at: new Date().toISOString() },
  { id: "public-w2", user_id: PUBLIC_USER, day_of_week: 3, exercise: "Dos + Biceps", session_time: "19:00", workout_type: "pull", sets: 4, reps: 10, status: "planned", created_at: new Date().toISOString() },
  { id: "public-w3", user_id: PUBLIC_USER, day_of_week: 5, exercise: "Jambes", session_time: "17:30", workout_type: "legs", sets: 5, reps: 6, status: "planned", created_at: new Date().toISOString() },
];
const publicWeights: WeightLog[] = [
  { id: "public-g1", user_id: PUBLIC_USER, date: "2026-04-18", weight_kg: 81.2, note: null, created_at: new Date().toISOString() },
  { id: "public-g2", user_id: PUBLIC_USER, date: "2026-04-20", weight_kg: 80.8, note: "Bonne semaine", created_at: new Date().toISOString() },
  { id: "public-g3", user_id: PUBLIC_USER, date: "2026-04-23", weight_kg: 80.3, note: null, created_at: new Date().toISOString() },
  { id: "public-g4", user_id: PUBLIC_USER, date: "2026-04-26", weight_kg: 80.1, note: "Objectif sèche", created_at: new Date().toISOString() },
];
const publicPrs: PersonalRecord[] = [
  { id: "public-pr1", user_id: PUBLIC_USER, exercise: "Développé couché", value: 95, unit: "kg", achieved_on: "2026-04-10", created_at: new Date().toISOString() },
  { id: "public-pr2", user_id: PUBLIC_USER, exercise: "Squat", value: 130, unit: "kg", achieved_on: "2026-04-16", created_at: new Date().toISOString() },
];
const publicMeasurements: Measurement[] = [
  { id: "public-m1", user_id: PUBLIC_USER, date: "2026-04-01", biceps_cm: 38, waist_cm: 84, chest_cm: 106, thigh_cm: 59, created_at: new Date().toISOString() },
  { id: "public-m2", user_id: PUBLIC_USER, date: "2026-04-22", biceps_cm: 38.5, waist_cm: 82.8, chest_cm: 107, thigh_cm: 59.8, created_at: new Date().toISOString() },
];

const BULK_TEMPLATES = {
  "Push classique": "18:00 | push | Développé couché | 4 | 8\n18:30 | push | Développé incliné haltères | 4 | 10\n19:00 | push | Dips | 3 | 10\n19:20 | push | Élévations latérales | 3 | 15",
  "Pull classique": "18:00 | pull | Tractions | 4 | 8\n18:30 | pull | Rowing barre | 4 | 10\n19:00 | pull | Tirage horizontal | 3 | 12\n19:20 | pull | Curl barre | 3 | 12",
  "Legs power": "18:00 | legs | Squat | 5 | 5\n18:30 | legs | Presse à cuisses | 4 | 10\n19:00 | legs | Soulevé de terre jambes tendues | 3 | 10\n19:20 | legs | Mollets debout | 4 | 15",
  "Full body rapide": "18:00 | other | Squat goblet | 3 | 12\n18:20 | other | Pompes | 3 | 15\n18:40 | other | Rowing haltères | 3 | 12\n19:00 | cardio | Rameur | 1 | 12",
} as const;

function readCache<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function title(label: string) {
  return <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{label}</h2>;
}

function formatDateJJMMYYYY(input: string) {
  const [year, month, day] = input.split("-");
  if (!year || !month || !day) return input;
  return `${day}//${month}//${year}`;
}

function getCurrentDayOfWeek() {
  const jsDay = new Date().getDay(); // 0=Sunday
  return jsDay === 0 ? 7 : jsDay;
}

function normalizeWorkoutForm(
  form: Partial<{
    day_of_week: number;
    exercise: string;
    session_time: string;
    workout_type: WorkoutSession["workout_type"];
    sets: number;
    reps: number;
    status: WorkoutSession["status"];
  }>,
) {
  return {
    day_of_week: form.day_of_week ?? 1,
    exercise: form.exercise ?? "",
    session_time: form.session_time ?? "18:00",
    workout_type: form.workout_type ?? "other",
    sets: form.sets ?? 3,
    reps: form.reps ?? 10,
    status: form.status ?? "planned",
  };
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [adminMode, setAdminMode] = useState<"view" | "edit">("view");
  const [activeTab, setActiveTab] = useState<TabKey>("Dashboard");
  const [isScrolled, setIsScrolled] = useState(false);

  const [workouts, setWorkouts] = useState<WorkoutSession[]>(() => readCache("fitness_workouts_cache"));
  const [weights, setWeights] = useState<WeightLog[]>(() => readCache("fitness_weights_cache"));
  const [prs, setPrs] = useState<PersonalRecord[]>(() => readCache("fitness_prs_cache"));
  const [measurements, setMeasurements] = useState<Measurement[]>(() => readCache("fitness_measurements_cache"));

  const [workoutForm, setWorkoutForm] = useState(() => normalizeWorkoutForm(initialWorkout));
  const [weightForm, setWeightForm] = useState(initialWeight);
  const [prForm, setPrForm] = useState(initialPr);
  const [measurementForm, setMeasurementForm] = useState(initialMeasurement);
  const [bulkDay, setBulkDay] = useState(1);
  const [bulkWorkoutsText, setBulkWorkoutsText] = useState("");
  const [planningQuery, setPlanningQuery] = useState("");
  const [goals, setGoals] = useState(() => {
    if (typeof window === "undefined") {
      return { weightTarget: "", prExercise: "", prTarget: "", deadline: "" };
    }
    const cachedGoals = localStorage.getItem("fitness_goals_cache");
    if (!cachedGoals) {
      return { weightTarget: "", prExercise: "", prTarget: "", deadline: "" };
    }
    try {
      return JSON.parse(cachedGoals) as {
        weightTarget: string;
        prExercise: string;
        prTarget: string;
        deadline: string;
      };
    } catch {
      return { weightTarget: "", prExercise: "", prTarget: "", deadline: "" };
    }
  });
  const [duplicateFromDay, setDuplicateFromDay] = useState(1);
  const [duplicateToDay, setDuplicateToDay] = useState(2);
  const [generatorType, setGeneratorType] = useState<WorkoutSession["workout_type"]>("push");
  const [generatorStartTime, setGeneratorStartTime] = useState("18:00");
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingWorkoutForm, setEditingWorkoutForm] = useState({
    exercise: "",
    session_time: "18:00",
    workout_type: "other" as WorkoutSession["workout_type"],
    sets: 3,
    reps: 10,
    status: "planned" as WorkoutSession["status"],
  });

  const isAdmin = Boolean(session?.user);
  const canEdit = isAdmin && adminMode === "edit";
  const displayWorkouts = isAdmin ? workouts : workouts.length ? workouts : publicWorkouts;
  const displayWeights = isAdmin ? weights : weights.length ? weights : publicWeights;
  const displayPrs = isAdmin ? prs : prs.length ? prs : publicPrs;
  const displayMeasurements = isAdmin ? measurements : measurements.length ? measurements : publicMeasurements;
  const topExercises = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of displayWorkouts) {
      counts.set(item.exercise, (counts.get(item.exercise) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }, [displayWorkouts]);
  const currentDayOfWeek = useMemo(() => getCurrentDayOfWeek(), []);
  const todaySessions = useMemo(
    () =>
      displayWorkouts
        .filter((item) => item.day_of_week === currentDayOfWeek)
        .sort((a, b) => (a.session_time ?? "99:99").localeCompare(b.session_time ?? "99:99")),
    [currentDayOfWeek, displayWorkouts],
  );
  const nextSession = useMemo(() => {
    const sorted = [...displayWorkouts].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return (a.session_time ?? "99:99").localeCompare(b.session_time ?? "99:99");
    });
    return (
      sorted.find((item) => item.day_of_week > currentDayOfWeek) ??
      sorted.find((item) => item.day_of_week === currentDayOfWeek && (item.session_time ?? "99:99") >= "00:00") ??
      sorted[0]
    );
  }, [currentDayOfWeek, displayWorkouts]);
  const stats = useMemo(() => {
    const total = displayWorkouts.length;
    const completed = displayWorkouts.filter((w) => w.status === "completed").length;
    const skipped = displayWorkouts.filter((w) => w.status === "skipped").length;
    const planned = displayWorkouts.filter((w) => w.status === "planned").length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    const uniqueExercises = new Set(displayWorkouts.map((w) => w.exercise)).size;
    return { total, completed, skipped, planned, completionRate, uniqueExercises };
  }, [displayWorkouts]);

  const loadFitnessData = useCallback(async (userId: string) => {
    const [w, we, p, m] = await Promise.all([
      supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("day_of_week")
        .order("session_time", { ascending: true }),
      supabase.from("weight_logs").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("personal_records").select("*").eq("user_id", userId).order("achieved_on", { ascending: false }),
      supabase.from("measurements").select("*").eq("user_id", userId).order("date", { ascending: false }),
    ]);
    if (w.data) setWorkouts(w.data as WorkoutSession[]);
    if (we.data) setWeights(we.data as WeightLog[]);
    if (p.data) setPrs(p.data as PersonalRecord[]);
    if (m.data) setMeasurements(m.data as Measurement[]);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user?.id) await loadFitnessData(data.session.user.id);
      setIsLoading(false);
    };
    void bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user?.id) void loadFitnessData(nextSession.user.id);
    });
    return () => authListener.subscription.unsubscribe();
  }, [loadFitnessData]);

  useEffect(() => {
    localStorage.setItem("fitness_workouts_cache", JSON.stringify(workouts));
    localStorage.setItem("fitness_weights_cache", JSON.stringify(weights));
    localStorage.setItem("fitness_prs_cache", JSON.stringify(prs));
    localStorage.setItem("fitness_measurements_cache", JSON.stringify(measurements));
  }, [workouts, weights, prs, measurements]);

  useEffect(() => {
    localStorage.setItem("fitness_goals_cache", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSignIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Connexion réussie.");
    if (!error) setShowAuthMenu(false);
  }
  async function handleSignUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : "Inscription réussie. Vérifie ta boîte mail.");
  }
  async function handleSignOut() {
    await supabase.auth.signOut();
    setMessage("Déconnexion réussie.");
    setShowAuthMenu(false);
  }
  async function handleForgotPassword() {
    if (!email.trim()) return setMessage("Entre ton email pour recevoir le lien de réinitialisation.");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setMessage(error ? error.message : "Email de réinitialisation envoyé.");
  }

  async function addWorkout() {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({ ...workoutForm, user_id: session.user.id })
      .select()
      .single();
    if (error) return setMessage(error.message);
    setWorkouts((curr) =>
      [...curr, data as WorkoutSession].sort(
        (a, b) =>
          a.day_of_week - b.day_of_week ||
          (a.session_time ?? "99:99").localeCompare(b.session_time ?? "99:99"),
      ),
    );
    setWorkoutForm(initialWorkout);
  }

  async function addWorkoutsInBulk() {
    if (!session?.user?.id) return;
    const lines = bulkWorkoutsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setMessage("Ajoute au moins une ligne pour l'ajout en lot.");
      return;
    }

    const rows: Array<{
      user_id: string;
      day_of_week: number;
      exercise: string;
      session_time: string;
      workout_type: WorkoutSession["workout_type"];
      sets: number;
      reps: number;
      status: WorkoutSession["status"];
    }> = [];

    for (const line of lines) {
      // Format attendu: HH:MM | type | exercice | sets | reps
      const [timeRaw, typeRaw, exerciseRaw, setsRaw, repsRaw] = line
        .split("|")
        .map((part) => part.trim());

      const session_time = timeRaw || "18:00";
      const workout_type = (typeRaw || "other").toLowerCase() as WorkoutSession["workout_type"];
      const exercise = exerciseRaw || "";
      const sets = Number(setsRaw || 3);
      const reps = Number(repsRaw || 10);

      const validType = ["push", "pull", "legs", "cardio", "other"].includes(workout_type);

      if (!exercise || !validType || Number.isNaN(sets) || Number.isNaN(reps)) {
        setMessage(
          "Format invalide. Utilise: HH:MM | type | exercice | sets | reps (ex: 18:00 | push | Développé couché | 4 | 8)",
        );
        return;
      }

      rows.push({
        user_id: session.user.id,
        day_of_week: bulkDay,
        exercise,
        session_time,
        workout_type,
        sets,
        reps,
        status: "planned",
      });
    }

    const { data, error } = await supabase.from("workout_sessions").insert(rows).select();
    if (error) {
      setMessage(error.message);
      return;
    }

    const inserted = (data ?? []) as WorkoutSession[];
    setWorkouts((curr) =>
      [...curr, ...inserted].sort(
        (a, b) =>
          a.day_of_week - b.day_of_week ||
          (a.session_time ?? "99:99").localeCompare(b.session_time ?? "99:99"),
      ),
    );
    setBulkWorkoutsText("");
    setMessage(`${inserted.length} séance(s) ajoutée(s) en lot.`);
  }

  async function duplicateDayPlan() {
    if (!session?.user?.id) return;
    if (duplicateFromDay === duplicateToDay) {
      setMessage("Choisis deux jours différents pour la duplication.");
      return;
    }

    const source = workouts.filter((item) => item.day_of_week === duplicateFromDay);
    if (source.length === 0) {
      setMessage("Aucune séance à dupliquer sur ce jour.");
      return;
    }

    const rows = source.map((item) => ({
      user_id: session.user.id,
      day_of_week: duplicateToDay,
      exercise: item.exercise,
      session_time: item.session_time,
      workout_type: item.workout_type,
      sets: item.sets,
      reps: item.reps,
      status: "planned" as const,
    }));

    const { data, error } = await supabase.from("workout_sessions").insert(rows).select();
    if (error) {
      setMessage(error.message);
      return;
    }

    const inserted = (data ?? []) as WorkoutSession[];
    setWorkouts((curr) =>
      [...curr, ...inserted].sort(
        (a, b) =>
          a.day_of_week - b.day_of_week ||
          (a.session_time ?? "99:99").localeCompare(b.session_time ?? "99:99"),
      ),
    );
    setMessage(`${inserted.length} séance(s) dupliquée(s).`);
  }

  async function generateExpressSession() {
    if (!session?.user?.id) return;

    const templates: Record<
      WorkoutSession["workout_type"],
      Array<{ exercise: string; sets: number; reps: number }>
    > = {
      push: [
        { exercise: "Développé couché", sets: 4, reps: 8 },
        { exercise: "Développé incliné haltères", sets: 4, reps: 10 },
        { exercise: "Dips", sets: 3, reps: 10 },
      ],
      pull: [
        { exercise: "Tractions", sets: 4, reps: 8 },
        { exercise: "Rowing barre", sets: 4, reps: 10 },
        { exercise: "Curl barre", sets: 3, reps: 12 },
      ],
      legs: [
        { exercise: "Squat", sets: 5, reps: 5 },
        { exercise: "Presse à cuisses", sets: 4, reps: 10 },
        { exercise: "Fentes", sets: 3, reps: 12 },
      ],
      cardio: [
        { exercise: "Rameur", sets: 1, reps: 12 },
        { exercise: "SkiErg", sets: 1, reps: 10 },
        { exercise: "Sprint tapis", sets: 1, reps: 8 },
      ],
      other: [
        { exercise: "Circuit Full Body", sets: 4, reps: 12 },
        { exercise: "Gainage", sets: 3, reps: 60 },
        { exercise: "Burpees", sets: 3, reps: 12 },
      ],
    };

    const startHour = Number(generatorStartTime.split(":")[0] ?? "18");
    const startMinute = Number(generatorStartTime.split(":")[1] ?? "0");
    const rows = templates[generatorType].map((item, index) => {
      const totalMinutes = startHour * 60 + startMinute + index * 30;
      const hh = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
      const mm = String(totalMinutes % 60).padStart(2, "0");
      return {
        user_id: session.user.id,
        day_of_week: workoutForm.day_of_week,
        exercise: item.exercise,
        session_time: `${hh}:${mm}`,
        workout_type: generatorType,
        sets: item.sets,
        reps: item.reps,
        status: "planned" as const,
      };
    });

    const { data, error } = await supabase.from("workout_sessions").insert(rows).select();
    if (error) {
      setMessage(error.message);
      return;
    }

    const inserted = (data ?? []) as WorkoutSession[];
    setWorkouts((curr) =>
      [...curr, ...inserted].sort(
        (a, b) =>
          a.day_of_week - b.day_of_week ||
          (a.session_time ?? "99:99").localeCompare(b.session_time ?? "99:99"),
      ),
    );
    setMessage(`Séance express ${generatorType.toUpperCase()} générée (${inserted.length} blocs).`);
  }
  async function addWeight() {
    if (!session?.user?.id) return;
    const payload = { user_id: session.user.id, date: weightForm.date, weight_kg: Number(weightForm.weight_kg), note: weightForm.note || null };
    const { data, error } = await supabase.from("weight_logs").insert(payload).select().single();
    if (error) return setMessage(error.message);
    setWeights((curr) => [data as WeightLog, ...curr].sort((a, b) => b.date.localeCompare(a.date)));
    setWeightForm(initialWeight);
  }
  async function addPr() {
    if (!session?.user?.id) return;
    const payload = { user_id: session.user.id, exercise: prForm.exercise, value: Number(prForm.value), unit: prForm.unit, achieved_on: prForm.achieved_on };
    const { data, error } = await supabase.from("personal_records").insert(payload).select().single();
    if (error) return setMessage(error.message);
    setPrs((curr) => [data as PersonalRecord, ...curr].sort((a, b) => b.achieved_on.localeCompare(a.achieved_on)));
    setPrForm(initialPr);
  }
  async function addMeasurement() {
    if (!session?.user?.id) return;
    const payload = {
      user_id: session.user.id,
      date: measurementForm.date,
      biceps_cm: measurementForm.biceps_cm ? Number(measurementForm.biceps_cm) : null,
      waist_cm: measurementForm.waist_cm ? Number(measurementForm.waist_cm) : null,
      chest_cm: measurementForm.chest_cm ? Number(measurementForm.chest_cm) : null,
      thigh_cm: measurementForm.thigh_cm ? Number(measurementForm.thigh_cm) : null,
    };
    const { data, error } = await supabase.from("measurements").insert(payload).select().single();
    if (error) return setMessage(error.message);
    setMeasurements((curr) => [data as Measurement, ...curr].sort((a, b) => b.date.localeCompare(a.date)));
    setMeasurementForm(initialMeasurement);
  }
  async function removeItem(table: "workout_sessions" | "weight_logs" | "personal_records" | "measurements", id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return setMessage(error.message);
    if (table === "workout_sessions") setWorkouts((curr) => curr.filter((item) => item.id !== id));
    if (table === "weight_logs") setWeights((curr) => curr.filter((item) => item.id !== id));
    if (table === "personal_records") setPrs((curr) => curr.filter((item) => item.id !== id));
    if (table === "measurements") setMeasurements((curr) => curr.filter((item) => item.id !== id));
  }

  async function cycleWorkoutStatus(workout: WorkoutSession) {
    if (!canEdit) return;
    const order: WorkoutSession["status"][] = ["planned", "completed", "skipped"];
    const currentIdx = order.indexOf(workout.status);
    const nextStatus = order[(currentIdx + 1) % order.length];

    const { error } = await supabase
      .from("workout_sessions")
      .update({ status: nextStatus })
      .eq("id", workout.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setWorkouts((curr) =>
      curr.map((item) => (item.id === workout.id ? { ...item, status: nextStatus } : item)),
    );
  }

  function startEditingWorkout(workout: WorkoutSession) {
    setEditingWorkoutId(workout.id);
    setEditingWorkoutForm({
      exercise: workout.exercise ?? "",
      session_time: workout.session_time ?? "18:00",
      workout_type: workout.workout_type ?? "other",
      sets: workout.sets ?? 3,
      reps: workout.reps ?? 10,
      status: workout.status ?? "planned",
    });
  }

  function cancelEditingWorkout() {
    setEditingWorkoutId(null);
    setEditingWorkoutForm({
      exercise: "",
      session_time: "18:00",
      workout_type: "other",
      sets: 3,
      reps: 10,
      status: "planned",
    });
  }

  async function saveEditingWorkout(workoutId: string) {
    if (!canEdit) return;
    if (!editingWorkoutForm.exercise.trim()) {
      setMessage("Le nom de l'exercice est obligatoire.");
      return;
    }

    const payload = {
      exercise: editingWorkoutForm.exercise.trim(),
      session_time: editingWorkoutForm.session_time,
      workout_type: editingWorkoutForm.workout_type,
      sets: Number(editingWorkoutForm.sets),
      reps: Number(editingWorkoutForm.reps),
      status: editingWorkoutForm.status,
    };

    const { error } = await supabase.from("workout_sessions").update(payload).eq("id", workoutId);
    if (error) {
      setMessage(error.message);
      return;
    }

    setWorkouts((curr) =>
      curr
        .map((item) => (item.id === workoutId ? { ...item, ...payload } : item))
        .sort(
          (a, b) =>
            a.day_of_week - b.day_of_week ||
            (a.session_time ?? "99:99").localeCompare(b.session_time ?? "99:99"),
        ),
    );
    setEditingWorkoutId(null);
    setMessage("Séance mise à jour.");
  }

  if (isLoading) return <main className="mx-auto max-w-6xl p-6">Chargement...</main>;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 py-6 md:px-8">
      <header
        className={`${panelClass} sticky top-4 z-20 transition-all duration-300 ${
          isScrolled
            ? "border-blue-200/70 bg-white/90 shadow-[0_18px_40px_rgba(37,99,235,0.18)] dark:border-blue-900/50 dark:bg-zinc-900/90"
            : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className={`transition-all duration-300 ${
              isScrolled ? "max-h-0 opacity-0 -translate-y-1 overflow-hidden" : "max-h-24 opacity-100 translate-y-0"
            }`}
          >
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Planning Fitness
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Dashboard musculation - style modern UI.
            </p>
          </div>

          <div
            className={`relative transition-all duration-300 ${
              isScrolled ? "max-h-0 opacity-0 overflow-hidden pointer-events-none" : "max-h-40 opacity-100"
            }`}
          >
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Admin
                </span>
                <button onClick={handleSignOut} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                  Déconnexion
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowAuthMenu((curr) => !curr)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21a8 8 0 0 0-16 0" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  Connexion
                </button>
                <div
                  className={`fixed inset-x-4 top-24 z-50 w-auto space-y-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl transition-all duration-200 dark:border-zinc-700 dark:bg-zinc-900 sm:absolute sm:inset-x-auto sm:top-12 sm:right-0 sm:w-80 ${
                    showAuthMenu
                      ? "visible translate-y-0 opacity-100"
                      : "invisible -translate-y-1 opacity-0 pointer-events-none"
                  }`}
                >
                    <input className={inputClass} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <div className="relative">
                      <input className={`${inputClass} pr-20`} type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword((curr) => !curr)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
                        {showPassword ? "Masquer" : "Afficher"}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSignIn} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">Connexion</button>
                      <button onClick={handleSignUp} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700">Inscription</button>
                      <button onClick={handleForgotPassword} className="ml-auto text-xs font-medium text-indigo-600 dark:text-indigo-400">Oublié ?</button>
                    </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <section className={`${panelClass} bg-gradient-to-r from-white/80 to-sky-50/70 dark:from-zinc-950/60 dark:to-sky-950/10`}>
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {tab}
            </button>
          ))}
          {isAdmin ? (
            <div className="ml-auto inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
              <button type="button" onClick={() => setAdminMode("view")} className={`rounded-lg px-3 py-1 text-xs font-semibold ${adminMode === "view" ? "bg-white dark:bg-zinc-950" : ""}`}>Affichage</button>
              <button type="button" onClick={() => setAdminMode("edit")} className={`rounded-lg px-3 py-1 text-xs font-semibold ${adminMode === "edit" ? "bg-white dark:bg-zinc-950" : ""}`}>Modification</button>
            </div>
          ) : null}
        </div>
      </section>

      {message ? (
        <section className={`${panelClass} border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 to-white dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-zinc-950/40`}>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
        </section>
      ) : null}

      {(activeTab === "Dashboard" || activeTab === "Aujourd'hui") && (
        <section className="grid animate-fade-slide gap-4 md:grid-cols-2">
          <article className={`${panelClass} bg-gradient-to-b from-sky-50/70 to-white dark:from-sky-950/10 dark:to-zinc-950/50`}>
            <div className="flex items-center justify-between">
              {title("Aujourd'hui")}
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                {DAYS[currentDayOfWeek - 1]}
              </span>
            </div>
            {todaySessions.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {todaySessions.map((session) => (
                  <li key={session.id} className="rounded-xl border border-zinc-200 bg-white/85 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/60">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{session.exercise}</p>
                    <p className="text-zinc-600 dark:text-zinc-300">
                      {session.session_time ?? "Sans heure"} - {session.sets} x {session.reps}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                Aucune séance prévue aujourd&apos;hui.
              </p>
            )}
            {nextSession ? (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/90 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Prochaine séance</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {nextSession.exercise}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {DAYS[nextSession.day_of_week - 1]} - {nextSession.session_time ?? "Sans heure"}
                </p>
              </div>
            ) : null}
          </article>

          <article className={`${panelClass} bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-950/10 dark:to-zinc-950/50`}>
            {title("Objectifs")}
            <div className="mt-3 grid gap-2">
              <input
                className={inputClass}
                placeholder="Objectif poids (ex: 78kg)"
                value={goals.weightTarget}
                onChange={(e) => setGoals((curr) => ({ ...curr, weightTarget: e.target.value }))}
              />
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  className={inputClass}
                  placeholder="Exercice PR cible"
                  value={goals.prExercise}
                  onChange={(e) => setGoals((curr) => ({ ...curr, prExercise: e.target.value }))}
                />
                <input
                  className={inputClass}
                  placeholder="Valeur PR cible"
                  value={goals.prTarget}
                  onChange={(e) => setGoals((curr) => ({ ...curr, prTarget: e.target.value }))}
                />
              </div>
              <input
                className={inputClass}
                type="date"
                value={goals.deadline}
                onChange={(e) => setGoals((curr) => ({ ...curr, deadline: e.target.value }))}
              />
            </div>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Objectifs sauvegardés automatiquement en local.
            </p>
          </article>
        </section>
      )}

      {(activeTab === "Dashboard" || activeTab === "Aujourd'hui") && (
        <section className={`${panelClass} animate-fade-slide`}>
          {title("Stats rapides")}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="rounded-xl border border-zinc-200 bg-white/85 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-xs text-zinc-500">Total séances</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/85 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-xs text-zinc-500">Complétées</p>
              <p className="text-xl font-bold text-emerald-600">{stats.completed}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/85 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-xs text-zinc-500">Planned</p>
              <p className="text-xl font-bold text-blue-600">{stats.planned}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/85 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-xs text-zinc-500">Skipped</p>
              <p className="text-xl font-bold text-rose-600">{stats.skipped}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/85 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-xs text-zinc-500">Taux completion</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{stats.completionRate}%</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/85 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-xs text-zinc-500">Exercices uniques</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{stats.uniqueExercises}</p>
            </div>
          </div>
        </section>
      )}

      {(activeTab === "Dashboard" || activeTab === "Planning") && (
        <section key={`planning-${activeTab}`} className={`${panelClass} animate-fade-slide bg-gradient-to-b from-sky-50/75 to-white dark:from-sky-950/10 dark:to-zinc-950/50`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {title("Planning Hebdomadaire")}
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {displayWorkouts.length} seance(s)
            </span>
          </div>
          {canEdit ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-blue-100/80 bg-gradient-to-r from-blue-50/80 to-indigo-50/70 p-3 dark:border-blue-900/40 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="grid gap-2 md:grid-cols-7">
              <select value={workoutForm.day_of_week ?? 1} onChange={(e) => setWorkoutForm((curr) => ({ ...normalizeWorkoutForm(curr), day_of_week: Number(e.target.value) }))} className={inputClass}>
                {DAYS.map((day, i) => <option key={day} value={i + 1}>{day}</option>)}
              </select>
              <input className={inputClass} placeholder="Exercice" value={workoutForm.exercise ?? ""} onChange={(e) => setWorkoutForm((curr) => ({ ...normalizeWorkoutForm(curr), exercise: e.target.value }))} />
              <input className={inputClass} type="time" value={workoutForm.session_time ?? "18:00"} onChange={(e) => setWorkoutForm((curr) => ({ ...normalizeWorkoutForm(curr), session_time: e.target.value }))} />
              <select value={workoutForm.workout_type ?? "other"} onChange={(e) => setWorkoutForm((curr) => ({ ...normalizeWorkoutForm(curr), workout_type: e.target.value as WorkoutSession["workout_type"] }))} className={inputClass}>
                <option value="push">Push</option>
                <option value="pull">Pull</option>
                <option value="legs">Legs</option>
                <option value="cardio">Cardio</option>
                <option value="other">Autre</option>
              </select>
              <input className={inputClass} type="number" placeholder="Sets" value={workoutForm.sets ?? 3} onChange={(e) => setWorkoutForm((curr) => ({ ...normalizeWorkoutForm(curr), sets: Number(e.target.value) }))} />
              <input className={inputClass} type="number" placeholder="Reps" value={workoutForm.reps ?? 10} onChange={(e) => setWorkoutForm((curr) => ({ ...normalizeWorkoutForm(curr), reps: Number(e.target.value) }))} />
              <button onClick={addWorkout} className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110">Ajouter</button>
              </div>

              <div className="rounded-xl border border-blue-200/70 bg-white/70 p-3 dark:border-blue-900/40 dark:bg-zinc-950/40">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Ajout rapide en lot</p>
                  <select
                    value={bulkDay}
                    onChange={(e) => setBulkDay(Number(e.target.value))}
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {DAYS.map((day, i) => (
                      <option key={day} value={i + 1}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {Object.keys(BULK_TEMPLATES).map((templateName) => (
                    <button
                      key={templateName}
                      type="button"
                      onClick={() => setBulkWorkoutsText(BULK_TEMPLATES[templateName as keyof typeof BULK_TEMPLATES])}
                      className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      {templateName}
                    </button>
                  ))}
                </div>
                <textarea
                  value={bulkWorkoutsText}
                  onChange={(e) => setBulkWorkoutsText(e.target.value)}
                  placeholder={
                    "Une séance par ligne\n18:00 | push | Développé couché | 4 | 8\n19:00 | pull | Tractions lestées | 4 | 6"
                  }
                  rows={4}
                  className={`${inputClass} resize-y`}
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Format: HH:MM | type(push/pull/legs/cardio/other) | exercice | sets | reps
                  </p>
                  <button
                    onClick={addWorkoutsInBulk}
                    className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Ajouter en lot
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-indigo-200/70 bg-white/70 p-3 dark:border-indigo-900/40 dark:bg-zinc-950/40">
                <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  Outils créatifs
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                    <p className="mb-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">Dupliquer un jour</p>
                    <div className="flex items-center gap-2">
                      <select
                        value={duplicateFromDay}
                        onChange={(e) => setDuplicateFromDay(Number(e.target.value))}
                        className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      >
                        {DAYS.map((day, i) => (
                          <option key={`${day}-from`} value={i + 1}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-zinc-500">→</span>
                      <select
                        value={duplicateToDay}
                        onChange={(e) => setDuplicateToDay(Number(e.target.value))}
                        className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      >
                        {DAYS.map((day, i) => (
                          <option key={`${day}-to`} value={i + 1}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={duplicateDayPlan}
                        className="ml-auto rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Dupliquer
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                    <p className="mb-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">Générateur express</p>
                    <div className="flex items-center gap-2">
                      <select
                        value={generatorType}
                        onChange={(e) =>
                          setGeneratorType(e.target.value as WorkoutSession["workout_type"])
                        }
                        className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      >
                        <option value="push">Push</option>
                        <option value="pull">Pull</option>
                        <option value="legs">Legs</option>
                        <option value="cardio">Cardio</option>
                        <option value="other">Autre</option>
                      </select>
                      <input
                        type="time"
                        value={generatorStartTime}
                        onChange={(e) => setGeneratorStartTime(e.target.value)}
                        className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      <button
                        type="button"
                        onClick={generateExpressSession}
                        className="ml-auto rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Générer
                      </button>
                    </div>
                  </div>
                </div>
                {topExercises.length > 0 ? (
                  <div className="mt-2">
                    <p className="mb-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      Top exercices
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {topExercises.map((exercise) => (
                        <button
                          key={exercise}
                          type="button"
                          onClick={() =>
                            setWorkoutForm((curr) => ({ ...normalizeWorkoutForm(curr), exercise }))
                          }
                          className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          {exercise}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <input
              value={planningQuery}
              onChange={(e) => setPlanningQuery(e.target.value)}
              placeholder="Filtrer les séances (ex: squat, push...)"
              className={`${inputClass} w-full md:w-80`}
            />
            {planningQuery ? (
              <button
                type="button"
                onClick={() => setPlanningQuery("")}
                className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold dark:border-zinc-700"
              >
                Effacer filtre
              </button>
            ) : null}
          </div>
          <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-white/60 p-2 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="grid grid-flow-col auto-cols-[80vw] gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid-flow-row md:auto-cols-auto md:overflow-x-visible md:pb-0 md:snap-none md:grid-cols-2 xl:grid-cols-7">
            {DAYS.map((day, i) => (
              <div key={day} className="group min-h-64 snap-start rounded-xl border border-zinc-200/90 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="sticky top-2 z-10 mb-2 flex items-center justify-between rounded-lg bg-zinc-100/90 px-2 py-1 dark:bg-zinc-900/90">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">{day}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                    J{i + 1}
                  </span>
                </div>
                <ul className="space-y-2">
                  {displayWorkouts
                    .filter((w) => w.day_of_week === i + 1)
                    .filter((w) =>
                      planningQuery
                        ? `${w.exercise} ${w.workout_type} ${w.status}`
                            .toLowerCase()
                            .includes(planningQuery.toLowerCase())
                        : true,
                    )
                    .sort((a, b) => (a.session_time ?? "99:99").localeCompare(b.session_time ?? "99:99"))
                    .map((w) => (
                    <li key={w.id} className="relative rounded-lg border border-zinc-200 bg-white/90 p-2 pl-4 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                      <span className="absolute left-1.5 top-2.5 h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                      {editingWorkoutId === w.id ? (
                        <div className="space-y-1">
                          <input
                            className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                            value={editingWorkoutForm.exercise}
                            onChange={(e) =>
                              setEditingWorkoutForm((curr) => ({ ...curr, exercise: e.target.value }))
                            }
                          />
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                              type="time"
                              value={editingWorkoutForm.session_time}
                              onChange={(e) =>
                                setEditingWorkoutForm((curr) => ({ ...curr, session_time: e.target.value }))
                              }
                            />
                            <select
                              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                              value={editingWorkoutForm.workout_type}
                              onChange={(e) =>
                                setEditingWorkoutForm((curr) => ({
                                  ...curr,
                                  workout_type: e.target.value as WorkoutSession["workout_type"],
                                }))
                              }
                            >
                              <option value="push">Push</option>
                              <option value="pull">Pull</option>
                              <option value="legs">Legs</option>
                              <option value="cardio">Cardio</option>
                              <option value="other">Autre</option>
                            </select>
                            <input
                              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                              type="number"
                              value={editingWorkoutForm.sets}
                              onChange={(e) =>
                                setEditingWorkoutForm((curr) => ({ ...curr, sets: Number(e.target.value) }))
                              }
                            />
                            <input
                              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                              type="number"
                              value={editingWorkoutForm.reps}
                              onChange={(e) =>
                                setEditingWorkoutForm((curr) => ({ ...curr, reps: Number(e.target.value) }))
                              }
                            />
                          </div>
                          <select
                            className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs uppercase dark:border-zinc-700 dark:bg-zinc-900"
                            value={editingWorkoutForm.status}
                            onChange={(e) =>
                              setEditingWorkoutForm((curr) => ({
                                ...curr,
                                status: e.target.value as WorkoutSession["status"],
                              }))
                            }
                          >
                            <option value="planned">planned</option>
                            <option value="completed">completed</option>
                            <option value="skipped">skipped</option>
                          </select>
                          <div className="mt-1 flex gap-1">
                            <button
                              type="button"
                              onClick={() => saveEditingWorkout(w.id)}
                              className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                            >
                              Enregistrer
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditingWorkout}
                              className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-semibold dark:border-zinc-700"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="font-semibold text-zinc-800 dark:text-zinc-100">{w.exercise}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${typeBadgeClass[w.workout_type ?? "other"]}`}>
                              {w.workout_type ?? "other"}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">{w.session_time ?? "Sans heure"}</p>
                          <p className="text-zinc-600 dark:text-zinc-300">{w.sets} x {w.reps}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{w.status}</p>
                            {canEdit ? (
                              <button
                                type="button"
                                onClick={() => cycleWorkoutStatus(w)}
                                className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                Changer statut
                              </button>
                            ) : null}
                          </div>
                          {canEdit ? (
                            <div className="mt-1 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditingWorkout(w)}
                                className="text-[10px] font-semibold text-blue-600 dark:text-blue-400"
                              >
                                Modifier
                              </button>
                              <button onClick={() => removeItem("workout_sessions", w.id)} className="text-[10px] text-rose-600">Supprimer</button>
                            </div>
                          ) : null}
                        </>
                      )}
                    </li>
                  ))}
                  {displayWorkouts.filter((w) => w.day_of_week === i + 1).length === 0 ? (
                    <li className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-2 text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-500">
                      Aucun evenement
                    </li>
                  ) : null}
                </ul>
              </div>
            ))}
            </div>
          </div>
        </section>
      )}

      {(activeTab === "Dashboard" || activeTab === "Poids") && (
        <section key={`poids-${activeTab}`} className="grid animate-fade-slide gap-4 md:grid-cols-2">
          <article className={`${panelClass} bg-gradient-to-b from-emerald-50/70 to-white dark:from-emerald-950/10 dark:to-zinc-950/50`}>
            {title("Notes de Poids")}
            {canEdit ? (
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <input className={inputClass} type="date" value={weightForm.date} onChange={(e) => setWeightForm((curr) => ({ ...curr, date: e.target.value }))} />
                <input className={inputClass} type="number" step="0.1" value={weightForm.weight_kg} onChange={(e) => setWeightForm((curr) => ({ ...curr, weight_kg: Number(e.target.value) }))} />
                <button onClick={addWeight} className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110">Ajouter</button>
                <input className={`${inputClass} md:col-span-3`} placeholder="Note optionnelle" value={weightForm.note} onChange={(e) => setWeightForm((curr) => ({ ...curr, note: e.target.value }))} />
              </div>
            ) : null}
            <div className="mt-4 space-y-2">
              {displayWeights.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                  <p className="font-medium">{formatDateJJMMYYYY(entry.date)} - {entry.weight_kg} kg</p>
                  <p className="text-zinc-500">{entry.note || "Sans note"}</p>
                  {canEdit ? <button onClick={() => removeItem("weight_logs", entry.id)} className="text-xs text-rose-600">Supprimer</button> : null}
                </div>
              ))}
            </div>
          </article>
          <ProgressChart logs={displayWeights} />
        </section>
      )}

      {(activeTab === "Dashboard" || activeTab === "PR" || activeTab === "Mensurations") && (
        <section key={`stats-${activeTab}`} className="grid animate-fade-slide gap-4 md:grid-cols-2">
          {(activeTab === "Dashboard" || activeTab === "PR") && (
            <article className={`${panelClass} bg-gradient-to-b from-violet-50/75 to-white dark:from-violet-950/10 dark:to-zinc-950/50`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                {title("Records Personnels")}
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                  {displayPrs.length} record(s)
                </span>
              </div>
              {canEdit ? (
                <div className="mt-4 grid gap-2 rounded-2xl border border-violet-100/80 bg-gradient-to-r from-violet-50/80 to-fuchsia-50/70 p-3 md:grid-cols-2 dark:border-violet-900/40 dark:from-violet-950/20 dark:to-fuchsia-950/20">
                  <input className={inputClass} placeholder="Exercice" value={prForm.exercise} onChange={(e) => setPrForm((curr) => ({ ...curr, exercise: e.target.value }))} />
                  <input className={inputClass} type="number" value={prForm.value} onChange={(e) => setPrForm((curr) => ({ ...curr, value: Number(e.target.value) }))} />
                  <input className={inputClass} placeholder="Unité (kg/reps)" value={prForm.unit} onChange={(e) => setPrForm((curr) => ({ ...curr, unit: e.target.value }))} />
                  <input className={inputClass} type="date" value={prForm.achieved_on} onChange={(e) => setPrForm((curr) => ({ ...curr, achieved_on: e.target.value }))} />
                  <button onClick={addPr} className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 md:col-span-2">Ajouter PR</button>
                </div>
              ) : null}
              <div className="mt-4 space-y-2">
                {displayPrs.map((record, idx) => (
                  <div key={record.id} className="rounded-2xl border border-zinc-200 bg-white/80 p-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-100">{record.exercise}</p>
                        <p className="text-zinc-500">Atteint le {formatDateJJMMYYYY(record.achieved_on)}</p>
                      </div>
                      <span className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1 text-xs font-bold text-white">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-base font-bold text-violet-700 dark:text-violet-300">
                        {record.value} {record.unit}
                      </p>
                      {canEdit ? (
                        <button onClick={() => removeItem("personal_records", record.id)} className="text-xs font-medium text-rose-600 hover:text-rose-500">
                          Supprimer
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}
          {(activeTab === "Dashboard" || activeTab === "Mensurations") && (
            <article className={`${panelClass} bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-950/10 dark:to-zinc-950/50`}>
              {title("Mensurations")}
              {canEdit ? (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input className={`${inputClass} md:col-span-2`} type="date" value={measurementForm.date} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, date: e.target.value }))} />
                  <input className={inputClass} type="number" step="0.1" placeholder="Bras (cm)" value={measurementForm.biceps_cm} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, biceps_cm: e.target.value }))} />
                  <input className={inputClass} type="number" step="0.1" placeholder="Taille (cm)" value={measurementForm.waist_cm} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, waist_cm: e.target.value }))} />
                  <input className={inputClass} type="number" step="0.1" placeholder="Poitrine (cm)" value={measurementForm.chest_cm} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, chest_cm: e.target.value }))} />
                  <input className={inputClass} type="number" step="0.1" placeholder="Cuisse (cm)" value={measurementForm.thigh_cm} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, thigh_cm: e.target.value }))} />
                  <button onClick={addMeasurement} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 md:col-span-2">Ajouter</button>
                </div>
              ) : null}
              <div className="mt-4 space-y-2">
                {displayMeasurements.map((item) => (
                  <div key={item.id} className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <p className="font-medium">{formatDateJJMMYYYY(item.date)}</p>
                    <p className="text-zinc-500">Bras: {item.biceps_cm ?? "-"} cm | Taille: {item.waist_cm ?? "-"} cm | Poitrine: {item.chest_cm ?? "-"} cm | Cuisse: {item.thigh_cm ?? "-"} cm</p>
                    {canEdit ? <button onClick={() => removeItem("measurements", item.id)} className="text-xs text-rose-600">Supprimer</button> : null}
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>
      )}
    </main>
  );
}
