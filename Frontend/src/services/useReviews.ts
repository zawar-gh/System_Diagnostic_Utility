// src/services/useReviews.ts
import { useState } from "react";
import { toast } from "sonner";

export function useReviews(user: any) {
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem("sdu_reviews");
    return saved ? JSON.parse(saved) : [];
  });
  const [newReview, setNewReview] = useState("");
  const [editingReview, setEditingReview] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // --- Add Review ---
  const handleAddReview = () => {
    if (!newReview.trim()) return;
    const review = {
      id: Date.now(),
      user: user?.username || "Anonymous",
      comment: newReview,
      timestamp: new Date().toISOString(),
    };
    const updated = [review, ...reviews];
    setReviews(updated);
    localStorage.setItem("sdu_reviews", JSON.stringify(updated));
    setNewReview("");
    toast.success("Review added");
  };

  // --- Edit Review ---
  const handleEditReview = (id: number) => {
    if (!editText.trim()) return;
    const updated = reviews.map((r: any) =>
      r.id === id ? { ...r, comment: editText } : r
    );
    setReviews(updated);
    localStorage.setItem("sdu_reviews", JSON.stringify(updated));
    setEditingReview(null);
    setEditText("");
    toast.success("Review updated");
  };

  // --- Delete Review ---
  const handleDeleteReview = (id: number) => {
    const updated = reviews.filter((r: any) => r.id !== id);
    setReviews(updated);
    localStorage.setItem("sdu_reviews", JSON.stringify(updated));
    toast.success("Review deleted");
  };

  return {
    reviews,
    newReview,
    setNewReview,
    editingReview,
    setEditingReview,
    editText,
    setEditText,
    handleAddReview,
    handleEditReview,
    handleDeleteReview,
  };
}
