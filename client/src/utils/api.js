import axios from 'axios';
import { parseApiError, logError } from './errorHandler';
import { Capacitor } from '@capacitor/core';
import { CapacitorHttp } from '@capacitor/core';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const isNative = Capacitor.isNativePlatform();
const nativeHttpAvailable = isNative && Capacitor.isPluginAvailable('CapacitorHttp');
let disableNativeHttp = false;

// Debug logging
console.log('🔌 API Configuration:', {
  API_URL,
  mode: import.meta.env.MODE,
  isNative,
  nativeHttpAvailable,
  platform: Capacitor.getPlatform()
});

// Request deduplication map
const pendingRequests = new Map();

// Create axios instance for web
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
});

/**
 * Generate unique key for request deduplication
 */
function getRequestKey(config) {
  return `${config.method}-${config.url}-${JSON.stringify(config.params || {})}`;
}

/**
 * Native HTTP request using CapacitorHttp (bypasses CORS)
 */
async function nativeRequest(config) {
  const token = localStorage.getItem('token');
  let url = config.url?.startsWith('http') ? config.url : `${API_URL}${config.url}`;
  const axiosFallback = async ({ disableNative = false, reason } = {}) => {
    if (disableNative && !disableNativeHttp) {
      console.warn('⚠️ Disabling CapacitorHttp for subsequent requests due to native failure');
      disableNativeHttp = true;
    }

    if (reason) {
      console.info(`📶 Using axios fallback on native platform (${reason})`);
    } else {
      console.info('📶 Using axios fallback on native platform');
    }

    const response = await axios.request({
      url,
      method: config.method?.toUpperCase() || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...config.headers
      },
      data: config.data,
      params: config.params,
      timeout: config.timeout,
      responseType: config.responseType || 'json',
      withCredentials: config.withCredentials
    });

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config
    };
  };

  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  const isMultipart = config.headers?.['Content-Type']?.toLowerCase?.().includes('multipart/form-data');

  if (isFormData || isMultipart) {
    console.warn('🗂️ Multipart/FormData detected, using axios fallback on native platform');
    return axiosFallback({ reason: 'multipart-formdata' });
  }
  
  // Convert params to query string if present
  if (config.params) {
    const queryParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  if (!nativeHttpAvailable || disableNativeHttp) {
    return axiosFallback({ reason: nativeHttpAvailable ? 'native-disabled' : 'plugin-missing' });
  }
  
  const options = {
    url,
    method: config.method?.toUpperCase() || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...config.headers
    },
    responseType: config.responseType || 'json'
  };

  // Only add data for non-GET requests
  if (config.data && options.method !== 'GET') {
    options.data = config.data;
  }

  console.log('📱 Native HTTP Request:', options.method, url);

  try {
    const response = await CapacitorHttp.request(options);
    console.log('📱 Native HTTP Response:', response.status);

    let normalizedData = response.data;
    if (typeof normalizedData === 'string' && normalizedData.length) {
      try {
        normalizedData = JSON.parse(normalizedData);
      } catch (parseError) {
        console.warn('⚠️ Unable to parse native HTTP response as JSON:', parseError.message);
      }
    }
    
    // Transform to axios-like response
    return {
      data: normalizedData,
      status: response.status,
      statusText: response.status === 200 ? 'OK' : 'Error',
      headers: response.headers,
      config
    };
  } catch (error) {
    console.error('📱 Native HTTP Error:', error);

    if (error?.code === 'UNIMPLEMENTED' || error?.message?.toLowerCase?.().includes('not implemented')) {
      return axiosFallback({ disableNative: true, reason: 'plugin-unimplemented' });
    }

    if (error?.status === 0) {
      return axiosFallback({ reason: 'status-0' });
    }

    throw {
      response: {
        status: error.status || 0,
        data: error.data || {},
        headers: error.headers || {}
      },
      message: error.message || 'Network request failed',
      config
    };
  }
}

