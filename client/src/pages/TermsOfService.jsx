import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TermsOfService = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service - WaZhop</title>
        <meta name="description" content="WaZhop's Terms of Service - Learn about the rules and regulations for using our platform." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <main className="container-custom py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Terms of Service
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Last updated: November 3, 2025
              </p>
            </div>

            {/* Content */}
            <div className="card prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
              {/* Introduction */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  Introduction
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  Welcome to WaZhop! These Terms of Service (&quot;Terms&quot;) govern your access to and use of WaZhop&apos;s 
                  platform, services, and applications. By accessing or using WaZhop, you agree to be bound by 
                  these Terms. If you don&apos;t agree to these Terms, do not use our services.
                </p>
              </section>

              {/* Account Registration */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  1. Account Registration
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  To use WaZhop&apos;s services, you must:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
                  <li>Be at least 18 years old</li>
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Have a valid WhatsApp Business number</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  You are responsible for maintaining the confidentiality of your password and for all 
                  activities that occur under your account. Notify us immediately of any unauthorized use.
                </p>
              </section>

              {/* Subscription Plans */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  2. Subscription Plans and Payments
                </h2>
                
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                  Plan Types
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  WaZhop offers three subscription plans:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
                  <li><strong>Free Plan:</strong> Limited features (up to 5 products, 1 shop, basic themes)</li>
                  <li><strong>Pro Plan:</strong> Enhanced features (₦4,999/month - up to 100 products, 3 shops, custom domain, analytics)</li>
                  <li><strong>Premium Plan:</strong> All features (₦9,999/month - unlimited products, unlimited shops, priority support)</li>
                </ul>

                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                  Billing
                </h3>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
                  <li>Subscriptions are billed monthly in advance</li>
                  <li>All fees are in Nigerian Naira (₦) unless otherwise stated</li>
                  <li>Payment is due at the start of each billing cycle</li>
                  <li>Subscriptions automatically renew unless cancelled</li>
                  <li>No refunds for partial months or unused services</li>
                  <li>We reserve the right to change pricing with 30 days notice</li>
                </ul>

                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                  Cancellation
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  You may cancel your subscription at any time. Upon cancellation, you&apos;ll retain access until 
                  the end of your current billing period. Your account will then be downgraded to the Free plan.
                </p>
              </section>

              {/* Acceptable Use */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  3. Acceptable Use Policy
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  You agree NOT to use WaZhop to:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <li>Sell illegal, counterfeit, or prohibited items</li>
                  <li>Engage in fraudulent or deceptive practices</li>
                  <li>Violate intellectual property rights</li>
                  <li>Upload malicious code or viruses</li>
                  <li>Spam or harass other users</li>
                  <li>Scrape or copy content without permission</li>
                  <li>Impersonate others or misrepresent your identity</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Interfere with the platform&apos;s security or operations</li>
                  <li>Create multiple accounts to circumvent restrictions</li>
                </ul>
              </section>

              {/* Content and Intellectual Property */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  4. Content and Intellectual Property
                </h2>
                
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                  Your Content
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  You retain ownership of all content you upload (products, images, descriptions). By using 
                  WaZhop, you grant us a license to display, store, and process your content to provide our services.
                </p>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  You represent and warrant that:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
                  <li>You own or have the right to use all content you upload</li>
                  <li>Your content doesn&apos;t infringe on third-party rights</li>
                  <li>Your content complies with these Terms and applicable laws</li>
                </ul>

                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                  WaZhop&apos;s Content
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  All WaZhop branding, logos, designs, and platform features are owned by WaZhop and protected 
                  by copyright, trademark, and other intellectual property laws. You may not copy, modify, or 
                  distribute WaZhop&apos;s content without permission.
                </p>
              </section>

              {/* Shop Storefronts */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  5. Shop Storefronts and Products
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  As a shop owner, you are responsible for:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
                  <li>Accurate product descriptions and pricing</li>
                  <li>Fulfilling orders and customer service</li>
                  <li>Complying with consumer protection laws</li>
                  <li>Maintaining accurate inventory information</li>
                  <li>Responding to customer inquiries via WhatsApp</li>
                  <li>Handling returns, refunds, and disputes</li>
                  <li>Paying applicable taxes on your sales</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  WaZhop provides the platform but is not responsible for transactions between you and your 
                  customers. All sales and customer relationships are between you and your customers.
                </p>
              </section>

              {/* WhatsApp Integration */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  6. WhatsApp Integration
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  WaZhop integrates with WhatsApp for customer communication. You acknowledge that:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <li>You must comply with WhatsApp&apos;s terms of service</li>
                  <li>You&apos;re responsible for all WhatsApp communications with customers</li>
                  <li>WaZhop is not affiliated with or endorsed by WhatsApp</li>
                  <li>WaZhop is not responsible for WhatsApp service interruptions</li>
                  <li>You must maintain a valid WhatsApp Business account</li>
                </ul>
              </section>

              {/* Plan Limitations */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  7. Plan Limitations and Enforcement
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  Each subscription plan has specific limits:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
                  <li><strong>Free Plan:</strong> 5 products, 1 shop, 10MB storage, basic features</li>
                  <li><strong>Pro Plan:</strong> 100 products, 3 shops, 1GB storage, advanced features</li>
                  <li><strong>Premium Plan:</strong> Unlimited products, unlimited shops, unlimited storage</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  If you exceed your plan limits, you must upgrade to continue using restricted features. 
                  We may temporarily disable access to premium features if you downgrade your plan.
                </p>
              </section>

              {/* Termination */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  8. Termination
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  We may suspend or terminate your account if you:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
                  <li>Violate these Terms of Service</li>
                  <li>Engage in fraudulent or illegal activities</li>
                  <li>Fail to pay subscription fees</li>
                  <li>Abuse or misuse our platform</li>
                  <li>Pose a security risk to other users</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  Upon termination, you lose access to your account and content. We may retain your data as 
                  required by law or for legitimate business purposes.
                </p>
              </section>

              {/* Disclaimer */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  9. Disclaimer of Warranties
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  WaZhop is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <li>The service will be uninterrupted or error-free</li>
                  <li>All data will be accurate or complete</li>
                  <li>The service will meet your specific requirements</li>
                  <li>Defects will be corrected immediately</li>
                  <li>The platform will be free from viruses or harmful components</li>
                </ul>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  10. Limitation of Liability
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  To the maximum extent permitted by law, WaZhop shall not be liable for:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Damages resulting from unauthorized access to your account</li>
                  <li>Issues arising from third-party services (WhatsApp, payment providers)</li>
                  <li>Customer disputes or transaction failures</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
                </p>
              </section>

              {/* Indemnification */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  11. Indemnification
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  You agree to indemnify and hold WaZhop harmless from any claims, damages, losses, or expenses 
                  arising from: (a) your violation of these Terms, (b) your violation of any rights of another, 
                  (c) your content, or (d) your use of the service.
                </p>
              </section>

              {/* Governing Law */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  12. Governing Law and Disputes
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall 
                  be resolved through:
                </p>
                <ol className="list-decimal pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <li>Good faith negotiation between the parties</li>
                  <li>Mediation, if negotiation fails</li>
                  <li>Courts of Lagos State, Nigeria, as a last resort</li>
                </ol>
              </section>

              {/* Changes to Terms */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  13. Changes to Terms
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  We may update these Terms from time to time. We&apos;ll notify you of significant changes via 
                  email or through the platform. Continued use after changes constitutes acceptance of the 
                  new Terms. If you don&apos;t agree, you must stop using our services.
                </p>
              </section>

              {/* Severability */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  14. Severability and Waiver
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  If any provision of these Terms is found unenforceable, the remaining provisions will continue 
                  in effect. Our failure to enforce any right or provision doesn&apos;t constitute a waiver of that right.
                </p>
              </section>

              {/* Contact */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  15. Contact Information
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  If you have questions about these Terms, please contact us:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 space-y-2 text-sm sm:text-base">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-gray-100">Email:</strong> legal@wazhop.com
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-gray-100">Support:</strong> support@wazhop.com
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-gray-100">Address:</strong> WaZhop, Lagos, Nigeria
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-gray-100">Website:</strong>{' '}
                    <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Contact Form
                    </a>
                  </p>
                </div>
              </section>

              {/* Acknowledgment */}
              <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong className="text-gray-900 dark:text-gray-100">
                    By using WaZhop, you acknowledge that you have read, understood, and agree to be bound by 
                    these Terms of Service.
                  </strong>
                </p>
              </section>
            </div>

            {/* Back Button */}
            <div className="mt-8 sm:mt-12 text-center">
              <a
                href="/"
                className="btn btn-outline inline-flex items-center gap-2 text-sm sm:text-base touch-manipulation"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TermsOfService;
