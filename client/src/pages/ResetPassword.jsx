import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { authAPI } from '../utils/api'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    if (password !== confirm) return toast.error('Passwords do not match')

    setLoading(true)
    try {
      const res = await authAPI.resetPassword(token, password)
      toast.success(res?.message || 'Password reset successful')
      setTimeout(() => navigate('/login', { replace: true }), 600)
    } catch (err) {
      toast.error(err.userMessage || 'Unable to reset password')
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
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Reset Password</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">Create a new password for your account</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="password" className="label text-sm sm:text-base">New Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input text-sm sm:text-base"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirm" className="label text-sm sm:text-base">Confirm Password</label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  className="input text-sm sm:text-base"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full text-sm sm:text-base py-3">
                {loading ? 'Updating...' : 'Reset password'}
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
