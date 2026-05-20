"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList
} from "recharts"
import { FieldStat } from "@/app/actions/dashboard"

// Modern Premium Palette
const COLORS = [
  "#4f46e5", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#f43f5e", // Rose
]

const GRADIENTS = [
    { start: "#4f46e5", end: "#818cf8" },
    { start: "#06b6d4", end: "#67e8f9" },
    { start: "#10b981", end: "#34d399" }
]

export function CheckInPieChart({
  checkedIn,
  total,
}: {
  checkedIn: number
  total: number
}) {
  const notCheckedIn = total - checkedIn
  const data = [
    { name: "Checked In", value: checkedIn },
    { name: "Not Arrived", value: notCheckedIn },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60} // Donut style
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
          animationDuration={1500}
          label={({ name, value }) => `${name}: ${value}`}
          labelLine={false}
        >
          <Cell key="cell-0" fill="#4f46e5" stroke="rgba(255,255,255,0.2)" /> {/* Indigo for Checked In */}
          <Cell key="cell-1" fill="#e2e8f0" stroke="rgba(255,255,255,0.2)" /> {/* Muted for Not Arrived */}
        </Pie>
        <Tooltip 
            contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)'
            }} 
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function FieldBarChart({ field }: { field: FieldStat }) {
  // Helper to truncate long labels for display on axis
  const truncate = (text: string, length: number = 20) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };

  const hasLongLabels = field.answers.some(a => a.name.length > 15);
  const shouldRotate = field.answers.length > 3 || hasLongLabels;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={field.answers} margin={{ bottom: shouldRotate ? 60 : 30, top: 20, left: 0, right: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={({ x, y, payload }) => (
            <g transform={`translate(${x},${y})`}>
              <text
                x={0}
                y={0}
                dy={16}
                textAnchor={shouldRotate ? "end" : "middle"}
                fill="#64748b"
                fontSize={11}
                fontWeight={500}
                transform={shouldRotate ? "rotate(-35)" : ""}
              >
                {truncate(payload.value, 20)}
              </text>
            </g>
          )}
          interval={0}
        />
        <YAxis 
            allowDecimals={false} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            width={30}
        />
        <Tooltip 
          cursor={{ fill: '#f8fafc', radius: 8 }}
          contentStyle={{ 
            borderRadius: '16px', 
            border: 'none', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderLeft: '4px solid #4f46e5'
          }}
          itemStyle={{ fontWeight: '700', color: '#1e293b' }}
          labelStyle={{ fontWeight: '600', marginBottom: '4px', color: '#64748b', maxWidth: '250px' }}
        />
        <Bar 
            dataKey="value" 
            name="Total" 
            radius={[6, 6, 0, 0]}
            barSize={field.answers.length > 5 ? 25 : 40}
            animationDuration={1500}
        >
          {field.answers.map((entry, index) => (
             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          <LabelList 
            dataKey="value" 
            position="top" 
            offset={10} 
            style={{ fill: '#64748b', fontSize: 12, fontWeight: '800' }} 
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

