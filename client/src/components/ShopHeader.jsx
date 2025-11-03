import { FiInstagram, FiFacebook, FiTwitter } from 'react-icons/fi';
import { IoLogoWhatsapp, IoLogoTiktok } from 'react-icons/io5';
import { FaTelegram, FaCheckCircle } from 'react-icons/fa';

const ShopHeader = ({ shop, template }) => {
  const settings = template?.settings || {};
  const { header } = settings;

  const getSocialIcon = (platform) => {
    const icons = {
      instagram: FiInstagram,
      facebook: FiFacebook,
      twitter: FiTwitter,
      whatsapp: IoLogoWhatsapp,
      tiktok: IoLogoTiktok,
      telegram: FaTelegram
    };
    return icons[platform] || null;
  };

  const renderHeaderBackground = () => {
    if (header?.type === 'gradient') {
      return {
        background: `linear-gradient(${header.gradient?.direction}, ${header.gradient?.from}, ${header.gradient?.to})`
      };
    } else if (header?.type === 'banner' && shop.banner?.url) {
      return {
        backgroundImage: `url(${shop.banner.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    } else if (header?.type === 'video' && shop.videoUrl) {
      // Video background handled separately
      return {};
    } else {
      return {
        backgroundColor: header?.backgroundColor || '#667eea'
      };
    }
  };

  const getHeightClass = () => {
    const heights = {
      small: 'h-40 md:h-48',
      medium: 'h-56 md:h-64',
      large: 'h-72 md:h-96'
    };
    return heights[header?.height] || heights.medium;
  };

  const enabledSocials = shop.socialLinks?.enabled || ['whatsapp'];
  const socialPlatforms = enabledSocials.map(platform => ({
    platform,
    url: shop.socialLinks?.[platform],
    icon: getSocialIcon(platform)
  })).filter(s => s.url && s.icon);

  return (
    <div className="relative">
      {/* Video Background for Luxury Motion */}
      {header?.type === 'video' && shop.videoUrl && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={shop.videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Header Content */}
      <div
        className={`relative ${getHeightClass()} flex items-center justify-center`}
        style={renderHeaderBackground()}
      >
        {/* Overlay for banner/video types */}
        {(header?.type === 'banner' || header?.type === 'video') && header?.overlay && (
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: header.overlayOpacity || 0.3 }}
          />
        )}

        {/* Content Container */}
        <div className="relative z-10 container-custom px-4">
          <div className={`flex flex-col items-${header?.logoPosition || 'left'} space-y-4`}>
            {/* Logo/Profile Image */}
            {header?.showLogo && shop.profileImage?.url && (
              <div className="relative">
                <img
                  src={shop.profileImage.url}
                  alt={shop.shopName}
                  className={`rounded-full border-4 border-white/30 shadow-xl ${
                    header.logoSize === 'large' ? 'w-32 h-32' :
                    header.logoSize === 'small' ? 'w-16 h-16' :
                    'w-24 h-24'
                  }`}
                />
                {/* Verified Badge (Premium only) */}
                {shop.verifiedBadge && header?.showVerifiedBadge && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                    <FaCheckCircle className="text-white text-xl" />
                  </div>
                )}
              </div>
            )}

            {/* Shop Name */}
            <h1
              className={`text-3xl md:text-5xl font-bold ${header?.textAlign === 'center' ? 'text-center' : ''}`}
              style={{ color: header?.textColor || '#ffffff' }}
            >
              {shop.shopName}
            </h1>

            {/* Description */}
            {shop.description && (
              <p
                className={`text-lg md:text-xl max-w-2xl ${header?.textAlign === 'center' ? 'text-center' : ''}`}
                style={{ color: header?.textColor || '#ffffff', opacity: 0.9 }}
              >
                {shop.description}
              </p>
            )}

            {/* Location */}
            {shop.location && (
              <p
                className={`text-sm md:text-base flex items-center ${header?.textAlign === 'center' ? 'justify-center' : ''}`}
                style={{ color: header?.textColor || '#ffffff', opacity: 0.8 }}
              >
                📍 {shop.location}
              </p>
            )}

            {/* Social Buttons */}
            {socialPlatforms.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {socialPlatforms.map(({ platform, url, icon: Icon }) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all hover:scale-105"
                    style={{ color: header?.textColor || '#ffffff' }}
                  >
                    <Icon className="text-xl" />
                    <span className="capitalize font-medium">{platform}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopHeader;
