"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/app/components/ui/data-table";
import { Button } from "@/app/components/ui/button";
import { Plus, Pencil, Trash2, ImageOff } from "lucide-react";
import { useAuthStore } from "@/app/lib/store";
import { api, Category } from "@/app/lib/api";
import { ColumnDef } from "@tanstack/react-table";
import { CategoryDialog } from "@/app/components/categories/category-dialog";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const { accessToken } = useAuthStore();
  const router = useRouter();

  const columns: ColumnDef<Category>[] = [
    {
      id: "icon",
      header: "Icon",
      cell: ({ row }) => {
        const icon_url = row.original.icon_url;
        return (
          <div className="relative w-10 h-10">
            {icon_url ? (
              <div className="relative w-10 h-10">
                <img
                  src={icon_url}
                  alt={`${row.original.name} icon`}
                  className="absolute inset-0 w-full h-full object-cover rounded"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                <ImageOff className="w-4 h-4 text-gray-400" />
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
        <Link
          href={`/products?category=${row.original.id}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "parent",
      header: "Parent Category",
      cell: ({ row }) => {
        const parentId = row.getValue("parent") as number | null;
        if (!parentId) return "None";
        const parent = categories.find((c) => c.id === parentId);
        return parent ? (
          <Link
            href={`/products?category=${parent.id}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {parent.name}
          </Link>
        ) : (
          "Unknown"
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) =>
        new Date(row.getValue("created_at")).toLocaleDateString(),
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

  const fetchCategories = async () => {
    try {
      if (!accessToken) return;
      const data = await api.categories.getAll(accessToken);
      setCategories(data);
    } catch (err) {
      setError("Failed to fetch categories");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [accessToken]);

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!accessToken || !categoryToDelete?.id) return;

    setDeleteLoading(true);
    try {
      await api.categories.delete(categoryToDelete.id, accessToken);
      await fetchCategories();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete category");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategory(undefined);
    setDialogOpen(true);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>
      <DataTable columns={columns} data={categories} />
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
        categories={categories}
        onSuccess={fetchCategories}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Category"
        description={`Are you sure you want to delete ${categoryToDelete?.name}? This will also affect any products in this category.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
