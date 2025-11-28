import axios from 'axios';
import { parseApiError, logError } from './errorHandler';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

console.log('🔌 API URL:', API_URL); // Debug log

// Request deduplication map
const pendingRequests = new Map();

// Create axios instance
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

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  requestEmailVerificationPublic: (email) => api.post('/auth/request-email-verification-public', { email }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  upgradeToSeller: (payload) => {
    // Backward compatible: allow passing a string (whatsapp) or an object { whatsapp, referralCode }
    const body = typeof payload === 'string' ? { whatsapp: payload } : payload;
    return api.put('/auth/upgrade-to-seller', body);
  }
};

// Shop endpoints
export const shopAPI = {
  getMyShop: (shopId) => api.get(`/shops/my/shop${shopId ? `?shopId=${shopId}` : ''}&_t=${Date.now()}`),
  getMyShops: () => api.get(`/shops/my/shops?_t=${Date.now()}`),
  getShopBySlug: (slug) => api.get(`/shops/${encodeURIComponent(slug)}`),
  createShop: (data) => api.post('/shops', data),
  deleteShop: (id) => api.delete(`/shops/${id}`),
  updateShop: (data, shopId) => api.put(`/shops/my/shop${shopId ? `?shopId=${shopId}` : ''}`, data),
  updateTheme: (data, shopId) => api.put(`/shops/my/theme${shopId ? `?shopId=${shopId}` : ''}`, data),
  getAvailableThemes: () => api.get('/shops/themes'),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/shops/my/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadBanner: (file) => {
    const formData = new FormData();
    formData.append('banner', file);
    return api.post('/shops/my/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (type) => api.delete(`/shops/my/image/${type}`),
  // Domain management
  setCustomDomain: (domain, shopId) => api.put(`/shops/my/domain${shopId ? `?shopId=${shopId}` : ''}`, { domain }),
  verifyCustomDomain: (shopId) => api.post(`/shops/my/domain/verify${shopId ? `?shopId=${shopId}` : ''}`),
  removeCustomDomain: (shopId) => api.delete(`/shops/my/domain${shopId ? `?shopId=${shopId}` : ''}`),
};

// Product endpoints
export const productAPI = {
  getMyProducts: () => api.get(`/products/my/products?_t=${Date.now()}`),
  getProduct: (id) => api.get(`/products/${id}`),
  getRelatedProducts: (id, limit = 6) => api.get(`/products/${id}/related?limit=${limit}`),
  getMarketplaceProducts: (params) => api.get('/products/marketplace', { params }),
  getBoostStatus: (id) => api.get(`/products/${id}/boost`),
  boostProduct: (id, data) => api.put(`/products/${id}/boost`, data),
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
    return api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  uploadImages: (id, images) => {
    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));
    return api.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (productId, imageId) =>
    api.delete(`/products/${productId}/images/${imageId}`),
  reorderProducts: (productIds) =>
    api.put('/products/my/reorder', { productIds }),
  trackClick: (id) => api.post(`/products/${id}/click`),
};

// User/Subscription endpoints
export const userAPI = {
  getSubscription: () => api.get('/users/subscription'),
  upgradePlan: (plan, duration, billingPeriod, couponCode) => api.post('/users/upgrade', { 
    plan, 
    duration, 
    billingPeriod,
    couponCode 
  }),
  verifyPaymentAndUpgrade: (data) => api.post('/subscription/verify-payment', data),
  downgradePlan: (plan, extra = {}) => api.post('/users/downgrade', { plan, ...extra }),
  switchToSeller: (whatsappNumber, plan) => api.post('/users/switch-to-seller', { whatsappNumber, plan }),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (token) => api.post('/auth/2fa/verify', { token }),
  disable2FA: (password, token) => api.post('/auth/2fa/disable', { password, token }),
  get2FAStatus: () => api.get('/auth/2fa/status'),
};

// Review endpoints
export const reviewAPI = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  createReview: (data) => {
    // Support both JSON and multipart with a single image
    if (data instanceof FormData) {
      return api.post('/reviews', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    if (data && data.imageFile) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'imageFile') return;
        if (value !== undefined && value !== null) formData.append(key, value);
      });
      formData.append('image', data.imageFile);
      return api.post('/reviews', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/reviews', data);
  },
  getMyShopReviews: (shopId, params) => api.get(`/reviews/shop/my${shopId ? `?shopId=${shopId}` : ''}`, { params }),
  approveReview: (id, isApproved) => api.put(`/reviews/${id}/approve`, { isApproved }),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
};

// Order endpoints
export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  getShopOrders: (shopId, params) => api.get(`/orders/shop/${shopId}`, { params }),
  getOrderStats: (shopId) => api.get(`/orders/shop/${shopId}/stats`),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  cancelOrder: (id) => api.patch(`/orders/${id}/cancel`),
};

// Coupon endpoints
export const couponAPI = {
  create: (data) => api.post('/coupons', data),
  getAll: () => api.get('/coupons'),
  getStats: () => api.get('/coupons/stats'),
  validate: (code, plan) => api.post('/coupons/validate', { code, plan }),
  apply: (code, plan) => api.post('/coupons/apply', { code, plan }),
  validateProduct: (code) => api.post('/coupons/validate-product', { code }),
  toggle: (id) => api.patch(`/coupons/${id}/toggle`),
  delete: (id) => api.delete(`/coupons/${id}`),
};

// Admin endpoints
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/status`),
  updateUserPlan: (id, plan, duration) => api.patch(`/admin/users/${id}/plan`, { plan, duration }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllShops: (params) => api.get('/admin/shops', { params }),
  deleteShop: (id) => api.delete(`/admin/shops/${id}`),
  getAllProducts: (params) => api.get('/admin/products', { params }),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  getAnalytics: () => api.get('/admin/analytics'),
  getRevenue: () => api.get('/admin/revenue'),
  getActivity: (limit) => api.get('/admin/activity', { params: { limit } }),
};

// Admin Create Store endpoints
export const adminCreateAPI = {
  createTemporaryStore: (data) => api.post('/admin/create-store', data),
  getTemporaryStores: () => api.get('/admin/create-store/temporary'),
  addProductToTempStore: (shopId, formData) => api.post(`/admin/create-store/${shopId}/products`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteTemporaryStore: (shopId) => api.delete(`/admin/create-store/${shopId}`),
};

// Store Activation endpoints
export const storeActivationAPI = {
  verifyActivationToken: (shopId, token) => api.get(`/activate-store/verify/${shopId}/${token}`),
  activateStore: (shopId, token, data) => api.post(`/activate-store/${shopId}/${token}`, data),
};

export const paymentAPI = {
  // Track payment initiation
  initiatePayment: (data) => api.post('/payments/initiate', data),
  
  // Update payment status (cancelled, failed, etc.)
  updatePaymentStatus: (transactionRef, data) => 
    api.patch(`/payments/${transactionRef}/status`, data),
  
  // Get payment history
  getPaymentHistory: (params) => api.get('/payments/history', { params }),
  
  // Get payment analytics
  getPaymentAnalytics: (days = 30) => 
    api.get('/payments/analytics', { params: { days } }),
  
  // Get specific transaction details
  getTransactionDetails: (transactionRef) => 
    api.get(`/payments/${transactionRef}`),
};

export default api;
