"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export default function PerformanceChart({ data }: { data: { label: string; score: number }[] }) {
  if (!data.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-500">
        Complete a quiz to see your performance trend.
      </div>
    )

  }
  return (
    <div className="mt-8 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -24 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px" }} formatter={(value) => [`${value}%`, "Score"]} />
          <Area type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={3} fill="url(#scoreGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  ) 
}
