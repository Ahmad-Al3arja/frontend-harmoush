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
  isInitialized: boolean;
  isRefreshing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  initAuth: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null as User | null,
      accessToken: null as string | null,
      refreshToken: null as string | null,
      admin: null as boolean | null,
      isInitialized: false,
      isRefreshing: false,

      login: async (email: string, password: string) => {
        try {
          const response = await api.auth.login({ email, password });
          
          set({
            user: response.user,
            accessToken: response.access,
            refreshToken: response.refresh,
            admin: response.admin,
            isInitialized: true,
          });
          
          setCookie("accessToken", response.access);
          setCookie("refreshToken", response.refresh);
          
          console.log("Login successful:", {
            user: response.user.email,
            admin: response.admin,
            userId: response.user.id
          });
        } catch (error) {
          console.error("Login failed:", error);
          get().clearAuth();
          throw error;
        }
      },

      logout: () => {
        console.log("Logging out user");
        get().clearAuth();
      },

      refreshAccessToken: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) {
          console.warn("No refresh token available");
          get().logout();
          throw new Error("No refresh token available");
        }

        if (get().isRefreshing) {
          console.log("Token refresh already in progress");
          return;
        }

        set({ isRefreshing: true });

        try {
          console.log("Refreshing access token...");
          const response = await api.auth.refreshToken(refreshToken);
          
          set({ 
            accessToken: response.access,
            isRefreshing: false 
          });
          
          setCookie("accessToken", response.access);
          console.log("Token refresh successful");
        } catch (error) {
          console.error("Token refresh failed:", error);
          set({ isRefreshing: false });
          get().logout();
          throw error;
        }
      },

      initAuth: async () => {
        const accessToken = getCookie("accessToken");
        const refreshToken = getCookie("refreshToken");
        
        if (accessToken && refreshToken) {
          set({ 
            accessToken, 
            refreshToken,
            isInitialized: true 
          });
          
          try {
            console.log("Initializing auth with existing tokens");
            // Fetch user data
            const user = await api.users.getCurrent(accessToken);
            set({ user });
            console.log("Auth initialized successfully:", user.email);
          } catch (error) {
            console.warn("Failed to get current user, attempting token refresh");
            try {
              await get().refreshAccessToken();
              // Try to get user data again with new token
              const newAccessToken = get().accessToken;
              if (newAccessToken) {
                const user = await api.users.getCurrent(newAccessToken);
                set({ user });
                console.log("Auth initialized after token refresh:", user.email);
              }
            } catch (refreshError) {
              console.error("Token refresh failed during init:", refreshError);
              get().logout();
            }
          }
        } else {
          set({ isInitialized: true });
          console.log("No tokens found, user not authenticated");
        }
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          admin: null,
          isInitialized: true,
          isRefreshing: false,
        });
        removeCookie("accessToken");
        removeCookie("refreshToken");
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
        isInitialized: state.isInitialized,
      }),
    }
  )
);
