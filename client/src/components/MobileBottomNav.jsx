import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiHome, FiInfo, FiPlusCircle, FiDollarSign, FiUser } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import BuyerToSellerUpgrade from './BuyerToSellerUpgrade'
import toast from 'react-hot-toast'

export default function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

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

  const handleHomeClick = () => {
    if (location.pathname === '/') {
      // If already on marketplace (homepage), scroll to top smoothly like a refresh
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Navigate to marketplace (homepage)
      navigate('/')
    }
  }

  const handleSellClick = () => {
    if (!isAuthenticated) {
      // Redirect to login without showing popup
      navigate('/login', { state: { from: '/dashboard/products', message: 'Please login or create an account to start selling' } })
      return
    }

    if (user?.role === 'seller') {
      // Take seller to products page (where they can add new products)
      navigate('/dashboard/products')
    } else {
      // Show upgrade modal for buyer
      setShowUpgradeModal(true)
    }
  }

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile', message: 'Please login or create an account to view your profile' } })
      return
    }

    navigate('/profile')
  }

  const navItems = [
    {
      icon: FiHome,
      label: 'Home',
      path: '/',
      onClick: handleHomeClick
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
      onClick: handleSellClick
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
      path: '/profile',
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
                active
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Buyer to Seller Upgrade Modal */}
      {showUpgradeModal && (
        <BuyerToSellerUpgrade onClose={() => setShowUpgradeModal(false)} />
      )}
    </nav>
  )
}
