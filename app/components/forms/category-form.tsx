"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { Upload, X } from "lucide-react";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

interface Category {
  id?: number;
  name: string;
  description: string;
  parent: number | null;
  icon_url?: string;
  created_at?: string;
}

interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  parent: number | null;
  icon_url: string;
  created_at: string;
}

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  parent: z.number().nullable(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialData?: Category;
  categories: Category[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({
  initialData,
  categories,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [removeIcon, setRemoveIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { accessToken } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      parent: initialData?.parent || null,
    },
  });

  // Set initial preview URL when component mounts or initialData changes
  useEffect(() => {
    if (initialData?.icon_url) {
      setPreviewUrl(initialData.icon_url);
      setRemoveIcon(false);
    }
  }, [initialData]);

  // Cleanup object URLs when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith("http")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileError("Please select an icon file");
      return;
    }

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setFileError("Please upload a valid image file (JPG or PNG)");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size must be less than 5MB");
      return;
    }

    // Cleanup previous preview URL if it exists
    if (previewUrl && !previewUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFileError("");
    setRemoveIcon(false);
  };

  const clearSelectedFile = () => {
    if (previewUrl && !previewUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl("");
    setRemoveIcon(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    if (!accessToken) return;

    if (!initialData && !selectedFile) {
      setFileError("Please select an icon image");
      return;
    }

    setLoading(true);
    setError("");
    setFileError("");

    try {
      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("description", data.description);

      if (data.parent) {
        formData.append("parent", data.parent.toString());
      }

      if (removeIcon) {
        formData.append("icon", "");
      } else if (selectedFile) {
        formData.append("icon", selectedFile);
      }

      let response: Category;

      if (initialData?.id) {
        response = await api.categories.update(
          initialData.id,
          formData,
          accessToken
        );
      } else {
        response = await api.categories.create(formData, accessToken);
      }

      // Update preview URL with the new icon_url from response
      if (response.icon_url) {
        setPreviewUrl(response.icon_url);
        setRemoveIcon(false);
      }

      onSuccess?.();
    } catch (err: any) {
      console.error("Error saving category:", err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to save category. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {(error || fileError) && (
        <div className="bg-red-50 text-red-500 p-3 rounded">
          {error || fileError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            {...register("name")}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description *
          </label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Icon {!initialData && "*"}
          </label>
          <div className="space-y-2">
            {/* {previewUrl && !removeIcon ? (
              <div className="relative w-32 h-32">
                <Image
                  src={previewUrl}
                  alt="Category icon preview"
                  fill
                  className="object-cover rounded"
                  unoptimized={!previewUrl.startsWith('http')}
                  onError={() => {
                    setError('Failed to load image');
                    setPreviewUrl('');
                  }}
                />
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : ( */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 text-gray-500 hover:text-gray-700"
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm">Click to upload icon</span>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>JPG or PNG format</p>
                  <p>Maximum size: 5MB</p>
                  <p>Maximum dimensions: 512x512 pixels</p>
                </div>
              </button>
            </div>
            {/* )} */}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Parent Category
          </label>
          <select
            {...register("parent", {
              setValueAs: (v) => (v === "" ? null : Number(v)),
            })}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None</option>
            {categories
              .filter((category) => category.id !== initialData?.id)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
          {errors.parent && (
            <p className="text-red-500 text-sm mt-1">{errors.parent.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : initialData
              ? "Update Category"
              : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
