"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ProgressChart } from "@/components/ProgressChart";
import { supabase } from "@/lib/supabase";
import type { Measurement, PersonalRecord, WeightLog, WorkoutSession } from "@/types/fitness";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const TABS = ["Dashboard", "Planning", "Poids", "PR", "Mensurations"] as const;
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
  push: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
  pull: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
  legs: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
  cardio: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
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

  const isAdmin = Boolean(session?.user);
  const canEdit = isAdmin && adminMode === "edit";
  const displayWorkouts = isAdmin ? workouts : workouts.length ? workouts : publicWorkouts;
  const displayWeights = isAdmin ? weights : weights.length ? weights : publicWeights;
  const displayPrs = isAdmin ? prs : prs.length ? prs : publicPrs;
  const displayMeasurements = isAdmin ? measurements : measurements.length ? measurements : publicMeasurements;

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

          <div className="relative">
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

      <section className={panelClass}>
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
        <section className={panelClass}>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
        </section>
      ) : null}

      {(activeTab === "Dashboard" || activeTab === "Planning") && (
        <section key={`planning-${activeTab}`} className={`${panelClass} animate-fade-slide`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {title("Planning Hebdomadaire")}
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {displayWorkouts.length} seance(s)
            </span>
          </div>
          {canEdit ? (
            <div className="mt-4 grid gap-2 rounded-2xl border border-blue-100/80 bg-gradient-to-r from-blue-50/80 to-indigo-50/70 p-3 md:grid-cols-7 dark:border-blue-900/40 dark:from-blue-950/20 dark:to-indigo-950/20">
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
              <button onClick={addWorkout} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">Ajouter</button>
            </div>
          ) : null}
          <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-white/60 p-2 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            {DAYS.map((day, i) => (
              <div key={day} className="group min-h-64 rounded-xl border border-zinc-200/90 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="sticky top-2 z-10 mb-2 flex items-center justify-between rounded-lg bg-zinc-100/90 px-2 py-1 dark:bg-zinc-900/90">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">{day}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                    J{i + 1}
                  </span>
                </div>
                <ul className="space-y-2">
                  {displayWorkouts
                    .filter((w) => w.day_of_week === i + 1)
                    .sort((a, b) => (a.session_time ?? "99:99").localeCompare(b.session_time ?? "99:99"))
                    .map((w) => (
                    <li key={w.id} className="relative rounded-lg border border-zinc-200 bg-white/90 p-2 pl-4 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                      <span className="absolute left-1.5 top-2.5 h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-100">{w.exercise}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${typeBadgeClass[w.workout_type ?? "other"]}`}>
                          {w.workout_type ?? "other"}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">{w.session_time ?? "Sans heure"}</p>
                      <p className="text-zinc-600 dark:text-zinc-300">{w.sets} x {w.reps}</p>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{w.status}</p>
                      {canEdit ? <button onClick={() => removeItem("workout_sessions", w.id)} className="mt-1 text-rose-600">Supprimer</button> : null}
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
          <article className={panelClass}>
            {title("Notes de Poids")}
            {canEdit ? (
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <input className={inputClass} type="date" value={weightForm.date} onChange={(e) => setWeightForm((curr) => ({ ...curr, date: e.target.value }))} />
                <input className={inputClass} type="number" step="0.1" value={weightForm.weight_kg} onChange={(e) => setWeightForm((curr) => ({ ...curr, weight_kg: Number(e.target.value) }))} />
                <button onClick={addWeight} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">Ajouter</button>
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
            <article className={panelClass}>
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
                  <button onClick={addPr} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900 md:col-span-2">Ajouter PR</button>
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
                      <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
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
            <article className={panelClass}>
              {title("Mensurations")}
              {canEdit ? (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input className={`${inputClass} md:col-span-2`} type="date" value={measurementForm.date} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, date: e.target.value }))} />
                  <input className={inputClass} type="number" step="0.1" placeholder="Bras (cm)" value={measurementForm.biceps_cm} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, biceps_cm: e.target.value }))} />
                  <input className={inputClass} type="number" step="0.1" placeholder="Taille (cm)" value={measurementForm.waist_cm} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, waist_cm: e.target.value }))} />
                  <input className={inputClass} type="number" step="0.1" placeholder="Poitrine (cm)" value={measurementForm.chest_cm} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, chest_cm: e.target.value }))} />
                  <input className={inputClass} type="number" step="0.1" placeholder="Cuisse (cm)" value={measurementForm.thigh_cm} onChange={(e) => setMeasurementForm((curr) => ({ ...curr, thigh_cm: e.target.value }))} />
                  <button onClick={addMeasurement} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900 md:col-span-2">Ajouter</button>
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
