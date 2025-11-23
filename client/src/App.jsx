import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { CartProvider } from './context/CartContext'
import { HelmetProvider } from 'react-helmet-async'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { lazy, Suspense, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import VersionCheck from './components/VersionCheck'
import { useTheme } from './context/ThemeContext'
// v2.0.1 - Free upgrade support

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

// Lazy load public pages
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Pricing = lazy(() => import('./pages/Pricing'))
const HowItWorks = lazy(() => import('./pages/HowItWorks'))
const Contact = lazy(() => import('./pages/Contact'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const TwoFactorVerify = lazy(() => import('./pages/TwoFactorVerify'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const OrderTracking = lazy(() => import('./pages/OrderTracking'))

// Lazy load dashboard pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const Profile = lazy(() => import('./pages/dashboard/Profile'))
const ShopSettings = lazy(() => import('./pages/dashboard/ShopSettings'))
const Products = lazy(() => import('./pages/dashboard/Products'))
const Subscription = lazy(() => import('./pages/dashboard/Subscription'))
const Analytics = lazy(() => import('./pages/dashboard/Analytics'))
const ManageShops = lazy(() => import('./pages/dashboard/ManageShops'))
const ReferralProgram = lazy(() => import('./pages/dashboard/ReferralProgram'))
const InventoryManagement = lazy(() => import('./pages/dashboard/InventoryManagement'))
const Reviews = lazy(() => import('./pages/dashboard/Reviews'))

// Lazy load admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminShops = lazy(() => import('./pages/admin/AdminShops'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminRevenue = lazy(() => import('./pages/admin/AdminRevenue'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

// Lazy load demo pages
const ErrorHandlingExamples = lazy(() => import('./pages/ErrorHandlingExamples'))
const LoadingStatesExamples = lazy(() => import('./pages/LoadingStatesExamples'))
const MobileResponsiveDemo = lazy(() => import('./pages/MobileResponsiveDemo'))

// Lazy load storefront
const Storefront = lazy(() => import('./pages/Storefront'))

// Protected Route Components
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import HideForBuyers from './components/HideForBuyers'

// Wrapper component that lives inside Router so we can use useLocation safely
function AppRoutes() {
  const location = useLocation()
  const { theme } = useTheme()

  // Normalize DOM theme on every route change to match ThemeContext
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [location?.pathname, theme])

  // Removed automatic prefetch on app load to reduce initial API calls
  // Products will load normally when user navigates to marketplace
  // On route changes, fade out and remove splash screen inserted in index.html
  useEffect(() => {
    const el = document.getElementById('app-splash')
    if (!el) {
      // Splash already removed or doesn't exist, ensure body class is clean
      document.body.classList.remove('splashing')
      return
    }

    // Configure splash duration based on page type
    const path = location?.pathname || window.location.pathname
    const isMarketplace = path === '/'
    const isLogin = path === '/login' || path === '/register'
    const isDashboard = path.startsWith('/dashboard')
    // Updated durations for smoother startup experience:
    // Dashboard: 2200ms, Marketplace (homepage): 3000ms, Login/Register: 1500ms, others: 0ms
    const MIN_SPLASH_MS = isDashboard ? 2200 : (isMarketplace ? 3000 : (isLogin ? 1500 : 0))

    // Maximum splash timeout to prevent over-long splash. Keep above homepage minimum.
    const MAX_SPLASH_MS = 3500

    const FADE_MS = 300
    const start = (window).__SPLASH_START || (performance.now ? performance.now() : Date.now())
    const now = performance.now ? performance.now() : Date.now()
    const elapsed = Math.max(0, now - start)
    const wait = Math.min(Math.max(0, MIN_SPLASH_MS - elapsed), MAX_SPLASH_MS)

    const timer = setTimeout(() => {
      el.style.transition = `opacity ${FADE_MS}ms ease`
      el.style.opacity = '0'
      setTimeout(() => {
        try { el.remove() } catch (e) { /* ignore */ }
        try { document.body.classList.remove('splashing') } catch (e) { /* ignore */ }
      }, FADE_MS + 40)
    }, wait)

    return () => clearTimeout(timer)
  }, [location?.pathname])

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Marketplace />} />
                <Route path="/about" element={<Home />} />
                <Route path="/pricing" element={<HideForBuyers><Pricing /></HideForBuyers>} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/verify-2fa" element={<TwoFactorVerify />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                <Route path="/orders/:orderId" element={<OrderTracking />} />

                {/* Admin Routes - Protected with admin authentication */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
                <Route path="/admin/shops" element={<AdminRoute><AdminShops /></AdminRoute>} />
                <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
                <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                <Route path="/admin/revenue" element={<AdminRoute><AdminRevenue /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

                {/* Protected Dashboard Routes */}
                {/* Allow buyers to access /dashboard so the upgrade modal can show */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/profile" element={<ProtectedRoute sellerOnly><Profile /></ProtectedRoute>} />
                <Route path="/dashboard/shops" element={<ProtectedRoute sellerOnly><ManageShops /></ProtectedRoute>} />
                <Route path="/dashboard/shop" element={<ProtectedRoute sellerOnly><ShopSettings /></ProtectedRoute>} />
                <Route path="/dashboard/products" element={<ProtectedRoute sellerOnly><Products /></ProtectedRoute>} />
                <Route path="/dashboard/inventory" element={<ProtectedRoute sellerOnly><InventoryManagement /></ProtectedRoute>} />
                <Route path="/dashboard/subscription" element={<ProtectedRoute sellerOnly><Subscription /></ProtectedRoute>} />
                <Route path="/dashboard/analytics" element={<ProtectedRoute sellerOnly><Analytics /></ProtectedRoute>} />
                <Route path="/dashboard/reviews" element={<ProtectedRoute sellerOnly><Reviews /></ProtectedRoute>} />
                <Route path="/dashboard/referrals" element={<ProtectedRoute sellerOnly><ReferralProgram /></ProtectedRoute>} />
                
                {/* Demo Pages (Development) */}
                <Route path="/demo/error-handling" element={<ProtectedRoute><ErrorHandlingExamples /></ProtectedRoute>} />
                <Route path="/demo/loading-states" element={<ProtectedRoute><LoadingStatesExamples /></ProtectedRoute>} />
                <Route path="/demo/mobile-responsive" element={<ProtectedRoute><MobileResponsiveDemo /></ProtectedRoute>} />

                {/* Public Storefront */}
                <Route path="/:slug" element={<Storefront />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <GoogleOAuthProvider clientId={googleClientId}>
          <ThemeProvider>
            <Router>
              <AuthProvider>
                <CartProvider>
                  <VersionCheck />
                  <AppRoutes />
                </CartProvider>
              </AuthProvider>
            </Router>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  )
}

export default App