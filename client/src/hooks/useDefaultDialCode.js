import { useEffect, useState } from 'react';
import { detectDialCode, getDetectedDialCode } from '../utils/ipGeolocation';
import { AFRICAN_DIAL_CODES } from '../utils/helpers';

const isSupportedDialCode = (dialCode) => {
  if (!dialCode) return false;
  const digitsOnly = dialCode.replace(/[^\d]/g, '');
  return AFRICAN_DIAL_CODES.includes(digitsOnly);
};

/**
 * Detects the user's African dial code based on IP geolocation and caches the result.
 * Returns the dial code prefixed with a plus sign (e.g., +234) when available.
 */
const useDefaultDialCode = () => {
  const [dialCode, setDialCode] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const applyDialCode = (candidate) => {
      if (!candidate || cancelled) return;
      const digitsOnly = candidate.replace(/[^\d]/g, '');
      if (!isSupportedDialCode(digitsOnly)) return;
      setDialCode(`+${digitsOnly}`);
    };

    const hydrateDialCode = async () => {
      const cached = getDetectedDialCode();
      if (cached) {
        applyDialCode(cached);
      }

      try {
        const detected = await detectDialCode();
        applyDialCode(detected);
      } catch (error) {
        console.error('Failed to detect dial code:', error);
      }
    };

    hydrateDialCode();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return dialCode;
};

export default useDefaultDialCode;
