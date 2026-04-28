"use client";

import {
  ActivityIcon,
  CalendarIcon,
  Pill,
  ScrollReveal,
  SectionHeading,
  SparklesIcon,
  StatCard,
  TrophyIcon,
  cn,
} from "@/components/marketing-ui";
import type { WorkoutSession } from "@/types/fitness";

type TabKey =
  | "Dashboard"
  | "Focus"
  | "Aujourd'hui"
  | "Planning"
  | "Poids"
  | "PR"
  | "Mensurations";

type Stats = {
  total: number;
  completed: number;
  skipped: number;
  planned: number;
  completionRate: number;
  uniqueExercises: number;
};

type ProgressionTip = {
  exercise: string;
  suggestion: string;
};

export function HeroSection({
  isAdmin,
  nextSession,
  heroPrimaryStat,
  stats,
  todaySessionsCount,
  displayPrsCount,
  setActiveTab,
  shellClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
}: {
  isAdmin: boolean;
  nextSession?: WorkoutSession;
  heroPrimaryStat: string;
  stats: Stats;
  todaySessionsCount: number;
  displayPrsCount: number;
  setActiveTab: (tab: TabKey) => void;
  shellClass: string;
  buttonPrimaryClass: string;
  buttonSecondaryClass: string;
}) {
  return (
    <ScrollReveal delay={40}>
      <section className="relative mt-5 overflow-hidden rounded-[32px] border border-black/8 bg-[#f5f5f7] px-4 py-5 shadow-[0_24px_90px_rgba(0,0,0,0.09)] dark:border-white/10 dark:bg-[#0b0b0f] sm:mt-6 sm:rounded-[40px] sm:px-8 sm:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,113,227,0.18),transparent_34%),radial-gradient(circle_at_85%_25%,rgba(92,225,230,0.12),transparent_25%)]" />
        <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-[#7aa2ff]/20 blur-3xl" />
        <div className="absolute -right-12 bottom-8 h-64 w-64 rounded-full bg-[#5ce1e6]/12 blur-3xl" />
        <div className="relative grid gap-5 sm:gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
          <div className="max-w-3xl">
            <Pill className="gap-2">
              <SparklesIcon />
              {isAdmin ? "Compte connecté" : "Mode démo intelligent"}
            </Pill>
            <h1 className="mt-4 text-[2.35rem] font-semibold leading-[0.95] tracking-[-0.05em] text-zinc-950 dark:text-white sm:mt-5 sm:text-6xl lg:text-7xl">
              Votre coaching fitness,
              <br />
              pensé comme un produit premium.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:mt-5 sm:text-lg sm:leading-7">
              Refonte complète du frontend dans une esthétique minimaliste, lumineuse et très hiérarchisée.
              Les objectifs, le planning, le mode focus et les statistiques restent accessibles dans une seule expérience.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
              <button type="button" onClick={() => setActiveTab("Dashboard")} className={cn(buttonPrimaryClass, "hero-button w-full sm:w-auto")}>
                Ouvrir le dashboard
              </button>
              <button type="button" onClick={() => setActiveTab("Planning")} className={cn(buttonSecondaryClass, "hero-button w-full sm:w-auto")}>
                Voir le planning
              </button>
            </div>
            <div className="mt-5 grid gap-2.5 sm:mt-8 sm:grid-cols-3 sm:gap-3">
              <div className="story-chip">
                <span className="story-chip-kicker">Plan</span>
                <span className="story-chip-value">Hebdomadaire</span>
              </div>
              <div className="story-chip">
                <span className="story-chip-kicker">Focus</span>
                <span className="story-chip-value">Salle en direct</span>
              </div>
              <div className="story-chip">
                <span className="story-chip-kicker">Progression</span>
                <span className="story-chip-value">Poids + PR</span>
              </div>
            </div>
          </div>

          <div className={cn(shellClass, "relative overflow-hidden p-4 sm:float-gentle sm:p-6")}>
            <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(0,113,227,0.16),transparent)]" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                Aperçu système
              </p>
              <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Prochaine séance</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-2xl">
                    {nextSession?.exercise ?? "Aucune"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{heroPrimaryStat}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Complétion</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-2xl">
                    {stats.completionRate}%
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{stats.completed} séances complétées</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-3">
                <StatCard label="Aujourd'hui" value={todaySessionsCount} tone="blue" icon={<CalendarIcon />} />
                <StatCard label="Exercices" value={stats.uniqueExercises} icon={<ActivityIcon />} />
                <StatCard label="PR actifs" value={displayPrsCount} tone="green" icon={<TrophyIcon />} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}

export function SummaryCards({
  currentDayLabel,
  todaySessionsCount,
  goals,
  formatDateJJMMYYYY,
  softPanelClass,
}: {
  currentDayLabel: string;
  todaySessionsCount: number;
  goals: { weightTarget: string; prExercise: string; prTarget: string; deadline: string };
  formatDateJJMMYYYY: (input: string) => string;
  softPanelClass: string;
}) {
  return (
    <ScrollReveal delay={80}>
      <section className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-3">
        <div className={cn(softPanelClass, "lift-hover md:col-span-1")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Aujourd&apos;hui</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:mt-3 sm:text-2xl">{currentDayLabel}</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {todaySessionsCount > 0 ? `${todaySessionsCount} séance(s) à gérer.` : "Aucune séance prévue pour le moment."}
          </p>
        </div>
        <div className={cn(softPanelClass, "lift-hover md:col-span-1")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Objectif poids</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:mt-3 sm:text-2xl">{goals.weightTarget || "Non défini"}</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Suivi personnel sauvegardé localement.</p>
        </div>
        <div className={cn(softPanelClass, "lift-hover md:col-span-1")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">PR cible</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:mt-3 sm:text-2xl">
            {goals.prExercise && goals.prTarget ? `${goals.prExercise} ${goals.prTarget}` : "A définir"}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {goals.deadline ? `Deadline ${formatDateJJMMYYYY(goals.deadline)}` : "Ajoutez une échéance."}
          </p>
        </div>
      </section>
    </ScrollReveal>
  );
}

export function OverviewSection({
  visible,
  currentDayLabel,
  todaySessions,
  goals,
  setGoals,
  stats,
  inputClass,
  shellClass,
  typeBadgeClass,
}: {
  visible: boolean;
  currentDayLabel: string;
  todaySessions: WorkoutSession[];
  goals: { weightTarget: string; prExercise: string; prTarget: string; deadline: string };
  setGoals: React.Dispatch<React.SetStateAction<{ weightTarget: string; prExercise: string; prTarget: string; deadline: string }>>;
  stats: Stats;
  inputClass: string;
  shellClass: string;
  typeBadgeClass: Record<string, string>;
}) {
  if (!visible) return null;

  return (
    <ScrollReveal className="mt-10" delay={20}>
      <section className="space-y-4 sm:space-y-5">
        <SectionHeading
          eyebrow="Overview"
          title="Une vue claire de la journée."
          description="Inspiré des pages produit Apple: gros contraste typographique, blocs respirants et lecture immédiate des priorités."
        />
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className={cn(shellClass, "p-4 sm:p-6")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Aujourd&apos;hui</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
                  {todaySessions.length > 0 ? `${todaySessions.length} bloc(s) prévus` : "Journée légère"}
                </h3>
              </div>
              <Pill className="hidden gap-2 sm:inline-flex">
                <CalendarIcon />
                {currentDayLabel}
              </Pill>
            </div>
              <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">
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

          <article className={cn(shellClass, "p-4 sm:p-6")}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Objectifs</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
              Cadrez le prochain cap.
            </h3>
            <div className="mt-6 grid gap-3">
              <input className={inputClass} placeholder="Objectif poids (ex: 78kg)" value={goals.weightTarget} onChange={(e) => setGoals((curr) => ({ ...curr, weightTarget: e.target.value }))} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={inputClass} placeholder="Exercice PR cible" value={goals.prExercise} onChange={(e) => setGoals((curr) => ({ ...curr, prExercise: e.target.value }))} />
                <input className={inputClass} placeholder="Valeur PR cible" value={goals.prTarget} onChange={(e) => setGoals((curr) => ({ ...curr, prTarget: e.target.value }))} />
              </div>
              <input className={inputClass} type="date" value={goals.deadline} onChange={(e) => setGoals((curr) => ({ ...curr, deadline: e.target.value }))} />
            </div>
          </article>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Total séances" value={stats.total} icon={<ActivityIcon />} />
          <StatCard label="Complétées" value={stats.completed} tone="green" icon={<SparklesIcon />} />
          <StatCard label="Planifiées" value={stats.planned} tone="blue" icon={<CalendarIcon />} />
          <StatCard label="Skipped" value={stats.skipped} tone="amber" icon={<ActivityIcon />} />
          <StatCard label="Taux réussite" value={`${stats.completionRate}%`} icon={<SparklesIcon />} />
          <StatCard label="Exercices uniques" value={stats.uniqueExercises} icon={<TrophyIcon />} />
        </div>
      </section>
    </ScrollReveal>
  );
}

export function FocusSection({
  visible,
  restSeconds,
  isRestRunning,
  setIsRestRunning,
  setRestSeconds,
  startRestTimer,
  todaySessions,
  focusSessionId,
  setFocusSessionId,
  initSetLogForSession,
  workoutSetLogs,
  toggleSetLog,
  progressionTips,
  buttonPrimaryClass,
  buttonSecondaryClass,
  shellClass,
  typeBadgeClass,
}: {
  visible: boolean;
  restSeconds: number;
  isRestRunning: boolean;
  setIsRestRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setRestSeconds: React.Dispatch<React.SetStateAction<number>>;
  startRestTimer: (seconds: number) => void;
  todaySessions: WorkoutSession[];
  focusSessionId: string | null;
  setFocusSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  initSetLogForSession: (session: WorkoutSession) => void;
  workoutSetLogs: Record<string, boolean[]>;
  toggleSetLog: (sessionId: string, setIndex: number) => void;
  progressionTips: ProgressionTip[];
  buttonPrimaryClass: string;
  buttonSecondaryClass: string;
  shellClass: string;
  typeBadgeClass: Record<string, string>;
}) {
  if (!visible) return null;

  return (
    <ScrollReveal className="mt-14" delay={40}>
      <section className="space-y-4 sm:space-y-5">
        <SectionHeading
          eyebrow="Focus"
          title="Mode séance, sans friction."
          description="Un espace plus immersif pour sélectionner l&apos;exercice en cours, lancer le chrono de repos et suivre les séries."
        />
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className={cn(shellClass, "p-4 sm:p-6")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Chrono repos</p>
                <h3 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-5xl">
                  {String(Math.floor(restSeconds / 60)).padStart(2, "0")}:{String(restSeconds % 60).padStart(2, "0")}
                </h3>
              </div>
                <Pill className="hidden sm:inline-flex">{isRestRunning ? "En cours" : "En pause"}</Pill>
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

            <div className="mt-6 space-y-2.5 sm:mt-8 sm:space-y-3">
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

          <article className={cn(shellClass, "p-4 sm:p-6")}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Auto progression</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
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
    </ScrollReveal>
  );
}
