import { useEffect, useMemo, useState } from 'react';
import { detectCountryCode, getDetectedCountry } from '../utils/ipGeolocation';
import { getCountryMeta, getCountryCodeFromPhone, resolveCountryCode } from '../utils/location';

const useDetectedCountry = (phoneNumber) => {
  const cachedDetected = useMemo(() => getDetectedCountry() || null, []);
  const [detectedCode, setDetectedCode] = useState(cachedDetected);

  useEffect(() => {
    let cancelled = false;

    const runDetection = async () => {
      try {
        const countryCode = await detectCountryCode();
        if (!cancelled && countryCode) {
          setDetectedCode(countryCode);
        }
      } catch (error) {
        console.error('Country detection failed:', error);
      }
    };

    runDetection();

    return () => {
      cancelled = true;
    };
  }, []);

  const inferredFromPhone = useMemo(() => getCountryCodeFromPhone(phoneNumber), [phoneNumber]);

  const countryCode = resolveCountryCode({
    phone: phoneNumber,
    detectedCode: inferredFromPhone || detectedCode
  });

  const meta = getCountryMeta(countryCode);

  return {
    countryCode,
    countryName: meta.name,
    regionLabel: meta.regionLabel,
    regions: meta.regions,
    defaultRegion: meta.defaultRegion,
    inferredFromPhone: Boolean(inferredFromPhone),
    detectedFromIP: Boolean(!inferredFromPhone && detectedCode)
  };
};

export default useDetectedCountry;
