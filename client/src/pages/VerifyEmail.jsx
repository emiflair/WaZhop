import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import OtpInput from '../components/OtpInput'
import api, { authAPI } from '../utils/api'

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'idle', message: '' })
  const [code, setCode] = useState('')
  // We keep the user's email only in localStorage; we won't display it.
  const [hasStoredEmail, setHasStoredEmail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    // Prefill email from localStorage if available
    try {
      const stored = localStorage.getItem('pendingVerifyEmail')
      if (stored) setHasStoredEmail(true)
    } catch (e) {
      // ignore access errors (e.g., private mode)
    }

    if (!token) {
      setState({ status: 'idle', message: '' })
      return
    }

  setState({ status: 'loading', message: 'Verifying your email…' })
    ;(async function verify() {
      try {
        const data = await api.get('/auth/verify-email', { params: { token, autoLogin: 1 } })
        if (data?.success) {
          if (data.token && data.user) {
            try {
              localStorage.setItem('token', data.token)
              localStorage.setItem('user', JSON.stringify(data.user))
            } catch {}
            const dest = data.user.role === 'seller' ? '/dashboard' : '/'
            window.location.href = dest
            return
          }
          setState({ status: 'success', message: 'Email verified successfully! Redirecting to login…' })
          const timer = setTimeout(() => navigate('/login'), 1500)
          return () => clearTimeout(timer)
        } else {
          setState({ status: 'error', message: data?.message || 'Verification failed.' })
        }
      } catch (err) {
        setState({ status: 'error', message: err.userMessage || err.message || 'Network error during verification.' })
      }
    })()
  }, [location.search, navigate])

  // Countdown for resend cooldown
  useEffect(() => {
    if (!cooldown) return
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const onSubmitCode = async (e) => {
    e.preventDefault()
    if (!code || code.trim().length !== 6) {
      setState({ status: 'error', message: 'Please enter the 6-digit code.' })
      return
    }
    setSubmitting(true)
    setState({ status: 'loading', message: 'Verifying your code…' })
    try {
      const data = await api.get('/auth/verify-email', { params: { token: code.trim(), autoLogin: 1 } })
      if (data?.success) {
        if (data.token && data.user) {
          try {
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
          } catch {}
          const dest = data.user.role === 'seller' ? '/dashboard' : '/'
          window.location.href = dest
          return
        }
        setState({ status: 'success', message: 'Email verified! Redirecting…' })
        setTimeout(() => navigate('/login'), 1200)
      } else {
        const serverMsg = data?.message || 'Invalid or expired code.'
        const helpful = /invalid token|incorrect code|expired|invalid/i.test(serverMsg)
          ? 'That code is incorrect or has expired. If you requested a new code (for example, by trying to log in), older codes stop working. Please use the most recent email or tap Resend Code.'
          : serverMsg
        setState({ status: 'error', message: helpful })
      }
    } catch (err) {
      setState({ status: 'error', message: err.userMessage || err.message || 'Network error.' })
    } finally {
      setSubmitting(false)
    }
  }

  const onResend = async () => {
    try {
      const target = (localStorage.getItem('pendingVerifyEmail') || '').trim().toLowerCase()
      if (!target) {
        setState({ status: 'error', message: 'We could not find your email. Please register again.' })
        return
      }
      await authAPI.requestEmailVerificationPublic(target)
      setCooldown(30)
      setState({ status: 'idle', message: 'If an account exists, a new code has been sent.' })
    } catch (err) {
      setState({ status: 'error', message: err.userMessage || 'Could not resend code. Try again.' })
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We emailed you a 6‑digit code. Enter it to finish setting up your account."
      altLink={<Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:underline">Back to login</Link>}
      footer={<span>Didn’t get the email? Check your spam folder or <button disabled={!hasStoredEmail || cooldown > 0} onClick={onResend} className={`font-semibold hover:underline ${cooldown>0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 dark:text-white'}`}>resend {cooldown>0 ? `(${cooldown}s)` : ''}</button></span>}
    >
      <div className="max-w-md mx-auto">
        {state.status === 'loading' && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Verifying your email…</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Please wait a moment.</p>
          </div>
        )}

        {state.status === 'success' && (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-green-600">Email verified!</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{state.message}</p>
            <button onClick={() => navigate('/login')} className="mt-6 btn btn-primary">Go to Login</button>
          </div>
        )}

        {(state.status === 'error' || state.status === 'idle') && (
          <form onSubmit={onSubmitCode} noValidate className="space-y-6">
            {state.status === 'error' && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-200">
                {state.message}
              </div>
            )}

            <div className="space-y-3 text-center">
              <label className="block text-sm font-medium">Verification code</label>
              <OtpInput value={code} onChange={(c) => setCode(c.slice(0, 6))} autoFocus disabled={submitting} />
              <p className="text-xs text-gray-500 dark:text-gray-400">Tip: You can paste the 6‑digit code directly.</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={onResend} className="btn btn-secondary" disabled={!hasStoredEmail || cooldown > 0}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
              <button type="submit" disabled={submitting || code.length !== 6} className="btn btn-primary">
                {submitting ? 'Verifying…' : 'Verify Email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
