import { create } from "zustand";
import type { ScanResult } from "@/lib/scoring";

export type ScanStatus = "idle" | "loading" | "success" | "error";

interface AppState {
  lat: number;
  lng: number;
  areaLabel: string;
  categoryId: string;
  status: ScanStatus;
  result: ScanResult | null;
  error: string | null;
  setArea: (lat: number, lng: number, areaLabel: string) => void;
  setCategoryId: (id: string) => void;
  setStatus: (s: ScanStatus) => void;
  setResult: (r: ScanResult | null) => void;
  setError: (e: string | null) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  lat: 12.9352,
  lng: 77.6245,
  areaLabel: "",
  categoryId: "",
  status: "idle",
  result: null,
  error: null,
  setArea: (lat, lng, areaLabel) => set({ lat, lng, areaLabel }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setStatus: (status) => set({ status }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
}));
