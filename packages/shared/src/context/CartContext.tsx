import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { CartItem } from '../types';
import { cartApi, couponsApi } from '../utils/api';
import { useAuth } from './AuthContext';

export interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  discountPercentage: number;
  appliedCouponCode: string;
  refreshCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<string | null>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  applyCouponCode: (code: string) => Promise<{ success: boolean; discount_percent?: number; error?: string }>;
  clearCouponCode: () => void;
  getCartTotal: () => number;
  getDiscountedTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    try {
      const items = await cartApi.get();
      setCartItems(items);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [user, refreshCart]);

  const addToCart = useCallback(async (productId: number, quantity: number = 1): Promise<string | null> => {
    if (!user) {
      return 'Please log in to add items to the cart';
    }
    try {
      await cartApi.add(productId, quantity);
      await refreshCart();
      return null;
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to add item to cart';
      return errMsg;
    }
  }, [user, refreshCart]);

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    if (!user) return;
    try {
      await cartApi.update(productId, quantity);
      await refreshCart();
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  }, [user, refreshCart]);

  const removeItem = useCallback(async (productId: number) => {
    if (!user) return;
    try {
      await cartApi.remove(productId);
      await refreshCart();
    } catch (err) {
      console.error('Error removing item from cart:', err);
    }
  }, [user, refreshCart]);

  const applyCouponCode = useCallback(async (code: string) => {
    if (!user) return { success: false, error: 'Please log in to apply keys' };
    try {
      const res = await couponsApi.apply(code);
      if (res && res.discount_percent !== undefined) {
        setDiscountPercentage(res.discount_percent);
        setAppliedCouponCode(res.code);
        return { success: true, discount_percent: res.discount_percent };
      }
      return { success: false, error: 'Failed to apply coupon' };
    } catch (err: any) {
      const error = err.response?.data?.error || 'Invalid or expired coupon';
      return { success: false, error };
    }
  }, [user]);

  const clearCouponCode = useCallback(() => {
    setDiscountPercentage(0);
    setAppliedCouponCode('');
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((acc, item) => {
      const price = item.sale_price !== null ? parseFloat(String(item.sale_price)) : parseFloat(String(item.price));
      return acc + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const getDiscountedTotal = useCallback(() => {
    const total = getCartTotal();
    const discount = total * (discountPercentage / 100);
    return Math.max(0, total - discount);
  }, [getCartTotal, discountPercentage]);

  const getCartCount = useCallback(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const value = useMemo(() => ({
    cartItems,
    loading,
    discountPercentage,
    appliedCouponCode,
    refreshCart,
    addToCart,
    updateQuantity,
    removeItem,
    applyCouponCode,
    clearCouponCode,
    getCartTotal,
    getDiscountedTotal,
    getCartCount
  }), [
    cartItems, loading, discountPercentage, appliedCouponCode,
    refreshCart, addToCart, updateQuantity, removeItem,
    applyCouponCode, clearCouponCode,
    getCartTotal, getDiscountedTotal, getCartCount
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
