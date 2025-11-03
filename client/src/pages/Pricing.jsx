import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FiCheck } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'yearly'

  const plans = [
    {
      name: 'Free',
      price: '₦0',
      yearlyPrice: '₦0',
      period: 'forever',
      features: [
        'Up to 5 products',
        '1 shop',
        '1 default theme',
        'WhatsApp integration',
        'WaShop branding',
        'Basic analytics',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: '₦5,000',
      yearlyPrice: '₦42,000',
      monthlyEquivalent: '₦3,500',
      period: '/month',
      yearlyDiscount: '30%',
      features: [
        'Up to 100 products',
        'Up to 2 shops',
        '10 premium themes with gradients',
        'Custom subdomain (yourshop.washop.com)',
        'No WaShop branding',
        'Advanced analytics',
        'Priority support',
        '1GB storage',
      ],
      cta: 'Start Pro',
      popular: true,
    },
    {
      name: 'Premium',
      price: '₦15,000',
      yearlyPrice: '₦126,000',
      monthlyEquivalent: '₦10,500',
      period: '/month',
      yearlyDiscount: '30%',
      features: [
        'Unlimited products',
        'Up to 3 shops',
        'All themes + custom colors',
        'Custom domain (myshop.com)',
        'Custom subdomain',
        'No WaShop branding',
        'Advanced analytics & insights',
        '24/7 Priority support',
        '10GB storage',
        'Custom CSS',
      ],
      cta: 'Go Premium',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar />
      <div className="flex-grow py-8 sm:py-12 md:py-16 bg-gray-50 dark:bg-gray-900 px-4">
        <div className="container-custom">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100 px-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 px-4">
              Choose the plan that&apos;s right for your business
            </p>

            {/* Billing Period Toggle */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-sm sm:text-base font-medium ${billingPeriod === 'monthly' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                  billingPeriod === 'yearly' ? 'bg-accent-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    billingPeriod === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm sm:text-base font-medium ${billingPeriod === 'yearly' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  Yearly
                </span>
                <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold px-2 py-1 rounded-full">
                  Save 30%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6 sm:p-8 border border-gray-100 dark:border-gray-700 ${
                  plan.popular ? 'ring-2 ring-accent-500 relative' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-accent-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{plan.name}</h3>
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                        {billingPeriod === 'yearly' && plan.yearlyPrice !== plan.price ? plan.yearlyPrice : plan.price}
                      </span>
                      <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 ml-2">
                        {billingPeriod === 'yearly' && plan.yearlyPrice !== plan.price ? '/year' : plan.period}
                      </span>
                    </div>
                    {billingPeriod === 'yearly' && plan.monthlyEquivalent && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {plan.monthlyEquivalent}/month when billed annually
                      </div>
                    )}
                    {billingPeriod === 'monthly' && plan.yearlyDiscount && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                        Save {plan.yearlyDiscount} with yearly billing
                      </div>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <FiCheck className="text-green-500 mt-1 mr-2 sm:mr-3 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`btn w-full text-center block text-sm sm:text-base py-3 sm:py-2 ${
                    plan.popular ? 'btn-primary' : 'btn-outline'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Pricing;
