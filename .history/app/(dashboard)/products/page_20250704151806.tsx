"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/app/components/ui/data-table";
import { Button } from "@/app/components/ui/button";
import { Plus, Pencil, Trash2, Star, Search, ImageOff } from "lucide-react";
import { useAuthStore } from "@/app/lib/store";
import { api, Product } from "@/app/lib/api";
import { ColumnDef } from "@tanstack/react-table";
import { ProductDialog } from "@/app/components/products/product-dialog";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";
import { ReviewsDialog } from "@/app/components/products/reviews-dialog";
import Image from "next/image";

interface Governorate {
  id: number;
  name: string;
  name_ar: string;
}

interface ApiResponse {
  count: number;
  governorates: Governorate[];
  ordering: string;
  results: Product[];
}

interface ProductsState {
  items: Product[];
  totalCount: number;
  governorates: Governorate[];
  currentOrdering: string;
}

interface SearchBarProps {
  onSearch: (query: string) => void;
}

function SearchBar({ onSearch }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border rounded px-4 py-2 w-64"
      />
      <Button type="submit" variant="secondary">
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
      {searchQuery && (
        <Button type="button" variant="ghost" onClick={handleClear}>
          Clear
        </Button>
      )}
    </form>
  );
}

function SortingOptions({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-4 py-2"
    >
      <option value="newest">Newest First</option>
      <option value="popular">Most Popular</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
}

// Main content component
function ProductsContent() {
  const [productsState, setProductsState] = useState<ProductsState>({
    items: [],
    totalCount: 0,
    governorates: [],
    currentOrdering: "newest",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState<
    Product | undefined
  >();
  const [ordering, setOrdering] = useState<string>("newest");
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("");
  const [featuredOrderEdits, setFeaturedOrderEdits] = useState<{ [id: number]: number | null }>({});
  const [savingFeaturedOrder, setSavingFeaturedOrder] = useState<{ [id: number]: boolean }>({});

  const { accessToken } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category");

  const columns: ColumnDef<Product>[] = [
    {
      id: "image",
      header: "Image",
      cell: ({ row }) => {
        const image = row.original.primary_image;
        return (
          <div className="relative w-12 h-12">
            {image ? (
              <div className="relative w-12 h-12">
                <img
                  src={image}
                  alt={row.original.name}
                  className="absolute inset-0 w-full h-full object-cover rounded"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                <ImageOff className="w-4 h-4" />
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
      id: "location",
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
      id: "reviews",
      header: "Reviews",
      cell: ({ row }) => {
        const product = row.original;
        const reviewCount = product.reviews?.length || 0;
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{product.average_rating?.toFixed(1) || "N/A"}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedReviewProduct(product);
                setReviewsDialogOpen(true);
              }}
            >
              View Reviews ({reviewCount})
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.getValue("is_active")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.getValue("is_active") ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      accessorKey: "featured_order",
      header: "Featured Order",
      cell: ({ row }) => {
        const product = row.original;
        const productId = product.id ?? 0;
        const value =
          featuredOrderEdits[productId] !== undefined
            ? featuredOrderEdits[productId]
            : product.featured_order ?? "";
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              className="border rounded px-2 py-1 w-20"
              value={value === null ? "" : value}
              onChange={(e) => handleFeaturedOrderChange(productId, e.target.value)}
              placeholder="None"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSaveFeaturedOrder(productId)}
              disabled={savingFeaturedOrder[productId]}
            >
              {savingFeaturedOrder[productId] ? "Saving..." : "Save"}
            </Button>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={() => handleDeleteClick(row.original)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const fetchProducts = async (params: URLSearchParams) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      if (categoryId) {
        params.append("category", categoryId);
      }

      const response: ApiResponse = await api.products.getAll(
        accessToken,
        params.toString()
      );

      setProductsState({
        items: response.results,
        totalCount: response.count,
        governorates: response.governorates,
        currentOrdering: response.ordering,
      });
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.append("search", query.trim());
    }
    if (ordering) {
      params.append("ordering", ordering);
    }
    if (selectedGovernorate) {
      params.append("governorate", selectedGovernorate);
    }
    await fetchProducts(params);
  };

  const handleGovernorateChange = (governorateId: string) => {
    setSelectedGovernorate(governorateId);
    const params = new URLSearchParams();
    if (governorateId) {
      params.append("governorate", governorateId);
    }
    if (ordering) {
      params.append("ordering", ordering);
    }
    fetchProducts(params);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (ordering) {
      params.append("ordering", ordering);
    }
    if (selectedGovernorate) {
      params.append("governorate", selectedGovernorate);
    }
    fetchProducts(params);
  }, [accessToken, ordering, categoryId]);

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!accessToken || !productToDelete?.id) return;

    setDeleteLoading(true);
    try {
      await api.products.delete(productToDelete.id, accessToken);
      const params = new URLSearchParams();
      if (ordering) {
        params.append("ordering", ordering);
      }
      if (selectedGovernorate) {
        params.append("governorate", selectedGovernorate);
      }
      await fetchProducts(params);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(undefined);
    setDialogOpen(true);
  };

  const handleProductClick = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  const handleFeaturedOrderChange = (id: number, value: string) => {
    setFeaturedOrderEdits((prev) => ({ ...prev, [id]: value === "" ? null : Number(value) }));
  };

  const handleSaveFeaturedOrder = async (id: number) => {
    if (!accessToken) return;
    setSavingFeaturedOrder((prev) => ({ ...prev, [id]: true }));
    try {
      const featured_order = featuredOrderEdits[id];
      await api.products.updateFeaturedOrder(accessToken, id, featured_order);
      setProductsState((prev) => ({
        ...prev,
        items: prev.items.map((p) =>
          p.id === id ? { ...p, featured_order } : p
        ),
      }));
    } catch (err) {
      alert("Failed to update featured order");
    } finally {
      setSavingFeaturedOrder((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-500 text-sm">
            {productsState.totalCount} products (
            {productsState.items.filter((p) => p.is_active).length} active)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <SearchBar onSearch={handleSearch} />
          <select
            className="border rounded px-4 py-2"
            value={selectedGovernorate}
            onChange={(e) => handleGovernorateChange(e.target.value)}
          >
            <option value="">All Locations</option>
            {productsState.governorates.map((gov) => (
              <option key={gov.id} value={gov.id}>
                {gov.name} ({gov.name_ar})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <SortingOptions
            value={ordering}
            onChange={(value) => setOrdering(value)}
          />
        </div>
      </div>

      {categoryId && (
        <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
          <span>
            Showing products in category:{" "}
            {productsState.items[0]?.category_name}
          </span>
          <Button
            variant="ghost"
            onClick={() => {
              router.push("/products");
            }}
          >
            Clear Filter
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">{error}</div>
      )}

      <DataTable columns={columns} data={productsState.items} />

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
        onSuccess={async () => {
          setDialogOpen(false);
          const params = new URLSearchParams();
          if (ordering) {
            params.append("ordering", ordering);
          }
          if (selectedGovernorate) {
            params.append("governorate", selectedGovernorate);
          }
          await fetchProducts(params);
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />

      <ReviewsDialog
        open={reviewsDialogOpen}
        onOpenChange={(open) => {
          setReviewsDialogOpen(open);
          if (!open) setSelectedReviewProduct(undefined);
        }}
        product={selectedReviewProduct!}
      />
    </div>
  );
}

// Main component with Suspense wrapper
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
