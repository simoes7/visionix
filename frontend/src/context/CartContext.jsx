import { createContext, useContext, useState, useEffect } from 'react';
import { useAlert } from './AlertContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { showAlert } = useAlert();
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      const items = savedCart ? JSON.parse(savedCart) : [];
      // Auto-assign cartItemId to existing items if missing
      return items.map(item => {
        if (!item.cartItemId) {
          item.cartItemId = `${item.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`;
        }
        return item;
      });
    } catch (e) {
      console.error("Failed to load cart from localStorage:", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    const cartItemId = `${product.id}-${product.selectedColor || ''}-${product.selectedSize || ''}`;

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.cartItemId === cartItemId);
      if (existingItem) {
        return prevItems.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      }
      return [...prevItems, { ...product, cartItemId, quantity: 1 }];
    });

    showAlert(`${product.name} added to your bag.`);
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, quantity) => {
    if (quantity < 1) return;
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + Number(item.price || 0) * (item.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export default CartContext;
