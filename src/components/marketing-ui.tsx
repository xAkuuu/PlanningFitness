"use client";

type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(" ");
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
  className,
  icon,
}: {
  label: string;
  value: string | number;
  tone?: "default" | "blue" | "green" | "amber";
  className?: string;
  icon?: React.ReactNode;
}) {
  const toneClass =
    tone === "blue"
      ? "text-[#0071e3]"
      : tone === "green"
        ? "text-[#1d9b5f]"
        : tone === "amber"
          ? "text-[#c27a00]"
          : "text-zinc-950 dark:text-white";

  return (
    <div
      className={cn(
        "rounded-[28px] border border-black/6 bg-white/78 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl transition duration-300 will-change-transform hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">{label}</p>
        {icon ? <span className="text-zinc-400 dark:text-zinc-500">{icon}</span> : null}
      </div>
      <p className={cn("mt-3 text-3xl font-semibold tracking-tight", toneClass)}>{value}</p>
    </div>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-black/8 bg-white/75 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200",
        className,
      )}
    >
      {children}
    </span>
  );
}

function iconPath(path: React.ReactNode) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  );
}

export function SparklesIcon() {
  return iconPath(
    <>
      <path d="M12 3l1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
      <path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />
    </>,
  );
}

export function ActivityIcon() {
  return iconPath(<path d="M3 12h4l2.5-5 3 10 2.5-5H21" />);
}

export function CalendarIcon() {
  return iconPath(
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>,
  );
}

export function TrophyIcon() {
  return iconPath(
    <>
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
      <path d="M6 6H4a2 2 0 0 0 2 4M18 6h2a2 2 0 0 1-2 4" />
      <path d="M12 11v4M9 21h6M10 15h4v2a2 2 0 0 1-4 0v-2Z" />
    </>,
  );
}

