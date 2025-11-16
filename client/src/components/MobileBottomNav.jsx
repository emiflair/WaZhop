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
    if (location.pathname === '/marketplace') {
      // If already on marketplace, scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Navigate to marketplace
      navigate('/marketplace')
    }
  }

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
      // Show upgrade modal for buyer
      setShowUpgradeModal(true)
    }
  }

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to view profile')
      navigate('/login')
      return
    }

    if (user?.role === 'seller') {
      // Take seller to dashboard
      navigate('/dashboard')
    } else {
      // Show upgrade modal for buyer
      setShowUpgradeModal(true)
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
      // Show upgrade modal for buyer
      setShowUpgradeModal(true)
    }
  }

  const navItems = [
    {
      icon: FiHome,
      label: 'Home',
      path: '/marketplace',
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

      {/* Buyer to Seller Upgrade Modal */}
      {showUpgradeModal && (
        <BuyerToSellerUpgrade onClose={() => setShowUpgradeModal(false)} />
      )}
    </nav>
  )
}
