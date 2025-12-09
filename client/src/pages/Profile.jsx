import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCamera, FiMail, FiPhone, FiUser, FiGlobe, FiExternalLink } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import MobileBottomNav from '../components/MobileBottomNav'
import { useAuth } from '../context/AuthContext'
import { authAPI, userAPI } from '../utils/api'
import { normalizeAfricanPhoneNumber, isValidAfricanPhone } from '../utils/helpers'
import { COUNTRY_REGION_MAP } from '../utils/location'
import toast from 'react-hot-toast'
import PriceTag from '../components/PriceTag'

const DEFAULT_FALLBACK_AVATAR = 'WZ'

const getInitials = (name = '') => {
  if (!name) return DEFAULT_FALLBACK_AVATAR
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const initials = parts.map((part) => part[0]?.toUpperCase() || '').join('')
  return initials || DEFAULT_FALLBACK_AVATAR
}

const buildCountryOptions = (activeCountry) => {
  const base = Object.values(COUNTRY_REGION_MAP).map(({ name }) => name)
  if (activeCountry && !base.includes(activeCountry)) {
    base.push(activeCountry)
  }
  return base
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    country: ''
  })
  const [favorites, setFavorites] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const countryOptions = useMemo(
    () => buildCountryOptions(formData.country || user?.country || ''),
    [formData.country, user?.country]
  )

  useEffect(() => {
    if (!user) return

    setFormData({
      name: user.name || '',
      email: user.email || '',
      whatsapp: user.whatsapp || '',
      country: user.country || ''
    })
    setFavorites(user.favorites || [])
  }, [user])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    const payload = {
      name: formData.name.trim()
    }

    if (formData.country?.trim()) {
      payload.country = formData.country.trim()
    } else if (user?.country) {
      payload.country = ''
    }

    if (formData.whatsapp?.trim()) {
      if (!isValidAfricanPhone(formData.whatsapp)) {
        toast.error('Enter a valid phone number with country code (e.g., +233201234567)')
        return
      }
      payload.whatsapp = normalizeAfricanPhoneNumber(formData.whatsapp)
    } else if (user?.whatsapp) {
      payload.whatsapp = ''
    }

    setIsSaving(true)
    try {
      const response = await authAPI.updateProfile(payload)
      const updatedUser = response?.user || response?.data
      if (updatedUser) {
        updateUser(updatedUser)
        setFavorites(updatedUser.favorites || [])
        setFormData({
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          whatsapp: updatedUser.whatsapp || '',
          country: updatedUser.country || ''
        })
      }
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile', error)
      const message = error?.response?.data?.message || 'Unable to update profile. Please try again.'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const triggerAvatarPicker = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      const response = await authAPI.uploadProfilePhoto(file)
      const updatedUser = response?.user || response?.data
      if (updatedUser) {
        updateUser(updatedUser)
        toast.success('Profile photo updated')
      }
    } catch (error) {
      console.error('Failed to upload profile photo', error)
      const message = error?.response?.data?.message || 'Unable to upload profile photo right now'
      toast.error(message)
    } finally {
      setIsUploadingAvatar(false)
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleRemoveFavorite = async (productId) => {
    try {
      const response = await userAPI.removeFavorite(productId)
      const updatedFavorites = response?.data?.favorites || []
      setFavorites(updatedFavorites)
      updateUser({ favorites: updatedFavorites })
      toast.success('Removed from favorites')
    } catch (error) {
      console.error('Failed to remove favorite', error)
      const message = error?.response?.data?.message || 'Unable to remove favorite right now'
      toast.error(message)
    }
  }

  const handleViewProduct = (product) => {
    if (!product?._id) return
    navigate(`/product/${product._id}`)
  }

  const initials = useMemo(() => getInitials(user?.name), [user?.name])
  const hasFavorites = favorites && favorites.length > 0

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="flex-1 pb-24 md:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 text-white shadow-lg">
            <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 px-6 py-10">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/80 shadow-xl bg-white text-primary-600 flex items-center justify-center text-3xl font-bold uppercase">
                    {user?.profilePic ? (
                      <img src={user.profilePic} alt={user.name || 'Profile avatar'} className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={triggerAvatarPicker}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-1 right-1 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white text-primary-600 shadow-lg hover:bg-gray-100 transition"
                    aria-label="Change profile photo"
                  >
                    <FiCamera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1 text-sm font-medium uppercase tracking-wider">
                    <FiUser className="w-3.5 h-3.5" />
                    {user?.role === 'seller' ? 'Seller' : 'Buyer'} Account
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mt-3">
                    {user?.name || 'Your Profile'}
                  </h1>
                  <p className="mt-2 flex items-center gap-2 text-white/90 text-sm md:text-base">
                    <FiMail className="w-4 h-4" />
                    {user?.email}
                  </p>
                  {formData.country && (
                    <p className="mt-1 flex items-center gap-2 text-white/80 text-sm">
                      <FiGlobe className="w-4 h-4" />
                      {formData.country}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm font-medium">
                <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-white/90">
                  <p className="uppercase text-xs tracking-[0.2em]">Plan</p>
                  <p className="text-lg font-semibold">{(user?.plan || 'free').toUpperCase()}</p>
                </div>
                <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-white/90">
                  <p className="uppercase text-xs tracking-[0.2em]">Favorites</p>
                  <p className="text-lg font-semibold">{favorites?.length || 0}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100/80 dark:border-gray-700/40 p-6 sm:p-8">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Profile details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal information so sellers can reach you faster.</p>
              </div>
              <button
                type="submit"
                form="profile-form"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            <form id="profile-form" className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FiUser className="w-4 h-4" />
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Ada Lovelace"
                  className="input"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FiMail className="w-4 h-4" />
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="input bg-gray-100 dark:bg-gray-900/40 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Email changes are handled by support—reach out if you need help.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="whatsapp" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FiPhone className="w-4 h-4" />
                  WhatsApp number (optional)
                </label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  placeholder="Include country code e.g. +233201234567"
                  className="input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="country" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FiGlobe className="w-4 h-4" />
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Select your country</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100/80 dark:border-gray-700/40 p-6 sm:p-8">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Saved favorites</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Products you love stay here so you can find them quickly.</p>
              </div>
            </div>

            {hasFavorites ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((product) => (
                  <article
                    key={product?._id}
                    className="flex gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-4 hover:border-primary-400 transition"
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm flex-shrink-0">
                      {product?.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product?.name || 'Product thumbnail'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                          {product?.name || 'Untitled product'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(product?._id)}
                          className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                      <PriceTag
                        price={product?.price}
                        currency={product?.currency}
                        priceUSD={product?.priceUSD}
                        className="mt-2"
                        primaryClassName="text-sm font-semibold text-primary-600 dark:text-primary-400"
                        convertedClassName="text-xs text-gray-500 dark:text-gray-400"
                      />
                      {product?.shop?.shopName && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          from <span className="font-medium text-gray-700 dark:text-gray-200">{product.shop.shopName}</span>
                        </p>
                      )}
                      <div className="mt-auto pt-3">
                        <button
                          type="button"
                          onClick={() => handleViewProduct(product)}
                          className="btn btn-secondary flex items-center gap-2 text-sm"
                        >
                          View product
                          <FiExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-900/40 p-10 text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No favorites yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tap the heart icon on any product in the marketplace and it will show up here.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  )
}
