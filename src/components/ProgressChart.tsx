"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { WeightLog } from "@/types/fitness";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

type ProgressChartProps = {
  logs: WeightLog[];
};

export function ProgressChart({ logs }: ProgressChartProps) {
  const mergedByDate = new Map<string, WeightLog>();
  for (const log of logs) {
    mergedByDate.set(log.date, log);
  }

  const sortedLogs = [...mergedByDate.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const labels = sortedLogs.map((log) => {
    const [year, month, day] = log.date.split("-");
    return `${day}//${month}//${year}`;
  });

  const values = sortedLogs.map((log) => log.weight_kg);
  const minValue = values.length ? Math.floor(Math.min(...values) - 1) : 0;
  const maxValue = values.length ? Math.ceil(Math.max(...values) + 1) : 0;

  const data = {
    labels,
    datasets: [
      {
        label: "Poids (kg)",
        data: values,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.25)",
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 5,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="rounded-3xl border border-white/60 bg-white/75 p-5 shadow-[0_20px_35px_rgba(13,25,43,0.08)] backdrop-blur-xl dark:border-zinc-700/60 dark:bg-zinc-900/70">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
        Courbe de progression du poids
      </h3>
      {sortedLogs.length > 1 ? (
        <div className="h-64">
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  ticks: { color: "#71717a" },
                  grid: { color: "rgba(113,113,122,0.2)" },
                  min: minValue,
                  max: maxValue,
                },
                x: { ticks: { color: "#71717a", maxRotation: 0 }, grid: { display: false } },
              },
            }}
          />
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ajoute au moins 2 entrées de poids pour afficher la courbe.
        </p>
      )}
    </div>
  );
}
