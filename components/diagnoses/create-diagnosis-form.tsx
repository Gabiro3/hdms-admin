"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import ImageUploader from "@/components/diagnoses/image-uploader"
import PatientForm, { type PatientFormValues } from "@/components/diagnoses/patient-form"
import { Steps, Step } from "@/components/ui/steps"
import { submitFormData } from "@/lib/utils/api-client"

interface CreateDiagnosisFormProps {
  user: any // Using any for simplicity, but should be properly typed
}

export default function CreateDiagnosisForm({ user }: CreateDiagnosisFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [patientFormValues, setPatientFormValues] = useState<PatientFormValues | null>(null)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const router = useRouter()

  const handlePatientFormChange = (values: PatientFormValues) => {
    setPatientFormValues(values)
  }

  const handleImagesChange = (files: File[]) => {
    setSelectedImages(files)
  }

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1)
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    if (!patientFormValues || selectedImages.length === 0) {
      setError("Please complete all required fields and upload at least one image")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setProcessingStatus("Uploading images...")

    try {
      // Create a FormData object to send files and form data
      const formData = new FormData()

      // Add patient form values
      Object.entries(patientFormValues).forEach(([key, value]) => {
        if (value) {
          formData.append(key, value)
        }
      })

      // Add hospital ID
      formData.append("hospitalId", user.hospital_id)

      // Add images
      selectedImages.forEach((file, index) => {
        formData.append(`images[${index}]`, file)
      })

      setProcessingStatus("Processing images with AI...")

      // Submit the form using our authenticated API client
      const response = await submitFormData("/api/diagnoses/create", formData)

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.")
        }

        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create diagnosis")
      }

      const data = await response.json()
      setProcessingStatus("Diagnosis created successfully!")

      // Store the diagnosis ID for redirection
      setDiagnosisId(data.diagnosis.id)

      // Move to success step
      setCurrentStep(2)
    } catch (error) {
      console.error("Error creating diagnosis:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDiagnosis = () => {
    if (diagnosisId) {
      router.push(`/diagnoses/${diagnosisId}/view`)
    }
  }

  const isNextDisabled = () => {
    if (currentStep === 0) {
      return (
        !patientFormValues ||
        !patientFormValues.patientName ||
        !patientFormValues.patientId ||
        !patientFormValues.ageRange ||
        !patientFormValues.scanType
      )
    }

    if (currentStep === 1) {
      return selectedImages.length === 0
    }

    return false
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Diagnosis</CardTitle>
        <CardDescription>Fill in patient details and upload medical images for AI analysis</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Steps currentStep={currentStep} className="mb-8">
          <Step title="Patient Information" description="Enter patient details" />
          <Step title="Upload Images" description="Upload medical scans" />
          <Step title="Complete" description="Diagnosis created" />
        </Steps>

        <div className="mt-6">
          {currentStep === 0 && (
            <PatientForm onFormValuesChange={handlePatientFormChange} defaultValues={patientFormValues || undefined} />
          )}

          {currentStep === 1 && <ImageUploader onImagesChange={handleImagesChange} maxImages={5} />}

          {currentStep === 2 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Diagnosis Created Successfully</h3>
              <p className="mt-2 text-sm text-gray-500">
                Your diagnosis has been created and the AI analysis is complete.
              </p>
              <Button onClick={handleViewDiagnosis} className="mt-6">
                View Diagnosis
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-4">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 0 || currentStep === 2 || isSubmitting}
        >
          Previous
        </Button>

        {currentStep < 1 ? (
          <Button onClick={handleNextStep} disabled={isNextDisabled() || isSubmitting}>
            Next
          </Button>
        ) : currentStep === 1 ? (
          <Button onClick={handleSubmit} disabled={isNextDisabled() || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {processingStatus}
              </>
            ) : (
              "Create Diagnosis"
            )}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
