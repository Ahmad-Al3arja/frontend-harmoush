"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useAuthStore } from "@/app/lib/store";
import { api } from "@/app/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Button } from "@/app/components/ui/button";
import { downloadCSV } from "@/app/lib/csv";

interface ProductAnalytics {
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
}

interface MonthlyAnalytics {
  monthly_data: any[];
  current_month: {
    products: number;
    growth_rate: number;
  };
  last_month: {
    products: number;
  };
}

interface UserAnalytics {
  overview: {
    total_users: number;
    verified_users: number;
    users_with_products: number;
    verification_rate: number;
  };
  monthly_users: any[];
  top_sellers: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics | null>(null);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState<MonthlyAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!accessToken) return;
      
      try {
        setLoading(true);
        const [products, monthly, users] = await Promise.all([
          api.analytics.getProductsAnalytics(accessToken),
          api.analytics.getMonthlyAnalytics(accessToken),
          api.analytics.getUserAnalytics(accessToken),
        ]);
        
        setProductAnalytics(products);
        setMonthlyAnalytics(monthly);
        setUserAnalytics(users);
      } catch (err: any) {
        setError(err.message || "Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [accessToken]);

  // CSV download handlers
  const handleDownloadCategoryStats = () => {
    if (productAnalytics?.category_stats) {
      downloadCSV(productAnalytics.category_stats, "category_stats.csv");
    }
  };
  const handleDownloadGovernorateStats = () => {
    if (productAnalytics?.governorate_stats) {
      downloadCSV(productAnalytics.governorate_stats, "governorate_stats.csv");
    }
  };
  const handleDownloadTopSellers = () => {
    if (userAnalytics?.top_sellers) {
      downloadCSV(userAnalytics.top_sellers, "top_sellers.csv");
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
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productAnalytics?.overview.total_products}</div>
            <p className="text-xs text-muted-foreground">
              {productAnalytics?.overview.active_products} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userAnalytics?.overview.total_users}</div>
            <p className="text-xs text-muted-foreground">
              {userAnalytics?.overview.verification_rate}% verified
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyAnalytics?.current_month.growth_rate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyAnalytics?.current_month.products} this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userAnalytics?.overview.users_with_products}
            </div>
            <p className="text-xs text-muted-foreground">
              Users with products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Products by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productAnalytics?.top_categories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category__name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_products" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Price Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Price Range Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productAnalytics?.price_ranges}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {productAnalytics?.price_ranges.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Product Creation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyAnalytics?.monthly_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Sellers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userAnalytics?.top_sellers.slice(0, 5).map((seller, index) => (
                <div key={seller.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{seller.name}</p>
                    <p className="text-sm text-gray-500">{seller.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{seller.product_count}</p>
                    <p className="text-sm text-gray-500">products</p>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handleDownloadTopSellers} variant="outline" size="sm" className="mb-2">
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Details */}
        <Card>
          <CardHeader>
            <CardTitle>Category Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Products</th>
                    <th className="text-right p-2">Avg Price</th>
                    <th className="text-right p-2">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productAnalytics?.category_stats.map((cat, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{cat.category__name}</td>
                      <td className="text-right p-2">{cat.total_products}</td>
                      <td className="text-right p-2">
                        ${cat.avg_price ? parseFloat(cat.avg_price).toFixed(2) : '0.00'}
                      </td>
                      <td className="text-right p-2">{cat.total_stock || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={handleDownloadCategoryStats} variant="outline" size="sm" className="mb-2">
              Download CSV
            </Button>
          </CardContent>
        </Card>

        {/* Governorate Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Governorate Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Governorate</th>
                    <th className="text-right p-2">Products</th>
                    <th className="text-right p-2">Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {productAnalytics?.governorate_stats.map((gov, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{gov.governorate__name}</td>
                      <td className="text-right p-2">{gov.product_count}</td>
                      <td className="text-right p-2">
                        ${gov.avg_price ? parseFloat(gov.avg_price).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={handleDownloadGovernorateStats} variant="outline" size="sm" className="mb-2">
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 