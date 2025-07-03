"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { api, User } from "@/app/lib/api";
import { useAuthStore } from "@/app/lib/store";

// Define the schema for form validation
const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Full name is required"),
  is_whatsapp: z.boolean(),
  phone: z.string().min(1, "Phone number is required"),
  show_phone: z.boolean(),
  bio: z.string().optional(),
  is_email_verified: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>; // Now includes 'name' instead of 'first_name' and 'last_name'

interface UserFormProps {
  initialData?: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UserForm({ initialData, onSuccess, onCancel }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { accessToken } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: initialData?.email || "",
      name: initialData?.name || "",
      is_whatsapp: initialData?.is_whatsapp || false,
      phone: initialData?.phone || "",
      show_phone: initialData?.show_phone || false,
      bio: initialData?.bio || "",
      is_email_verified: initialData?.is_email_verified || false,
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue("email", initialData.email);
      setValue("name", initialData.name || "");
      setValue("phone", initialData.phone || "");
      setValue("is_whatsapp", initialData?.is_whatsapp || false);
      setValue("show_phone", initialData.show_phone || false);
      setValue("bio", initialData.bio || "");
      setValue("is_email_verified", initialData.is_email_verified || false);
    }
  }, [initialData, setValue]);

  const onSubmit = async (data: UserFormData) => {
    if (!accessToken) return;

    setLoading(true);
    setError("");

    try {
      if (initialData) {
        await api.users.update(initialData.id!, data, accessToken);
      } else {
        throw new Error("New user creation should be handled by registration");
      }
      onSuccess?.();
    } catch (err) {
      setError("Failed to save user");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register("email")}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            {...register("name")}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <input
            {...register("phone")}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("is_whatsapp")}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">Is WhatsApp</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("show_phone")}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">Show Phone</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            {...register("bio")}
            rows={4}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.bio && (
            <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("is_email_verified")}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">Email Verified</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Update User"}
        </Button>
      </div>
    </form>
  );
}