// Request interceptor to add token and handle deduplication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Request deduplication for GET requests
    if (config.method === 'get') {
      const requestKey = getRequestKey(config);
      
      // If same request is already pending, return that promise
      if (pendingRequests.has(requestKey)) {
        const controller = new AbortController();
        config.signal = controller.signal;
        
        // Return the pending promise instead of making a new request
        return pendingRequests.get(requestKey).then(
          (response) => {
            // Simulate axios response structure
            return Promise.reject({
              config,
              response,
              _isDeduplicated: true
            });
          },
          (error) => {
            return Promise.reject(error);
          }
        );
      }
    }
    
    return config;
  },
  (error) => {
    logError(error, { context: 'API Request' });
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Clean up pending request
    if (response.config.method === 'get') {
      const requestKey = getRequestKey(response.config);
      pendingRequests.delete(requestKey);
    }
    
    // Don't process 304 responses - they have no data
    if (response.status === 304) {
      console.warn('⚠️ Received 304 response, no data:', response.config.url);
      return response;
    }
    
    // Check if response.data exists
    if (!response.data) {
      console.warn('⚠️ No response.data:', response.config.url);
      return response;
    }
    
    // Return full response.data - components will handle their own data extraction
    return response.data;
  },
  (error) => {
    // Enhanced error logging
    console.error('❌ API Error:', {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      isNetworkError: error.message === 'Network Error',
      code: error.code
    });
    
    // Handle deduplicated requests
    if (error._isDeduplicated) {
      return error.response;
    }
    
    // Clean up pending request on error
    if (error.config?.method === 'get') {
      const requestKey = getRequestKey(error.config);
      pendingRequests.delete(requestKey);
    }
    
    // Log all API errors
    logError(error, {
      context: 'API Response',
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status
    });

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Don't redirect if already on login/register page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }

    // Handle email verification requirement (403 with requiresVerification flag)
    if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
      // Store email for verification flow if provided
      if (error.response?.data?.email) {
        localStorage.setItem('pendingVerifyEmail', error.response.data.email);
      }
      
      // Redirect to verify email page if not already there
      if (!window.location.pathname.includes('/verify-email')) {
        window.location.href = '/verify-email';
      }
    }

    // Enhance error object with parsed message
    error.userMessage = parseApiError(error);
    
    return Promise.reject(error);
  }
);

/**
 * API wrapper that uses native HTTP on mobile, axios on web
 */
const shouldUseNativeHttp = () => isNative && nativeHttpAvailable && !disableNativeHttp;

const callNative = (method, url, data, config = {}) =>
  nativeRequest({ ...config, url, data, method }).then((response) => response.data);

const apiWrapper = {
  request: (config) => (shouldUseNativeHttp() ? callNative(config.method || 'get', config.url, config.data, config) : api.request(config)),
  get: (url, config = {}) => (shouldUseNativeHttp() ? callNative('get', url, undefined, config) : api.get(url, config)),
  post: (url, data, config = {}) => (shouldUseNativeHttp() ? callNative('post', url, data, config) : api.post(url, data, config)),
  put: (url, data, config = {}) => (shouldUseNativeHttp() ? callNative('put', url, data, config) : api.put(url, data, config)),
  delete: (url, config = {}) => (shouldUseNativeHttp() ? callNative('delete', url, undefined, config) : api.delete(url, config)),
  patch: (url, data, config = {}) => (shouldUseNativeHttp() ? callNative('patch', url, data, config) : api.patch(url, data, config))
};

// Auth endpoints
export const authAPI = {
  register: (data) => apiWrapper.post('/auth/register', data),
  login: (data) => apiWrapper.post('/auth/login', data),
  googleAuth: (data) => apiWrapper.post('/auth/google', data),
  requestEmailVerificationPublic: (email) => apiWrapper.post('/auth/request-email-verification-public', { email }),
  getMe: () => apiWrapper.get('/auth/me'),
  updateProfile: (data) => apiWrapper.put('/auth/profile', data),
  changePassword: (data) => apiWrapper.put('/auth/change-password', data),
  forgotPassword: (email) => apiWrapper.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => apiWrapper.post('/auth/reset-password', { token, password }),
  upgradeToSeller: (payload) => {
    // Backward compatible: allow passing a string (whatsapp) or an object { whatsapp, referralCode }
    const body = typeof payload === 'string' ? { whatsapp: payload } : payload;
    return apiWrapper.put('/auth/upgrade-to-seller', body);
  }
};

