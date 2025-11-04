import { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isValidating, setIsValidating] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('wazhop_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
        // Validate cart items in the background
        validateCartItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Validate cart items against the database
  const validateCartItems = async (items) => {
    if (!items || items.length === 0) return;
    
    setIsValidating(true);
    try {
      const invalidItems = [];
      
      // Check each item to see if product and shop still exist
      for (const item of items) {
        try {
          // Try to fetch the shop to verify it exists
          await api.get(`/shops/${item.shop.slug}`);
          // If shop exists, product validation is handled by the shop endpoint
        } catch (error) {
          if (error.response?.status === 404) {
            console.log(`🗑️ Removing invalid cart item: ${item.product.name} (shop or product no longer exists)`);
            invalidItems.push(item);
          }
        }
      }

      // Remove invalid items from cart
      if (invalidItems.length > 0) {
        const validItems = items.filter(
          item => !invalidItems.some(
            invalid => invalid.product._id === item.product._id && 
                      JSON.stringify(invalid.variant) === JSON.stringify(item.variant)
          )
        );
        
        setCartItems(validItems);
        
        if (invalidItems.length === items.length) {
          toast.error('Cart cleared: All items no longer exist');
        } else {
          toast.error(`Removed ${invalidItems.length} unavailable item${invalidItems.length > 1 ? 's' : ''} from cart`);
        }
      }
    } catch (error) {
      console.error('Error validating cart:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wazhop_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, shop, quantity = 1, variant = null) => {
    // Check if product is already in cart
    const existingItemIndex = cartItems.findIndex(
      item => item.product._id === product._id && 
               JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newCartItems = [...cartItems];
      newCartItems[existingItemIndex].quantity += quantity;
      setCartItems(newCartItems);
      toast.success('Cart updated!');
    } else {
      // Add new item
      setCartItems([
        ...cartItems,
        {
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            inStock: product.inStock,
            stock: product.stock
          },
          shop: {
            _id: shop._id,
            shopName: shop.shopName,
            slug: shop.slug,
            owner: shop.owner
          },
          quantity,
          variant,
          addedAt: new Date().toISOString()
        }
      ]);
      toast.success('Added to cart!');
    }
  };

  const removeFromCart = (productId, variant = null) => {
    setCartItems(
      cartItems.filter(
        item => !(item.product._id === productId && 
                  JSON.stringify(item.variant) === JSON.stringify(variant))
      )
    );
    toast.success('Removed from cart');
  };

  const updateQuantity = (productId, variant, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }

    const newCartItems = cartItems.map(item => {
      if (item.product._id === productId && 
          JSON.stringify(item.variant) === JSON.stringify(variant)) {
        return { ...item, quantity };
      }
      return item;
    });
    setCartItems(newCartItems);
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success('Cart cleared');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.variant?.price || item.product.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Group items by shop for WhatsApp checkout
  const getItemsByShop = () => {
    const itemsByShop = {};
    cartItems.forEach(item => {
      const shopId = item.shop._id;
      if (!itemsByShop[shopId]) {
        itemsByShop[shopId] = {
          shop: item.shop,
          items: []
        };
      }
      itemsByShop[shopId].items.push(item);
    });
    return Object.values(itemsByShop);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getItemsByShop
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
