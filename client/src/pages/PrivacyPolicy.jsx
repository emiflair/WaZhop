import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - WaShop</title>
        <meta name="description" content="WaShop's Privacy Policy - Learn how we collect, use, and protect your personal information." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <main className="container-custom py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Privacy Policy
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
                  Welcome to WaShop. We respect your privacy and are committed to protecting your personal data. 
                  This privacy policy will inform you about how we look after your personal data when you visit 
                  our platform and tell you about your privacy rights and how the law protects you.
                </p>
              </section>

              {/* Information We Collect */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  1. Information We Collect
                </h2>
                
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                  Personal Information
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
                  <li>Name and contact information (email, phone number)</li>
                  <li>WhatsApp business number</li>
                  <li>Shop information (name, description, category, location)</li>
                  <li>Product information and images</li>
                  <li>Payment and billing information</li>
                  <li>Account credentials</li>
                </ul>

                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                  Automatically Collected Information
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  When you use our platform, we automatically collect:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (pages visited, time spent, clicks)</li>
                  <li>Analytics data (product views, WhatsApp clicks)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              {/* How We Use Your Information */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  2. How We Use Your Information
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <li>Create and manage your account</li>
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, prevent, and address technical issues and fraudulent activities</li>
                  <li>Provide analytics to shop owners about their store performance</li>
                </ul>
              </section>

              {/* Information Sharing */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  3. Information Sharing and Disclosure
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  We do not sell your personal information. We may share your information in the following circumstances:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <li><strong>With shop owners:</strong> When you interact with a shop (view products, click WhatsApp), basic analytics are shared with the shop owner</li>
                  <li><strong>With service providers:</strong> We share information with third-party vendors who help us operate our platform (hosting, analytics, payment processing)</li>
                  <li><strong>For legal reasons:</strong> We may disclose information if required by law or to protect our rights</li>
                  <li><strong>Business transfers:</strong> If WaShop is involved in a merger or acquisition, your information may be transferred</li>
                  <li><strong>With your consent:</strong> We may share information with third parties when you give us permission</li>
                </ul>
              </section>

              {/* Data Storage and Security */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  4. Data Storage and Security
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  We take reasonable measures to protect your personal information from unauthorized access, 
                  use, or disclosure. However, no internet transmission is completely secure, and we cannot 
                  guarantee absolute security.
                </p>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  Your data is stored on secure servers and we use industry-standard encryption for sensitive 
                  information. We retain your information for as long as necessary to provide our services and 
                  comply with legal obligations.
                </p>
              </section>

              {/* Your Rights */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  5. Your Privacy Rights
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  Depending on your location, you may have the following rights:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
                  <li><strong>Access:</strong> Request access to your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Objection:</strong> Object to our processing of your information</li>
                  <li><strong>Portability:</strong> Request transfer of your information</li>
                  <li><strong>Withdraw consent:</strong> Withdraw consent for data processing</li>
                </ul>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  To exercise these rights, please contact us at privacy@washop.com or through your account settings.
                </p>
              </section>

              {/* Cookies */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  6. Cookies and Tracking Technologies
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  We use cookies and similar tracking technologies to collect information about your browsing 
                  activities. You can control cookies through your browser settings, but disabling cookies may 
                  affect your ability to use certain features.
                </p>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  We use cookies for authentication, preferences, analytics, and security purposes.
                </p>
              </section>

              {/* Children's Privacy */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  7. Children&apos;s Privacy
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  WaShop is not intended for children under 18 years of age. We do not knowingly collect 
                  personal information from children. If you believe we have collected information from a 
                  child, please contact us immediately.
                </p>
              </section>

              {/* International Data Transfers */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  8. International Data Transfers
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  Your information may be transferred to and processed in countries other than Nigeria. 
                  We ensure appropriate safeguards are in place to protect your information in accordance 
                  with this privacy policy.
                </p>
              </section>

              {/* Changes to Policy */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  9. Changes to This Policy
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  We may update this privacy policy from time to time. We will notify you of any changes by 
                  posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage you 
                  to review this policy periodically.
                </p>
              </section>

              {/* Contact Us */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  10. Contact Us
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 space-y-2 text-sm sm:text-base">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-gray-100">Email:</strong> privacy@washop.com
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-gray-100">Address:</strong> WaShop, Lagos, Nigeria
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-gray-100">Website:</strong>{' '}
                    <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Contact Form
                    </a>
                  </p>
                </div>
              </section>

              {/* Nigeria Data Protection */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  11. Nigeria Data Protection Regulation (NDPR)
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  As a Nigerian-based company, we comply with the Nigeria Data Protection Regulation (NDPR) 
                  and ensure that your personal data is processed lawfully, fairly, and transparently. You 
                  have the right to file a complaint with the National Information Technology Development 
                  Agency (NITDA) if you believe your data protection rights have been violated.
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

export default PrivacyPolicy;
