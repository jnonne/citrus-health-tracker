import Link from 'next/link'

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-800 shadow-sm p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Your account is not on the access list. Contact the app owner to request access.
        </p>
        <Link href="/login">
          <button className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Back to Sign In
          </button>
        </Link>
      </div>
    </div>
  )
}
