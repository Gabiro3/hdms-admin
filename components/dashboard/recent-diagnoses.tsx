"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface RecentDiagnosesProps {
  hospitalId: string
}

interface Diagnosis {
  id: string
  title: string
  created_at: string
  patient_id: string
  users: {
    full_name: string
  }
}

export default function RecentDiagnoses({ hospitalId }: RecentDiagnosesProps) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchRecentDiagnoses = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("diagnoses")
          .select(`
            id,
            title,
            created_at,
            patient_id,
            users (
              full_name
            )
          `)
          .eq("hospital_id", hospitalId)
          .order("created_at", { ascending: false })
          .limit(5)

        if (error) {
          throw error
        }

        setDiagnoses(data || [])
      } catch (error) {
        console.error("Error fetching recent diagnoses:", error)
      } finally {
        setLoading(false)
      }
    }

    if (hospitalId) {
      fetchRecentDiagnoses()
    }
  }, [hospitalId, supabase])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Recent Diagnoses</CardTitle>
        <Link href="/diagnoses">
          <Button variant="ghost" size="sm" className="text-xs">
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-gray-200"></div>
                  <div className="h-3 w-32 rounded bg-gray-200"></div>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-200"></div>
              </div>
            ))}
          </div>
        ) : diagnoses.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">No diagnoses found</p>
            <Link href="/diagnoses/new" className="mt-2">
              <Button variant="outline" size="sm">
                Create your first diagnosis
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {diagnoses.map((diagnosis) => (
              <div key={diagnosis.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {diagnosis.patient_id.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{diagnosis.title}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>Patient: {diagnosis.patient_id}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(diagnosis.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <Link href={`/diagnoses/${diagnosis.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
