import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', message: 'Verifying your email…' })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    if (!token) {
      setState({ status: 'error', message: 'Missing verification token.' })
      return
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (res.ok && data?.success) {
          setState({ status: 'success', message: 'Email verified successfully! Redirecting to login…' })
          // Redirect to login after a short delay
          const timer = setTimeout(() => navigate('/login'), 2000)
          return () => clearTimeout(timer)
        } else {
          setState({ status: 'error', message: data?.message || 'Verification failed.' })
        }
      } catch (err) {
        setState({ status: 'error', message: err.message || 'Network error during verification.' })
      }
    }

    verify()
  }, [location.search, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 shadow-sm rounded-xl p-8 text-center">
        {state.status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold">Verifying your email…</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Please wait a moment.</p>
          </>
        )}
        {state.status === 'success' && (
          <>
            <h1 className="text-xl font-semibold text-green-600">Email verified!</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{state.message}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700"
            >
              Go to Login
            </button>
          </>
        )}
        {state.status === 'error' && (
          <>
            <h1 className="text-xl font-semibold text-red-600">Verification error</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{state.message}</p>
            <div className="mt-6 space-x-3">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center rounded-lg bg-gray-800 text-white px-4 py-2 hover:bg-gray-900"
              >
                Go to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
