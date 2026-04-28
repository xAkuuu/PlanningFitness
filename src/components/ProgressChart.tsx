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
        borderColor: "#0071e3",
        backgroundColor: "rgba(0,113,227,0.12)",
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#0071e3",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        tension: 0.36,
        borderWidth: 3,
      },
    ],
  };

  return (
    <div className="rounded-[32px] border border-black/8 bg-white/78 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
        Body Metrics
      </p>
      <h3 className="mb-2 mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
        Courbe de progression du poids
      </h3>
      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-300">
        Visualisation lissée de l&apos;évolution de votre poids au fil du temps.
      </p>
      {sortedLogs.length > 1 ? (
        <div className="h-72 rounded-[24px] border border-black/8 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "#111114",
                  titleColor: "#ffffff",
                  bodyColor: "#ffffff",
                  displayColors: false,
                  padding: 12,
                  cornerRadius: 14,
                },
              },
              scales: {
                y: {
                  ticks: { color: "#86868b" },
                  grid: { color: "rgba(134,134,139,0.14)" },
                  border: { display: false },
                  min: minValue,
                  max: maxValue,
                },
                x: {
                  ticks: { color: "#86868b", maxRotation: 0 },
                  grid: { display: false },
                  border: { display: false },
                },
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
