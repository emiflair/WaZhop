import { Link } from 'react-router-dom';
import logoBlack from '/wazhoplogo/logoblack.PNG?url';
import logoWhite from '/wazhoplogo/Logowhite.PNG?url';

// Shared layout for Login/Register with orange gradient art panel on the left (md+)
// and content card on the right. Keeps things accessible and mobile-first.
const AuthLayout = ({ title, subtitle, aside, children, footer, altLink }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-950">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top nav with brand */}
        <div className="flex items-center justify-between mb-8 pt-safe">
          <Link to="/" className="flex-shrink-0 flex items-center -ml-14">
            <img src={logoBlack} alt="WaZhop" className="h-20 md:h-20 lg:h-24 w-auto object-contain dark:hidden" />
            <img src={logoWhite} alt="WaZhop" className="h-20 md:h-20 lg:h-24 w-auto object-contain hidden dark:block" />
          </Link>
          {altLink}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Art/Marketing panel */}
          <div className="hidden md:flex relative overflow-hidden rounded-2xl p-8 lg:p-10 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white shadow-xl">
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-black/10 blur-2xl" aria-hidden="true" />

            <div className="relative z-10 flex flex-col justify-between w-full">
              <div>
                <h2 className="text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-sm">{title}</h2>
                {subtitle && (
                  <p className="mt-6 text-white/90 text-xl lg:text-2xl leading-relaxed max-w-lg">{subtitle}</p>
                )}
              </div>

              {/* Feature bullets */}
              <ul className="mt-12 space-y-6 text-white/95 text-lg lg:text-xl">
                <li className="flex items-center gap-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold">✓</span>
                  <span>Beautiful storefronts in minutes</span>
                </li>
                <li className="flex items-center gap-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold">✓</span>
                  <span>Seamless WhatsApp integration</span>
                </li>
                <li className="flex items-center gap-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold">✓</span>
                  <span>Powerful analytics & insights</span>
                </li>
              </ul>

              <div className="mt-14 pt-10 border-t border-white/20">
                <p className="font-semibold text-2xl">Built for growth</p>
                <p className="text-white/80 mt-3 text-lg">Scale from your first product to thousands.</p>
              </div>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
            {aside}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">{title}</h1>
              {subtitle && (
                <p className="text-gray-600 dark:text-gray-300 mt-2">{subtitle}</p>
              )}
            </div>
            {children}
            {footer && (
              <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
