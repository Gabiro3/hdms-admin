"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, FileText, ImageIcon, Activity, Calendar, User, Hospital, Trash2, Download } from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DiagnosisDetailProps {
  diagnosis: any // Using any for simplicity, but should be properly typed
}

export default function DiagnosisDetail({ diagnosis }: DiagnosisDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("diagnoses").delete().eq("id", diagnosis.id)

      if (error) {
        throw error
      }

      router.push("/diagnoses")
      router.refresh()
    } catch (error) {
      console.error("Error deleting diagnosis:", error)
      alert("Failed to delete diagnosis")
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = () => {
    // This is a placeholder - in a real app, you'd have a status field
    const statuses = ["pending", "in-review", "completed"]
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    switch (randomStatus) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "in-review":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Review</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{diagnosis.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Patient ID: {diagnosis.patient_id}</span>
              <span>•</span>
              <span>{format(new Date(diagnosis.created_at), "PPP")}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this diagnosis?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the diagnosis and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {diagnosis.patient_id.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">Patient ID: {diagnosis.patient_id}</h3>
                  <p className="text-sm text-muted-foreground">Medical Record</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date Created</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(diagnosis.created_at), "PPP")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Doctor</p>
                    <p className="text-sm text-muted-foreground">{diagnosis.users?.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Hospital className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Hospital</p>
                    <p className="text-sm text-muted-foreground">{diagnosis.hospitals?.name}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            {/* FIX: Restructure the Tabs component to properly contain TabsContent */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">Diagnosis Details</CardTitle>
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="overview" className="tab-button">
                      <FileText className="mr-2 h-4 w-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="images" className="tab-button">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Images
                    </TabsTrigger>
                    <TabsTrigger value="ai-analysis" className="tab-button">
                      <Activity className="mr-2 h-4 w-4" />
                      AI Analysis
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Doctor's Notes</h3>
                    <div className="rounded-md bg-gray-50 p-4">
                      <p className="whitespace-pre-wrap text-gray-700">
                        {diagnosis.doctor_notes || "No notes provided"}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="images" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Diagnostic Images</h3>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download All
                    </Button>
                  </div>
                  {!diagnosis.image_links || diagnosis.image_links.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <ImageIcon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mt-4 text-sm font-medium">No images available</h3>
                      <p className="mt-2 text-xs text-muted-foreground">Upload images to enhance the diagnosis</p>
                      <Button variant="outline" size="sm" className="mt-4">
                        Upload Images
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {diagnosis.image_links.map((imageUrl: string, index: number) => (
                        <div key={index} className="group relative aspect-square overflow-hidden rounded-md border">
                          <img
                            src={imageUrl || "/placeholder.svg"}
                            alt={`Diagnostic image ${index + 1}`}
                            className="h-full w-full object-cover transition-all group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button variant="secondary" size="sm">
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="ai-analysis" className="mt-0 space-y-6">
                  <div>
                    <h3 className="mb-2 text-lg font-medium">AI Analysis Results</h3>
                    {!diagnosis.ai_analysis_results ? (
                      <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Activity className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="mt-4 text-sm font-medium">No AI analysis available</h3>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Run AI analysis to get insights on this diagnosis
                        </p>
                        <Button variant="outline" size="sm" className="mt-4">
                          Run Analysis
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium">Summary</h4>
                            <p className="mt-1 text-gray-700">{diagnosis.ai_analysis_results.overall_summary}</p>
                          </CardContent>
                        </Card>

                        <div className="text-xs text-muted-foreground">
                          Analysis performed on{" "}
                          {format(new Date(diagnosis.ai_analysis_results.analysisTimestamp), "PPP p")}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}
