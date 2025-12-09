import { IoLogoWhatsapp } from 'react-icons/io5';
import { FiEye } from 'react-icons/fi';
import LazyImage from './LazyImage';
import PriceTag from './PriceTag';
import { formatWhatsAppNumber } from '../utils/helpers';
import { formatPrice } from '../utils/currency';

const PremiumProductCard = ({ product, shop, template, onQuickView }) => {
  const settings = template?.settings || {};
  const { productCards, colors } = settings;

  const getDiscountPercentage = () => {
    if (product.comparePrice && product.comparePrice > product.price) {
      return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
    }
    return 0;
  };

  const handleNegotiateOnWhatsApp = () => {
    const phoneNumber = formatWhatsAppNumber(shop.owner?.whatsapp || shop.socialLinks?.whatsapp);
    if (!phoneNumber) {
      console.warn('WhatsApp number not available for shop negotiation.');
      return;
    }
    const message = encodeURIComponent(
      `Hi ${shop.shopName}, I'm interested in your ${product.name}. Can we discuss the price?`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const getCardStyle = () => {
    const styles = {
      rounded: 'rounded-xl',
      square: 'rounded-none',
      elevated: 'rounded-2xl'
    };
    return styles[productCards?.style] || styles.rounded;
  };

  const getShadowClass = () => {
    const shadows = {
      small: 'shadow-sm hover:shadow-md',
      medium: 'shadow-md hover:shadow-lg',
      large: 'shadow-lg hover:shadow-xl',
      xl: 'shadow-xl hover:shadow-2xl',
      glow: `shadow-lg hover:shadow-[0_0_30px_rgba(${hexToRgb(productCards?.glowColor || colors?.primary)},0.5)]`
    };
    return shadows[productCards?.shadow] || shadows.medium;
  };

  const getHoverEffect = () => {
    const effects = {
      lift: 'hover:-translate-y-2',
      scale: 'hover:scale-105',
      glow: 'hover:ring-2 hover:ring-opacity-50',
      'lift-scale': 'hover:-translate-y-2 hover:scale-105',
      float: 'hover:-translate-y-3 hover:shadow-2xl'
    };
    return effects[productCards?.hoverEffect] || effects.lift;
  };

  const getImageRatio = () => {
    const ratios = {
      '1:1': 'aspect-square',
      '4:3': 'aspect-[4/3]',
      '16:9': 'aspect-video',
      mixed: 'aspect-square' // Default for masonry
    };
    return ratios[productCards?.imageRatio] || ratios['1:1'];
  };

  const discountPercent = getDiscountPercentage();

  return (
    <div
      className={`
        ${getCardStyle()} 
        ${getShadowClass()} 
        ${getHoverEffect()}
        overflow-hidden 
        transition-all 
        duration-300 
        group
        ${productCards?.premiumBorder ? 'border-2' : ''}
      `}
      style={{
        backgroundColor: colors?.cardBackground || '#ffffff',
        borderColor: productCards?.premiumBorder ? colors?.primary : 'transparent'
      }}
    >
      {/* Product Image */}
      <div className={`relative ${getImageRatio()} overflow-hidden`}>
        <LazyImage
          src={product.images?.[0] || '/placeholder-product.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-white font-bold text-sm shadow-lg"
            style={{ backgroundColor: colors?.accent || '#FFD700' }}
          >
            -{discountPercent}%
          </div>
        )}

        {/* Stock Badge */}
        {product.stock === 0 && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
            Out of Stock
          </div>
        )}

        {/* Quick View Button */
        {productCards?.showQuickView && onQuickView && (
          <button
            onClick={() => onQuickView(product)}
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-full text-gray-900 font-semibold hover:scale-110 transition-transform">
              <FiEye className="text-xl" />
              <span>Quick View</span>
            </div>
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Product Name */}
        <h3 className="font-semibold text-lg line-clamp-2" style={{ color: colors?.text }}>
          {product.name}
        </h3>

        {/* Short Description */}
        {product.description && (
          <p className="text-sm line-clamp-2 opacity-75" style={{ color: colors?.text }}>
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <PriceTag
            price={product.price}
            currency={product?.currency || shop?.paymentSettings?.currency}
            priceUSD={product?.priceUSD}
            layout="inline"
            primaryClassName="text-2xl font-bold"
            primaryStyle={{ color: colors?.primary }}
            convertedClassName="text-xs text-gray-500 dark:text-gray-400"
          />
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-sm line-through opacity-50" style={{ color: colors?.text }}>
              {formatPrice(product.comparePrice, product?.currency || shop?.paymentSettings?.currency || 'NGN')}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {/* Negotiate on WhatsApp Button */}
          {productCards?.showNegotiateButton && (
            <button
              onClick={handleNegotiateOnWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all hover:scale-105 shadow-md"
              style={{
                backgroundColor: colors?.primary,
                color: colors?.buttonText
              }}
              disabled={product.stock === 0}
            >
              <IoLogoWhatsapp className="text-xl" />
              <span>Negotiate</span>
            </button>
          )}
        </div>

        {/* Category Tag */}
        {product.category && (
          <div className="pt-2">
            <span
              className="inline-block px-3 py-1 text-xs rounded-full"
              style={{
                backgroundColor: `${colors?.primary}20`,
                color: colors?.primary
              }}
            >
              {product.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to convert hex to RGB
const hexToRgb = (hex) => {
  if (!hex) return '102, 126, 234';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '102, 126, 234';
};

export default PremiumProductCard;
