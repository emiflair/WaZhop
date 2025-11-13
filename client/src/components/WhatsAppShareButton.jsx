import { useState } from 'react';
import { FaWhatsapp, FaShareAlt } from 'react-icons/fa';
import api from '../utils/api';

export default function WhatsAppShareButton({ product, shop }) {
  const [loading, setLoading] = useState(false);

  const handleShareToStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/whatsapp/share-status/${product._id}`);
      
      if (response.data.success) {
        // Try native WhatsApp Status share first
        if (window.innerWidth <= 768) {
          window.location.href = response.data.shareLink;
        } else {
          // Desktop fallback - open WhatsApp Web
          window.open(response.data.webShareLink, '_blank');
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareToChat = async () => {
    try {
      setLoading(true);
      const productUrl = `${window.location.origin}/${shop.slug}/products/${product._id}`;
      const text = encodeURIComponent(
        `Check out ${product.name}! 🛍️\n\n` +
        `${product.description.substring(0, 100)}...\n\n` +
        `₦${product.price.toLocaleString()}\n\n` +
        `${productUrl}`
      );
      
      if (window.innerWidth <= 768) {
        window.location.href = `whatsapp://send?text=${text}`;
      } else {
        window.open(`https://web.whatsapp.com/send?text=${text}`, '_blank');
      }
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Share to WhatsApp Status */}
      <button
        onClick={handleShareToStatus}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50"
      >
        <FaShareAlt className="text-lg" />
        <span className="font-medium">Share to Status</span>
      </button>

      {/* Share to WhatsApp Chat */}
      <button
        onClick={handleShareToChat}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 disabled:opacity-50"
      >
        <FaWhatsapp className="text-xl" />
        <span className="font-medium">Share</span>
      </button>
    </div>
  );
}
