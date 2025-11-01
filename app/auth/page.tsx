import { AuthForm } from "@/components/auth/auth-form"

export const dynamic = 'force-dynamic'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            vRita AI
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerador de PRD Estruturado
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}