// Shop endpoints
export const shopAPI = {
  getMyShop: (shopId) =>
    apiWrapper.get('/shops/my/shop', {
      params: {
        ...(shopId ? { shopId } : {}),
        _t: Date.now(),
      },
    }),
  getMyShops: () => apiWrapper.get(`/shops/my/shops?_t=${Date.now()}`),
  getShopBySlug: (slug) => apiWrapper.get(`/shops/${slug}`),
  createShop: (data) => apiWrapper.post('/shops', data),
  deleteShop: (id) => apiWrapper.delete(`/shops/${id}`),
  updateShop: (data, shopId) => apiWrapper.put(`/shops/my/shop${shopId ? `?shopId=${shopId}` : ''}`, data),
  updateTheme: (data, shopId) => apiWrapper.put(`/shops/my/theme${shopId ? `?shopId=${shopId}` : ''}`, data),
  getAvailableThemes: () => apiWrapper.get('/shops/themes'),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return apiWrapper.post('/shops/my/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadBanner: (file) => {
    const formData = new FormData();
    formData.append('banner', file);
    return apiWrapper.post('/shops/my/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (type) => apiWrapper.delete(`/shops/my/image/${type}`),
  // Domain management
  setCustomDomain: (domain, shopId) => apiWrapper.put(`/shops/my/domain${shopId ? `?shopId=${shopId}` : ''}`, { domain }),
  verifyCustomDomain: (shopId) => apiWrapper.post(`/shops/my/domain/verify${shopId ? `?shopId=${shopId}` : ''}`),
  removeCustomDomain: (shopId) => apiWrapper.delete(`/shops/my/domain${shopId ? `?shopId=${shopId}` : ''}`),
};

// Product endpoints
export const productAPI = {
  getMyProducts: () => apiWrapper.get(`/products/my/products?_t=${Date.now()}`),
  getProduct: (id) => apiWrapper.get(`/products/${id}`),
  getRelatedProducts: (id, limit = 6) => apiWrapper.get(`/products/${id}/related?limit=${limit}`),
  getMarketplaceProducts: (params) => apiWrapper.get('/products/marketplace', { params }),
  getBoostStatus: (id) => apiWrapper.get(`/products/${id}/boost`),
  boostProduct: (id, data) => apiWrapper.put(`/products/${id}/boost`, data),
  createProduct: (data, images) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (Array.isArray(data[key])) {
        data[key].forEach((item) => formData.append(key, item));
      } else {
        formData.append(key, data[key]);
      }
    });
    if (images && images.length > 0) {
      images.forEach((image) => formData.append('images', image));
    }
    return apiWrapper.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateProduct: (id, data) => apiWrapper.put(`/products/${id}`, data),
  deleteProduct: (id) => apiWrapper.delete(`/products/${id}`),
  uploadImages: (id, images) => {
    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));
    return apiWrapper.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (productId, imageId) =>
    apiWrapper.delete(`/products/${productId}/images/${imageId}`),
  reorderProducts: (productIds) =>
    apiWrapper.put('/products/my/reorder', { productIds }),
  trackClick: (id) => apiWrapper.post(`/products/${id}/click`),
};

// User/Subscription endpoints
export const userAPI = {
  getSubscription: () => apiWrapper.get('/users/subscription'),
  upgradePlan: (plan, duration, billingPeriod, couponCode) => apiWrapper.post('/users/upgrade', { 
    plan, 
    duration, 
    billingPeriod,
    couponCode 
  }),
  verifyPaymentAndUpgrade: (data) => apiWrapper.post('/subscription/verify-payment', data),
  downgradePlan: (plan, extra = {}) => apiWrapper.post('/users/downgrade', { plan, ...extra }),
  switchToSeller: (whatsappNumber, plan) => apiWrapper.post('/users/switch-to-seller', { whatsappNumber, plan }),
  setup2FA: () => apiWrapper.post('/auth/2fa/setup'),
  verify2FA: (token) => apiWrapper.post('/auth/2fa/verify', { token }),
  disable2FA: (password, token) => apiWrapper.post('/auth/2fa/disable', { password, token }),
  get2FAStatus: () => apiWrapper.get('/auth/2fa/status'),
  getAdminUsers: () => apiWrapper.get('/users/admin/all'),
  updateAdminUser: (userId, payload) => apiWrapper.patch(`/users/admin/${userId}`, payload)
};

export const subscriptionAPI = {
  getStatus: () => apiWrapper.get('/subscription/status'),
  renew: (payload = {}) => apiWrapper.post('/subscription/renew', payload),
  toggleAutoRenew: (autoRenew) => apiWrapper.patch('/subscription/auto-renew', { autoRenew }),
  cancel: () => apiWrapper.post('/subscription/cancel')
};

// Review endpoints
export const reviewAPI = {
  getProductReviews: (productId, params) => apiWrapper.get(`/reviews/product/${productId}`, { params }),
  createReview: (data) => {
    // Support both JSON and multipart with a single image
    if (data instanceof FormData) {
      return apiWrapper.post('/reviews', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    if (data && data.imageFile) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'imageFile') return;
        if (value !== undefined && value !== null) formData.append(key, value);
      });
      formData.append('image', data.imageFile);
      return apiWrapper.post('/reviews', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return apiWrapper.post('/reviews', data);
  },
  getMyShopReviews: (shopId, params) => apiWrapper.get(`/reviews/shop/my${shopId ? `?shopId=${shopId}` : ''}`, { params }),
  approveReview: (id, isApproved) => apiWrapper.put(`/reviews/${id}/approve`, { isApproved }),
  deleteReview: (id) => apiWrapper.delete(`/reviews/${id}`),
  markHelpful: (id) => apiWrapper.post(`/reviews/${id}/helpful`),
};

