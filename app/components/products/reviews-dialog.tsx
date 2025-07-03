"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Product, api } from "../../lib/api";
import { Star, StarHalf } from "lucide-react";
import { useAuthStore } from "../../lib/store";

interface ReviewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

interface RatingDistributionProps {
  ratings: number[];
  total: number;
}

function RatingDistribution({ ratings, total }: RatingDistributionProps) {
  return (
    <div className="space-y-2">
      {ratings.map((count, index) => {
        const stars = 5 - index;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={stars} className="flex items-center gap-2">
            <div className="w-12 text-sm">{stars} ★</div>
            <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="w-12 text-sm text-right">{count}</div>
          </div>
        );
      })}
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex text-yellow-400">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 fill-current" />
      ))}
      {hasHalfStar && <StarHalf className="w-4 h-4 fill-current" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4" />
      ))}
    </div>
  );
}

interface Review {
  id: number;
  user: string; // Assuming user is just a name for now
  rating: number;
  comment: string;
  created_at: string;
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{review.user}</div>
          <RatingStars rating={review.rating} />
        </div>
        <div className="text-sm text-gray-500">
          {new Date(review.created_at).toLocaleDateString()}
        </div>
      </div>
      <p className="text-gray-700">{review.comment}</p>
    </div>
  );
}

export function ReviewsDialog({
  open,
  onOpenChange,
  product,
}: ReviewsDialogProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [errorReviews, setErrorReviews] = useState("");
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!open || !product?.id || !accessToken) return;

      setLoadingReviews(true);
      setErrorReviews("");
      try {
        const data = await api.products.getReviews(product.id, accessToken);
        setReviews(data);
      } catch (err: any) {
        console.error("Failed to fetch reviews:", err);
        setErrorReviews(err.message || "Failed to load reviews");
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [open, product, accessToken]);

  // Don't render if no product is selected
  if (!product) return null;

  const ratingCounts = Array(5).fill(0);
  let totalRating = 0;

  reviews.forEach((review: any) => {
    ratingCounts[5 - review.rating]++;
    totalRating += review.rating;
  });

  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Reviews for {product.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          <div className="flex gap-8 items-center">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {averageRating.toFixed(1)}
              </div>
              <RatingStars rating={averageRating} />
              <div className="text-sm text-gray-500 mt-1">
                {reviews.length} reviews
              </div>
            </div>
            <div className="flex-1">
              <RatingDistribution
                ratings={ratingCounts}
                total={reviews.length}
              />
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loadingReviews ? (
              <div className="text-center py-8">Loading reviews...</div>
            ) : errorReviews ? (
              <div className="text-center text-red-500 py-8">
                {errorReviews}
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review: any) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No reviews yet
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
