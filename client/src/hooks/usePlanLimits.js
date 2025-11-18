import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to check user plan limits and feature access
 * @returns {Object} Plan limits and feature access helpers
 */
export const usePlanLimits = () => {
  const { user } = useAuth();

  const plan = user?.plan || 'free';

  // Plan hierarchy for comparisons
  const planLevels = { free: 0, pro: 1, premium: 2 };
  const currentLevel = planLevels[plan];

  // Feature access based on plan
  const features = {
    // Products
    maxProducts: plan === 'free' ? 5 : plan === 'pro' ? 100 : Infinity,
    
    // Shops
    maxShops: plan === 'free' ? 1 : plan === 'pro' ? 2 : 3,
    
    // Storage
    hasStorage: plan !== 'free',
    maxStorage: plan === 'free' ? 0 : plan === 'pro' ? 65 * 1024 * 1024 * 1024 : 1024 * 1024 * 1024 * 1024,
    
    // Themes
    canCustomizeTheme: plan !== 'free',
    maxThemes: plan === 'free' ? 1 : plan === 'pro' ? 10 : Infinity,
    canUsePresetThemes: plan !== 'free',
    canUseCustomColors: plan === 'premium',
    
    // Visual features
    canUseGradients: plan !== 'free',
    canUseAnimations: plan !== 'free',
    canUseCustomCSS: plan === 'premium',
    
    // Analytics
    hasAnalytics: plan !== 'free',
    hasAdvancedAnalytics: plan === 'pro' || plan === 'premium',
    
    // Domain
    canUseCustomDomain: plan === 'premium',
    
    // Branding
    canRemoveBranding: plan !== 'free',
    hasWatermark: plan === 'free',
    
    // Templates
    canUseBasicTemplates: true, // All plans
    canUseProTemplates: plan !== 'free',
    canUsePremiumTemplates: plan === 'premium',
    
    // Support
    hasPrioritySupport: plan !== 'free',
    hasDedicatedManager: plan === 'premium'
  };

  /**
   * Check if user has access to a specific feature
   * @param {string} featureName - Name of the feature to check
   * @returns {boolean} Whether user has access
   */
  const hasFeature = (featureName) => {
    return features[featureName] || false;
  };

  /**
   * Check if user can upgrade to a specific plan
   * @param {string} targetPlan - Plan to check upgrade eligibility
   * @returns {boolean} Whether user can upgrade
   */
  const canUpgradeTo = (targetPlan) => {
    return planLevels[targetPlan] > currentLevel;
  };

  /**
   * Get the required plan for a feature
   * @param {string} feature - Feature name
   * @returns {string} Required plan level
   */
  const getRequiredPlan = (feature) => {
    const featureRequirements = {
      storage: 'pro',
      customTheme: 'pro',
      presetThemes: 'pro',
      gradients: 'pro',
      animations: 'pro',
      analytics: 'pro',
      customColors: 'premium',
      customCSS: 'premium',
      customDomain: 'premium',
      premiumTemplates: 'premium',
      removeBranding: 'pro'
    };

    return featureRequirements[feature] || 'premium';
  };

  /**
   * Get upgrade message for a locked feature
   * @param {string} feature - Feature name
   * @returns {string} Upgrade message
   */
  const getUpgradeMessage = (feature) => {
    const requiredPlan = getRequiredPlan(feature);
    const messages = {
      storage: 'Upgrade to Pro or Premium to upload images',
      customTheme: 'Upgrade to Pro for preset themes or Premium for unlimited customization',
      presetThemes: 'Upgrade to Pro for 10 professional themes',
      gradients: 'Upgrade to Pro for gradient themes',
      animations: 'Upgrade to Pro for smooth animations',
      analytics: 'Upgrade to Pro for analytics dashboard',
      customColors: 'Upgrade to Premium for unlimited color customization',
      customCSS: 'Upgrade to Premium for custom CSS',
      customDomain: 'Upgrade to Premium for custom domain',
      premiumTemplates: 'Upgrade to Premium for exclusive templates',
      removeBranding: 'Upgrade to Pro or Premium to remove WaZhop branding'
    };

    return messages[feature] || `Upgrade to ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} to access this feature`;
  };

  return {
    plan,
    currentLevel,
    features,
    hasFeature,
    canUpgradeTo,
    getRequiredPlan,
    getUpgradeMessage,
    isPremium: plan === 'premium',
    isPro: plan === 'pro',
    isFree: plan === 'free'
  };
};

export default usePlanLimits;
