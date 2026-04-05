import Link from 'next/link'

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-sm text-gray-500 mb-6">
          Your account is not on the access list. Contact the app owner to request access.
        </p>
        <Link href="/login">
          <button className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Back to Sign In
          </button>
        </Link>
      </div>
    </div>
  )
}
