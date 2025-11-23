import { FiX, FiShoppingCart, FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { IoLogoWhatsapp } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';

const CartSidebar = ({ isOpen, onClose, shop }) => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal, getItemsByShop } = useCart();

  const handleWhatsAppCheckout = () => {
    const itemsByShop = getItemsByShop();
    
    if (itemsByShop.length === 0) {
      toast.error('No items in cart');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    
    itemsByShop.forEach(({ shop: itemShop, items }, index) => {
      // Check if WhatsApp number exists
      const whatsappNumber = itemShop?.owner?.whatsapp?.replace(/\D/g, '');
      
      if (!whatsappNumber) {
        console.error('Missing WhatsApp for shop:', itemShop.shopName);
        errorCount++;
        toast.error(`${itemShop.shopName}: WhatsApp contact not available`);
        return;
      }

      const currency = itemShop.paymentSettings?.currency || 'NGN';
      let message = `Hello! I'd like to order the following items from ${itemShop.shopName}:\n\n`;
      
      items.forEach((item, idx) => {
        const price = item.variant?.price || item.product.price;
        message += `${idx + 1}. ${item.product.name}`;
        if (item.variant) {
          message += ` (${Object.values(item.variant).join(', ')})`;
        }
        message += ` - Qty: ${item.quantity} - ${formatPrice(price, currency)} each\n`;
      });

      const shopTotal = items.reduce((sum, item) => {
        const price = item.variant?.price || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      message += `\nTotal: ${formatPrice(shopTotal, currency)}`;

      // Use setTimeout to stagger the window opens (prevents popup blockers)
      setTimeout(() => {
        window.open(
          `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
          '_blank'
        );
      }, index * 500); // 500ms delay between each window

      successCount++;
    });

    if (successCount > 0) {
      toast.success(`Opening ${successCount} WhatsApp conversation${successCount > 1 ? 's' : ''}`);
    }

    if (errorCount === 0 && successCount > 0) {
      // Only close if all were successful
      setTimeout(() => onClose(), itemsByShop.length * 500 + 500);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
            <div className="flex items-center gap-2">
              <FiShoppingCart size={20} className="sm:w-6 sm:h-6" />
              <h2 className="text-lg sm:text-xl font-bold">Shopping Cart</h2>
            </div>
            <button onClick={onClose} className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <FiX size={22} className="text-gray-700 dark:text-gray-200" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-10">
                <FiShoppingCart size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-600 dark:text-gray-300 text-base">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group items by shop */}
                {getItemsByShop().map(({ shop: itemShop, items }, shopIdx) => (
                  <div key={shopIdx} className="space-y-3">
                    {/* Shop Header */}
                    <div className="flex items-center justify-between pb-2 border-b-2 border-primary-200 dark:border-primary-700">
                      <div className="flex items-center gap-2">
                        <FiShoppingBag className="text-primary-600 dark:text-primary-400" size={18} />
                        <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">{itemShop.shopName}</h3>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {items.length} item{items.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Shop Items */}
                    {items.map((item, idx) => {
                      const price = item.variant?.price || item.product.price;
                      const image = item.product.images?.[0]?.url;

                      return (
                        <div key={idx} className="flex gap-3 pb-3">
                          {/* Product Image */}
                          {image ? (
                            <img
                              src={image}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                              <FiShoppingCart className="text-gray-300 dark:text-gray-500" size={20} />
                            </div>
                          )}

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 line-clamp-2 text-gray-900 dark:text-gray-100">
                              {item.product.name}
                            </h4>
                            {item.variant && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                {Object.entries(item.variant).map(([key, value]) => 
                                  key !== 'price' && key !== 'stock' && key !== 'sku' ? value : null
                                ).filter(Boolean).join(', ')}
                              </p>
                            )}
                            <p className="font-bold text-base text-gray-900 dark:text-gray-100">
                              {formatPrice(price, itemShop.paymentSettings?.currency || 'NGN')}
                            </p>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => updateQuantity(item.product._id, item.variant, item.quantity - 1)}
                                className="p-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                              >
                                <FiMinus size={14} />
                              </button>
                              <span className="w-8 text-center font-medium text-gray-800 dark:text-gray-200">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product._id, item.variant, item.quantity + 1)}
                                className="p-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                disabled={item.product.stock !== null && item.quantity >= item.product.stock}
                              >
                                <FiPlus size={14} />
                              </button>
                              <button
                                onClick={() => removeFromCart(item.product._id, item.variant)}
                                className="ml-auto p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 text-gray-900 dark:text-gray-100">
              {/* Multiple shops notice */}
              {getItemsByShop().length > 1 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-2">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>📦 Multiple Shops:</strong> You&apos;ll send separate WhatsApp messages to each shop owner.
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold">
                  {formatPrice(getCartTotal(), shop?.paymentSettings?.currency || 'NGN')}
                </span>
              </div>

              {/* Check if any shop in cart has payment gateway configured */}
              {getItemsByShop().some(({ shop: itemShop }) => itemShop?.paymentSettings?.provider) ? (
                <>
                  {/* Primary Checkout Button - Only show if payment gateway is configured */}
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/checkout');
                    }}
                    className="btn btn-primary w-full flex items-center justify-center gap-2 mb-2"
                  >
                    <FiShoppingBag size={20} />
                    Proceed to Checkout
                  </button>

                  {/* WhatsApp Quick Checkout - Alternative option */}
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="btn btn-whatsapp w-full flex items-center justify-center gap-2"
                  >
                    <IoLogoWhatsapp size={20} />
                    Quick Order via WhatsApp
                  </button>
                </>
              ) : (
                <>
                  {/* No Payment Gateway - WhatsApp Only */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>💬 WhatsApp Checkout:</strong> This shop hasn&apos;t integrated a payment gateway yet. Complete your order via WhatsApp.
                    </p>
                  </div>
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="btn btn-whatsapp w-full flex items-center justify-center gap-2"
                  >
                    <IoLogoWhatsapp size={20} />
                    Order via WhatsApp
                  </button>
                </>
              )}

              <button
                onClick={clearCart}
                className="w-full py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium mt-2"
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;
