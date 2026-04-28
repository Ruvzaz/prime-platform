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
  YAxis
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
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={field.answers} margin={{ bottom: 40, top: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
          interval={0}
          angle={field.answers.length > 4 ? -25 : 0}
          textAnchor={field.answers.length > 4 ? "end" : "middle"}
        />
        <YAxis 
            allowDecimals={false} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11 }}
        />
        <Tooltip 
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ 
            borderRadius: '12px', 
            border: 'none', 
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '10px 14px'
          }}
        />
        <Bar 
            dataKey="value" 
            name="Total" 
            radius={[6, 6, 0, 0]}
            barSize={field.answers.length > 5 ? 30 : 45}
            animationDuration={1500}
        >
          {field.answers.map((entry, index) => (
             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
