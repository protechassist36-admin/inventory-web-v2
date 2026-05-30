import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
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
  addItem: (item) => {
    const { cart } = get();
    const existingItem = cart.find((i) => i.id === item.id);
    if (existingItem) {
      set({
        cart: cart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ cart: [...cart, { ...item, quantity: 1 }] });
    }
  },
  removeItem: (id) => {
    set({ cart: get().cart.filter((i) => i.id !== id) });
  },
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
    } else {
      set({
        cart: get().cart.map((i) => (i.id === id ? { ...i, quantity } : i)),
      });
    }
  },
  clearCart: () => set({ cart: [] }),
  get total() {
    return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));
