import { create } from "zustand";

interface AppState {
  useMock: boolean;
  setUseMock: (v: boolean) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  useMock: true,
  setUseMock: (v) => set({ useMock: v }),
}));