// Order endpoints
export const orderAPI = {
  createOrder: (data) => apiWrapper.post('/orders', data),
  getMyOrders: () => apiWrapper.get('/orders/my-orders'),
  getOrderById: (id) => apiWrapper.get(`/orders/${id}`),
  getShopOrders: (shopId, params) => apiWrapper.get(`/orders/shop/${shopId}`, { params }),
  getOrderStats: (shopId) => apiWrapper.get(`/orders/shop/${shopId}/stats`),
  updateOrderStatus: (id, status) => apiWrapper.patch(`/orders/${id}/status`, { status }),
  cancelOrder: (id) => apiWrapper.patch(`/orders/${id}/cancel`),
};

// Coupon endpoints
export const couponAPI = {
  create: (data) => apiWrapper.post('/coupons', data),
  getAll: () => apiWrapper.get('/coupons'),
  getStats: () => apiWrapper.get('/coupons/stats'),
  validate: (code, plan) => apiWrapper.post('/coupons/validate', { code, plan }),
  apply: (code, plan) => apiWrapper.post('/coupons/apply', { code, plan }),
  validateProduct: (code) => apiWrapper.post('/coupons/validate-product', { code }),
  toggle: (id, isActive) => apiWrapper.patch(`/coupons/${id}/toggle`, { isActive }),
  delete: (id) => apiWrapper.delete(`/coupons/${id}`),
};

// Admin endpoints
export const adminAPI = {
  getStats: () => apiWrapper.get('/admin/stats'),
  getAllUsers: (params) => apiWrapper.get('/admin/users', { params }),
  updateUserRole: (id, role) => apiWrapper.patch(`/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id) => apiWrapper.patch(`/admin/users/${id}/status`),
  updateUserPlan: (id, plan, duration) => apiWrapper.patch(`/admin/users/${id}/plan`, { plan, duration }),
  deleteUser: (id) => apiWrapper.delete(`/admin/users/${id}`),
  getAllShops: (params) => apiWrapper.get('/admin/shops', { params }),
  deleteShop: (id) => apiWrapper.delete(`/admin/shops/${id}`),
  getAllProducts: (params) => apiWrapper.get('/admin/products', { params }),
  deleteProduct: (id) => apiWrapper.delete(`/admin/products/${id}`),
  getAllOrders: (params) => apiWrapper.get('/admin/orders', { params }),
  updateOrderStatus: (id, status) => apiWrapper.patch(`/admin/orders/${id}/status`, { status }),
  getAnalytics: () => apiWrapper.get('/admin/analytics'),
  getRevenue: () => apiWrapper.get('/admin/revenue'),
  getActivity: (limit) => apiWrapper.get('/admin/activity', { params: { limit } }),
};

// Admin Create Store endpoints
export const adminCreateAPI = {
  createTemporaryStore: (data) => apiWrapper.post('/admin/create-store', data),
  getTemporaryStores: () => apiWrapper.get('/admin/create-store/temporary'),
  addProductToTempStore: (shopId, formData) => apiWrapper.post(`/admin/create-store/${shopId}/products`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteTemporaryStore: (shopId) => apiWrapper.delete(`/admin/create-store/${shopId}`),
};

export const adminSettingsAPI = {
  get: () => apiWrapper.get('/settings/admin'),
  update: (payload) => apiWrapper.put('/settings/admin', payload)
};

// Store Activation endpoints
export const storeActivationAPI = {
  verifyActivationToken: (shopId, token) => apiWrapper.get(`/activate-store/verify/${shopId}/${token}`),
  activateStore: (shopId, token, data) => apiWrapper.post(`/activate-store/${shopId}/${token}`, data),
};

export const paymentAPI = {
  // Track payment initiation
  initiatePayment: (data) => apiWrapper.post('/payments/initiate', data),
  
  // Update payment status (cancelled, failed, etc.)
  updatePaymentStatus: (transactionRef, data) => 
    apiWrapper.patch(`/payments/${transactionRef}/status`, data),
  
  // Get payment history
  getPaymentHistory: (params) => apiWrapper.get('/payments/history', { params }),
  
  // Get payment analytics
  getPaymentAnalytics: (days = 30) => 
    apiWrapper.get('/payments/analytics', { params: { days } }),
  
  // Get specific transaction details
  getTransactionDetails: (transactionRef) => 
    apiWrapper.get(`/payments/${transactionRef}`),
};

export default api;
export { apiWrapper };
