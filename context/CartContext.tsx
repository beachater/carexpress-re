import React, { createContext, useContext, useState } from 'react';

type CartItem = {
  name: string;
  price: number;
  quantity: number;
  pharmacy_id: string;
  pharmacy_name: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (name: string, amount: number) => void;
  removeItem: (name: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart(prev =>
      prev.some(p => p.name === item.name)
        ? prev
        : [...prev, { ...item, quantity: 1 }]
    );
  };

  const updateQuantity = (name: string, amount: number) => {
    setCart(prev =>
      prev.map(item =>
        item.name === name
          ? { ...item, quantity: Math.max(1, item.quantity + amount) }
          : item
      )
    );
  };

  const removeItem = (name: string) => {
    setCart(prev => prev.filter(item => item.name !== name));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeItem }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
