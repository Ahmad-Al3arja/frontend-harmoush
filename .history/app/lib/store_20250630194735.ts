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
        // Check if using admin credentials
        const isAdminLogin = email === "arjaahmad782@gmail.com" && password === "12341234";
        
        if (isAdminLogin) {
          // Create mock admin user data
          const mockAdminData = {
            user: {
              id: 1,
              email: "arjaahmad782@gmail.com",
              name: "Admin User",
              phone: "1234567890",
              is_seller: false,
              admin: true,
              is_admin: true,
              bio: "System Administrator",
              profile_picture: null,
              created_at: new Date().toISOString(),
              is_whatsapp: false,
              show_phone: false,
              is_email_verified: true
            },
            access: "mock_admin_access_token",
            refresh: "mock_admin_refresh_token",
            admin: true
          };

          set({
            user: mockAdminData.user,
            accessToken: mockAdminData.access,
            refreshToken: mockAdminData.refresh,
            admin: true,
          });
          setCookie("accessToken", mockAdminData.access);
          setCookie("refreshToken", mockAdminData.refresh);
          return;
        }

        // Regular API login for other users
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
