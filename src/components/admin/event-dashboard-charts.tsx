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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

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
          <Cell key="cell-0" fill="#22c55e" /> {/* Green for Checked In */}
          <Cell key="cell-1" fill="#e2e8f0" /> {/* Gray for Not Arrived */}
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          tick={false} // Hide X tick labels if too long, relying on tooltip or legend
          axisLine={false}
        />
        <YAxis allowDecimals={false} />
        <Tooltip 
          cursor={{ fill: 'transparent' }}
          contentStyle={{ borderRadius: '8px' }}
        />
        <Legend />
        <Bar dataKey="value" name="Count" fill="#6366f1" radius={[4, 4, 0, 0]}>
          {field.answers.map((entry, index) => (
             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
