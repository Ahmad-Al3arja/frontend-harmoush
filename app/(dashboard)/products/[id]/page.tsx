"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ProductDetails } from "@/app/lib/api";
import { useAuthStore } from "@/app/lib/store";
import { Card } from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import {
  Star,
  Calendar,
  Package,
  MapPin,
  User,
  Clock,
  ImageOff,
  Upload,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import Image from "next/image";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface ProductImage {
  id: number;
  image: string;
  order: number;
  created_at: string;
}

interface ProductReview {
  id: number;
  user: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductDetailsPage() {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImage, setDeletingImage] = useState<number | null>(null);
  const [reorderingImages, setReorderingImages] = useState(false);
  const { accessToken } = useAuthStore();
  const params = useParams();
  const productId = params.id;

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!accessToken || !productId) return;

      try {
        const data = await api.products.get(Number(productId), accessToken);
        setProduct(data);
        setSelectedImage(data.primary_image);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [accessToken, productId]);

  const handleReorderImages = async (result: DropResult) => {
    if (!result.destination || !product || !accessToken || !productId) return;

    const newImages = Array.from(product.images);
    const [reorderedItem] = newImages.splice(result.source.index, 1);
    newImages.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for smooth UX
    setProduct({
      ...product,
      images: newImages,
    });

    setReorderingImages(true);
    try {
      // Send the new order to the API
      const imageOrder = newImages.map((img) => img.id);
      await api.products.reorderImages(
        Number(productId),
        imageOrder,
        accessToken
      );

      // Refresh product data to ensure sync with server
      const updatedProduct = await api.products.get(
        Number(productId),
        accessToken
      );
      setProduct(updatedProduct);
    } catch (error) {
      console.error("Error reordering images:", error);
      // Optionally show error message to user
      setError("Failed to reorder images");
    } finally {
      setReorderingImages(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || !accessToken || !productId) return;

    setUploadingImages(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      await api.products.addImages(Number(productId), formData, accessToken);

      const updatedProduct = await api.products.get(
        Number(productId),
        accessToken
      );
      setProduct(updatedProduct);
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error("Error uploading images:", error);
      setError("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!accessToken || !productId) return;

    setDeletingImage(imageId);
    try {
      await api.products.deleteImage(Number(productId), imageId, accessToken);

      const updatedProduct = await api.products.get(
        Number(productId),
        accessToken
      );
      setProduct(updatedProduct);

      if (
        selectedImage ===
        product?.images.find((img) => img.id === imageId)?.image
      ) {
        setSelectedImage(updatedProduct.primary_image);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      setError("Failed to delete image");
    } finally {
      setDeletingImage(null);
    }
  };

  const ImagePlaceholder = () => (
    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
      <ImageOff className="w-8 h-8 text-gray-400" />
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-lg">
        {error || "Product not found"}
      </div>
    );
  }

  const validImages = [
    product.primary_image,
    ...(product.images || []).map((img) => img.image),
  ].filter((img): img is string => Boolean(img));

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-lg overflow-hidden">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <ImagePlaceholder />
            )}
          </div>
          {validImages.length > 0 && (
            <DragDropContext onDragEnd={handleReorderImages}>
              <Droppable droppableId="images" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-4 gap-2"
                  >
                    {product.images.map((image, index) => (
                      <Draggable
                        key={image.id.toString()}
                        draggableId={image.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`relative aspect-square rounded-md overflow-hidden group ${
                              snapshot.isDragging
                                ? "ring-2 ring-blue-500 z-50"
                                : ""
                            }`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-2 left-2 p-1 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-grab"
                            >
                              <GripVertical className="w-4 h-4 text-white" />
                            </div>
                            <Image
                              src={image.image}
                              alt={`Product image ${image.id}`}
                              fill
                              className={`object-cover cursor-pointer ${
                                selectedImage === image.image
                                  ? "border-2 border-blue-500"
                                  : ""
                              }`}
                              sizes="(max-width: 768px) 25vw, 12vw"
                              onClick={() => setSelectedImage(image.image)}
                            />
                            {/* Delete Button Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(image.id);
                                }}
                                className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                                disabled={deletingImage === image.id}
                              >
                                {deletingImage === image.id ? (
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-5 h-5 text-white" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Primary Image (if exists and not in images array) */}
                    {product.primary_image &&
                      !product.images.some(
                        (img) => img.image === product.primary_image
                      ) && (
                        <div
                          className="relative aspect-square rounded-md overflow-hidden cursor-pointer"
                          onClick={() =>
                            setSelectedImage(product.primary_image)
                          }
                        >
                          <Image
                            src={product.primary_image}
                            alt="Primary product image"
                            fill
                            className={`object-cover ${
                              selectedImage === product.primary_image
                                ? "border-2 border-blue-500"
                                : ""
                            }`}
                            sizes="(max-width: 768px) 25vw, 12vw"
                          />
                        </div>
                      )}

                    {/* Add Image Button */}
                    <div
                      className="relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center bg-gray-50"
                      onClick={() => setIsUploadModalOpen(true)}
                    >
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {/* Upload Modal */}
          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Images</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      Click to upload images or drag and drop
                    </span>
                    <div className="text-xs text-gray-400 mt-2 space-y-1">
                      <p>Supported formats: JPG, JPEG, PNG</p>
                      <p>Maximum size: 5MB per image</p>
                      <p>Minimum dimensions: 200x200 pixels</p>
                      <p>Maximum dimensions: 2000x2000 pixels</p>
                    </div>
                  </label>
                </div>
                {uploadingImages && (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl font-semibold text-blue-600 mt-2">
              ${Number(product.price).toLocaleString()}
            </p>
          </div>

          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="font-semibold">
                {product.average_rating?.toFixed(1) || "N/A"}
              </span>
              <span className="text-gray-500">
                ({product.reviews?.length || 0} reviews)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-500" />
                <span>{product.stock} in stock</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span>
                  {typeof product.city === "string"
                    ? product.city
                    : "Location not specified"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                <span>
                  {typeof product.seller === "string"
                    ? product.seller
                    : "Seller not specified"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                {product?.created_at ? (
                  <span>
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            </div>
          </Card>

          <div>
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-600">
              {product.description || "No description available"}
            </p>
          </div>

          {/* Reviews Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Reviews</h2>
            <div className="space-y-4">
              {product.reviews?.length > 0 ? (
                product.reviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold">
                            {typeof review.user === "string"
                              ? review.user
                              : "User"}
                          </span>
                        </div>
                        <p className="mt-2">{review.comment}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{review.rating}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500">No reviews yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
