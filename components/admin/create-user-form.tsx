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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { apiRequest } from "@/lib/utils/api-client"

interface Hospital {
  id: string
  name: string
  code: string
}

interface CreateUserFormProps {
  hospitals: Hospital[]
}

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  hospitalId: z.string().min(1, "Hospital is required"),
  role: z.string().optional(),
  expertise: z.string().optional(),
  phone: z.string().optional(),
})

export default function CreateUserForm({ hospitals }: CreateUserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [createdUser, setCreatedUser] = useState<any | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      hospitalId: "",
      role: "doctor",
      expertise: "",
      phone: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setSubmitStatus(null)
    setErrorMessage("")
    setTemporaryPassword(null)
    setCreatedUser(null)

    try {
      const response = await apiRequest("/api/admin/users/create", {
        method: "POST",
        body: values,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create user")
      }

      const data = await response.json()
      setSubmitStatus("success")
      setTemporaryPassword(data.temporaryPassword)
      setCreatedUser(data.user)

      // Reset form
      form.reset()
    } catch (error) {
      console.error("Error creating user:", error)
      setSubmitStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to create user")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
        <CardDescription>
          Fill out the form below to create a new user account. A temporary password will be generated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitStatus === "success" && temporaryPassword && (
          <Alert className="mb-6 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>User Created Successfully</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>The user account has been created. Please share the temporary password with the user securely.</p>
              <div className="mt-2 p-2 bg-white rounded border border-green-200">
                <p className="font-medium">Temporary Password:</p>
                <p className="font-mono text-lg mt-1 p-2 bg-gray-50 rounded text-center">{temporaryPassword}</p>
              </div>
              <p className="text-xs mt-2">This password will only be shown once. Make sure to copy it now.</p>
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
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@hospital.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="hospitalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hospital</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hospital" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name} ({hospital.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "doctor"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="technician">Technician</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="expertise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expertise/Specialty</FormLabel>
                    <FormControl>
                      <Input placeholder="Cardiology, Radiology, etc." {...field} />
                    </FormControl>
                    <FormDescription>Optional field</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormDescription>Optional field</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> A temporary password will be generated for this user. They will be required to
                change it upon their first login.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || submitStatus === "success"}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating User...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-4">
        <Button variant="outline" onClick={() => router.push("/admin/users")}>
          Back to Users
        </Button>
        {submitStatus === "success" && (
          <Button
            onClick={() => {
              setSubmitStatus(null)
              setTemporaryPassword(null)
              setCreatedUser(null)
            }}
          >
            Create Another User
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
