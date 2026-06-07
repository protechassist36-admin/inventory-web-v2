import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  isExternal?: boolean;
  externalSourceName?: string;
  externalCostPrice?: number;
}

interface POSState {
  cart: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  total: 0,
  addItem: (item) => {
    const { cart } = get();
    const existingItem = cart.find((i) => i.id === item.id);
    let newCart;
    if (existingItem) {
      newCart = cart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
    } else {
      newCart = [...cart, { ...item, quantity: 1 }];
    }
    set({ 
        cart: newCart,
        total: newCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    });
  },
  removeItem: (id) => {
    const newCart = get().cart.filter((i) => i.id !== id);
    set({ 
        cart: newCart,
        total: newCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    });
  },
  updateQuantity: (id, quantity) => {
    let newCart;
    if (quantity <= 0) {
      newCart = get().cart.filter((i) => i.id !== id);
    } else {
      newCart = get().cart.map((i) => (i.id === id ? { ...i, quantity } : i));
    }
    set({
        cart: newCart,
        total: newCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    });
  },
  clearCart: () => set({ cart: [], total: 0 }),
}));
