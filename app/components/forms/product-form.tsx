"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { api, ProductDetails, Category } from "@/app/lib/api";
import { useAuthStore } from "@/app/lib/store";
import Image from "next/image";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

interface ProductFormProps {
  initialData?: ProductDetails;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Governorate {
  id: number;
  name: string;
  name_ar: string;
}

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be positive"),
  stock: z.number().min(0, "Stock must be positive"),
  category: z.number().min(1, "Category is required"),
  status: z.enum(["active", "inactive"] as const),
  is_active: z.boolean(),
  city: z.string().min(1, "City is required"),
  governorate: z.number().min(1, "Governorate is required"),
  currency_en: z.enum(["USD", "SYP"]),
  currency_ar: z.string().optional(),
  primary_image: z
    .any()
    .refine((files) => files?.length > 0, "Image is required")
    .refine((files) => files?.[0] instanceof File, "Invalid file type.")
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      "Max file size is 5MB."
    )
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
  images: z.any().optional(),
});

const editProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive").optional(),
  stock: z.number().min(0, "Stock must be positive").optional(),
  category: z.number().min(1, "Category is required"),
  status: z.enum(["active", "inactive"] as const).optional(),
  is_active: z.boolean().optional(),
  city: z.string().optional(),
  governorate: z.number().optional(),
  currency_ar: z.string().optional(),
  primary_image: z.any().optional(),
  currency_en: z.string().optional(),
  images: z.any().optional(),
});

type ProductFormData =
  | z.infer<typeof createProductSchema>
  | z.infer<typeof editProductSchema>;

