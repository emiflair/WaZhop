import axios from 'axios';
import { parseApiError, logError } from './errorHandler';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

console.log('🔌 API URL:', API_URL); // Debug log

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    
    // Handle standard API response format { success: true, data: {...} }
    if (response.data.success === true) {
      // Auth endpoints return { success, token, user } - return full response.data
      if (response.data.token && response.data.user) {
        return response.data;
      }
      // Upgrade/downgrade endpoints return { success, user, data } - return full response.data
      if (response.data.user && response.data.data) {
        return response.data;
      }
      // Other endpoints return { success, data } - extract just the data
      if (response.data.data !== undefined) {
        return response.data.data;
      }
    }
    
    // For non-standard responses (direct data objects), return as-is
    return response.data;
  },
  (error) => {
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

    // Enhance error object with parsed message
    error.userMessage = parseApiError(error);
    
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password })
};

// Shop endpoints
export const shopAPI = {
  getMyShop: (shopId) => api.get(`/shops/my/shop${shopId ? `?shopId=${shopId}` : ''}`),
  getMyShops: () => api.get('/shops/my/shops'),
  getShopBySlug: (slug) => api.get(`/shops/${slug}`),
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
  // Domain and subdomain management
  setCustomDomain: (domain, shopId) => api.put(`/shops/my/domain${shopId ? `?shopId=${shopId}` : ''}`, { domain }),
  verifyCustomDomain: (shopId) => api.post(`/shops/my/domain/verify${shopId ? `?shopId=${shopId}` : ''}`),
  removeCustomDomain: (shopId) => api.delete(`/shops/my/domain${shopId ? `?shopId=${shopId}` : ''}`),
  setSubdomain: (subdomain, shopId) => api.put(`/shops/my/subdomain${shopId ? `?shopId=${shopId}` : ''}`, { subdomain }),
};

// Product endpoints
export const productAPI = {
  getMyProducts: () => api.get('/products/my/products'),
  getProduct: (id) => api.get(`/products/${id}`),
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
  upgradePlan: (plan, duration, billingPeriod) => api.post('/users/upgrade', { plan, duration, billingPeriod }),
  downgradePlan: (plan) => api.post('/users/downgrade', { plan }),
};

// Review endpoints
export const reviewAPI = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  createReview: (data) => api.post('/reviews', data),
  getMyShopReviews: (shopId, params) => api.get(`/reviews/shop/my${shopId ? `?shopId=${shopId}` : ''}`, { params }),
  approveReview: (id, isApproved) => api.put(`/reviews/${id}/approve`, { isApproved }),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
};

export default api;
