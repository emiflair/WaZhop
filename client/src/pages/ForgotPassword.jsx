import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { authAPI } from '../utils/api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.forgotPassword(email)
      toast.success(res?.message || 'If an account exists, a reset link has been generated.')
      // In dev, backend returns resetLink; navigate user directly
      if (res?.resetLink) {
        // Give user a moment to read toast
        setTimeout(() => {
          navigate(new URL(res.resetLink).pathname, { replace: true })
        }, 600)
      } else {
        navigate('/login', { replace: true })
      }
    } catch (err) {
      toast.error(err.userMessage || 'Unable to process request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Forgot Password</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">Enter your email to reset your password</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="email" className="label text-sm sm:text-base">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input text-sm sm:text-base"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full text-sm sm:text-base py-3">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <div className="mt-4 sm:mt-6 text-center">
              <Link to="/login" className="text-sm text-primary-600 hover:underline">Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