export function ProductForm({
  initialData,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<
    string[]
  >([]);
  const [additionalImagesFiles, setAdditionalImagesFiles] =
    useState<FileList | null>(null);
  const { accessToken } = useAuthStore();

  const GOVERNORATES: Governorate[] = [
    { id: 10, name: "Al-Hasakah", name_ar: "الحسكة" },
    { id: 2, name: "Aleppo", name_ar: "حلب" },
    { id: 12, name: "As-Suwayda", name_ar: "السويداء" },
    { id: 1, name: "Damascus", name_ar: "دمشق" },
    { id: 14, name: "Damascus Countryside", name_ar: "ريف دمشق" },
    { id: 11, name: "Daraa", name_ar: "درعا" },
    { id: 9, name: "Deir ez-Zor", name_ar: "دير الزور" },
    { id: 4, name: "Hama", name_ar: "حماة" },
    { id: 3, name: "Homs", name_ar: "حمص" },
    { id: 7, name: "Idlib", name_ar: "إدلب" },
    { id: 5, name: "Latakia", name_ar: "اللاذقية" },
    { id: 13, name: "Quneitra", name_ar: "القنيطرة" },
    { id: 8, name: "Raqqa", name_ar: "الرقة" },
    { id: 6, name: "Tartus", name_ar: "طرطوس" },
  ];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(
      initialData ? editProductSchema : createProductSchema
    ),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price ? Number(initialData.price) : 0,
      stock: initialData?.stock || 0,
      category: initialData?.category || 0,
      status: initialData?.is_active ? "active" : "inactive",
      city: initialData?.city || "",
      governorate: initialData?.governorate
        ? Number(initialData.governorate)
        : 0,
      is_active: initialData?.is_active ?? true,
      currency_en: initialData?.currency_en || undefined,
    },
  });

  // Set the category value and other fields when initialData changes
  useEffect(() => {
    if (initialData) {
      // Ensure category is set correctly for editing
      if (initialData.category) {
        setValue("category", Number(initialData.category));
      }

      // Set other important fields
      setValue("name", initialData.name || "");
      setValue("description", initialData.description || "");
      setValue("price", initialData.price ? Number(initialData.price) : 0);
      setValue("stock", initialData.stock || 0);
      setValue("city", initialData.city || "");
      setValue(
        "governorate",
        initialData.governorate ? Number(initialData.governorate) : 0
      );
      setValue("status", initialData.is_active ? "active" : "inactive");
      setValue("is_active", initialData.is_active ?? true);
      setValue("currency_en", initialData.currency_en || undefined);
    }
  }, [initialData, setValue]);

  const imageFile = watch("primary_image");
  const additionalImages = watch("images");
  const currencyEn = watch("currency_en");

  useEffect(() => {
    if (imageFile?.[0] instanceof File) {
      const file = imageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [imageFile]);

  useEffect(() => {
    if (additionalImages?.length > 0) {
      const newPreviews: string[] = [];
      Array.from(additionalImages).forEach((file) => {
        if (file instanceof File) {
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews.push(reader.result as string);
            if (newPreviews.length === additionalImages.length) {
              setAdditionalImagePreviews(newPreviews);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }, [additionalImages]);

  useEffect(() => {
    if (initialData?.primary_image) {
      setImagePreview(initialData.primary_image);
    }

    // If the product has additional images, display them
    if (initialData?.images && initialData.images.length > 0) {
      const existingImages = initialData.images.map((img) => img.image);
      setAdditionalImagePreviews(existingImages);
    }
  }, [initialData]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!accessToken) return;
      try {
        const data = await api.categories.getAll(accessToken);
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load categories");
      }
    };

    fetchCategories();
  }, [accessToken]);

  useEffect(() => {
    if (currencyEn === "USD") {
      setValue("currency_ar", "دولار");
    } else if (currencyEn === "SYP") {
      setValue("currency_ar", "ليرة سورية");
    }
  }, [currencyEn, setValue]);

  const onSubmit = async (data: any) => {
    if (!accessToken) return;

    setLoading(true);
    setError("");

    // Create a new FormData object for the submission
    const formData = new FormData();

    // Log what we're about to submit
    console.log("Form data being prepared:", data);
    console.log("Additional images files:", additionalImagesFiles);

    try {
      if (initialData?.id) {
        formData.append("name", data.name || initialData.name);
        formData.append(
          "description",
          data.description || initialData.description
        );
        formData.append(
          "price",
          data.price?.toString() || initialData.price.toString()
        );
        formData.append(
          "stock",
          data.stock?.toString() || initialData.stock.toString()
        );
        formData.append("category", data.category.toString());

        const isActive = data.status
          ? data.status === "active"
          : initialData.is_active;
        formData.append("is_active", isActive.toString());

        formData.append("city", data.city || initialData.city);
        formData.append(
          "governorate",
          data.governorate?.toString() || initialData.governorate.toString()
        );
        formData.append(
          "currency_en",
          data.currency_en || initialData.currency_en
        );
        formData.append(
          "currency_ar",
          data.currency_ar || initialData.currency_ar
        );

        if (data.primary_image?.[0]) {
          formData.append("primary_image", data.primary_image[0]);
        }

        // Handle additional images as an array - Use 'uploaded_images' as the field name
        if (additionalImagesFiles && additionalImagesFiles.length > 0) {
          console.log(
            `Adding ${additionalImagesFiles.length} additional images to payload`
          );

          // Directly use the FileList from the state
          for (let i = 0; i < additionalImagesFiles.length; i++) {
            const file = additionalImagesFiles[i];
            // Use 'uploaded_images' as the field name for the backend
            formData.append("uploaded_images", file);
            console.log(
              `Added image ${i + 1}/${additionalImagesFiles.length}: ${file.name}`
            );
          }
        }

        // Images are handled separately in the images field
      } else {
        formData.append("name", data.name!);
        formData.append("description", data.description!);
        formData.append("price", data.price!.toString());
        formData.append("stock", data.stock!.toString());
        formData.append("category", data.category!.toString());
        formData.append("is_active", (data.status === "active").toString());
        formData.append("city", data.city!);
        formData.append("governorate", data.governorate!.toString());
        formData.append("currency_en", data.currency_en!);
        formData.append("currency_ar", data.currency_ar!);
        if (data.primary_image?.[0]) {
          formData.append("primary_image", data.primary_image[0]);
        }

        // Handle additional images for new products as an array - Use 'uploaded_images' as the field name
        if (additionalImagesFiles && additionalImagesFiles.length > 0) {
          console.log(
            `Adding ${additionalImagesFiles.length} additional images to payload for new product`
          );

          // Directly use the FileList from the state
          for (let i = 0; i < additionalImagesFiles.length; i++) {
            const file = additionalImagesFiles[i];
            // Use 'uploaded_images' as the field name for the backend
            formData.append("uploaded_images", file);
            console.log(
              `Added image ${i + 1}/${additionalImagesFiles.length}: ${file.name}`
            );
          }
        }
      }

      // Log the final FormData before submission
      console.log("FormData entries:");
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      let response;
      if (initialData?.id) {
        // For update, directly pass the FormData object
        console.log(`Updating product ${initialData.id} with FormData`);
        response = await api.products.update(
          initialData.id,
          formData,
          accessToken
        );
      } else {
        // For create, directly pass the FormData object
        console.log("Creating new product with FormData");
        response = await api.products.create(formData, accessToken);
      }

      if (!response) {
        throw new Error("Failed to save product");
      }

      onSuccess?.();
    } catch (err: any) {
      console.error("Failed to save product:", err);
      setError(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      encType="multipart/form-data"
      className="space-y-6"
    >
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Name {!initialData && <span className="text-red-500">*</span>}
          </label>
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
            Description{" "}
            {!initialData && <span className="text-red-500">*</span>}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Price {!initialData && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">
                {errors.price.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Stock {!initialData && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              {...register("stock", { valueAsNumber: true })}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.stock && (
              <p className="text-red-500 text-sm mt-1">
                {errors.stock.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Category {!initialData && <span className="text-red-500">*</span>}
          </label>
          <select
            {...register("category", { valueAsNumber: true })}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled={!!initialData}>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">
              {errors.category.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              City {!initialData && <span className="text-red-500">*</span>}
            </label>
            <input
              {...register("city")}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Governorate{" "}
              {!initialData && <span className="text-red-500">*</span>}
            </label>
            <select
              {...register("governorate", { valueAsNumber: true })}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a governorate</option>
              {GOVERNORATES.map((gov) => (
                <option key={gov.id} value={gov.id}>
                  {gov.name} ({gov.name_ar})
                </option>
              ))}
            </select>
            {errors.governorate && (
              <p className="text-red-500 text-sm mt-1">
                {errors.governorate.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Status {!initialData && <span className="text-red-500">*</span>}
          </label>
          <select
            {...register("status")}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {errors.status && (
            <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Currency{!initialData && <span className="text-red-500">*</span>}
          </label>
          <select
            {...register("currency_en")}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select currency</option>
            <option value="USD">USD</option>
            <option value="SYP">SYP</option>
          </select>
          {errors.currency_en && (
            <p className="text-red-500 text-sm mt-1">
              {errors.currency_en.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Primary Image{" "}
            {!initialData && <span className="text-red-500">*</span>}
          </label>
          <input
            type="file"
            accept="image/*"
            {...register("primary_image")}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.primary_image && (
            <p className="text-red-500 text-sm mt-1">
              {errors.primary_image.message as string}
            </p>
          )}
          {(imagePreview || initialData?.primary_image) && (
            <div className="mt-2 relative w-48 h-48">
              <Image
                src={imagePreview || initialData?.primary_image || ""}
                alt="Product preview"
                fill
                className="rounded-lg object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Additional Images
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                console.log("Files selected:", e.target.files.length);
                // Store the files in component state instead of using react-hook-form
                setAdditionalImagesFiles(e.target.files);

                // Create previews
                const newPreviews: string[] = [];
                Array.from(e.target.files).forEach((file) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    newPreviews.push(reader.result as string);
                    if (newPreviews.length === e.target.files!.length) {
                      setAdditionalImagePreviews(newPreviews);
                    }
                  };
                  reader.readAsDataURL(file);
                });
              }
            }}
          />
          {errors.images && (
            <p className="text-red-500 text-sm mt-1">
              {errors.images.message as string}
            </p>
          )}

          {additionalImagePreviews.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Additional Images:</h4>
              <div className="grid grid-cols-4 gap-2">
                {additionalImagePreviews.map((src, index) => (
                  <div key={index} className="relative w-24 h-24">
                    <Image
                      src={src}
                      alt={`Additional image ${index + 1}`}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
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
              ? "Update Product"
              : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
