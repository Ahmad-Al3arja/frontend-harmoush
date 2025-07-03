"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/card";
import { DataTable } from "@/app/components/ui/data-table";
import { useAuthStore } from "@/app/lib/store";
import { ColumnDef } from "@tanstack/react-table";
import { ShoppingBag, Users, LayoutGrid, Star, ImageOff, Wifi, WifiOff, Clock } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";

interface DashboardProduct {
  id: number;
  name: string;
  price: string;
  primary_image: string | null;
  category_name: string;
  city: string;
  governorate: string;
  governorate_display: string;
  created_at: string;
  average_rating: number;
  review_count: number;
  is_favorite: boolean;
  stock?: number;
  is_active: boolean;
}

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  totalUsers: number;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle?: string;
  status?: 'success' | 'warning' | 'error';
}

interface ApiResponse {
  count: number;
  governorates: Array<{
    id: number;
    name: string;
    name_ar: string;
  }>;
  ordering: string;
  results: Array<{
    id: number;
    name: string;
    price: string;
    primary_image: string | null;
    category_name: string;
    city: string;
    governorate: string;
    governorate_display: string;
    created_at: string;
    average_rating: number;
    reviews: Array<any>;
    is_active: boolean;
    stock?: number;
  }>;
}

function StatCard({ title, value, icon, subtitle, status }: StatCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  return (
    <Card className={`p-6 border ${getStatusColor()}`}>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-full">{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalCategories: 0,
    totalUsers: 0,
  });
  const [recentProducts, setRecentProducts] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const { accessToken } = useAuthStore();
  const router = useRouter();

  const columns: ColumnDef<DashboardProduct>[] = [
    {
      id: "primary_image",
      header: "Image",
      cell: ({ row }) => {
        const image = row.original.primary_image;
        return (
          <div className="relative w-12 h-12">
            {image ? (
              <Image
                src={image}
                alt={row.original.name}
                fill
                className="object-cover rounded"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                <ImageOff className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <button
          onClick={() => handleProductClick(row.original)}
          className="text-left hover:text-blue-600 hover:underline"
        >
          {row.getValue("name")}
        </button>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => `$${Number(row.getValue("price")).toLocaleString()}`,
    },
    {
      accessorKey: "category_name",
      header: "Category",
    },
    {
      accessorKey: "city",
      header: "Location",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.city}</span>
          <span className="text-xs text-gray-500">
            {row.original.governorate_display}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "average_rating",
      header: "Rating",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Star
            className={`w-4 h-4 ${
              row.original.average_rating > 0
                ? "text-yellow-400 fill-current"
                : "text-gray-300"
            }`}
          />
          <span>{row.original.average_rating || "N/A"}</span>
          <span className="text-xs text-gray-500">
            ({row.original.review_count})
          </span>
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.original.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus('checking');
        await api.health.check();
        setConnectionStatus('connected');
      } catch (error) {
        console.warn('Connection check failed:', error);
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!accessToken) return;

      try {
        const [productsResponse, categoriesResponse, usersResponse] =
          await Promise.all([
            api.products.getAll(accessToken),
            api.categories.getAll(accessToken),
            api.users.getAll(accessToken),
          ]);

        const formattedProducts: DashboardProduct[] =
          productsResponse.results.map((product) => ({
            id: product.id || 0,
            name: product.name || "",
            price: product.price || "0",
            primary_image: product.primary_image ?? null,
            category_name: product.category_name || "",
            city: product.city || "",
            governorate: product.governorate || "",
            governorate_display: product.governorate_display || "",
            created_at: product.created_at || "",
            average_rating: product.average_rating || 0,
            review_count: product.reviews?.length || 0,
            is_favorite: false,
            stock: product.stock,
            is_active: product.is_active || false,
          }));

        setStats({
          totalProducts: productsResponse.count,
          activeProducts: formattedProducts.filter((p) => p.is_active).length,
          totalCategories: Array.isArray(categoriesResponse)
            ? categoriesResponse.length
            : 0,
          totalUsers: Array.isArray(usersResponse) ? usersResponse.length : 0,
        });

        setRecentProducts(formattedProducts.slice(-5).reverse());
      } catch (err) {
        console.error(err);
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [accessToken]);

  const handleProductClick = (product: DashboardProduct) => {
    router.push(`/products/${product.id}`);
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-6 h-6 text-green-600" />;
      case 'checking': return <Clock className="w-6 h-6 text-yellow-600" />;
      case 'disconnected': return <WifiOff className="w-6 h-6 text-red-600" />;
    }
  };

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected': return { status: 'success' as const, subtitle: 'Connected to t3h.dracode.org' };
      case 'checking': return { status: 'warning' as const, subtitle: 'Checking connection...' };
      case 'disconnected': return { status: 'error' as const, subtitle: 'Disconnected from server' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-500 p-4 rounded-lg">{error}</div>;
  }

  const connectionInfo = getConnectionStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
          Backend: <span className="font-mono text-blue-600">t3h.dracode.org</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Server Status"
          value={connectionStatus === 'connected' ? 'Online' : connectionStatus === 'checking' ? 'Checking' : 'Offline'}
          icon={getConnectionIcon()}
          subtitle={connectionInfo.subtitle}
          status={connectionInfo.status}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          title="Active Products"
          value={stats.activeProducts}
          icon={<Star className="w-6 h-6 text-green-600" />}
        />
        <StatCard
          title="Categories"
          value={stats.totalCategories}
          icon={<LayoutGrid className="w-6 h-6 text-purple-600" />}
        />
        <StatCard
          title="Users"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6 text-orange-600" />}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Products</h2>
        <Card>
          <DataTable columns={columns} data={recentProducts} />
        </Card>
      </div>
    </div>
  );
}
