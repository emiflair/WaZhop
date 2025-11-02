// Theme presets for different plans

// Free plan - Only default theme (cannot be changed)
const FREE_THEME = {
  name: 'Clean White',
  primaryColor: '#FFFFFF',
  accentColor: '#000000',
  backgroundColor: '#F9FAFB',
  textColor: '#111827',
  layout: 'grid',
  font: 'inter',
  hasGradient: false,
  gradient: null,
  buttonStyle: 'rounded',
  cardStyle: 'shadow',
  animations: false,
  customCSS: false
};

// Pro plan - 10 professional preset themes with gradients
const PRO_THEMES = {
  cleanWhite: {
    name: 'Clean White',
    primaryColor: '#FFFFFF',
    accentColor: '#000000',
    backgroundColor: '#F9FAFB',
    textColor: '#111827',
    layout: 'grid',
    font: 'inter',
    hasGradient: false,
    gradient: null,
    buttonStyle: 'rounded',
    cardStyle: 'shadow',
    animations: true,
    customCSS: false
  },
  modernBlack: {
    name: 'Modern Black',
    primaryColor: '#000000',
    accentColor: '#3B82F6',
    backgroundColor: '#111827',
    textColor: '#FFFFFF',
    layout: 'grid',
    font: 'poppins',
    hasGradient: true,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    buttonStyle: 'rounded-full',
    cardStyle: 'elevated',
    animations: true,
    customCSS: false
  },
  professionalGrey: {
    name: 'Professional Grey',
    primaryColor: '#6B7280',
    accentColor: '#10B981',
    backgroundColor: '#F3F4F6',
    textColor: '#1F2937',
    layout: 'list',
    font: 'roboto',
    hasGradient: false,
    gradient: null,
    buttonStyle: 'square',
    cardStyle: 'border',
    animations: true,
    customCSS: false
  },
  oceanBlue: {
    name: 'Ocean Blue',
    primaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    backgroundColor: '#EFF6FF',
    textColor: '#1E3A8A',
    layout: 'grid',
    font: 'inter',
    hasGradient: true,
    gradient: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)',
    buttonStyle: 'rounded',
    cardStyle: 'shadow',
    animations: true,
    customCSS: false
  },
  elegantPurple: {
    name: 'Elegant Purple',
    primaryColor: '#7C3AED',
    accentColor: '#EC4899',
    backgroundColor: '#FAF5FF',
    textColor: '#581C87',
    layout: 'minimal',
    font: 'montserrat',
    hasGradient: true,
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    buttonStyle: 'rounded-full',
    cardStyle: 'elevated',
    animations: true,
    customCSS: false
  },
  sunsetOrange: {
    name: 'Sunset Orange',
    primaryColor: '#F97316',
    accentColor: '#DC2626',
    backgroundColor: '#FFF7ED',
    textColor: '#9A3412',
    layout: 'grid',
    font: 'poppins',
    hasGradient: true,
    gradient: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)',
    buttonStyle: 'rounded',
    cardStyle: 'shadow',
    animations: true,
    customCSS: false
  },
  emeraldGreen: {
    name: 'Emerald Green',
    primaryColor: '#059669',
    accentColor: '#FBBF24',
    backgroundColor: '#ECFDF5',
    textColor: '#064E3B',
    layout: 'masonry',
    font: 'inter',
    hasGradient: true,
    gradient: 'linear-gradient(135deg, #52c234 0%, #061700 100%)',
    buttonStyle: 'rounded',
    cardStyle: 'border',
    animations: true,
    customCSS: false
  },
  royalGold: {
    name: 'Royal Gold',
    primaryColor: '#D97706',
    accentColor: '#7C2D12',
    backgroundColor: '#FFFBEB',
    textColor: '#78350F',
    layout: 'grid',
    font: 'montserrat',
    hasGradient: true,
    gradient: 'linear-gradient(135deg, #F4D03F 0%, #16A085 100%)',
    buttonStyle: 'square',
    cardStyle: 'elevated',
    animations: true,
    customCSS: false
  },
  midnightBlue: {
    name: 'Midnight Blue',
    primaryColor: '#1E3A8A',
    accentColor: '#10B981',
    backgroundColor: '#1F2937',
    textColor: '#F3F4F6',
    layout: 'list',
    font: 'roboto',
    hasGradient: true,
    gradient: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)',
    buttonStyle: 'rounded-full',
    cardStyle: 'shadow',
    animations: true,
    customCSS: false
  },
  roseGold: {
    name: 'Rose Gold',
    primaryColor: '#BE185D',
    accentColor: '#F59E0B',
    backgroundColor: '#FDF2F8',
    textColor: '#831843',
    layout: 'minimal',
    font: 'poppins',
    hasGradient: true,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    buttonStyle: 'rounded',
    cardStyle: 'elevated',
    animations: true,
    customCSS: false
  }
};

// Premium plan features - Full customization
const PREMIUM_FEATURES = {
  unlimitedColors: true,
  customGradients: true,
  advancedAnimations: true,
  customCSS: true,
  customFonts: true,
  videoBackgrounds: true,
  parallaxEffects: true,
  customDomain: true,
  removeWatermark: true,
  prioritySupport: true,
  advancedAnalytics: true,
  seoTools: true,
  emailIntegration: true,
  multiCurrency: true,
  inventoryManagement: true
};

module.exports = {
  FREE_THEME,
  PRO_THEMES,
  PREMIUM_FEATURES
};

