import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { CartProvider } from './context/CartContext'
import { HelmetProvider } from 'react-helmet-async'
import { lazy, Suspense, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'

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

// Lazy load demo pages
const ErrorHandlingExamples = lazy(() => import('./pages/ErrorHandlingExamples'))
const LoadingStatesExamples = lazy(() => import('./pages/LoadingStatesExamples'))
const MobileResponsiveDemo = lazy(() => import('./pages/MobileResponsiveDemo'))

// Lazy load storefront
const Storefront = lazy(() => import('./pages/Storefront'))

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute'

// Wrapper component that lives inside Router so we can use useLocation safely
function AppRoutes() {
  const location = useLocation()
  // On route changes, fade out and remove splash screen inserted in index.html
  useEffect(() => {
    const el = document.getElementById('app-splash')
    if (!el) return

    // If we navigated to a marketing page, remove splash immediately
    const path = location?.pathname || window.location.pathname
  const isLogin = path === '/login' || path === '/register'
    const isDashboard = path.startsWith('/dashboard')
    // Only dashboard gets the long splash; login/register get a short one; all other pages (including storefront) remove immediately
    const MIN_SPLASH_MS = isDashboard ? 1600 : (isLogin ? 900 : 0)

    const FADE_MS = 350
    const start = (window).__SPLASH_START || (performance.now ? performance.now() : Date.now())
    const now = performance.now ? performance.now() : Date.now()
    const elapsed = Math.max(0, now - start)
    const wait = Math.max(0, MIN_SPLASH_MS - elapsed)

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
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />

                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/dashboard/shops" element={<ProtectedRoute><ManageShops /></ProtectedRoute>} />
                <Route path="/dashboard/shop" element={<ProtectedRoute><ShopSettings /></ProtectedRoute>} />
                <Route path="/dashboard/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                <Route path="/dashboard/inventory" element={<ProtectedRoute><InventoryManagement /></ProtectedRoute>} />
                <Route path="/dashboard/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/dashboard/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
                <Route path="/dashboard/referrals" element={<ProtectedRoute><ReferralProgram /></ProtectedRoute>} />
                
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
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <Router>
            <AuthProvider>
              <CartProvider>
                <AppRoutes />
              </CartProvider>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  )
}

export default App