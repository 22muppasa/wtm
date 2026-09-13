import { create } from 'zustand';
import type { ActivityCategory } from '@/types';
interface UIState {
  toast: string | null;
  cameraDraftUri: string | null;
  cameraDraftCategory: ActivityCategory | null;
  showToast: (message: string) => void;
  clearToast: () => void;
  setCameraDraftUri: (uri: string | null) => void;
  setCameraDraftCategory: (category: ActivityCategory | null) => void;
}
export const useUIStore = create<UIState>((set) => ({
  toast: null,
  cameraDraftUri: null,
  cameraDraftCategory: null,
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
  setCameraDraftUri: (cameraDraftUri) => set({ cameraDraftUri }),
  setCameraDraftCategory: (cameraDraftCategory) => set({ cameraDraftCategory }),
}));
