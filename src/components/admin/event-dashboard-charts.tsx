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
} from "recharts"
import { FieldStat } from "@/app/actions/dashboard"

const COLORS = ["#09090b", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8", "#f4f4f5"]

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
          labelLine={false}
          label={({ percent }: { percent?: number }) =>
            `${((percent || 0) * 100).toFixed(0)}%`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          <Cell key="cell-0" fill="#09090b" /> {/* Foreground (Dark) for Checked In */}
          <Cell key="cell-1" fill="#e4e4e7" /> {/* Muted (Light) for Not Arrived */}
        </Pie>
        <Tooltip formatter={(value: any) => [value, "Attendees"]} />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function FieldBarChart({ field }: { field: FieldStat }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={field.answers} margin={{ bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
        <XAxis 
          dataKey="name" 
          tick={false} // Hide X tick labels if too long, relying on tooltip or legend
          axisLine={false}
        />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
        <Tooltip 
          cursor={{ fill: 'transparent' }}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7' }}
        />
        <Legend />
        <Bar dataKey="value" name="Count" fill="#09090b" radius={[4, 4, 0, 0]}>
          {field.answers.map((entry, index) => (
             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
