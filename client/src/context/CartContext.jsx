import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CartContext } from './CartContextDefinition';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('washop_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('washop_cart', JSON.stringify(cartItems));
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
