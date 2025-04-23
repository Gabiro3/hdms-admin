"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface AdminBillingChartProps {
  data: {
    diagnosisCounts: Record<string, number>
    diagnosisCosts: Record<string, number>
  }
}

export default function AdminBillingChart({ data }: AdminBillingChartProps) {
  // Transform the data for the chart
  const chartData = Object.entries(data.diagnosisCosts).map(([name, value]) => ({
    name,
    value,
  }))

  // Define colors for the chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  // Format currency for the tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(value)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatCurrency(payload[0].value)}</p>
          <p className="text-xs text-muted-foreground">{data.diagnosisCounts[payload[0].name]} diagnoses</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-full">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">No billing data available</p>
        </div>
      )}
    </div>
  )
}
