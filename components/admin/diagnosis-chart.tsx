"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parseISO } from "date-fns"

interface DiagnosisChartProps {
  timeSeriesData: {
    date: string
    count: number
  }[]
}

export default function AdminDiagnosisChart({ timeSeriesData }: DiagnosisChartProps) {
  const [timeRange, setTimeRange] = useState("30days")

  // Find the maximum count for scaling
  const maxCount = Math.max(...timeSeriesData.map((d) => d.count), 1)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Diagnosis Trends</CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="6months">Last 6 months</SelectItem>
            <SelectItem value="1year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none">
            {/* X-axis */}
            <line x1="50" y1="250" x2="750" y2="250" stroke="#e5e7eb" strokeWidth="1" />

            {/* Y-axis */}
            <line x1="50" y1="50" x2="50" y2="250" stroke="#e5e7eb" strokeWidth="1" />

            {/* X-axis labels - show fewer labels for clarity */}
            {timeSeriesData.length > 0 &&
              timeSeriesData
                .filter((_, i) => i % Math.max(1, Math.floor(timeSeriesData.length / 7)) === 0)
                .map((dataPoint, i, filteredArray) => {
                  const x = 50 + (i * (700 / (filteredArray.length - 1)) || 0)
                  return (
                    <g key={`x-label-${i}`}>
                      <text x={x} y="270" textAnchor="middle" fontSize="10" fill="#6b7280">
                        {format(parseISO(dataPoint.date), "MMM d")}
                      </text>
                      <line x1={x} y1="250" x2={x} y2="255" stroke="#e5e7eb" strokeWidth="1" />
                    </g>
                  )
                })}

            {/* Y-axis labels */}
            {[0, 1, 2, 3, 4].map((tick) => {
              const y = 250 - tick * 50
              const value = Math.round((tick * maxCount) / 4)
              return (
                <g key={`y-label-${tick}`}>
                  <text x="40" y={y + 5} textAnchor="end" fontSize="10" fill="#6b7280">
                    {value}
                  </text>
                  <line x1="45" y1={y} x2="50" y2={y} stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="50" y1={y} x2="750" y2={y} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4" />
                </g>
              )
            })}

            {/* Line chart */}
            {timeSeriesData.length > 1 && (
              <>
                <path
                  d={timeSeriesData
                    .map((dataPoint, i) => {
                      const x = 50 + i * (700 / (timeSeriesData.length - 1))
                      const y = 250 - (dataPoint.count / maxCount) * 200
                      return `${i === 0 ? "M" : "L"} ${x} ${y}`
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />

                {/* Area under the line */}
                <path
                  d={`
                    ${timeSeriesData
                      .map((dataPoint, i) => {
                        const x = 50 + i * (700 / (timeSeriesData.length - 1))
                        const y = 250 - (dataPoint.count / maxCount) * 200
                        return `${i === 0 ? "M" : "L"} ${x} ${y}`
                      })
                      .join(" ")}
                    L 750 250
                    L 50 250
                    Z
                  `}
                  fill="url(#gradient)"
                  fillOpacity="0.2"
                />

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Data points */}
                {timeSeriesData.map((dataPoint, i) => {
                  const x = 50 + i * (700 / (timeSeriesData.length - 1))
                  const y = 250 - (dataPoint.count / maxCount) * 200
                  return (
                    <g key={`point-${i}`} className="data-point">
                      <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                      <circle cx={x} cy={y} r="8" fill="#3b82f6" fillOpacity="0.2" />
                      <title>
                        {format(parseISO(dataPoint.date), "MMM d, yyyy")}: {dataPoint.count} diagnoses
                      </title>
                    </g>
                  )
                })}
              </>
            )}

            {/* No data message */}
            {timeSeriesData.length <= 1 && (
              <text x="400" y="150" textAnchor="middle" fontSize="14" fill="#6b7280">
                Not enough data to display chart
              </text>
            )}
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}
