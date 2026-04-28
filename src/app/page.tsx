 "use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ActivityIcon,
  CalendarIcon,
  Pill,
  SectionHeading,
  SparklesIcon,
  StatCard,
  TrophyIcon,
  cn,
} from "@/components/marketing-ui";
import { ProgressChart } from "@/components/ProgressChart";
import { supabase } from "@/lib/supabase";
import type { Measurement, PersonalRecord, WeightLog, WorkoutSession } from "@/types/fitness";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const TABS = ["Dashboard", "Focus", "Aujourd'hui", "Planning", "Poids", "PR", "Mensurations"] as const;
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

const shellClass =
  "rounded-[32px] border border-black/8 bg-white/72 shadow-[0_20px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6";
const softPanelClass =
  "rounded-[28px] border border-black/6 bg-white/78 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5";
const inputClass =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 dark:border-white/10 dark:bg-white/5 dark:text-white";
const buttonPrimaryClass =
  "inline-flex items-center justify-center rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0077ed]";
const buttonSecondaryClass =
  "inline-flex items-center justify-center rounded-full border border-black/10 bg-white/80 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10";
const typeBadgeClass: Record<string, string> = {
  push: "bg-[#fce7f3] text-[#9d174d] dark:bg-[#831843]/40 dark:text-[#fbcfe8]",
  pull: "bg-[#e0e7ff] text-[#3730a3] dark:bg-[#312e81]/40 dark:text-[#c7d2fe]",
  legs: "bg-[#dcfce7] text-[#166534] dark:bg-[#14532d]/40 dark:text-[#bbf7d0]",
  cardio: "bg-[#fef3c7] text-[#92400e] dark:bg-[#78350f]/40 dark:text-[#fde68a]",
  other: "bg-[#f3f4f6] text-[#3f3f46] dark:bg-white/10 dark:text-white/80",
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

function formatDateJJMMYYYY(input: string) {
  const [year, month, day] = input.split("-");
  if (!year || !month || !day) return input;
  return `${day}/${month}/${year}`;
}

function getCurrentDayOfWeek() {
  const jsDay = new Date().getDay();
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
  const [focusSessionId, setFocusSessionId] = useState<string | null>(null);
  const [restSeconds, setRestSeconds] = useState(90);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [workoutSetLogs, setWorkoutSetLogs] = useState<Record<string, boolean[]>>({});

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
  const progressionTips = useMemo(() => {
    const completed = displayWorkouts.filter((w) => w.status === "completed");
    const byExercise = new Map<string, { reps: number; sets: number; count: number }>();
    for (const item of completed) {
      const prev = byExercise.get(item.exercise);
      if (!prev) {
        byExercise.set(item.exercise, { reps: item.reps, sets: item.sets, count: 1 });
      } else {
        byExercise.set(item.exercise, {
          reps: Math.max(prev.reps, item.reps),
          sets: Math.max(prev.sets, item.sets),
          count: prev.count + 1,
        });
      }
    }
    return [...byExercise.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
      .map(([exercise, stats]) => ({
        exercise,
        suggestion:
          stats.reps < 12
            ? `Passe à ${stats.sets} x ${stats.reps + 1}`
            : `Garde ${stats.sets} x ${stats.reps} et augmente légèrement la charge`,
      }));
  }, [displayWorkouts]);
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

  useEffect(() => {
    if (!isRestRunning) return;
    const timer = window.setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          setIsRestRunning(false);
          if (typeof window !== "undefined") {
            try {
              const audioContext = new window.AudioContext();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              oscillator.type = "sine";
              oscillator.frequency.value = 880;
              gainNode.gain.value = 0.03;
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              oscillator.start();
              oscillator.stop(audioContext.currentTime + 0.15);
            } catch {
              // ignore if browser blocks audio
            }
            if ("vibrate" in navigator) {
              navigator.vibrate([120, 60, 120]);
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRestRunning]);

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

  function startRestTimer(seconds: number) {
    setRestSeconds(seconds);
    setIsRestRunning(true);
  }

  function initSetLogForSession(session: WorkoutSession) {
    setWorkoutSetLogs((curr) => {
      if (curr[session.id]) return curr;
      return { ...curr, [session.id]: Array.from({ length: session.sets }, () => false) };
    });
  }

  function toggleSetLog(sessionId: string, setIndex: number) {
    const session = workouts.find((item) => item.id === sessionId);
    if (!session) return;

    setWorkoutSetLogs((curr) => {
      const currentSets = curr[sessionId] ?? Array.from({ length: session.sets }, () => false);
      const next = [...currentSets];
      next[setIndex] = !next[setIndex];

      const allDone = next.length > 0 && next.every(Boolean);
      const nextStatus: WorkoutSession["status"] = allDone ? "completed" : "planned";

      if (session.status !== nextStatus) {
        void supabase.from("workout_sessions").update({ status: nextStatus }).eq("id", sessionId);
        setWorkouts((workoutList) =>
          workoutList.map((item) =>
            item.id === sessionId ? { ...item, status: nextStatus } : item,
          ),
        );
      }

      return { ...curr, [sessionId]: next };
    });
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

  const heroPrimaryStat = nextSession ? `${DAYS[nextSession.day_of_week - 1]} ${nextSession.session_time ?? ""}`.trim() : "Planifie";

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6">
        <div className={cn(shellClass, "w-full max-w-xl p-10 text-center")}>
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">Fitness OS</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">Chargement de l&apos;expérience</h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
            Synchronisation du planning, des objectifs et des métriques.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
      <header
        className={cn(
          "sticky top-4 z-40 rounded-full border px-4 py-3 transition-all duration-300",
          "border-black/8 bg-white/72 backdrop-blur-2xl dark:border-white/10 dark:bg-black/35",
          isScrolled && "shadow-[0_18px_60px_rgba(0,0,0,0.12)]",
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-zinc-500 dark:text-zinc-400">
              Planning Fitness
            </p>
            <p className="text-sm text-zinc-900 dark:text-white">Frontend premium inspiré d&apos;Apple</p>
          </div>

          <nav className="hidden flex-wrap items-center gap-2 lg:flex">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition",
                  activeTab === tab
                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                    : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/8",
                )}
              >
                {tab}
              </button>
            ))}
          </nav>

          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Pill>Admin</Pill>
              <div className="hidden rounded-full border border-black/8 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5 sm:inline-flex">
                <button
                  type="button"
                  onClick={() => setAdminMode("view")}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium",
                    adminMode === "view" && "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950",
                  )}
                >
                  Vue
                </button>
                <button
                  type="button"
                  onClick={() => setAdminMode("edit")}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium",
                    adminMode === "edit" && "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950",
                  )}
                >
                  Edition
                </button>
              </div>
              <button type="button" onClick={handleSignOut} className={buttonSecondaryClass}>
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="relative">
              <button type="button" onClick={() => setShowAuthMenu((curr) => !curr)} className={buttonSecondaryClass}>
                Connexion
              </button>
              <div
                className={cn(
                  "absolute right-0 top-14 z-50 w-[min(92vw,360px)] rounded-[28px] border border-black/8 bg-white/92 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.16)] backdrop-blur-2xl transition",
                  "dark:border-white/10 dark:bg-[#111114]/92",
                  showAuthMenu ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
                )}
              >
                <div className="space-y-3">
                  <input className={inputClass} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <div className="relative">
                    <input
                      className={cn(inputClass, "pr-20")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((curr) => !curr)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500"
                    >
                      {showPassword ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleSignIn} className={buttonPrimaryClass}>
                      Connexion
                    </button>
                    <button type="button" onClick={handleSignUp} className={buttonSecondaryClass}>
                      Inscription
                    </button>
                    <button type="button" onClick={handleForgotPassword} className="ml-auto text-xs font-medium text-[#0071e3]">
                      Mot de passe oublié ?
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="relative mt-6 overflow-hidden rounded-[40px] border border-black/8 bg-[#f5f5f7] px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.10)] dark:border-white/10 dark:bg-[#0b0b0f] sm:px-8 sm:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,113,227,0.18),transparent_34%),radial-gradient(circle_at_85%_25%,rgba(92,225,230,0.12),transparent_25%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
          <div className="max-w-3xl">
            <Pill className="gap-2">
              <SparklesIcon />
              {isAdmin ? "Compte connecté" : "Mode démo intelligent"}
            </Pill>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-6xl lg:text-7xl">
              Votre coaching fitness,
              <br />
              pensé comme un produit premium.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
              Refonte complète du frontend dans une esthétique minimaliste, lumineuse et très hiérarchisée.
              Les objectifs, le planning, le mode focus et les statistiques restent accessibles dans une seule expérience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => setActiveTab("Dashboard")} className={cn(buttonPrimaryClass, "hero-button")}>
                Ouvrir le dashboard
              </button>
              <button type="button" onClick={() => setActiveTab("Planning")} className={cn(buttonSecondaryClass, "hero-button")}>
                Voir le planning
              </button>
            </div>
          </div>

          <div className={cn(shellClass, "float-gentle relative overflow-hidden p-6")}>
            <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(0,113,227,0.16),transparent)]" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                Aperçu système
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Prochaine séance</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {nextSession?.exercise ?? "Aucune"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{heroPrimaryStat}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Complétion</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {stats.completionRate}%
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{stats.completed} séances complétées</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <StatCard label="Aujourd'hui" value={todaySessions.length} tone="blue" icon={<CalendarIcon />} />
                <StatCard label="Exercices" value={stats.uniqueExercises} icon={<ActivityIcon />} />
                <StatCard label="PR actifs" value={displayPrs.length} tone="green" icon={<TrophyIcon />} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className={cn(softPanelClass, "lift-hover md:col-span-1")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Aujourd&apos;hui</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">{DAYS[currentDayOfWeek - 1]}</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {todaySessions.length > 0 ? `${todaySessions.length} séance(s) à gérer.` : "Aucune séance prévue pour le moment."}
          </p>
        </div>
        <div className={cn(softPanelClass, "lift-hover md:col-span-1")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Objectif poids</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">{goals.weightTarget || "Non défini"}</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Suivi personnel sauvegardé localement.</p>
        </div>
        <div className={cn(softPanelClass, "lift-hover md:col-span-1")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">PR cible</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            {goals.prExercise && goals.prTarget ? `${goals.prExercise} ${goals.prTarget}` : "A définir"}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{goals.deadline ? `Deadline ${formatDateJJMMYYYY(goals.deadline)}` : "Ajoutez une échéance."}</p>
        </div>
      </section>

      <section className={cn(shellClass, "mt-6 p-4 sm:p-5")}>
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition",
                activeTab === tab
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                  : "border border-black/8 bg-white/70 text-zinc-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10",
              )}
            >
              {tab}
            </button>
          ))}
          {isAdmin ? (
            <div className="ml-auto inline-flex rounded-full border border-black/8 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setAdminMode("view")}
                className={cn("rounded-full px-3 py-1.5 text-xs font-medium", adminMode === "view" && "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950")}
              >
                Affichage
              </button>
              <button
                type="button"
                onClick={() => setAdminMode("edit")}
                className={cn("rounded-full px-3 py-1.5 text-xs font-medium", adminMode === "edit" && "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950")}
              >
                Modification
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {message ? (
        <section className={cn(shellClass, "mt-6 p-5")}>
          <p className="text-sm text-[#0071e3]">{message}</p>
        </section>
      ) : null}

      {(activeTab === "Dashboard" || activeTab === "Aujourd'hui") && (
        <section className="mt-10 space-y-5">
          <SectionHeading
            eyebrow="Overview"
            title="Une vue claire de la journée."
            description="Inspiré des pages produit Apple: gros contraste typographique, blocs respirants et lecture immédiate des priorités."
          />
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className={cn(shellClass, "p-6")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Aujourd&apos;hui</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {todaySessions.length > 0 ? `${todaySessions.length} bloc(s) prévus` : "Journée légère"}
                  </h3>
                </div>
                <Pill className="gap-2">
                  <CalendarIcon />
                  {DAYS[currentDayOfWeek - 1]}
                </Pill>
              </div>
              <div className="mt-6 space-y-3">
                {todaySessions.length > 0 ? (
                  todaySessions.map((session) => (
                    <div key={session.id} className="lift-hover rounded-[24px] border border-black/8 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-medium text-zinc-950 dark:text-white">{session.exercise}</p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-300">
                            {session.session_time ?? "Sans heure"} • {session.sets} x {session.reps}
                          </p>
                        </div>
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", typeBadgeClass[session.workout_type ?? "other"])}>
                          {session.workout_type}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-black/12 p-6 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                    Aucune séance prévue aujourd&apos;hui.
                  </div>
                )}
              </div>
            </article>

            <article className={cn(shellClass, "p-6")}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Objectifs</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                Cadrez le prochain cap.
              </h3>
              <div className="mt-6 grid gap-3">
                <input className={inputClass} placeholder="Objectif poids (ex: 78kg)" value={goals.weightTarget} onChange={(e) => setGoals((curr) => ({ ...curr, weightTarget: e.target.value }))} />
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={inputClass} placeholder="Exercice PR cible" value={goals.prExercise} onChange={(e) => setGoals((curr) => ({ ...curr, prExercise: e.target.value }))} />
                  <input className={inputClass} placeholder="Valeur PR cible" value={goals.prTarget} onChange={(e) => setGoals((curr) => ({ ...curr, prTarget: e.target.value }))} />
                </div>
                <input className={inputClass} type="date" value={goals.deadline} onChange={(e) => setGoals((curr) => ({ ...curr, deadline: e.target.value }))} />
              </div>
            </article>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard label="Total séances" value={stats.total} icon={<ActivityIcon />} />
            <StatCard label="Complétées" value={stats.completed} tone="green" icon={<SparklesIcon />} />
            <StatCard label="Planifiées" value={stats.planned} tone="blue" icon={<CalendarIcon />} />
            <StatCard label="Skipped" value={stats.skipped} tone="amber" icon={<ActivityIcon />} />
            <StatCard label="Taux réussite" value={`${stats.completionRate}%`} icon={<SparklesIcon />} />
            <StatCard label="Exercices uniques" value={stats.uniqueExercises} icon={<TrophyIcon />} />
          </div>
        </section>
      )}

      {(activeTab === "Dashboard" || activeTab === "Focus") && (
        <section className="mt-14 space-y-5">
          <SectionHeading
            eyebrow="Focus"
            title="Mode séance, sans friction."
            description="Un espace plus immersif pour sélectionner l&apos;exercice en cours, lancer le chrono de repos et suivre les séries."
          />
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className={cn(shellClass, "p-6")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Chrono repos</p>
                  <h3 className="mt-2 text-5xl font-semibold tracking-[-0.04em] text-zinc-950 dark:text-white">
                    {String(Math.floor(restSeconds / 60)).padStart(2, "0")}:{String(restSeconds % 60).padStart(2, "0")}
                  </h3>
                </div>
                <Pill>{isRestRunning ? "En cours" : "En pause"}</Pill>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {[60, 90, 120].map((value) => (
                  <button key={value} type="button" onClick={() => startRestTimer(value)} className={buttonSecondaryClass}>
                    {value}s
                  </button>
                ))}
                <button type="button" onClick={() => setIsRestRunning((prev) => !prev)} className={buttonPrimaryClass}>
                  {isRestRunning ? "Pause" : "Lancer"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRestRunning(false);
                    setRestSeconds(90);
                  }}
                  className={buttonSecondaryClass}
                >
                  Reset
                </button>
              </div>

              <div className="mt-8 space-y-3">
                {todaySessions.length > 0 ? (
                  todaySessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => {
                        setFocusSessionId(session.id);
                        initSetLogForSession(session);
                        startRestTimer(90);
                      }}
                      className={cn(
                        "w-full rounded-[24px] border p-4 text-left transition",
                        focusSessionId === session.id
                          ? "border-[#0071e3]/30 bg-[#0071e3]/8"
                          : "border-black/8 bg-white/80 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-medium text-zinc-950 dark:text-white">{session.exercise}</p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-300">
                            {session.session_time ?? "Sans heure"} • {session.sets} x {session.reps}
                          </p>
                        </div>
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", typeBadgeClass[session.workout_type ?? "other"])}>
                          {session.workout_type}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-black/12 p-6 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                    Aucune séance aujourd&apos;hui.
                  </div>
                )}
              </div>

              {focusSessionId ? (
                <div className="mt-6 rounded-[28px] border border-black/8 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                  {todaySessions
                    .filter((session) => session.id === focusSessionId)
                    .map((session) => {
                      const setLog = workoutSetLogs[session.id] ?? Array.from({ length: session.sets }, () => false);
                      const doneCount = setLog.filter(Boolean).length;

                      return (
                        <div key={session.id}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Journal de séance</p>
                          <h4 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                            {session.exercise}
                          </h4>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-300">{doneCount}/{session.sets} séries validées</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {setLog.map((done, idx) => (
                              <button
                                key={`${session.id}-set-${idx + 1}`}
                                type="button"
                                onClick={() => toggleSetLog(session.id, idx)}
                                className={cn(
                                  "rounded-full px-4 py-2 text-sm font-medium transition",
                                  done ? "bg-[#1d9b5f] text-white" : "border border-black/10 bg-white text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200",
                                )}
                              >
                                Série {idx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : null}
            </article>

            <article className={cn(shellClass, "p-6")}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Auto progression</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                Suggestions pilotées par vos performances.
              </h3>
              <div className="mt-6 space-y-3">
                {progressionTips.length > 0 ? (
                  progressionTips.map((tip) => (
                    <div key={tip.exercise} className="lift-hover rounded-[24px] border border-black/8 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-base font-medium text-zinc-950 dark:text-white">{tip.exercise}</p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-300">{tip.suggestion}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-black/12 p-6 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                    Marquez quelques séances comme terminées pour activer les recommandations.
                  </div>
                )}
              </div>
            </article>
          </div>
        </section>
      )}

      {(activeTab === "Dashboard" || activeTab === "Planning") && (
        <section className="mt-14 space-y-5">
          <SectionHeading
            eyebrow="Planning"
            title="Un planning hebdomadaire plus éditorial."
            description="Cartes plus aérées, filtres intégrés, outils de duplication et génération rapide pour construire une semaine complète."
            action={<Pill>{displayWorkouts.length} séance(s)</Pill>}
          />

          {canEdit ? (
            <div className={cn(shellClass, "space-y-4 p-6")}>
              <div className="grid gap-3 xl:grid-cols-7">
                <select value={workoutForm.day_of_week ?? 1} onChange={(e) => setWorkoutForm((curr) => ({ ...normalizeWorkoutForm(curr), day_of_week: Number(e.target.value) }))} className={inputClass}>
                  {DAYS.map((day, i) => (
                    <option key={day} value={i + 1}>{day}</option>
                  ))}
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
                <button type="button" onClick={addWorkout} className={buttonPrimaryClass}>Ajouter</button>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[28px] border border-black/8 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-medium text-zinc-950 dark:text-white">Ajout rapide en lot</h3>
                    <select value={bulkDay} onChange={(e) => setBulkDay(Number(e.target.value))} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5">
                      {DAYS.map((day, i) => (
                        <option key={day} value={i + 1}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.keys(BULK_TEMPLATES).map((templateName) => (
                      <button key={templateName} type="button" onClick={() => setBulkWorkoutsText(BULK_TEMPLATES[templateName as keyof typeof BULK_TEMPLATES])} className={buttonSecondaryClass}>
                        {templateName}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={bulkWorkoutsText}
                    onChange={(e) => setBulkWorkoutsText(e.target.value)}
                    rows={5}
                    placeholder={"Une séance par ligne\n18:00 | push | Développé couché | 4 | 8\n19:00 | pull | Tractions lestées | 4 | 6"}
                    className={cn(inputClass, "mt-4 resize-y")}
                  />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Format: HH:MM | type | exercice | sets | reps</p>
                    <button type="button" onClick={addWorkoutsInBulk} className={buttonPrimaryClass}>Ajouter en lot</button>
                  </div>
                </div>

                <div className="rounded-[28px] border border-black/8 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
                  <h3 className="text-lg font-medium text-zinc-950 dark:text-white">Outils créatifs</h3>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-[22px] border border-black/8 p-4 dark:border-white/10">
                      <p className="text-sm font-medium text-zinc-950 dark:text-white">Dupliquer un jour</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <select value={duplicateFromDay} onChange={(e) => setDuplicateFromDay(Number(e.target.value))} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5">
                          {DAYS.map((day, i) => (
                            <option key={`${day}-from`} value={i + 1}>{day}</option>
                          ))}
                        </select>
                        <span className="text-sm text-zinc-400">→</span>
                        <select value={duplicateToDay} onChange={(e) => setDuplicateToDay(Number(e.target.value))} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5">
                          {DAYS.map((day, i) => (
                            <option key={`${day}-to`} value={i + 1}>{day}</option>
                          ))}
                        </select>
                        <button type="button" onClick={duplicateDayPlan} className={buttonPrimaryClass}>Dupliquer</button>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-black/8 p-4 dark:border-white/10">
                      <p className="text-sm font-medium text-zinc-950 dark:text-white">Générateur express</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <select value={generatorType} onChange={(e) => setGeneratorType(e.target.value as WorkoutSession["workout_type"])} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5">
                          <option value="push">Push</option>
                          <option value="pull">Pull</option>
                          <option value="legs">Legs</option>
                          <option value="cardio">Cardio</option>
                          <option value="other">Autre</option>
                        </select>
                        <input type="time" value={generatorStartTime} onChange={(e) => setGeneratorStartTime(e.target.value)} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5" />
                        <button type="button" onClick={generateExpressSession} className={buttonPrimaryClass}>Générer</button>
                      </div>
                    </div>
                  </div>

                  {topExercises.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-zinc-950 dark:text-white">Top exercices</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {topExercises.map((exercise) => (
                          <button key={exercise} type="button" onClick={() => setWorkoutForm((curr) => ({ ...normalizeWorkoutForm(curr), exercise }))} className={buttonSecondaryClass}>
                            {exercise}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className={cn(shellClass, "p-6")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input value={planningQuery} onChange={(e) => setPlanningQuery(e.target.value)} placeholder="Filtrer les séances (ex: squat, push...)" className={cn(inputClass, "max-w-md")} />
              {planningQuery ? <button type="button" onClick={() => setPlanningQuery("")} className={buttonSecondaryClass}>Effacer le filtre</button> : null}
            </div>

            <div className="mt-6 grid grid-flow-col auto-cols-[84vw] gap-4 overflow-x-auto pb-2 md:grid-flow-row md:auto-cols-auto md:grid-cols-2 xl:grid-cols-7">
              {DAYS.map((day, i) => {
                const filtered = displayWorkouts
                  .filter((w) => w.day_of_week === i + 1)
                  .filter((w) =>
                    planningQuery
                      ? `${w.exercise} ${w.workout_type} ${w.status}`.toLowerCase().includes(planningQuery.toLowerCase())
                      : true,
                  )
                  .sort((a, b) => (a.session_time ?? "99:99").localeCompare(b.session_time ?? "99:99"));

                return (
                  <div key={day} className="min-h-72 rounded-[28px] border border-black/8 bg-white/80 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3 rounded-[22px] bg-black/[0.03] px-3 py-2 dark:bg-white/[0.04]">
                      <div>
                        <p className="text-sm font-medium text-zinc-950 dark:text-white">{day}</p>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">J{i + 1}</p>
                      </div>
                      <Pill>{filtered.length}</Pill>
                    </div>
                    <ul className="mt-3 space-y-3">
                      {filtered.map((w) => (
                        <li key={w.id} className="lift-hover rounded-[22px] border border-black/8 bg-white/88 p-3 dark:border-white/10 dark:bg-white/5">
                          {editingWorkoutId === w.id ? (
                            <div className="space-y-2">
                              <input className={inputClass} value={editingWorkoutForm.exercise} onChange={(e) => setEditingWorkoutForm((curr) => ({ ...curr, exercise: e.target.value }))} />
                              <div className="grid grid-cols-2 gap-2">
                                <input className={inputClass} type="time" value={editingWorkoutForm.session_time} onChange={(e) => setEditingWorkoutForm((curr) => ({ ...curr, session_time: e.target.value }))} />
                                <select className={inputClass} value={editingWorkoutForm.workout_type} onChange={(e) => setEditingWorkoutForm((curr) => ({ ...curr, workout_type: e.target.value as WorkoutSession["workout_type"] }))}>
                                  <option value="push">Push</option>
                                  <option value="pull">Pull</option>
                                  <option value="legs">Legs</option>
                                  <option value="cardio">Cardio</option>
                                  <option value="other">Autre</option>
                                </select>
                                <input className={inputClass} type="number" value={editingWorkoutForm.sets} onChange={(e) => setEditingWorkoutForm((curr) => ({ ...curr, sets: Number(e.target.value) }))} />
                                <input className={inputClass} type="number" value={editingWorkoutForm.reps} onChange={(e) => setEditingWorkoutForm((curr) => ({ ...curr, reps: Number(e.target.value) }))} />
                              </div>
                              <select className={inputClass} value={editingWorkoutForm.status} onChange={(e) => setEditingWorkoutForm((curr) => ({ ...curr, status: e.target.value as WorkoutSession["status"] }))}>
                                <option value="planned">planned</option>
                                <option value="completed">completed</option>
                                <option value="skipped">skipped</option>
                              </select>
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => saveEditingWorkout(w.id)} className={buttonPrimaryClass}>Enregistrer</button>
                                <button type="button" onClick={cancelEditingWorkout} className={buttonSecondaryClass}>Annuler</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-zinc-950 dark:text-white">{w.exercise}</p>
                                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-300">{w.session_time ?? "Sans heure"} • {w.sets} x {w.reps}</p>
                                </div>
                                <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase", typeBadgeClass[w.workout_type ?? "other"])}>
                                  {w.workout_type}
                                </span>
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-2">
                                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">{w.status}</p>
                                {canEdit ? (
                                  <button type="button" onClick={() => cycleWorkoutStatus(w)} className="text-xs font-medium text-[#0071e3]">
                                    Changer statut
                                  </button>
                                ) : null}
                              </div>
                              {canEdit ? (
                                <div className="mt-2 flex items-center gap-3 text-xs">
                                  <button type="button" onClick={() => startEditingWorkout(w)} className="font-medium text-zinc-700 dark:text-zinc-200">Modifier</button>
                                  <button type="button" onClick={() => removeItem("workout_sessions", w.id)} className="font-medium text-rose-600">Supprimer</button>
                                </div>
                              ) : null}
                            </>
                          )}
                        </li>
                      ))}
                      {filtered.length === 0 ? (
                        <li className="rounded-[22px] border border-dashed border-black/12 p-5 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                          Aucun événement
                        </li>
                      ) : null}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {(activeTab === "Dashboard" || activeTab === "Poids") && (
        <section className="mt-14 space-y-5">
          <SectionHeading
            eyebrow="Body Metrics"
            title="Le poids devient lisible en un regard."
            description="Une colonne d&apos;entrées claire et une courbe de progression plus propre, dans la même grammaire visuelle."
          />
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <article className={cn(shellClass, "p-6")}>
              <h3 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">Notes de poids</h3>
              {canEdit ? (
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <input className={inputClass} type="date" value={weightForm.date} onChange={(e) => setWeightForm((curr) => ({ ...curr, date: e.target.value }))} />
                  <input className={inputClass} type="number" step="0.1" value={weightForm.weight_kg} onChange={(e) => setWeightForm((curr) => ({ ...curr, weight_kg: Number(e.target.value) }))} />
                  <button type="button" onClick={addWeight} className={buttonPrimaryClass}>Ajouter</button>
                  <input className={cn(inputClass, "md:col-span-3")} placeholder="Note optionnelle" value={weightForm.note} onChange={(e) => setWeightForm((curr) => ({ ...curr, note: e.target.value }))} />
                </div>
              ) : null}
              <div className="mt-6 space-y-3">
                {displayWeights.map((entry) => (
                  <div key={entry.id} className="lift-hover rounded-[22px] border border-black/8 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-base font-medium text-zinc-950 dark:text-white">{formatDateJJMMYYYY(entry.date)} • {entry.weight_kg} kg</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-300">{entry.note || "Sans note"}</p>
                    {canEdit ? <button type="button" onClick={() => removeItem("weight_logs", entry.id)} className="mt-2 text-xs font-medium text-rose-600">Supprimer</button> : null}
                  </div>
                ))}
              </div>
            </article>
            <ProgressChart logs={displayWeights} />
          </div>
        </section>
      )}

      {(activeTab === "Dashboard" || activeTab === "PR" || activeTab === "Mensurations") && (
        <section className="mt-14 space-y-5">
          <SectionHeading
            eyebrow="Performance"
            title="Records et mensurations dans le même écosystème."
            description="Une présentation plus élégante des performances pour garder une lecture premium même sur les vues utilitaires."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {(activeTab === "Dashboard" || activeTab === "PR") && (
              <article className={cn(shellClass, "p-6")}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">Records personnels</h3>
                  <Pill>{displayPrs.length} record(s)</Pill>
                </div>
                {canEdit ? (
                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    <input className={inputClass} placeholder="Exercice" value={prForm.exercise} onChange={(e) => setPrForm((curr) => ({ ...curr, exercise: e.target.value }))} />
                    <input className={inputClass} type="number" value={prForm.value} onChange={(e) => setPrForm((curr) => ({ ...curr, value: Number(e.target.value) }))} />
                    <input className={inputClass} placeholder="Unité" value={prForm.unit} onChange={(e) => setPrForm((curr) => ({ ...curr, unit: e.target.value }))} />
                    <input className={inputClass} type="date" value={prForm.achieved_on} onChange={(e) => setPrForm((curr) => ({ ...curr, achieved_on: e.target.value }))} />
                    <button type="button" onClick={addPr} className={cn(buttonPrimaryClass, "md:col-span-2")}>Ajouter PR</button>
                  </div>
                ) : null}
                <div className="mt-6 space-y-3">
                  {displayPrs.map((record, idx) => (
                    <div key={record.id} className="lift-hover rounded-[24px] border border-black/8 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-medium text-zinc-950 dark:text-white">{record.exercise}</p>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-300">Atteint le {formatDateJJMMYYYY(record.achieved_on)}</p>
                        </div>
                        <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-950">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-2xl font-semibold tracking-tight text-[#0071e3]">{record.value} {record.unit}</p>
                        {canEdit ? <button type="button" onClick={() => removeItem("personal_records", record.id)} className="text-xs font-medium text-rose-600">Supprimer</button> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            )}

            {(activeTab === "Dashboard" || activeTab === "Mensurations") && (
              <article className={cn(shellClass, "p-6")}>
                <h3 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">Mensurations</h3>
                {canEdit ? (
                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    <input className={cn(inputClass, "md:col-span-2")} type="date" value={measurementForm.date} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, date: e.target.value }))} />
                    <input className={inputClass} type="number" step="0.1" placeholder="Bras (cm)" value={measurementForm.biceps_cm} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, biceps_cm: e.target.value }))} />
                    <input className={inputClass} type="number" step="0.1" placeholder="Taille (cm)" value={measurementForm.waist_cm} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, waist_cm: e.target.value }))} />
                    <input className={inputClass} type="number" step="0.1" placeholder="Poitrine (cm)" value={measurementForm.chest_cm} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, chest_cm: e.target.value }))} />
                    <input className={inputClass} type="number" step="0.1" placeholder="Cuisse (cm)" value={measurementForm.thigh_cm} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, thigh_cm: e.target.value }))} />
                    <button type="button" onClick={addMeasurement} className={cn(buttonPrimaryClass, "md:col-span-2")}>Ajouter</button>
                  </div>
                ) : null}
                <div className="mt-6 space-y-3">
                  {displayMeasurements.map((item) => (
                    <div key={item.id} className="lift-hover rounded-[24px] border border-black/8 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-base font-medium text-zinc-950 dark:text-white">{formatDateJJMMYYYY(item.date)}</p>
                      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-300">
                        Bras: {item.biceps_cm ?? "-"} cm • Taille: {item.waist_cm ?? "-"} cm • Poitrine: {item.chest_cm ?? "-"} cm • Cuisse: {item.thigh_cm ?? "-"} cm
                      </p>
                      {canEdit ? <button type="button" onClick={() => removeItem("measurements", item.id)} className="mt-2 text-xs font-medium text-rose-600">Supprimer</button> : null}
                    </div>
                  ))}
                </div>
              </article>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
