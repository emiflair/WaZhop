const nlp = require('compromise');

/**
 * Content Moderation System
 * Detects harmful, dangerous, or inappropriate content in text
 */

// We'll use a simple profanity list instead of bad-words package
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'bastard', 'crap',
  'piss', 'dick', 'cock', 'pussy', 'slut', 'whore', 'fag'
];

// Simple profanity filter
const filter = {
  isProfane: (text) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return PROFANITY_LIST.some((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerText);
    });
  },
  clean: (text) => {
    if (!text) return text;
    let cleaned = text;
    PROFANITY_LIST.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '*'.repeat(word.length));
    });
    return cleaned;
  }
};

// Extended list of harmful categories and keywords
const HARMFUL_CATEGORIES = {
  weapons: [
    'gun', 'guns', 'rifle', 'pistol', 'firearm', 'ammunition', 'ammo', 'bullet', 'bullets',
    'explosive', 'explosives', 'bomb', 'grenade', 'weapon', 'weapons', 'knife', 'knives',
    'sword', 'dagger', 'machete', 'ak-47', 'ak47', 'ar-15', 'ar15', 'shotgun'
  ],
  drugs: [
    'cocaine', 'heroin', 'meth', 'methamphetamine', 'ecstasy', 'mdma', 'lsd', 'marijuana',
    'cannabis', 'weed', 'molly', 'crack', 'opium', 'fentanyl', 'oxycontin', 'xanax',
    'adderall', 'prescription pills', 'drug dealer', 'narcotic', 'narcotics'
  ],
  violence: [
    'kill', 'murder', 'assault', 'terrorist', 'terrorism', 'suicide bomber', 'hitman',
    'assassin', 'torture', 'kidnap', 'kidnapping', 'human trafficking', 'child abuse',
    'rape', 'sexual assault'
  ],
  illegal: [
    'stolen', 'counterfeit', 'fake id', 'fraud', 'scam', 'money laundering', 'pirated',
    'hacked', 'cracked', 'illegal', 'black market', 'smuggle', 'smuggling', 'forged'
  ],
  adult: [
    'porn', 'pornography', 'xxx', 'adult content', 'sex toy', 'sex toys', 'escort',
    'prostitution', 'sexual services', 'strip club', 'brothel'
  ],
  harmful: [
    'poison', 'toxic', 'hazardous', 'radioactive', 'asbestos', 'cyanide', 'arsenic',
    'anthrax', 'biohazard', 'chemical weapon'
  ],
  discriminatory: [
    'hate speech', 'racist', 'racism', 'white supremacy', 'nazi', 'kkk', 'genocide',
    'ethnic cleansing', 'homophobic', 'transphobic', 'xenophobic'
  ],
  dangerous: [
    'suicide kit', 'self harm', 'how to make bomb', 'how to kill', 'drug recipe',
    'dangerous chemical', 'lethal dose'
  ]
};

// Compile all harmful keywords
const ALL_HARMFUL_KEYWORDS = Object.values(HARMFUL_CATEGORIES).flat();

/**
 * Check if text contains profanity
 * @param {string} text - Text to check
 * @returns {boolean} - True if profanity detected
 */
function containsProfanity(text) {
  if (!text) return false;
  return filter.isProfane(text);
}

/**
 * Clean profanity from text
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
function cleanProfanity(text) {
  if (!text) return text;
  return filter.clean(text);
}

/**
 * Check if text contains harmful keywords
 * @param {string} text - Text to check
 * @returns {object} - { isHarmful, categories, matches }
 */
function checkHarmfulContent(text) {
  if (!text) return { isHarmful: false, categories: [], matches: [] };

  const lowerText = text.toLowerCase();
  const detectedCategories = new Set();
  const matches = [];

  // Check each category
  for (const [category, keywords] of Object.entries(HARMFUL_CATEGORIES)) {
    for (const keyword of keywords) {
      // Use word boundary regex to avoid false positives
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerText)) {
        detectedCategories.add(category);
        matches.push({ keyword, category });
      }
    }
  }

  return {
    isHarmful: detectedCategories.size > 0,
    categories: Array.from(detectedCategories),
    matches
  };
}

/**
 * Analyze text for suspicious patterns
 * @param {string} text - Text to analyze
 * @returns {object} - Analysis results
 */
