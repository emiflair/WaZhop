import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiHome, FiInfo, FiPlusCircle, FiDollarSign, FiUser } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          
          // Show navbar when scrolling up or at top
          if (currentScrollY < lastScrollY || currentScrollY < 10) {
            setIsVisible(true)
          } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Hide when scrolling down
            setIsVisible(false)
          }
          
          setLastScrollY(currentScrollY)
          ticking = false
        })
        ticking = true
      }
    }

    // Show navbar when user stops scrolling
    let scrollTimeout
    const handleScrollEnd = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        setIsVisible(true)
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scroll', handleScrollEnd, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScrollEnd)
      clearTimeout(scrollTimeout)
    }
  }, [lastScrollY])

  const handleSellClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to continue')
      navigate('/login')
      return
    }

    if (user?.role === 'seller') {
      // Take seller to add products page
      navigate('/dashboard/products/new')
    } else {
      // Prompt buyer to upgrade to seller
      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Switch to Seller Account?</p>
          <p className="text-sm text-gray-600">Start selling your products on WaZhop</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                navigate('/profile?tab=upgrade')
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium"
            >
              Upgrade Now
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ), { duration: 5000 })
    }
  }

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to view profile')
      navigate('/login')
      return
    }

    if (user?.role === 'seller') {
      // Take seller directly to dashboard
      navigate('/dashboard')
    } else {
      // Prompt buyer to upgrade to seller
      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Switch to Seller Account?</p>
          <p className="text-sm text-gray-600">Start selling your products on WaZhop</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                navigate('/profile?tab=upgrade')
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium"
            >
              Upgrade Now
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ), { duration: 5000 })
    }
  }

  const navItems = [
    {
      icon: FiHome,
      label: 'Home',
      path: '/marketplace',
      onClick: () => navigate('/marketplace')
    },
    {
      icon: FiInfo,
      label: 'About',
      path: '/about',
      onClick: () => navigate('/about')
    },
    {
      icon: FiPlusCircle,
      label: 'Sell',
      path: null,
      onClick: handleSellClick,
      isSpecial: true
    },
    {
      icon: FiDollarSign,
      label: 'Pricing',
      path: '/pricing',
      onClick: () => navigate('/pricing')
    },
    {
      icon: FiUser,
      label: 'Profile',
      path: null,
      onClick: handleProfileClick
    }
  ]

  const isActive = (path) => {
    if (!path) return false
    return location.pathname === path
  }

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const active = isActive(item.path)
          
          return (
            <button
              key={index}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] touch-target ${
                item.isSpecial
                  ? 'text-primary-600 dark:text-primary-400'
                  : active
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
              }`}
            >
              <Icon className={`${item.isSpecial ? 'w-7 h-7' : 'w-6 h-6'}`} />
              <span className={`text-xs font-medium ${item.isSpecial ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
