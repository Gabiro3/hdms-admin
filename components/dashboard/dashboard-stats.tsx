"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, ImageIcon, Activity, TrendingUp } from "lucide-react"

interface DashboardStatsProps {
  hospitalId: string
}

interface StatsData {
  totalDiagnoses: number
  totalImages: number
  mostFrequentType: {
    type: string
    count: number
  } | null
}

export default function DashboardStats({ hospitalId }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    totalDiagnoses: 0,
    totalImages: 0,
    mostFrequentType: null,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        // Get total diagnoses
        const { count: totalDiagnoses } = await supabase
          .from("diagnoses")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospitalId)

        // Calculate total images by summing the length of image_links arrays
        const { data: diagnosesWithImages } = await supabase
          .from("diagnoses")
          .select("image_links")
          .eq("hospital_id", hospitalId)
          .not("image_links", "is", null)

        let totalImages = 0
        diagnosesWithImages?.forEach((diagnosis) => {
          if (diagnosis.image_links) {
            totalImages += diagnosis.image_links.length
          }
        })

        // Get diagnosis types and count
        // For this example, we'll extract the type from the title
        // In a real app, you might have a separate field for type
        const { data: diagnoses } = await supabase.from("diagnoses").select("title").eq("hospital_id", hospitalId)

        const typeCounts: Record<string, number> = {}
        diagnoses?.forEach((diagnosis) => {
          // Extract a type from the title (e.g., "CT", "MRI", "X-Ray")
          // This is a simplified example - in a real app, you'd have a proper type field
          const match = diagnosis.title.match(/(CT|MRI|X-Ray|Ultrasound)/i)
          if (match) {
            const type = match[0].toUpperCase()
            typeCounts[type] = (typeCounts[type] || 0) + 1
          } else {
            typeCounts["Other"] = (typeCounts["Other"] || 0) + 1
          }
        })

        // Find the most frequent type
        let mostFrequentType = null
        let maxCount = 0

        Object.entries(typeCounts).forEach(([type, count]) => {
          if (count > maxCount) {
            mostFrequentType = type
            maxCount = count
          }
        })

        setStats({
          totalDiagnoses: totalDiagnoses || 0,
          totalImages,
          mostFrequentType: mostFrequentType ? { type: mostFrequentType, count: maxCount } : null,
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (hospitalId) {
      fetchStats()
    }
  }, [hospitalId, supabase])

  const statCards = [
    {
      title: "Total Diagnoses",
      value: stats.totalDiagnoses,
      icon: <FileText className="h-5 w-5 text-primary" />,
      trend: "+12% from last month",
      trendUp: true,
    },
    {
      title: "Total Images",
      value: stats.totalImages,
      icon: <ImageIcon className="h-5 w-5 text-primary" />,
      trend: "+8% from last month",
      trendUp: true,
    },
    {
      title: "Most Common Type",
      value: stats.mostFrequentType?.type || "N/A",
      subValue: stats.mostFrequentType ? `${stats.mostFrequentType.count} diagnoses` : "",
      icon: <Activity className="h-5 w-5 text-primary" />,
      trend: "No change from last month",
      trendUp: null,
    },
    {
      title: "Average Response Time",
      value: "1.2 days",
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      trend: "-5% from last month",
      trendUp: true,
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <div className="rounded-full bg-primary/10 p-2">{card.icon}</div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
              ) : (
                <>
                  <p className="text-2xl font-bold">{card.value}</p>
                  {card.subValue && <p className="text-xs text-muted-foreground">{card.subValue}</p>}
                </>
              )}
            </div>
            {!loading && (
              <div className="mt-2 flex items-center text-xs">
                {card.trendUp !== null && (
                  <span className={`mr-1 flex items-center ${card.trendUp ? "text-green-600" : "text-red-600"}`}>
                    {card.trendUp ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingUp className="mr-1 h-3 w-3 transform rotate-180" />
                    )}
                  </span>
                )}
                <span className="text-muted-foreground">{card.trend}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
