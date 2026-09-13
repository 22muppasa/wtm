import { create } from 'zustand';
interface UIState { toast: string | null; showToast: (message: string) => void; clearToast: () => void }
export const useUIStore = create<UIState>((set) => ({
  toast: null, showToast: (toast) => set({ toast }), clearToast: () => set({ toast: null }),
}));
