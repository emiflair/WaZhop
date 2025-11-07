import { Link } from 'react-router-dom';
import logo from '../assets/brand/wazhop-icon.svg';

// Shared layout for Login/Register with orange gradient art panel on the left (md+)
// and content card on the right. Keeps things accessible and mobile-first.
const AuthLayout = ({ title, subtitle, aside, children, footer, altLink }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-950">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top nav with brand - add safe area padding for mobile notch/status bar */}
        <div className="flex items-center justify-between mb-8 pt-safe">
          <Link to="/" className="flex items-center space-x-0">
            <img src={logo} alt="WaZhop logo" className="h-10 w-10 rounded-lg shadow" />
            <span className="-ml-2 tracking-tighter text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">aZhop</span>
          </Link>
          {altLink}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Art/Marketing panel */}
          <div className="hidden md:flex relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white shadow-xl">
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-black/10 blur-2xl" aria-hidden="true" />

            <div className="relative z-10 flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-sm">{title}</h2>
                {subtitle && (
                  <p className="mt-3 text-white/90 leading-relaxed max-w-md">{subtitle}</p>
                )}
              </div>

              {/* Feature bullets */}
              <ul className="mt-8 space-y-3 text-white/95 text-sm">
                <li className="flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">✓</span> Beautiful storefronts in minutes</li>
                <li className="flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">✓</span> Seamless WhatsApp integration</li>
                <li className="flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">✓</span> Powerful analytics & insights</li>
              </ul>

              <div className="mt-10 flex items-center gap-3">
                <img src={logo} alt="Brand" className="h-12 w-12 rounded-xl shadow-lg" />
                <div>
                  <p className="font-semibold">Built for growth</p>
                  <p className="text-white/80 text-sm">Scale from your first product to thousands.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8">
            {aside}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
              {subtitle && (
                <p className="text-gray-600 dark:text-gray-300 mt-2">{subtitle}</p>
              )}
            </div>
            {children}
            {footer && (
              <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
