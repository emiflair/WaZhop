import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PaymentSettings from '../../components/PaymentSettings';
import { shopAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { usePlanLimits } from '../../hooks/usePlanLimits';
import toast from 'react-hot-toast';
import { HexColorPicker } from 'react-colorful';
import { FaUpload, FaTimes, FaInstagram, FaFacebook, FaTwitter, FaMapMarkerAlt, FaStore, FaGlobe, FaCrown, FaLock } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa';
import { TouchButton } from '../../components/mobile';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ShopSettings = () => {
  const { user } = useAuth();
  const { hasFeature, getUpgradeMessage } = usePlanLimits();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get('shopId');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shop, setShop] = useState(null);
  const [availableThemes, setAvailableThemes] = useState([]);
  const [customizationAllowed, setCustomizationAllowed] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    category: '',
    location: '',
    theme: {
      mode: 'light'
    }
  });

  // Theme state
  const [theme, setTheme] = useState({
    primaryColor: '#f97316',
    accentColor: '#3b82f6',
    layout: 'grid',
    fontFamily: 'inter'
  });

  // Social links state
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    facebook: '',
    twitter: '',
    tiktok: ''
  });

  // Custom domain state
  const [customDomain, setCustomDomain] = useState('');
  const [domainVerified, setDomainVerified] = useState(false);
  const [domainVerificationToken, setDomainVerificationToken] = useState('');
  const [verifyingDomain, setVerifyingDomain] = useState(false);

  // Image state
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Color picker visibility
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false);
  const [showAccentPicker, setShowAccentPicker] = useState(false);

  // Slug validation
  const [slugError, setSlugError] = useState('');
  const [slugChecking, setSlugChecking] = useState(false);

  useEffect(() => {
    fetchShop();
    fetchAvailableThemes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAvailableThemes = async () => {
    try {
      const themesData = await shopAPI.getAvailableThemes();
      console.log('Available themes response:', themesData);
      setAvailableThemes(themesData.themes || []);
      setCustomizationAllowed(themesData.customizationAllowed || false);
    } catch (error) {
      console.error('Error fetching themes:', error);
    }
  };

  const fetchShop = async () => {
    try {
      setLoading(true);
      const data = await shopAPI.getMyShop(shopId);
      setShop(data);
      
      // Populate form - map backend field names to form field names
      setFormData({
        name: data.shopName || '',
        description: data.description || '',
        slug: data.slug || '',
        category: data.category || '',
        location: data.location || '',
        theme: {
          mode: data.theme?.mode || 'light'
        }
      });

      // Populate theme
      setTheme({
        primaryColor: data.theme?.primaryColor || '#f97316',
        accentColor: data.theme?.accentColor || '#3b82f6',
        layout: data.theme?.layout || 'grid',
        fontFamily: data.theme?.font || 'inter'
      });

      // Populate social links
      setSocialLinks({
        instagram: data.socialLinks?.instagram || '',
        facebook: data.socialLinks?.facebook || '',
        twitter: data.socialLinks?.twitter || '',
        tiktok: data.socialLinks?.tiktok || ''
      });

      // Populate custom domain
      setCustomDomain(data.customDomain || '');
      setDomainVerified(data.domainVerified || false);
      setDomainVerificationToken(data.domainVerificationToken || '');

      // Set image previews
      if (data.logo) setLogoPreview(data.logo);
      if (data.banner) setBannerPreview(data.banner);

    } catch (error) {
      console.error('Error fetching shop:', error);
      // Don't show error toast if shop doesn't exist (buyer account)
      if (error.response?.status !== 404) {
        toast.error('Failed to load shop settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate slug
    if (name === 'slug') {
      validateSlug(value);
    }
  };

  const validateSlug = async (slug) => {
    if (!slug) {
      setSlugError('');
      return;
    }

    // Check format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    // Check if unchanged
    if (slug === shop?.slug) {
      setSlugError('');
      return;
    }

    // Check availability
    setSlugChecking(true);
    try {
      // You can add a checkSlugAvailability endpoint if needed
      // For now, we'll just validate format
      setSlugError('');
    } catch (error) {
      setSlugError('This slug is already taken');
    } finally {
      setSlugChecking(false);
    }
  };

  const handleThemeChange = (field, value) => {
    setTheme(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (platform, value) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }));
  };

  const handleSetCustomDomain = async () => {
    if (!customDomain) {
      toast.error('Please enter a domain');
      return;
    }

    try {
      setSaving(true);
      const response = await shopAPI.setCustomDomain(customDomain, shopId);
      setDomainVerified(false);
      setDomainVerificationToken(response.verificationToken);
      toast.success('Domain added! Please configure DNS and verify.');
    } catch (error) {
      console.error('Error setting custom domain:', error);
      toast.error(error.response?.data?.message || 'Failed to set custom domain');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    try {
      setVerifyingDomain(true);
      await shopAPI.verifyCustomDomain(shopId);
      setDomainVerified(true);
      toast.success('Domain verified successfully!');
      fetchShop();
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast.error(error.response?.data?.message || 'Domain verification failed');
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!window.confirm('Are you sure you want to remove the custom domain?')) {
      return;
    }

    try {
      setSaving(true);
      await shopAPI.removeCustomDomain(shopId);
      setCustomDomain('');
      setDomainVerified(false);
      setDomainVerificationToken('');
      toast.success('Custom domain removed');
    } catch (error) {
      console.error('Error removing domain:', error);
      toast.error(error.response?.data?.message || 'Failed to remove domain');
    } finally {
      setSaving(false);
    }
  };

  // Subdomain feature removed: shops use wazhop.ng/<slug> or custom domains.

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check storage access for free plan
      if (!hasFeature('hasStorage')) {
        toast.error(getUpgradeMessage('storage'));
        e.target.value = ''; // Reset input
        return;
      }

      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo must be less than 5MB');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check storage access for free plan
      if (!hasFeature('hasStorage')) {
        toast.error(getUpgradeMessage('storage'));
        e.target.value = ''; // Reset input
        return;
      }

      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Banner must be less than 10MB');
        return;
      }

      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return;

    // Check storage access
    if (!hasFeature('hasStorage')) {
      toast.error(getUpgradeMessage('storage'));
      navigate('/dashboard/subscription');
      return;
    }

    try {
      setUploadingLogo(true);
      const data = await shopAPI.uploadLogo(logoFile);
      setShop(prev => ({ ...prev, logo: data }));
      setLogoFile(null);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const uploadBanner = async () => {
    if (!bannerFile) return;

    // Check storage access
    if (!hasFeature('hasStorage')) {
      toast.error(getUpgradeMessage('storage'));
      navigate('/dashboard/subscription');
      return;
    }

    try {
      setUploadingBanner(true);
      const data = await shopAPI.uploadBanner(bannerFile);
      setShop(prev => ({ ...prev, banner: data }));
      setBannerFile(null);
      toast.success('Banner uploaded successfully');
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error(error.response?.data?.message || 'Failed to upload banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
  };

  const removeBanner = () => {
    setBannerPreview(null);
    setBannerFile(null);
  };

  const handleApplyTheme = async (themeId) => {
    try {
      setSaving(true);
      
      // Apply the preset theme
      await shopAPI.updateTheme({ themeName: themeId }, shopId);
      
      // Fetch updated shop data to reflect the new theme
      await fetchShop();
      
      toast.success(`Theme applied successfully!`);
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error(error.response?.data?.message || 'Failed to apply theme');
    } finally {
      setSaving(false);
    }
  };

  // Persist layout immediately for Pro and Premium users when a layout is selected
  const handleLayoutSelect = async (layoutValue) => {
    setTheme(prev => ({ ...prev, layout: layoutValue }));
    if (user?.plan === 'free') return; // Free users can't change layout

    try {
      setSaving(true);
      await shopAPI.updateTheme({ layout: layoutValue }, shopId);
      toast.success('Layout updated');
      await fetchShop();
    } catch (error) {
      console.error('Error updating layout:', error);
      toast.error(error.response?.data?.message || 'Failed to update layout');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (updates) => {
    console.log('🔄 ShopSettings.handleUpdate called with:', updates);
    try {
      setSaving(true);
      const result = await shopAPI.updateShop(updates, shopId);
      console.log('✅ ShopSettings.handleUpdate result:', result);
      // Refresh shop data
      await fetchShop();
      return Promise.resolve();
    } catch (error) {
      console.error('❌ ShopSettings.handleUpdate error:', error);
      return Promise.reject(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (slugError) {
      toast.error('Please fix slug error before saving');
      return;
    }

    try {
      setSaving(true);

      // Update shop details - map form field names to backend field names
      const shopData = {
        shopName: formData.name,
        description: formData.description,
        slug: formData.slug,
        category: formData.category,
        location: formData.location,
        socialLinks,
        theme: {
          mode: formData.theme.mode
        }
      };
      await shopAPI.updateShop(shopData, shopId);

      // Persist theme (Premium customization)
      if (user?.plan === 'premium') {
        try {
          await shopAPI.updateTheme({
            primaryColor: theme.primaryColor,
            accentColor: theme.accentColor,
            layout: theme.layout,
            font: theme.fontFamily
          }, shopId);
        } catch (err) {
          console.error('Error updating theme:', err);
          toast.error(err.response?.data?.message || 'Failed to update theme');
        }
      }

      // Upload images if changed
      if (logoFile) {
        await uploadLogo();
      }
      if (bannerFile) {
        await uploadBanner();
      }

      toast.success('Shop settings saved successfully');
      fetchShop(); // Refresh data
    } catch (error) {
      console.error('Error saving shop settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { value: 'fashion', label: 'Fashion & Clothing' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'food', label: 'Food & Beverages' },
    { value: 'beauty', label: 'Beauty & Cosmetics' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'services', label: 'Services' },
    { value: 'other', label: 'Other' }
  ];

  const layouts = [
    { value: 'grid', label: 'Grid View', description: 'Products in a grid' },
    { value: 'list', label: 'List View', description: 'Products in a list' },
    { value: 'minimal', label: 'Minimal', description: 'Clean minimal layout' },
    { value: 'masonry', label: 'Masonry', description: 'Pinterest-style layout' }
  ];

  const fonts = [
    { value: 'inter', label: 'Inter', class: 'font-sans' },
    { value: 'roboto', label: 'Roboto', class: 'font-sans' },
    { value: 'poppins', label: 'Poppins', class: 'font-sans' },
    { value: 'montserrat', label: 'Montserrat', class: 'font-sans' }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl pb-24 sm:pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Shop Settings</h1>
          <p className="text-gray-600 mt-2">Customize your shop&apos;s appearance and details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaStore className="text-primary-500" />
              Basic Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="input"
                  placeholder="Tell customers about your shop..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop URL/Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">wazhop.ng/</span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className={`input flex-1 ${slugError ? 'border-red-500' : ''}`}
                    required
                  />
                  {slugChecking && (
                    <span className="text-sm text-gray-500">Checking...</span>
                  )}
                </div>
                {slugError && (
                  <p className="text-sm text-red-500 mt-1">{slugError}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Only lowercase letters, numbers, and hyphens allowed
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaMapMarkerAlt className="inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Logo & Banner */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Logo & Banner</h2>
            
            <div className="space-y-6">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Logo
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <FaUpload className="text-gray-400 text-2xl" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="logo"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <label htmlFor="logo" className="btn-secondary cursor-pointer">
                        <FaUpload className="inline mr-2" />
                        Choose Logo
                      </label>
                      {logoPreview && (
                        <>
                          {logoFile && (
                            <button
                              type="button"
                              onClick={uploadLogo}
                              disabled={uploadingLogo}
                              className="btn-primary"
                            >
                              {uploadingLogo ? 'Uploading...' : 'Upload'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="btn-secondary text-red-600 hover:bg-red-50"
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Recommended: Square image, at least 200x200px, max 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Banner
                </label>
                <div className="space-y-3">
                  <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <FaUpload className="text-gray-400 text-2xl" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="banner"
                      accept="image/*"
                      onChange={handleBannerSelect}
                      className="hidden"
                    />
                    <label htmlFor="banner" className="btn-secondary cursor-pointer">
                      <FaUpload className="inline mr-2" />
                      Choose Banner
                    </label>
                    {bannerPreview && (
                      <>
                        {bannerFile && (
                          <button
                            type="button"
                            onClick={uploadBanner}
                            disabled={uploadingBanner}
                            className="btn-primary"
                          >
                            {uploadingBanner ? 'Uploading...' : 'Upload'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={removeBanner}
                          className="btn-secondary text-red-600 hover:bg-red-50"
                        >
                          <FaTimes />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Recommended: Wide image, at least 1200x400px, max 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Customization */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Theme Customization</h2>
              {user?.plan === 'free' && (
                <button
                  onClick={() => navigate('/dashboard/subscription')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  <FaCrown /> Upgrade to Customize
                </button>
              )}
              {user?.plan === 'pro' && !customizationAllowed && (
                <button
                  onClick={() => navigate('/dashboard/subscription')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
                >
                  <FaCrown /> Upgrade for Custom Colors
                </button>
              )}
            </div>

            {/* Theme Mode Selector - Premium Only */}
            {user?.plan === 'premium' ? (
              <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-indigo-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">🎨</div>
                  <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Customer View Mode
                  </label>
                  <span className="ml-auto px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold rounded-full">
                    PREMIUM
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Control how your shop appears to customers. This is separate from your dashboard theme preference.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: { ...formData.theme, mode: 'light' } })}
                    className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                      formData.theme.mode === 'light'
                        ? 'border-yellow-500 bg-white shadow-lg ring-2 ring-yellow-300'
                        : 'border-gray-300 bg-white hover:border-yellow-400 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">☀️</div>
                      <div className="text-sm font-bold text-gray-800">Light Mode</div>
                      {formData.theme.mode === 'light' && (
                        <div className="text-xs text-yellow-600 font-semibold mt-2 flex items-center justify-center gap-1">
                          <span>✓</span> Active
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">Bright & Clean</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: { ...formData.theme, mode: 'dark' } })}
                    className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                      formData.theme.mode === 'dark'
                        ? 'border-indigo-500 bg-gray-900 text-white shadow-lg ring-2 ring-indigo-400'
                        : 'border-gray-600 bg-gray-900 text-white hover:border-indigo-400 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">🌙</div>
                      <div className="text-sm font-bold">Dark Mode</div>
                      {formData.theme.mode === 'dark' && (
                        <div className="text-xs text-indigo-400 font-semibold mt-2 flex items-center justify-center gap-1">
                          <span>✓</span> Active
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">Sleek & Modern</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: { ...formData.theme, mode: 'auto' } })}
                    className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                      formData.theme.mode === 'auto'
                        ? 'border-purple-500 bg-gradient-to-br from-white via-gray-200 to-gray-900 shadow-lg ring-2 ring-purple-400'
                        : 'border-gray-400 bg-gradient-to-br from-white via-gray-200 to-gray-900 hover:border-purple-400 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">🌗</div>
                      <div className="text-sm font-bold text-gray-800">Auto Mode</div>
                      {formData.theme.mode === 'auto' && (
                        <div className="text-xs text-purple-600 font-semibold mt-2 flex items-center justify-center gap-1">
                          <span>✓</span> Active
                        </div>
                      )}
                      <div className="text-xs text-gray-600 mt-1">Smart Adapt</div>
                    </div>
                  </button>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-gray-600">
                  <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                    <span className="text-base">💡</span>
                    <span>
                      <strong>Tip:</strong> Auto mode automatically matches your customers&apos; device preferences (light during day, dark at night).
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-purple-300 dark:border-gray-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="text-center">
                    <FaLock className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-400 mb-2">Premium Feature</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Control customer view mode (light/dark/auto)</p>
                    <button
                      onClick={() => navigate('/dashboard/subscription')}
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
                    >
                      Upgrade to Premium
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3 opacity-30">
                  <div className="text-2xl">🎨</div>
                  <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Customer View Mode
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 opacity-30">
                  Control how your shop appears to customers. This is separate from your dashboard theme preference.
                </p>
                <div className="grid grid-cols-3 gap-4 opacity-30">
                  <div className="p-4 rounded-xl border-2 border-gray-300 bg-white">
                    <div className="text-center">
                      <div className="text-3xl mb-2">☀️</div>
                      <div className="text-sm font-bold text-gray-800">Light Mode</div>
                      <div className="text-xs text-gray-500 mt-1">Bright & Clean</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border-2 border-gray-600 bg-gray-900">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🌙</div>
                      <div className="text-sm font-bold text-white">Dark Mode</div>
                      <div className="text-xs text-gray-400 mt-1">Sleek & Modern</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border-2 border-gray-400 bg-gradient-to-br from-white via-gray-200 to-gray-900">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🌗</div>
                      <div className="text-sm font-bold text-gray-800">Auto Mode</div>
                      <div className="text-xs text-gray-600 mt-1">Smart Adapt</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Free Plan - Locked */}
            {user?.plan === 'free' && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center">
                <FaLock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Theme Customization Locked
                </h3>
                <p className="text-gray-600 mb-4">
                  Your shop is using the default Clean White theme. Upgrade to Pro for 5 professional themes or Premium for unlimited customization.
                </p>
                <div className="bg-white rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-20 h-20 rounded-lg bg-white border-4 border-gray-300"></div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Clean White (Current)</p>
                      <p className="text-sm text-gray-600">Classic and professional</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/dashboard/subscription')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
                >
                  View Plans & Upgrade
                </button>
              </div>
            )}

            {/* Pro Plan - Preset Themes */}
            {user?.plan === 'pro' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Pro Plan:</strong> Choose from 10 professional preset themes with gradients & animations. Upgrade to Premium for unlimited customization + custom CSS.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableThemes.map((themeOption) => (
                    <button
                      type="button"
                      key={themeOption.id}
                      onClick={() => handleApplyTheme(themeOption.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left group hover:scale-105 ${
                        shop?.theme?.name === themeOption.name
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-20 h-20 rounded-lg border-2 flex items-center justify-center overflow-hidden"
                          style={{
                            background: themeOption.hasGradient 
                              ? themeOption.gradient 
                              : themeOption.primaryColor,
                            borderColor: themeOption.accentColor
                          }}
                        >
                          {themeOption.hasGradient && (
                            <div className="text-white font-bold text-2xl animate-pulse">✨</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            {themeOption.name}
                            {themeOption.hasGradient && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                Gradient
                              </span>
                            )}
                          </h4>
                          {shop?.theme?.name === themeOption.name && (
                            <span className="text-xs text-blue-600 font-medium">✓ Active Theme</span>
                          )}
                          {themeOption.animations && (
                            <span className="text-xs text-primary-600 flex items-center gap-1 mt-1">
                              ⚡ Animations
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <div
                          className="w-10 h-6 rounded border"
                          style={{ backgroundColor: themeOption.primaryColor }}
                          title="Primary"
                        ></div>
                        <div
                          className="w-10 h-6 rounded border"
                          style={{ backgroundColor: themeOption.accentColor }}
                          title="Accent"
                        ></div>
                        <div
                          className="w-10 h-6 rounded border"
                          style={{ backgroundColor: themeOption.backgroundColor }}
                          title="Background"
                        ></div>
                        <div
                          className="w-10 h-6 rounded border"
                          style={{ backgroundColor: themeOption.textColor }}
                          title="Text"
                        ></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Premium Plan - Full Customization */}
            {user?.plan === 'premium' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 rounded">
                  <p className="text-sm text-purple-800">
                    <strong className="flex items-center gap-2">
                      <FaCrown className="text-yellow-500" />
                      Premium Plan:
                    </strong> 
                    Unlimited customization! Use preset themes, create custom colors, add gradients, custom CSS, animations, and more!
                  </p>
                </div>

                {/* Preset Themes */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    ⚡ Quick Presets (10 Professional Themes)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {availableThemes.map((themeOption) => (
                      <button
                        type="button"
                        key={themeOption.id}
                        onClick={() => handleApplyTheme(themeOption.id)}
                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                          shop?.theme?.name === themeOption.name
                            ? 'border-purple-500 bg-purple-50 shadow-lg'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div
                          className="w-full h-16 rounded mb-2 border-2 flex items-center justify-center overflow-hidden"
                          style={{
                            background: themeOption.hasGradient 
                              ? themeOption.gradient 
                              : themeOption.primaryColor,
                            borderColor: themeOption.accentColor
                          }}
                        >
                          {themeOption.hasGradient && (
                            <div className="text-white font-bold text-xl">✨</div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-900 text-center">
                          {themeOption.name}
                        </p>
                        {shop?.theme?.name === themeOption.name && (
                          <p className="text-xs text-purple-600 text-center">✓ Active</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Custom Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Primary Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPrimaryPicker(!showPrimaryPicker);
                            setShowAccentPicker(false);
                          }}
                          className="w-full h-12 rounded-lg border-2 border-gray-300 flex items-center justify-between px-4 hover:border-gray-400"
                          style={{ backgroundColor: theme.primaryColor }}
                        >
                          <span className="text-white font-medium drop-shadow-md">
                            {theme.primaryColor}
                          </span>
                        </button>
                        {showPrimaryPicker && (
                          <div className="absolute z-10 mt-2">
                            <div
                              className="fixed inset-0"
                              onClick={() => setShowPrimaryPicker(false)}
                            />
                            <div className="relative bg-white p-3 rounded-lg shadow-xl border">
                              <HexColorPicker
                                color={theme.primaryColor}
                                onChange={(color) => handleThemeChange('primaryColor', color)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Accent Color
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAccentPicker(!showAccentPicker);
                            setShowPrimaryPicker(false);
                          }}
                          className="w-full h-12 rounded-lg border-2 border-gray-300 flex items-center justify-between px-4 hover:border-gray-400"
                          style={{ backgroundColor: theme.accentColor }}
                        >
                          <span className="text-white font-medium drop-shadow-md">
                            {theme.accentColor}
                          </span>
                        </button>
                        {showAccentPicker && (
                          <div className="absolute z-10 mt-2">
                            <div
                              className="fixed inset-0"
                              onClick={() => setShowAccentPicker(false)}
                            />
                            <div className="relative bg-white p-3 rounded-lg shadow-xl border">
                              <HexColorPicker
                                color={theme.accentColor}
                                onChange={(color) => handleThemeChange('accentColor', color)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Layout, Font, Preview - Pro & Premium (Premium gets full color control) */}
            {(user?.plan === 'pro' || user?.plan === 'premium') && (
              <div className="space-y-6 mt-6">
              {/* Layout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Shop Layout
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {layouts.map(layout => (
                    <button
                      key={layout.value}
                      type="button"
                      onClick={() => handleLayoutSelect(layout.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        theme.layout === layout.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{layout.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{layout.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={theme.fontFamily}
                  onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
                  className="input"
                >
                  {fonts.map(font => (
                    <option key={font.value} value={font.value} className={font.class}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme Preview
                </label>
                <div 
                  className="border-2 border-gray-200 rounded-lg p-6"
                  style={{
                    backgroundColor: '#ffffff',
                    fontFamily: theme.fontFamily
                  }}
                >
                  <div 
                    className="inline-block px-4 py-2 rounded-lg text-white font-medium mb-3"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    Primary Button
                  </div>
                  <div 
                    className="inline-block px-4 py-2 rounded-lg text-white font-medium ml-2"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    Accent Button
                  </div>
                  <p className="mt-3 text-gray-700">
                    This is how your shop will look with the selected theme.
                  </p>
                </div>
              </div>
              </div>
            )}
          </div>

          {/* Subdomain feature removed: shops now use wazhop.ng/<slug> or custom domains only */}

          {/* Custom Domain (Premium only) */}
          {user?.plan === 'premium' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FaGlobe className="text-purple-500" />
                  Custom Domain
                  <span className="text-sm bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <FaCrown className="text-yellow-500" /> Premium
                  </span>
                </h2>
              </div>
              
              <div className="space-y-4">
                {!shop?.customDomain ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Your Domain
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                        className="input flex-1 min-w-[250px]"
                        placeholder="myshop.com"
                      />
                      <TouchButton
                        type="button"
                        onClick={handleSetCustomDomain}
                        variant="primary"
                        size="sm"
                        disabled={saving || !customDomain}
                        loading={saving}
                      >
                        Add Domain
                      </TouchButton>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      You must own this domain. Purchase domains from registrars like GoDaddy, Namecheap, Google Domains, etc.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Current Domain
                        </label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {shop.customDomain}
                        </p>
                        <p className={`text-sm mt-1 ${domainVerified ? 'text-primary-600' : 'text-primary-600'}`}>
                          {domainVerified ? '✓ Verified' : '⚠ Pending Verification'}
                        </p>
                      </div>
                      <TouchButton
                        type="button"
                        onClick={handleRemoveDomain}
                        variant="secondary"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        disabled={saving}
                      >
                        Remove Domain
                      </TouchButton>
                    </div>

                    {!domainVerified && domainVerificationToken && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                        <h3 className="font-semibold text-blue-900">DNS Configuration Required</h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="font-medium text-blue-800">Step 1: Add A Record</p>
                            <div className="bg-white p-2 rounded mt-1 font-mono text-xs">
                              Type: A<br />
                              Name: @ (or your domain)<br />
                              Value: 192.168.70.58 (your server IP)
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-blue-800">Step 2: Add TXT Record</p>
                            <div className="bg-white p-2 rounded mt-1 font-mono text-xs break-all">
                              Type: TXT<br />
                              Name: _washop-verify<br />
                              Value: {domainVerificationToken}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-blue-800">Step 3: Verify DNS</p>
                            <p className="text-gray-700">
                              After configuring DNS (may take up to 48 hours to propagate), click verify:
                            </p>
                            <TouchButton
                              type="button"
                              onClick={handleVerifyDomain}
                              variant="primary"
                              size="sm"
                              disabled={verifyingDomain}
                              loading={verifyingDomain}
                              className="mt-2"
                            >
                              Verify Domain
                            </TouchButton>
                          </div>
                        </div>
                      </div>
                    )}

                    {domainVerified && (
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <p className="text-sm text-primary-800">
                          ✓ Your shop is accessible at:{' '}
                          <a 
                            href={`https://${shop.customDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline"
                          >
                            {shop.customDomain}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Links */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaGlobe className="text-primary-500" />
              Social Media Links
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaInstagram className="inline text-pink-500 mr-2" />
                  Instagram
                </label>
                <input
                  type="text"
                  value={socialLinks.instagram}
                  onChange={(e) => handleSocialChange('instagram', e.target.value)}
                  className="input"
                  placeholder="https://instagram.com/yourshop"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaFacebook className="inline text-blue-600 mr-2" />
                  Facebook
                </label>
                <input
                  type="text"
                  value={socialLinks.facebook}
                  onChange={(e) => handleSocialChange('facebook', e.target.value)}
                  className="input"
                  placeholder="https://facebook.com/yourshop"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaTwitter className="inline text-blue-400 mr-2" />
                  Twitter
                </label>
                <input
                  type="text"
                  value={socialLinks.twitter}
                  onChange={(e) => handleSocialChange('twitter', e.target.value)}
                  className="input"
                  placeholder="https://twitter.com/yourshop"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaTiktok className="inline text-black mr-2" />
                  TikTok
                </label>
                <input
                  type="text"
                  value={socialLinks.tiktok}
                  onChange={(e) => handleSocialChange('tiktok', e.target.value)}
                  className="input"
                  placeholder="https://tiktok.com/@yourshop"
                />
              </div>
            </div>
          </div>

          {/* Payment Integration (Premium only) */}
          <PaymentSettings 
            shop={shop} 
            onUpdate={handleUpdate}
            isPremium={user?.plan === 'premium'}
          />

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <TouchButton
              type="button"
              onClick={fetchShop}
              variant="secondary"
              size="md"
              disabled={saving}
            >
              Reset
            </TouchButton>
            <TouchButton
              type="submit"
              variant="primary"
              size="md"
              disabled={saving || slugError || slugChecking}
              loading={saving}
            >
              Save Settings
            </TouchButton>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ShopSettings;
