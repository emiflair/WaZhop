# Error Handling Documentation

Complete guide to error handling components and utilities in WaShop.

## 📦 Components

### 1. ErrorBoundary

**Purpose**: Catch JavaScript errors in component tree and display fallback UI

**Usage**:
```jsx
import ErrorBoundary from '../components/ErrorBoundary';

// Wrap your app or specific sections
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

**Features**:
- Catches errors anywhere in child component tree
- Displays user-friendly error UI
- Shows stack trace in development mode
- Try Again and Go Home buttons
- Automatic error logging (can integrate with Sentry)

---

### 2. ErrorAlert

**Purpose**: Display contextual error, warning, info, or success messages

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | string | 'error' | Alert type: 'error', 'warning', 'info', 'success' |
| title | string | - | Alert title |
| message | string | - | Alert message |
| errors | array | [] | Array of error messages to display as list |
| onClose | function | - | Callback when close button clicked |
| dismissible | boolean | true | Whether alert can be dismissed |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import ErrorAlert from '../components/ErrorAlert';

// Simple error
<ErrorAlert
  type="error"
  title="Error Occurred"
  message="Something went wrong"
  onClose={() => setShowError(false)}
/>

// Multiple errors
<ErrorAlert
  type="error"
  title="Validation Errors"
  errors={['Email is required', 'Password too short']}
/>

// Warning
<ErrorAlert
  type="warning"
  message="Your subscription expires in 3 days"
/>
```

---

### 3. FormError & FormField

**Purpose**: Display inline validation errors for form fields

**FormError Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| error | string | - | Error message to display |
| touched | boolean | false | Whether field has been touched |
| success | boolean | false | Whether to show success state |
| successMessage | string | - | Success message to display |
| className | string | '' | Additional CSS classes |

**FormField Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Field label |
| error | string | - | Error message |
| touched | boolean | false | Whether field touched |
| required | boolean | false | Whether field required |
| helperText | string | - | Helper text below field |
| children | ReactNode | - | Input element |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { FormError, FormField } from '../components/FormError';

// FormField (recommended)
<FormField
  label="Email Address"
  error={errors.email}
  touched={touched.email}
  required
  helperText="We'll never share your email"
>
  <input
    type="email"
    value={email}
    onChange={handleChange}
    onBlur={() => setTouched({...touched, email: true})}
    className={`input ${errors.email && touched.email ? 'border-red-500' : ''}`}
  />
</FormField>

// FormError only
<input type="email" ... />
<FormError error={errors.email} touched={touched.email} />
```

---

### 4. LoadingSpinner, LoadingOverlay, InlineLoader

**Purpose**: Display loading states with various styles

**LoadingSpinner Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | string | 'md' | Size: 'sm', 'md', 'lg', 'xl' |
| message | string | '' | Loading message to display |
| fullScreen | boolean | false | Show as full-screen overlay |
| color | string | 'text-green-500' | Spinner color (Tailwind class) |
| className | string | '' | Additional CSS classes |

**LoadingOverlay Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| show | boolean | - | Whether to show overlay |
| message | string | - | Loading message |
| children | ReactNode | - | Content to overlay |

**Usage**:
```jsx
import LoadingSpinner, { LoadingOverlay, InlineLoader } from '../components/LoadingSpinner';

// Basic spinner
<LoadingSpinner />

// With message
<LoadingSpinner size="lg" message="Loading products..." />

// Full screen
<LoadingSpinner fullScreen message="Please wait..." />

// Overlay
<LoadingOverlay show={loading} message="Saving...">
  <YourContent />
</LoadingOverlay>

// Inline
<p>Processing <InlineLoader /></p>
```

---

## 🛠️ Utilities

### Error Handler (`errorHandler.js`)

**Functions**:

#### parseApiError(error)
Parse API error and return user-friendly message
```jsx
import { parseApiError } from '../utils/errorHandler';

const message = parseApiError(error);
console.log(message); // "Email is already in use"
```

#### handleApiError(error, defaultMessage)
Handle API error with automatic toast notification
```jsx
import { handleApiError } from '../utils/errorHandler';

try {
  await api.createProduct(data);
} catch (error) {
  handleApiError(error, 'Failed to create product');
}
```

#### parseValidationErrors(error)
Extract field-specific validation errors
```jsx
import { parseValidationErrors } from '../utils/errorHandler';

const fieldErrors = parseValidationErrors(error);
// { email: 'Invalid email', password: 'Too short' }
```

#### Toast Notifications
```jsx
import { showSuccess, showError, showWarning, showInfo } from '../utils/errorHandler';

showSuccess('Product created!');
showError('Failed to save');
showWarning('Changes not saved');
showInfo('Auto-save enabled');
```

#### Error Checkers
```jsx
import { isNetworkError, isAuthError, isValidationError } from '../utils/errorHandler';

if (isNetworkError(error)) {
  // Handle network error
}
if (isAuthError(error)) {
  // Redirect to login
}
```

#### Error Wrapper
```jsx
import { withErrorHandler } from '../utils/errorHandler';

const createProduct = withErrorHandler(
  async (data) => await api.createProduct(data),
  'Failed to create product'
);
```

#### Retry Logic
```jsx
import { retryOperation } from '../utils/errorHandler';

await retryOperation(
  () => api.uploadImage(file),
  3, // max retries
  1000 // delay in ms
);
```

---

### Validation (`validation.js`)

**Functions**:

#### validateEmail(email)
```jsx
import { validateEmail } from '../utils/validation';

