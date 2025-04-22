import type { Metadata } from "next"
import LoginForm from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Login | Hospital Diagnosis Management System",
  description: "Login to the Hospital Diagnosis Management System",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900">
            Hospital Diagnosis Management System
          </h1>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">Welcome back</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Login with your hospital credentials to continue</p>
        </div>
        <div className="mt-8 rounded-lg bg-white p-8 shadow">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
