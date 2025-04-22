"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, FileText, ImageIcon, Activity, Calendar, User, Hospital, Download, Printer } from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface DiagnosisViewProps {
  diagnosis: any // Using any for simplicity, but should be properly typed
}

export default function DiagnosisView({ diagnosis }: DiagnosisViewProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()

  // Extract patient metadata
  const patientMetadata = diagnosis.patient_metadata || {}
  const aiAnalysis = diagnosis.ai_analysis_results || {}

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
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
          <Button variant="default" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download Images
          </Button>
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
                    {patientMetadata.name
                      ? patientMetadata.name.substring(0, 2).toUpperCase()
                      : diagnosis.patient_id.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{patientMetadata.name || "Unknown"}</h3>
                  <p className="text-sm text-muted-foreground">Patient ID: {diagnosis.patient_id}</p>
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
                {patientMetadata.age_range && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Age Range</p>
                      <p className="text-sm text-muted-foreground">{patientMetadata.age_range}</p>
                    </div>
                  </div>
                )}
                {patientMetadata.scan_type && (
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Scan Type</p>
                      <p className="text-sm text-muted-foreground">{patientMetadata.scan_type}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <Card>
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
                    {!aiAnalysis || Object.keys(aiAnalysis).length === 0 ? (
                      <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Activity className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="mt-4 text-sm font-medium">No AI analysis available</h3>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Run AI analysis to get insights on this diagnosis
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium">Summary</h4>
                            <p className="mt-1 text-gray-700">{aiAnalysis.summary}</p>
                          </CardContent>
                        </Card>

                        {aiAnalysis.findings && aiAnalysis.findings.length > 0 && (
                          <Card>
                            <CardContent className="p-4">
                              <h4 className="font-medium">Findings</h4>
                              <ul className="mt-2 space-y-2">
                                {aiAnalysis.findings.map((finding: string, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                                    <span>{finding}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                          <Card>
                            <CardContent className="p-4">
                              <h4 className="font-medium">Recommendations</h4>
                              <ul className="mt-2 space-y-2">
                                {aiAnalysis.recommendations.map((recommendation: string, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                                    <span>{recommendation}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {aiAnalysis.potential_conditions && aiAnalysis.potential_conditions.length > 0 && (
                          <Card>
                            <CardContent className="p-4">
                              <h4 className="font-medium">Potential Conditions</h4>
                              <div className="mt-4 space-y-3">
                                {aiAnalysis.potential_conditions.map(
                                  (condition: { name: string; probability: number }, index: number) => (
                                    <div key={index}>
                                      <div className="mb-1 flex items-center justify-between">
                                        <span className="font-medium">{condition.name}</span>
                                        <span className="text-sm">{Math.round(condition.probability * 100)}%</span>
                                      </div>
                                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                        <div
                                          className="h-full bg-primary"
                                          style={{
                                            width: `${Math.round(condition.probability * 100)}%`,
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {aiAnalysis.confidence_score !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">AI Confidence Score</span>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {Math.round(aiAnalysis.confidence_score * 100)}%
                            </Badge>
                          </div>
                        )}

                        {aiAnalysis.analysisTimestamp && (
                          <div className="text-xs text-muted-foreground">
                            Analysis performed on {format(new Date(aiAnalysis.analysisTimestamp), "PPP p")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
