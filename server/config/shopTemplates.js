// Shop Template Presets for WaZhop
// These templates provide world-class UI/UX designs for seller shops

const shopTemplates = {
  // ===== TEMPLATE 1: CLASSIC GRADIENT (Free & Above) =====
  classicGradient: {
    id: 'classic-gradient',
    name: 'Classic Gradient',
    description: 'Elegant color gradient header with two-column grid layout',
    planRequired: 'free',
    preview: '/assets/templates/classic-gradient.jpg',
    settings: {
      layout: 'two-column-grid',
      header: {
        type: 'gradient',
        gradient: {
          from: '#667eea',
          to: '#764ba2',
          direction: 'to bottom right'
        },
        height: 'medium', // small, medium, large
        showLogo: true,
        logoPosition: 'left', // left, center
        logoSize: 'medium',
        showVerifiedBadge: false, // Premium only
        textAlign: 'left',
        textColor: '#ffffff'
      },
      productCards: {
        style: 'rounded', // rounded, square, elevated
        shadow: 'medium',
        hoverEffect: 'lift', // lift, scale, glow
        imageRatio: '1:1', // 1:1, 4:3, 16:9
        showQuickView: true,
        showNegotiateButton: true
      },
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#FFD700',
        background: '#ffffff',
        text: '#1a202c',
        cardBackground: '#ffffff',
        buttonText: '#ffffff'
      },
      typography: {
        font: 'Inter',
        headingWeight: '700',
        bodyWeight: '400'
      },
      spacing: {
        gridGap: '1.5rem',
        sectionPadding: '3rem'
      },
      animations: {
        enabled: false,
        cardHover: 'lift',
        scrollReveal: false
      }
    }
  },

  // ===== TEMPLATE 2: MINIMAL WHITE (Free & Above) =====
  minimalWhite: {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Clean white background with shadow cards - perfect for clothing/cosmetics',
    planRequired: 'free',
    preview: '/assets/templates/minimal-white.jpg',
    settings: {
      layout: 'three-column-grid',
      header: {
        type: 'solid',
        backgroundColor: '#ffffff',
        height: 'small',
        showLogo: true,
        logoPosition: 'center',
        logoSize: 'large',
        showVerifiedBadge: false,
        textAlign: 'center',
        textColor: '#1a202c',
        borderBottom: true
      },
      productCards: {
        style: 'elevated',
        shadow: 'large',
        hoverEffect: 'scale',
        imageRatio: '4:3',
        showQuickView: true,
        showNegotiateButton: true
      },
      colors: {
        primary: '#1a202c',
        secondary: '#718096',
        accent: '#4299e1',
        background: '#f7fafc',
        text: '#1a202c',
        cardBackground: '#ffffff',
        buttonText: '#ffffff'
      },
      typography: {
        font: 'Poppins',
        headingWeight: '600',
        bodyWeight: '400'
      },
      spacing: {
        gridGap: '2rem',
        sectionPadding: '2.5rem'
      },
      animations: {
        enabled: false,
        cardHover: 'scale',
        scrollReveal: false
      }
    }
  },

  // ===== TEMPLATE 3: MODERN DARK (Pro & Above) =====
  modernDark: {
    id: 'modern-dark',
    name: 'Modern Dark',
    description: 'Dark mode layout with glowing buttons - great for tech/gadgets',
    planRequired: 'pro',
    preview: '/assets/templates/modern-dark.jpg',
    settings: {
      layout: 'two-column-grid',
      header: {
        type: 'gradient',
        gradient: {
          from: '#1a202c',
          to: '#2d3748',
          direction: 'to bottom'
        },
        height: 'medium',
        showLogo: true,
        logoPosition: 'left',
        logoSize: 'medium',
        showVerifiedBadge: true, // Pro+
        textAlign: 'left',
        textColor: '#ffffff'
      },
      productCards: {
        style: 'rounded',
        shadow: 'glow',
        hoverEffect: 'glow',
        imageRatio: '1:1',
        showQuickView: true,
        showNegotiateButton: true,
        glowColor: '#4299e1'
      },
      colors: {
        primary: '#4299e1',
        secondary: '#63b3ed',
        accent: '#f6ad55',
        background: '#1a202c',
        text: '#e2e8f0',
        cardBackground: '#2d3748',
        buttonText: '#1a202c'
      },
      typography: {
        font: 'Inter',
        headingWeight: '700',
        bodyWeight: '400'
      },
      spacing: {
        gridGap: '2rem',
        sectionPadding: '3rem'
      },
      animations: {
        enabled: true,
        cardHover: 'glow',
        scrollReveal: true
      }
    }
  },

  // ===== TEMPLATE 4: LIFESTYLE BANNER (Premium) =====
  lifestyleBanner: {
    id: 'lifestyle-banner',
    name: 'Lifestyle Banner',
    description: 'Full-width hero banner with horizontal scroll - stunning visual impact',
    planRequired: 'premium',
    preview: '/assets/templates/lifestyle-banner.jpg',
    settings: {
      layout: 'horizontal-scroll',
      header: {
        type: 'banner',
        bannerImage: null, // User uploads custom banner
        height: 'large',
        overlay: true,
        overlayOpacity: 0.3,
        showLogo: true,
        logoPosition: 'center',
        logoSize: 'large',
        showVerifiedBadge: true,
        textAlign: 'center',
        textColor: '#ffffff',
        parallax: true
      },
      productCards: {
        style: 'elevated',
        shadow: 'large',
        hoverEffect: 'lift-scale',
        imageRatio: '4:3',
        showQuickView: true,
        showNegotiateButton: true,
        width: '350px'
      },
      colors: {
        primary: '#e53e3e',
        secondary: '#f56565',
        accent: '#fbd38d',
        background: '#ffffff',
        text: '#1a202c',
        cardBackground: '#ffffff',
        buttonText: '#ffffff'
      },
      typography: {
        font: 'Playfair Display',
        headingWeight: '700',
        bodyWeight: '400'
      },
      spacing: {
        gridGap: '1.5rem',
        sectionPadding: '4rem'
      },
      animations: {
        enabled: true,
        cardHover: 'lift-scale',
        scrollReveal: true,
        parallaxScroll: true
      }
    }
  },

  // ===== TEMPLATE 5: LUXURY MOTION (Premium) =====
  luxuryMotion: {
    id: 'luxury-motion',
    name: 'Luxury Motion',
    description: 'Video/motion background with premium transitions - ultimate sophistication',
    planRequired: 'premium',
    preview: '/assets/templates/luxury-motion.jpg',
    settings: {
      layout: 'masonry-grid',
      header: {
        type: 'video',
        videoUrl: null, // User uploads or provides URL
        fallbackGradient: {
          from: '#000000',
          to: '#434343',
          direction: 'to bottom right'
        },
        height: 'large',
        overlay: true,
        overlayOpacity: 0.5,
        showLogo: true,
        logoPosition: 'center',
        logoSize: 'large',
        showVerifiedBadge: true,
        textAlign: 'center',
        textColor: '#ffffff',
        motionGradient: true
      },
      productCards: {
        style: 'rounded',
        shadow: 'xl',
        hoverEffect: 'float',
        imageRatio: 'mixed', // Masonry layout
        showQuickView: true,
        showNegotiateButton: true,
        premiumBorder: true
      },
      colors: {
        primary: '#d4af37', // Gold
        secondary: '#f7dc6f',
        accent: '#ffffff',
        background: '#0f0f0f',
        text: '#f5f5f5',
        cardBackground: '#1a1a1a',
        buttonText: '#0f0f0f'
      },
      typography: {
        font: 'Cormorant Garamond',
        headingWeight: '600',
        bodyWeight: '400'
      },
      spacing: {
        gridGap: '2rem',
        sectionPadding: '5rem'
      },
      animations: {
        enabled: true,
        cardHover: 'float',
        scrollReveal: true,
        parallaxScroll: true,
        motionBackground: true,
        transitionSpeed: 'smooth'
      }
    }
  }
};

// Get templates available for a specific plan
const getTemplatesForPlan = (plan) => {
  const planHierarchy = {
    free: ['free'],
    pro: ['free', 'pro'],
    premium: ['free', 'pro', 'premium']
  };

  const allowedPlans = planHierarchy[plan] || ['free'];

  return Object.values(shopTemplates).filter((template) => allowedPlans.includes(template.planRequired));
};

// Get template by ID
const getTemplateById = (templateId) => Object.values(shopTemplates).find((t) => t.id === templateId);

// Default template for new shops
const getDefaultTemplate = () => shopTemplates.classicGradient;

module.exports = {
  shopTemplates,
  getTemplatesForPlan,
  getTemplateById,
  getDefaultTemplate
};
