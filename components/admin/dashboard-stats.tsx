"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, ImageIcon, Users, Hospital, User } from "lucide-react"

interface AdminDashboardStatsProps {
  totalDiagnoses: number
  totalUsers: number
  totalImages: number
  totalHospitals: number
  totalPatients: number
}

export default function AdminDashboardStats({
  totalDiagnoses,
  totalUsers,
  totalImages,
  totalHospitals,
  totalPatients,
}: AdminDashboardStatsProps) {
  const statCards = [
    {
      title: "Total Diagnoses",
      value: totalDiagnoses,
      icon: <FileText className="h-5 w-5 text-blue-600" />,
      description: "Total diagnoses in the system",
    },
    {
      title: "Total Users",
      value: totalUsers,
      icon: <Users className="h-5 w-5 text-green-600" />,
      description: "Registered users across all hospitals",
    },
    {
      title: "Total Images",
      value: totalImages,
      icon: <ImageIcon className="h-5 w-5 text-purple-600" />,
      description: "Medical images stored in the system",
    },
    {
      title: "Total Hospitals",
      value: totalHospitals,
      icon: <Hospital className="h-5 w-5 text-red-600" />,
      description: "Hospitals registered in the system",
    },
    {
      title: "Total Patients",
      value: totalPatients,
      icon: <User className="h-5 w-5 text-orange-600" />,
      description: "Unique patients in the system",
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {statCards.map((card, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <div className="rounded-full bg-primary/10 p-2">{card.icon}</div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