const error = validateEmail('invalid-email');
// Returns: "Please enter a valid email address"
```

#### validatePassword(password, options)
```jsx
import { validatePassword } from '../utils/validation';

const error = validatePassword('weak', {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true
});
// Returns: "Password must be at least 8 characters"
```

#### getPasswordStrength(password)
```jsx
import { getPasswordStrength } from '../utils/validation';

const strength = getPasswordStrength('MyP@ssw0rd123');
// Returns: { score: 5, label: 'Strong', color: 'green' }
```

#### Other Validators
```jsx
import {
  validatePhone,
  validateUrl,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateRange,
  validateFileSize,
  validateFileType,
  validateSlug,
  validatePrice,
  combineValidators
} from '../utils/validation';

// Phone
validatePhone('+2348012345678');

// URL
validateUrl('https://example.com', true);

// Required
validateRequired(value, 'Email');

// Length
validateMinLength(value, 3, 'Username');
validateMaxLength(value, 100, 'Description');

// Range
validateRange(value, 0, 999999, 'Price');

// File
validateFileSize(file, 5); // 5MB max
validateFileType(file, ['image/jpeg', 'image/png']);

// Slug
validateSlug('my-shop-name');

// Price
validatePrice(1000);

// Combine validators
const validateUsername = combineValidators(
  (v) => validateRequired(v, 'Username'),
  (v) => validateMinLength(v, 3, 'Username'),
  (v) => validateMaxLength(v, 20, 'Username')
);
```

---

## 🎯 Integration Examples

### Complete Form with Validation

```jsx
import { useState } from 'react';
import { FormField } from '../components/FormError';
import { validateEmail, validatePassword } from '../utils/validation';
import { handleApiError, showSuccess } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

const MyForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const errors = {
    email: validateEmail(formData.email),
    password: validatePassword(formData.password)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ email: true, password: true });
    
    // Check for errors
    if (errors.email || errors.password) return;
    
    setLoading(true);
    try {
      await api.register(formData);
      showSuccess('Account created successfully!');
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Email"
        error={errors.email}
        touched={touched.email}
        required
      >
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          onBlur={() => setTouched({...touched, email: true})}
          className={`input ${errors.email && touched.email ? 'border-red-500' : ''}`}
        />
      </FormField>

      <FormField
        label="Password"
        error={errors.password}
        touched={touched.password}
        required
      >
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          onBlur={() => setTouched({...touched, password: true})}
          className={`input ${errors.password && touched.password ? 'border-red-500' : ''}`}
        />
      </FormField>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? <LoadingSpinner size="sm" /> : 'Submit'}
      </button>
    </form>
  );
};
```

### API Call with Error Handling

```jsx
import { handleApiError, showSuccess } from '../utils/errorHandler';
import { LoadingOverlay } from '../components/LoadingSpinner';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.getProducts();
      setData(response.data);
    } catch (error) {
      handleApiError(error, 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingOverlay show={loading} message="Loading products...">
      {/* Your content */}
    </LoadingOverlay>
  );
};
```

---

## 🎨 Styling

All components use Tailwind CSS classes and follow the existing design system:
- Error: red-50, red-500, red-600, red-800
- Warning: yellow-50, yellow-500, yellow-600, yellow-800
- Info: blue-50, blue-500, blue-600, blue-800
- Success: green-50, green-500, green-600, green-800

---

## 📝 Best Practices

1. **Always wrap app in ErrorBoundary**
   ```jsx
   <ErrorBoundary>
     <App />
   </ErrorBoundary>
   ```

2. **Use FormField for consistent form layouts**
   ```jsx
   <FormField label="Email" error={error} touched={touched}>
     <input ... />
   </FormField>
   ```

3. **Handle API errors with handleApiError**
   ```jsx
   catch (error) {
     handleApiError(error);
   }
   ```

4. **Validate on blur, not on change**
   ```jsx
   onBlur={() => setTouched({...touched, email: true})}
   ```

5. **Show loading states for async operations**
   ```jsx
   {loading ? <LoadingSpinner /> : <Content />}
   ```

6. **Use toast notifications for user feedback**
   ```jsx
   showSuccess('Saved!');
   showError('Failed!');
   ```

---

## 🔧 Troubleshooting

**Q: Errors not showing?**  
A: Make sure the field is marked as touched: `touched={touched.fieldName}`

**Q: Toast not appearing?**  
A: Verify `<Toaster />` is in your App.jsx

**Q: ErrorBoundary not catching errors?**  
A: ErrorBoundary only catches errors in components below it in the tree

**Q: Validation not working?**  
A: Check that you're calling the validator function and passing the result to FormError

---

## 📦 Files Created

- `client/src/components/ErrorBoundary.jsx` - Error boundary component
- `client/src/components/ErrorAlert.jsx` - Alert component
- `client/src/components/FormError.jsx` - Form error components
- `client/src/components/LoadingSpinner.jsx` - Loading components
- `client/src/components/errorHandling.js` - Export file
- `client/src/utils/errorHandler.js` - Error utilities
- `client/src/utils/validation.js` - Validation utilities
- `client/src/pages/ErrorHandlingExamples.jsx` - Demo page
- `client/src/components/ERROR_HANDLING_DOCS.md` - This documentation

---

## 🚀 Next Steps

1. Wrap App.jsx in ErrorBoundary
2. Replace existing error handling with new utilities
3. Add validation to all forms
4. Use LoadingSpinner for all async operations
5. Replace console.error with handleApiError
6. Add password strength meter to password fields
7. Test all error scenarios

Happy coding! 🎉
