"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/card";
import { DataTable } from "@/app/components/ui/data-table";
import { useAuthStore } from "@/app/lib/store";
import { ColumnDef } from "@tanstack/react-table";
import { ShoppingBag, Users, LayoutGrid, Star, ImageOff } from "lucide-react";
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
  value: number;
  icon: React.ReactNode;
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

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-full">{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
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
            id: product.id || 0, // Ensure id is always a number
            name: product.name || "",
            price: product.price || "0",
            primary_image: product.primary_image ?? null, // Ensure primary_image is string | null
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

        // Get 5 most recent products
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
