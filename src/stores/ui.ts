import { create } from 'zustand';
interface UIState {
  toast: string | null;
  cameraDraftUri: string | null;
  showToast: (message: string) => void;
  clearToast: () => void;
  setCameraDraftUri: (uri: string | null) => void;
}
export const useUIStore = create<UIState>((set) => ({
  toast: null,
  cameraDraftUri: null,
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
  setCameraDraftUri: (cameraDraftUri) => set({ cameraDraftUri }),
}));
