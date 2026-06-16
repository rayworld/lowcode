import { create } from 'zustand';
import { Application } from '@lowcode/shared';
import { appService } from '../services/app.service';

interface AppState {
  apps: Application[];
  currentApp: Application | null;
  loading: boolean;
  fetchApps: () => Promise<void>;
  setCurrentApp: (app: Application | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  apps: [],
  currentApp: null,
  loading: false,

  fetchApps: async () => {
    set({ loading: true });
    try {
      const res = await appService.findAll();
      set({ apps: res.data || [] });
    } catch {
      // handled by interceptor
    } finally {
      set({ loading: false });
    }
  },

  setCurrentApp: (app) => set({ currentApp: app }),
}));
