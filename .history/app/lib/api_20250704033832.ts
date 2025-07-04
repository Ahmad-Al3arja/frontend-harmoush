"use client";

import { create } from "zustand";

// Use environment variable for API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/proxy";

interface RequestConfig extends RequestInit {
  token?: string;
  isFormData?: boolean;
  retries?: number;
}

// Loading state store
interface LoadingState {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useLoadingStore = create<LoadingState>()((set: any) => ({
  loading: false,
  setLoading: (loading: boolean) => set({ loading }),
}));

// Retry logic for failed requests
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('401')) {
        throw error;
      }
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('400')) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        console.warn(`Request failed, retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError!;
}

async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { token, isFormData, retries = 3, ...requestConfig } = config;
  const headers = new Headers(config.headers || {});

  // Show loading bar
  useLoadingStore.getState().setLoading(true);

  const makeRequest = async (): Promise<T> => {
    try {
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      if (!isFormData && config.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...requestConfig,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse error as JSON, but don't fail if it's not valid JSON
        const errorText = await response.text();
        let error: { message?: string; detail?: string } = {};
        
        try {
          if (errorText) {
            error = JSON.parse(errorText);
          }
        } catch (e) {
          // If parsing fails, use the raw text as the message
          error = { message: errorText || "An error occurred" };
        }
        
        // Provide more specific error messages based on status codes
        let errorMessage = error.message || error.detail || "An error occurred";
        
        switch (response.status) {
          case 401:
            errorMessage = "Authentication failed. Please log in again.";
            break;
          case 403:
            errorMessage = "You don't have permission to perform this action.";
            break;
          case 404:
            errorMessage = "The requested resource was not found.";
            break;
          case 422:
            errorMessage = "Invalid data provided. Please check your input.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = "Server is temporarily unavailable. Please try again later.";
            break;
        }
        
        throw new Error(errorMessage);
      }

      // For DELETE operations or other responses that might be empty
      if (config.method === "DELETE" || response.status === 204) {
        return {} as T;
      }

      // Check if there's actual content to parse
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return {} as T;
      }

      // Check if response has content before trying to parse JSON
      const text = await response.text();
      if (!text || text.trim() === "") {
        return {} as T;
      }

      // Parse the JSON response
      try {
        return JSON.parse(text) as T;
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    } finally {
      // Hide loading bar
      useLoadingStore.getState().setLoading(false);
    }
  };

  // Use retry logic for the request
  return retryRequest(makeRequest, retries);
}

// Helper function to ensure array response
const ensureArray = <T>(data: T | T[]): T[] => {
  return Array.isArray(data) ? data : [];
};
interface ApiResponse {
  count: number;
  governorates: any;
  ordering: string;
  results: Product[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  is_seller: boolean;
  bio?: string;
}

export interface Category {
  id?: number;
  name: string;
  description: string;
  parent: number | null;
  icon_url?: string;
  created_at?: string;
}

export interface User {
  id?: number;
  email: string;
  name: string;
  phone: string;
  is_seller: boolean;
  is_admin_blocked?: boolean;
  admin?: boolean;
  is_admin?: boolean;
  bio?: string;
  profile_picture?: string | null;
  created_at?: string;
  is_whatsapp?: boolean;
  show_phone?: boolean;
  is_email_verified?: boolean;
}

export interface Mark {
  id: number;
  mark_type: string;
  awarded_at: string;
  expires_at: string | undefined;
  reason: string | undefined;
  is_active: boolean;
  awarded_by: number;
}

interface AssignMarkData {
  mark_type: string;
  expires_at?: string;
  reason?: string;
}
interface UpdateMarkData {
  expires_at?: string;
  reason?: string;
  is_active?: boolean;
}
export interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CreateReview {
  rating: number;
  comment: string;
}

export interface ProductImage {
  id: number;
  image: string;
  order: number;
  created_at: string;
}

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  category: number;
  category_name: string;
  seller: string | null;
  is_active: boolean;
  primary_image?: string | null;
  created_at?: string;
  updated_at?: string;
  average_rating: number;
  reviews: Review[];
  city: string;
  governorate: string;
  governorate_display: string;
  currency_en?: string;
  currency_ar?: string;
  featured_order?: number | null;
}

export interface ProductDetails extends Product {
  primary_image: string;
  city: string;
  images: ProductImage[];
}

export interface Report {
  id: number;
  details: string;
  reason: string;
  reason_display: string;
  report_type: string;
  reported_product: number | null;
  reported_user: number | null;
  reporter: number;
  reporter_email: string;
  reviewed_by: number | null;
  status: string;
  status_display: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: number;
  is_active?: boolean;
  primary_image?: File;
  city?: string;
  governorate?: string;
  currency_en?: string;
  currency_ar?: string;
  uploaded_images?: File[];
  featured_order?: number | null;
}

export interface PaginatedResponse<T> {
  count: number;
  active_count?: number;
  inactive_count?: number;
  is_admin?: boolean;
  results: T[];
}

export interface CreateProductData
  extends Omit<
    Product,
    | "id"
    | "created_at"
    | "image"
    | "category_name"
    | "seller"
    | "is_active"
    | "updated_at"
    | "average_rating"
    | "reviews"
  > {
  image?: File;
  uploaded_images?: File[];
}

export interface AdvertisementVideo {
  id: number;
  title: string;
  video: string;
  video_url: string;
  thumbnail: string | null;
  thumbnail_url: string | null;
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateVideoData {
  title: string;
  video: File;
  thumbnail?: File;
  is_active: boolean;
}

export interface UpdateVideoData {
  title?: string;
  video?: File;
  thumbnail?: File;
  is_active?: boolean;
}

export const api = {
  get: (url: string, config: RequestConfig = {}) =>
    request(url, { ...config, method: "GET" }),
  post: (url: string, data: any, config: RequestConfig = {}) =>
    request(url, { ...config, method: "POST", body: JSON.stringify(data) }),
  put: (url: string, data: any, config: RequestConfig = {}) =>
    request(url, { ...config, method: "PUT", body: JSON.stringify(data) }),
  delete: (url: string, config: RequestConfig = {}) =>
    request(url, { ...config, method: "DELETE" }),

  // Health check endpoint
  health: {
    check: async (): Promise<{ status: string; timestamp: string }> => {
      try {
        const response = await fetch(`${API_BASE_URL}/health/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          return await response.json();
        } else {
          throw new Error('Health check failed');
        }
      } catch (error) {
        throw new Error('Unable to connect to server');
      }
    },
  },

  auth: {
    login: (credentials: LoginCredentials) =>
      request<{ user: User; access: string; refresh: string; admin: boolean }>(
        "/auth/login/",
        {
          method: "POST",
          body: JSON.stringify(credentials),
        }
      ),

    register: (data: RegisterData) =>
      request<{ user: User; access: string; refresh: string }>(
        "/auth/register/",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),

    refreshToken: (refresh: string) =>
      request<{ access: string }>("/auth/token/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      }),
  },

  users: {
    getCurrent: (token: string) => request<User>("/users/me/", { token }),
    getAll: (token: string) =>
      request<User[]>("/users/", { token }).then(ensureArray),
    get: (id: number, token: string) =>
      request<User>(`/users/${id}/`, { token }),
    delete: (id: number, token: string) =>
      request<{}>(`/users/${id}/delete/`, {
        method: "DELETE",
        token,
      }),
    block: (id: number, reason: string, token: string) =>
      request<{}>(`/admin-block/`, {
        method: "POST",
        body: JSON.stringify({ user_id: id, reason }),
        token,
      }),

    unblock: (id: number, token: string) =>
      request<{}>(`/admin-block/${id}/unblock/`, {
        method: "DELETE",
        token,
      }),
    create: (data: Partial<User>, token: string) =>
      request<User>("/users/create/", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),
    createReview: (userId: number, data: CreateReview, token: string) =>
      request<Review>(`/users/${userId}/reviews/create/`, {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    getReviews: (userId: number, token: string) =>
      request<Review[]>(`/users/${userId}/reviews/`, {
        method: "GET",
        token,
      }),

    listMarks: (userId: string, token: string) =>
      request<Mark[]>(`/users/${userId}/marks/`, {
        method: "GET",
        token,
      }).then(ensureArray),

    assignMark: (userId: string, data: AssignMarkData, token: string) =>
      request<Mark>(`/users/${userId}/marks/`, {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    updateMark: (
      userId: string,
      markId: string,
      data: UpdateMarkData,
      token: string
    ) =>
      request<Mark>(`/users/${userId}/marks/${markId}/`, {
        method: "PUT",
        body: JSON.stringify(data),
        token,
        headers: {
          "Content-Type": "application/json",
        },
      }),

    update: (id: number, data: Partial<User>, token: string) =>
      request<User>(`/users/${id}/update/`, {
        method: "PUT",
        body: JSON.stringify(data),
        token,
      }),

    getMarkDetails: (userId: string, markId: string, token: string) =>
      request<Mark>(`/users/${userId}/marks/${markId}/`, { token }),

    deleteMark: (userId: string, markId: string, token: string) =>
      request<{}>(`/users/${userId}/marks/${markId}/`, {
        method: "DELETE",
        token,
      }),
  },

  categories: {
    getAll: (token: string) =>
      request<Category[]>("/categories/", { token }).then(ensureArray),

    get: (id: number, token: string) =>
      request<Category>(`/categories/${id}/`, { token }),

    create: async (formData: FormData, token: string): Promise<Category> => {
      const response = await fetch(`${API_BASE_URL}/categories/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      return response.json();
    },

    update: async (
      id: number,
      formData: FormData,
      token: string
    ): Promise<Category> => {
      const response = await fetch(`${API_BASE_URL}/categories/${id}/update/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      return response.json();
    },

    delete: (id: number, token: string) =>
      request<{}>(`/categories/${id}/delete/`, {
        method: "DELETE",
        token,
      }),
  },

  products: {
    getAll: async (
      token: string,
      queryString?: string
    ): Promise<ApiResponse> => {
      const url = queryString
        ? `${API_BASE_URL}/products/?${queryString}`
        : `${API_BASE_URL}/products/`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      return data as ApiResponse;
    },

    get: (id: number, token: string) =>
      request<ProductDetails>(`/products/${id}/`, { token }),

    getReviews: (id: number, token: string) =>
      request<Review[]>(`/products/${id}/reviews/`, { token }).then(
        ensureArray
      ),

    create: (data: CreateProductData | FormData, token: string) => {
      let formData: FormData;

      if (data instanceof FormData) {
        // If FormData is passed directly, use it
        formData = data;
      } else {
        // Otherwise, create a new FormData from the object
        formData = new FormData();

        // Handle regular fields
        Object.entries(data).forEach(([key, value]) => {
          // Skip images array as we'll handle it separately
          if (key === "uploaded_images") return;

          if (value instanceof File) {
            formData.append(key, value);
          } else if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        // Handle multiple images
        if (data.uploaded_images && Array.isArray(data.uploaded_images)) {
          data.uploaded_images.forEach((image) => {
            formData.append("uploaded_images", image);
          });
        }
      }

      return request<Product>("/products/create/", {
        method: "POST",
        body: formData,
        token,
        isFormData: true,
      });
    },

    update: (id: number, data: UpdateProductData | FormData, token: string) => {
      let formData: FormData;

      if (data instanceof FormData) {
        // If FormData is passed directly, use it
        formData = data;
      } else {
        // Otherwise, create a new FormData from the object
        formData = new FormData();

        if (data.name) formData.append("name", data.name);
        if (data.description) formData.append("description", data.description);
        if (data.price !== undefined)
          formData.append("price", data.price.toString());
        if (data.stock !== undefined)
          formData.append("stock", data.stock.toString());
        if (data.category !== undefined)
          formData.append("category", data.category.toString());
        if (data.is_active !== undefined)
          formData.append("is_active", data.is_active.toString());
        if (data.primary_image)
          formData.append("primary_image", data.primary_image);
        if (data.city) formData.append("city", data.city);
        if (data.governorate) formData.append("governorate", data.governorate);
        if (data.currency_en) formData.append("currency_en", data.currency_en);
        if (data.currency_ar) formData.append("currency_ar", data.currency_ar);

        // Images are handled separately

        // Handle multiple images
        if (data.uploaded_images && Array.isArray(data.uploaded_images)) {
          data.uploaded_images.forEach((image) => {
            formData.append("uploaded_images", image);
          });
        }
      }

      return request<ProductDetails>(`/products/${id}/update/`, {
        method: "PUT",
        body: formData,
        token,
        isFormData: true,
      });
    },

    delete: (id: number, token: string) =>
      request<{}>(`/products/${id}/delete/`, {
        method: "DELETE",
        token,
      }),

    search: (
      params: {
        search: string;
        category?: number;
        page?: number;
        page_size?: number;
      },
      token: string
    ) =>
      request<PaginatedResponse<Product>>(
        `/products/?${new URLSearchParams({
          ...(params.search && { search: params.search }),
          ...(params.category && { category: params.category.toString() }),
          ...(params.page && { page: params.page.toString() }),
          ...(params.page_size && { page_size: params.page_size.toString() }),
        }).toString()}`,
        {
          method: "GET",
          token,
        }
      ).then((response) => response.results || []),

    addImages: async (productId: number, formData: FormData, token: string) => {
      const response = await fetch(
        `${API_BASE_URL}/products/${productId}/images/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload images");
      }
      return await response.json();
    },

    deleteImage: async (productId: number, imageId: number, token: string) => {
      const response = await fetch(
        `${API_BASE_URL}/products/${productId}/images/${imageId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to delete image");
      return true;
    },

    reorderImages: async (
      productId: number,
      imageOrder: number[],
      token: string
    ) => {
      const response = await fetch(
        `${API_BASE_URL}/products/${productId}/images/reorder/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image_order: imageOrder }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reorder images");
      }

      return response.json();
    },

    updateFeaturedOrder: (token: string, productId: number, featured_order: number | null) =>
      request(`/products/${productId}/featured_order/`, {
        method: "PUT",
        token,
        body: JSON.stringify({ featured_order }),
        headers: { "Content-Type": "application/json" },
      }),
  },

  videos: {
    getAll: (token: string) =>
      request<AdvertisementVideo[]>("/videos/", { token }),

    get: (id: number, token: string) =>
      request<AdvertisementVideo>(`/videos/${id}/`, { token }),

    create: (data: CreateVideoData | FormData, token: string) => {
      let formData: FormData;

      if (data instanceof FormData) {
        // If FormData is passed directly, use it
        formData = data;
      } else {
        // Otherwise, create a new FormData from the object
        formData = new FormData();

        formData.append("title", data.title);
        formData.append("video", data.video);
        if (data.thumbnail) {
          formData.append("thumbnail", data.thumbnail);
        }
        formData.append("is_active", data.is_active.toString());
      }

      return request<AdvertisementVideo>("/videos/", {
        method: "POST",
        body: formData,
        token,
        isFormData: true,
      });
    },

    update: (id: number, data: UpdateVideoData | FormData, token: string) => {
      let formData: FormData;

      if (data instanceof FormData) {
        // If FormData is passed directly, use it
        formData = data;
      } else {
        // Otherwise, create a new FormData from the object
        formData = new FormData();

        if (data.title) formData.append("title", data.title);
        if (data.video) formData.append("video", data.video);
        if (data.thumbnail) formData.append("thumbnail", data.thumbnail);
        if (data.is_active !== undefined) formData.append("is_active", data.is_active.toString());
      }

      return request<AdvertisementVideo>(`/videos/${id}/`, {
        method: "PUT",
        body: formData,
        token,
        isFormData: true,
      });
    },

    delete: (id: number, token: string) =>
      request<{}>(`/videos/${id}/`, {
        method: "DELETE",
        token,
      }),

    setActive: (id: number, token: string) =>
      request<AdvertisementVideo>(`/videos/${id}/set_active/`, {
        method: "PUT",
        token,
      }),
  },

  reports: {
    getAll: (token: string, queryParams?: string) => {
      let url = "/reports/all";
      if (queryParams) {
        url = `${url}/?${queryParams}`;
      }
      // Expect an object with { reports, pagination }
      return request<{ reports: Report[]; pagination: any }>(url, { token });
    },

    get: (id: number, token: string) =>
      request<Report>(`/reports/${id}/`, { token }),

    updateStatus: (
      id: number,
      data: { status: string; admin_notes: string },
      token: string
    ) =>
      request<Report>(`/reports/${id}/status/`, {
        method: "PUT",
        body: JSON.stringify(data),
        token,
      }),
  },

  analytics: {
    getProductsAnalytics: (token: string) =>
      request<{
        overview: {
          total_products: number;
          active_products: number;
          inactive_products: number;
          recent_products: number;
        };
        category_stats: any[];
        top_categories: any[];
        price_ranges: any[];
        governorate_stats: any[];
      }>("/analytics/products/", { token }),

    getMonthlyAnalytics: (token: string) =>
      request<{
        monthly_data: any[];
        current_month: {
          products: number;
          growth_rate: number;
        };
        last_month: {
          products: number;
        };
      }>("/analytics/monthly/", { token }),

    getUserAnalytics: (token: string) =>
      request<{
        overview: {
          total_users: number;
          verified_users: number;
          users_with_products: number;
          verification_rate: number;
        };
        monthly_users: any[];
        top_sellers: any[];
      }>("/analytics/users/", { token }),

    getDashboardSummary: (token: string) =>
      request<{
        totals: {
          products: number;
          users: number;
          categories: number;
        };
        recent_activity: {
          products_this_week: number;
          users_this_week: number;
        };
        top_categories: any[];
        recent_products: any[];
      }>("/analytics/dashboard/", { token }),
  },
};
