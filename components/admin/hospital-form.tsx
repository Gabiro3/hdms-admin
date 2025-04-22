"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { apiRequest } from "@/lib/utils/api-client"
import { generateHospitalCode } from "@/lib/utils/generate-hospital-code"

interface Hospital {
  id: string
  name: string
  code: string
  address: string
  created_at: string
  updated_at: string
}

interface HospitalFormProps {
  hospital?: Hospital
}

const formSchema = z.object({
  name: z.string().min(2, "Hospital name must be at least 2 characters"),
  code: z.string().min(5, "Hospital code must be at least 5 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
})

export default function HospitalForm({ hospital }: HospitalFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const isEditing = !!hospital

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: hospital?.name || "",
      code: hospital?.code || "",
      address: hospital?.address || "",
    },
  })

  const generateCode = () => {
    const code = generateHospitalCode()
    form.setValue("code", code)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setSubmitStatus(null)
    setErrorMessage("")

    try {
      let response

      if (isEditing) {
        // Update existing hospital
        response = await apiRequest("/api/admin/hospitals", {
          method: "PATCH",
          body: {
            id: hospital.id,
            ...values,
          },
        })
      } else {
        // Create new hospital
        response = await apiRequest("/api/admin/hospitals", {
          method: "POST",
          body: values,
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${isEditing ? "update" : "create"} hospital`)
      }

      setSubmitStatus("success")

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/admin/hospitals")
        router.refresh()
      }, 1500)
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} hospital:`, error)
      setSubmitStatus("error")
      setErrorMessage(error instanceof Error ? error.message : `Failed to ${isEditing ? "update" : "create"} hospital`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Hospital" : "Create New Hospital"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update the hospital information below."
            : "Fill out the form below to create a new hospital."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitStatus === "success" && (
          <Alert className="mb-6 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Hospital successfully {isEditing ? "updated" : "created"}. Redirecting...
            </AlertDescription>
          </Alert>
        )}

{submitStatus === "error" && (
  <Alert className="mb-6" variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{errorMessage}</AlertDescription>
  </Alert>
)}


        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hospital Name</FormLabel>
                  <FormControl>
                    <Input placeholder="General Hospital" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hospital Code</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input placeholder="HSP-12345" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={generateCode}>
                      Generate
                    </Button>
                  </div>
                  <FormDescription>
                    A unique code for the hospital. Format: HSP-XXXXX
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Medical Center Dr, City, State, ZIP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Hospital" : "Create Hospital"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-4">
        <Button variant="outline" onClick={() => router.push("/admin/hospitals")}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  )
}