function analyzeSuspiciousPatterns(text) {
  if (!text) return { suspicious: false, patterns: [] };

  const lowerText = text.toLowerCase();
  const patterns = [];

  // Check for suspicious phrases
  const suspiciousPatterns = [
    { pattern: /no questions asked/i, reason: 'Suspicious transaction language' },
    { pattern: /cash only/i, reason: 'Suspicious payment requirement' },
    { pattern: /untraceable/i, reason: 'Suspicious anonymity claim' },
    { pattern: /off the books/i, reason: 'Suspicious informal transaction' },
    { pattern: /under the table/i, reason: 'Suspicious informal transaction' },
    { pattern: /don't tell/i, reason: 'Suspicious secrecy requirement' },
    { pattern: /secret/i, reason: 'Suspicious secrecy' },
    { pattern: /discreet/i, reason: 'Suspicious discretion requirement' },
    { pattern: /replica/i, reason: 'Possible counterfeit' },
    { pattern: /authentic guarantee/i, reason: 'Possible counterfeit claim' },
    { pattern: /100% real/i, reason: 'Suspicious authenticity claim' }
  ];

  for (const { pattern, reason } of suspiciousPatterns) {
    if (pattern.test(lowerText)) {
      patterns.push(reason);
    }
  }

  return {
    suspicious: patterns.length > 0,
    patterns
  };
}

/**
 * Comprehensive content moderation check
 * @param {object} content - { name, description, tags }
 * @returns {object} - { allowed, reason, severity, details }
 */
function moderateContent(content) {
  const { name = '', description = '', tags = [] } = content;
  const fullText = `${name} ${description} ${tags.join(' ')}`;

  // 1. Check for profanity
  const hasProfanity = containsProfanity(fullText);
  if (hasProfanity) {
    return {
      allowed: false,
      reason: 'Content contains inappropriate language',
      severity: 'medium',
      details: {
        type: 'profanity',
        message: 'Please remove profane or offensive language from your product listing.'
      }
    };
  }

  // 2. Check for harmful content
  const harmfulCheck = checkHarmfulContent(fullText);
  if (harmfulCheck.isHarmful) {
    return {
      allowed: false,
      reason: 'Content contains prohibited items or harmful keywords',
      severity: 'high',
      details: {
        type: 'harmful_content',
        categories: harmfulCheck.categories,
        matches: harmfulCheck.matches.slice(0, 3), // Limit to first 3 matches
        message: `This product listing has been flagged for containing prohibited content related to: ${harmfulCheck.categories.join(', ')}. Such items cannot be sold on our platform.`
      }
    };
  }

  // 3. Check for suspicious patterns
  const suspiciousCheck = analyzeSuspiciousPatterns(fullText);
  if (suspiciousCheck.suspicious) {
    return {
      allowed: false,
      reason: 'Content contains suspicious patterns',
      severity: 'medium',
      details: {
        type: 'suspicious_pattern',
        patterns: suspiciousCheck.patterns,
        message: `Your product listing contains suspicious language: ${suspiciousCheck.patterns.join(', ')}. Please revise your description to comply with our policies.`
      }
    };
  }

  // 4. Use NLP to detect complex harmful contexts
  const doc = nlp(fullText);
  const verbs = doc.verbs().out('array');
  const dangerousVerbs = ['kill', 'harm', 'hurt', 'destroy', 'attack', 'assault'];
  const hasDangerousVerbs = verbs.some((verb) => dangerousVerbs.some((dangerous) => verb.toLowerCase().includes(dangerous)));

  if (hasDangerousVerbs) {
    return {
      allowed: false,
      reason: 'Content describes potentially dangerous or harmful actions',
      severity: 'high',
      details: {
        type: 'dangerous_context',
        message: 'Your product description contains language that suggests dangerous or harmful use. Please revise the description.'
      }
    };
  }

  // Content is safe
  return {
    allowed: true,
    reason: 'Content passed moderation checks',
    severity: 'none',
    details: null
  };
}

/**
 * Check if a URL is safe
 * @param {string} url - URL to check
 * @returns {boolean} - True if URL is safe
 */
function isSafeUrl(url) {
  if (!url) return true;

  const lowerUrl = url.toLowerCase();
  const unsafePatterns = [
    'porn',
    'xxx',
    'adult',
    'casino',
    'gambling',
    'phishing',
    'scam'
  ];

  return !unsafePatterns.some((pattern) => lowerUrl.includes(pattern));
}

module.exports = {
  containsProfanity,
  cleanProfanity,
  checkHarmfulContent,
  analyzeSuspiciousPatterns,
  moderateContent,
  isSafeUrl,
  HARMFUL_CATEGORIES
};
