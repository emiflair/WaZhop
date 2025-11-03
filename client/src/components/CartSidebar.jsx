import { FiX, FiShoppingCart, FiMinus, FiPlus, FiTrash2, FiCreditCard } from 'react-icons/fi';
import { IoLogoWhatsapp } from 'react-icons/io5';
import { useCart } from '../hooks/useCart';
import toast from 'react-hot-toast';

const CartSidebar = ({ isOpen, onClose, shop }) => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal, getItemsByShop } = useCart();

  const handleWhatsAppCheckout = () => {
    const itemsByShop = getItemsByShop();
    
    itemsByShop.forEach(({ shop, items }) => {
      let message = `Hello! I'd like to order the following items from ${shop.shopName}:\n\n`;
      
      items.forEach((item, idx) => {
        message += `${idx + 1}. ${item.product.name}`;
        if (item.variant) {
          message += ` (${Object.values(item.variant).join(', ')})`;
        }
        message += ` - Qty: ${item.quantity} - ₦${(item.variant?.price || item.product.price).toLocaleString()} each\n`;
      });

      const shopTotal = items.reduce((sum, item) => {
        const price = item.variant?.price || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      message += `\nTotal: ₦${shopTotal.toLocaleString()}`;

      const whatsappNumber = shop.owner.whatsapp.replace(/\D/g, '');
      window.open(
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
        '_blank'
      );
    });

    onClose();
  };

  const handlePaymentCheckout = () => {
    if (!shop?.paymentSettings?.provider) {
      toast.error('Payment integration not configured');
      return;
    }

    const paymentLink = shop.paymentSettings[shop.paymentSettings.provider]?.paymentLink;
    if (!paymentLink) {
      toast.error('Payment link not configured');
      return;
    }

    // Build cart summary for payment
    const itemsByShop = getItemsByShop();
    const shopItems = itemsByShop.find(item => item.shop._id === shop._id);
    
    if (!shopItems || shopItems.items.length === 0) {
      toast.error('No items from this shop in cart');
      return;
    }

    // Append cart details to payment link
    const urlWithParams = new URL(paymentLink);
    urlWithParams.searchParams.append('amount', getCartTotal());
    urlWithParams.searchParams.append('items', shopItems.items.length);
    window.open(urlWithParams.toString(), '_blank');
    
    onClose();
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
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
            <div className="flex items-center gap-2">
              <FiShoppingCart size={24} />
              <h2 className="text-xl font-bold">Shopping Cart</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <FiX size={24} className="text-gray-700 dark:text-gray-200" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <FiShoppingCart size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item, idx) => {
                  const price = item.variant?.price || item.product.price;
                  const image = item.product.images?.[0]?.url;

                  return (
                    <div key={idx} className="flex gap-3 border-b pb-4 border-gray-200 dark:border-gray-700">
                      {/* Product Image */}
                      {image ? (
                        <img
                          src={image}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                          <FiShoppingCart className="text-gray-300 dark:text-gray-500" size={24} />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-gray-900 dark:text-gray-100">
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.shop.shopName}</p>
                        {item.variant && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                            {Object.entries(item.variant).map(([key, value]) => 
                              key !== 'price' && key !== 'stock' && key !== 'sku' ? value : null
                            ).filter(Boolean).join(', ')}
                          </p>
                        )}
                        <p className="font-bold text-lg text-gray-900 dark:text-gray-100">₦{price.toLocaleString()}</p>

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
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 text-gray-900 dark:text-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold">₦{getCartTotal().toLocaleString()}</span>
              </div>

              {/* Payment Button - Show if payment provider is configured */}
              {shop?.paymentSettings?.provider && shop?.paymentSettings[shop.paymentSettings.provider]?.paymentLink && (
                <button
                  onClick={handlePaymentCheckout}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <FiCreditCard size={20} />
                  Pay Now
                </button>
              )}

              {/* WhatsApp Button - Show if payment not configured or if negotiation is allowed */}
              {(!shop?.paymentSettings?.provider || shop?.paymentSettings?.allowWhatsAppNegotiation) && (
                <button
                  onClick={handleWhatsAppCheckout}
                  className="btn btn-whatsapp w-full flex items-center justify-center gap-2"
                >
                  <IoLogoWhatsapp size={20} />
                  {shop?.paymentSettings?.provider ? 'Checkout via WhatsApp' : 'Checkout on WhatsApp'}
                </button>
              )}

              <button
                onClick={clearCart}
                className="w-full py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium"
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
