"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api, User } from "./api";
import { setCookie, removeCookie, getCookie } from "./cookies";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  admin: boolean | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null as User | null,
      accessToken: null as string | null,
      refreshToken: null as string | null,
      admin: null as boolean | null,

      login: async (email: string, password: string) => {
        const response = await api.auth.login({ email, password });
        set({
          user: response.user,
          accessToken: response.access,
          refreshToken: response.refresh,
          admin: response.admin,
        });
        setCookie("accessToken", response.access);
        setCookie("refreshToken", response.refresh);
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        });
        removeCookie("accessToken");
        removeCookie("refreshToken");
      },

      refreshAccessToken: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) {
          get().logout();
          throw new Error("No refresh token available");
        }

        try {
          const response = await api.auth.refreshToken(refreshToken);
          set({ accessToken: response.access });
          setCookie("accessToken", response.access);
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      initAuth: () => {
        const accessToken = getCookie("accessToken");
        const refreshToken = getCookie("refreshToken");
        if (accessToken && refreshToken) {
          set({ accessToken, refreshToken });
          // Fetch user data
          api.users
            .getCurrent(accessToken)
            .then((user) => set({ user }))
            .catch(() => get().refreshAccessToken())
            .catch(() => get().logout());
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state: AuthState) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        admin: state.admin,
      }),
    }
  )
);
