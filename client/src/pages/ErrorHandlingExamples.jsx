import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ErrorAlert from '../components/ErrorAlert';
import { FormField } from '../components/FormError';
import LoadingSpinner, { LoadingOverlay, InlineLoader } from '../components/LoadingSpinner';
import {
  validateEmail,
  validatePassword,
  getPasswordStrength,
  validatePhone,
  validateSlug,
  validatePrice
} from '../utils/validation';
import {
  showError,
  showSuccess,
  showWarning,
  showInfo,
  handleApiError
} from '../utils/errorHandler';

const ErrorHandlingExamples = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    slug: '',
    price: ''
  });
  
  const [touched, setTouched] = useState({});
  const [showAlert, setShowAlert] = useState(true);
  const [loading, setLoading] = useState(false);
  const [overlayLoading, setOverlayLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const getFieldError = (field) => {
    switch (field) {
      case 'email':
        return validateEmail(formData.email);
      case 'password':
        return validatePassword(formData.password);
      case 'phone':
        return validatePhone(formData.phone);
      case 'slug':
        return validateSlug(formData.slug);
      case 'price':
        return validatePrice(formData.price);
      default:
        return null;
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const simulateApiCall = async (shouldFail = false) => {
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (shouldFail) {
        // Simulate API error
        const error = {
          response: {
            status: 400,
            data: {
              message: 'Validation failed',
              errors: ['Invalid email format', 'Password is too weak']
            }
          }
        };
        throw error;
      }
      
      showSuccess('Operation completed successfully!');
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const simulateOverlayLoading = async () => {
    setOverlayLoading(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setOverlayLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Error Handling Components</h1>
          <p className="text-gray-600 mt-2">
            Examples of all error handling and validation components
          </p>
        </div>

        {/* ErrorAlert Component */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">1. Error Alert Component</h2>
          
          <div className="space-y-4">
            {showAlert && (
              <>
                <ErrorAlert
                  type="error"
                  title="Error Occurred"
                  message="Something went wrong with your request."
                  onClose={() => setShowAlert(false)}
                />
                
                <ErrorAlert
                  type="warning"
                  title="Warning"
                  message="Your subscription will expire in 3 days."
                  onClose={() => {}}
                />
                
                <ErrorAlert
                  type="info"
                  title="Information"
                  message="Your changes have been auto-saved."
                  onClose={() => {}}
                />
                
                <ErrorAlert
                  type="error"
                  title="Validation Errors"
                  errors={[
                    'Email is required',
                    'Password must be at least 8 characters',
                    'Phone number is invalid'
                  ]}
                  onClose={() => {}}
                />
              </>
            )}
            
            {!showAlert && (
              <button
                onClick={() => setShowAlert(true)}
                className="btn-secondary"
              >
                Show Alerts Again
              </button>
            )}
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-mono text-gray-700">
              {`<ErrorAlert
  type="error"
  title="Error Occurred"
  message="Something went wrong."
  onClose={() => {}}
/>`}
            </p>
          </div>
        </section>

        {/* Form Validation */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">2. Form Validation with Error Display</h2>
          
          <form className="space-y-4">
            <FormField
              label="Email Address"
              error={getFieldError('email')}
              touched={touched.email}
              required
            >
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${getFieldError('email') && touched.email ? 'border-red-500' : ''}`}
                placeholder="Enter your email"
              />
            </FormField>

            <FormField
              label="Password"
              error={getFieldError('password')}
              touched={touched.password}
              required
            >
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${getFieldError('password') && touched.password ? 'border-red-500' : ''}`}
                placeholder="Enter password"
              />
              
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Password Strength:</span>
                    <span className={`text-sm font-medium text-${passwordStrength.color}-600`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${passwordStrength.color}-500 transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </FormField>

            <FormField
              label="WhatsApp Number"
              error={getFieldError('phone')}
              touched={touched.phone}
              helperText="Use international format (e.g., +233201234567)"
              required
            >
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${getFieldError('phone') && touched.phone ? 'border-red-500' : ''}`}
                placeholder="e.g., +233201234567"
              />
            </FormField>

            <FormField
              label="Shop URL Slug"
              error={getFieldError('slug')}
              touched={touched.slug}
              helperText="Only lowercase letters, numbers, and hyphens"
              required
            >
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${getFieldError('slug') && touched.slug ? 'border-red-500' : ''}`}
                placeholder="my-shop-name"
              />
            </FormField>

            <FormField
              label="Product Price (₦)"
              error={getFieldError('price')}
              touched={touched.price}
              required
            >
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${getFieldError('price') && touched.price ? 'border-red-500' : ''}`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </FormField>
          </form>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-mono text-gray-700">
              {`<FormField
  label="Email"
  error={validateEmail(email)}
  touched={touched.email}
  required
>
  <input ... />
</FormField>`}
            </p>
          </div>
        </section>

        {/* Loading States */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">3. Loading States</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Loading Spinners</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <LoadingSpinner size="sm" />
                  <p className="text-xs text-gray-600 mt-2">Small</p>
                </div>
                <div className="text-center">
                  <LoadingSpinner size="md" />
                  <p className="text-xs text-gray-600 mt-2">Medium</p>
                </div>
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="text-xs text-gray-600 mt-2">Large</p>
                </div>
                <div className="text-center">
                  <LoadingSpinner size="xl" />
                  <p className="text-xs text-gray-600 mt-2">Extra Large</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">With Message</h3>
              <LoadingSpinner message="Loading your data..." />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Inline Loader</h3>
              <p className="flex items-center gap-2 text-gray-700">
                Processing your request <InlineLoader />
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Loading Overlay</h3>
              <button
                onClick={simulateOverlayLoading}
                className="btn-primary mb-3"
                disabled={overlayLoading}
              >
                Trigger Overlay Loading
              </button>
              
              <LoadingOverlay show={overlayLoading} message="Loading content...">
                <div className="bg-gray-100 rounded-lg p-8">
                  <h4 className="font-semibold mb-2">Content Area</h4>
                  <p className="text-gray-600">
                    This content will be overlaid with a loading spinner when the button is clicked.
                  </p>
                </div>
              </LoadingOverlay>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-mono text-gray-700">
              {`<LoadingSpinner size="md" message="Loading..." />
<LoadingOverlay show={loading}>
  <YourContent />
</LoadingOverlay>`}
            </p>
          </div>
        </section>

        {/* Toast Notifications */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">4. Toast Notifications</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => showSuccess('Operation successful!')}
              className="btn-primary"
            >
              Show Success Toast
            </button>
            
            <button
              onClick={() => showError('An error occurred!')}
              className="btn-secondary"
            >
              Show Error Toast
            </button>
            
            <button
              onClick={() => showWarning('This is a warning!')}
              className="btn-secondary"
            >
              Show Warning Toast
            </button>
            
            <button
              onClick={() => showInfo('Here is some information')}
              className="btn-secondary"
            >
              Show Info Toast
            </button>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-mono text-gray-700">
              {`import { showSuccess, showError } from '../utils/errorHandler';

showSuccess('Operation successful!');
showError('An error occurred!');`}
            </p>
          </div>
        </section>

        {/* API Error Handling */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">5. API Error Handling</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Simulate API calls with success and error responses:
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={() => simulateApiCall(false)}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading && <InlineLoader />}
                Simulate Success
              </button>
              
              <button
                onClick={() => simulateApiCall(true)}
                disabled={loading}
                className="btn-secondary flex items-center gap-2"
              >
                {loading && <InlineLoader />}
                Simulate Error
              </button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-mono text-gray-700 whitespace-pre">
              {`try {
  const response = await api.createProduct(data);
  showSuccess('Product created!');
} catch (error) {
  handleApiError(error);
}`}
            </p>
          </div>
        </section>

        {/* Features List */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">✨ Features Implemented</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-primary-600">Components</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ ErrorBoundary - Catch component errors</li>
                <li>✅ ErrorAlert - Contextual error messages</li>
                <li>✅ FormError - Inline field validation</li>
                <li>✅ FormField - Field wrapper with errors</li>
                <li>✅ LoadingSpinner - Multiple sizes</li>
                <li>✅ LoadingOverlay - Content overlay</li>
                <li>✅ InlineLoader - Small inline spinner</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-primary-600">Utilities</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ parseApiError - Parse API errors</li>
                <li>✅ handleApiError - Handle with toast</li>
                <li>✅ Validation functions - 14 validators</li>
                <li>✅ Password strength checker</li>
                <li>✅ Toast notifications - 4 types</li>
                <li>✅ Error retry logic</li>
                <li>✅ Error logging utilities</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default ErrorHandlingExamples;
