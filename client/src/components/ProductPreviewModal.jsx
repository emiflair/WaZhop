import { useState } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import PriceTag from './PriceTag';
import { formatPrice } from '../utils/currency';

/**
 * Lightweight product preview modal for dashboard
 * Props:
 * - product: product object with images, name, price, comparePrice, description, tags, inStock
 * - onClose: function to close the modal
 */
const ProductPreviewModal = ({ product, onClose }) => {
  const [index, setIndex] = useState(0);
  const images = product?.images || [];
  const currency = product?.currency || 'NGN';

  const hasImages = images.length > 0;

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  return (
  <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white rounded-full p-2 shadow hover:bg-gray-100"
          aria-label="Close"
        >
          <FiX size={22} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Image gallery */}
          <div>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-3" style={{ height: 360 }}>
              {hasImages ? (
                <img
                  src={images[index].url}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiImage size={64} className="text-gray-300" />
                </div>
              )}

              {hasImages && images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
                    aria-label="Previous image"
                  >
                    <FiChevronLeft size={22} />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
                    aria-label="Next image"
                  >
                    <FiChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {hasImages && images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button
                    key={img._id || i}
                    onClick={() => setIndex(i)}
                    className={`border-2 rounded-lg overflow-hidden ${i === index ? 'border-blue-500' : 'border-gray-200'}`}
                  >
                    <img src={img.url} alt="" className="w-full h-16 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>

            <div className="mb-4 flex items-baseline gap-3">
              <PriceTag
                price={product.price}
                currency={currency}
                priceUSD={product.priceUSD}
                layout="inline"
                className="flex items-baseline gap-2"
                primaryClassName="text-3xl font-bold text-gray-900"
                convertedClassName="text-sm text-gray-500 dark:text-gray-400"
              />
              {product.comparePrice && product.comparePrice > product.price && (
                <p className="text-gray-400 line-through">
                  {formatPrice(product.comparePrice, currency)}
                </p>
              )}
            </div>

            <div className="mb-4">
              <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${product.inStock ? 'bg-primary-100 text-primary-700' : 'bg-red-100 text-red-700'}`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
              <span className="ml-2 inline-block text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700 capitalize">
                {product.category}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-1">Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, i) => (
                    <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreviewModal;
