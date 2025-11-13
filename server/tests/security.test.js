const { checkPasswordStrength, sanitizeHTML, detectXSS, detectSQLInjection } = require('../utils/security');

describe('Security Utils', () => {
  describe('Password Strength Checker', () => {
    it('should mark strong passwords as strong', () => {
      const result = checkPasswordStrength('MySecure123!Pass');
      expect(result.isStrong).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should mark weak passwords as weak', () => {
      const result = checkPasswordStrength('123');
      expect(result.isStrong).toBe(false);
      expect(result.strength).toBe('weak');
    });

    it('should detect common patterns', () => {
      const result = checkPasswordStrength('password123');
      expect(result.isStrong).toBe(false);
      expect(result.feedback).toContain('Avoid common patterns');
    });

    it('should provide helpful feedback', () => {
      const result = checkPasswordStrength('short');
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });

  describe('HTML Sanitization', () => {
    it('should escape HTML special characters', () => {
      const dirty = '<script>alert("XSS")</script>';
      const clean = sanitizeHTML(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('&lt;script&gt;');
    });

    it('should escape quotes', () => {
      const dirty = 'He said "Hello" and \'Goodbye\'';
      const clean = sanitizeHTML(dirty);
      expect(clean).toContain('&quot;');
      expect(clean).toContain('&#x27;');
    });
  });

  describe('XSS Detection', () => {
    it('should detect script tags', () => {
      const malicious = '<script>alert(1)</script>';
      expect(detectXSS(malicious)).toBe(true);
    });

    it('should detect javascript protocol', () => {
      const malicious = 'javascript:alert(1)';
      expect(detectXSS(malicious)).toBe(true);
    });

    it('should detect event handlers', () => {
      const malicious = '<img onerror="alert(1)">';
      expect(detectXSS(malicious)).toBe(true);
    });

    it('should not flag clean input', () => {
      const clean = 'This is a normal string';
      expect(detectXSS(clean)).toBe(false);
    });
  });

  describe('SQL Injection Detection', () => {
    it('should detect SQL keywords', () => {
      const malicious = "' OR 1=1--";
      expect(detectSQLInjection(malicious)).toBe(true);
    });

    it('should detect UNION attacks', () => {
      const malicious = "UNION SELECT * FROM users";
      expect(detectSQLInjection(malicious)).toBe(true);
    });

    it('should not flag clean input', () => {
      const clean = 'This is a normal search query';
      expect(detectSQLInjection(clean)).toBe(false);
    });
  });
});
