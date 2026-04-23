import { apiClient } from "@/lib/api-client";
import { shouldUseMocks } from "@/lib/mock-mode";
import ratingsMock from "@/mocks/ratings.list.json";
import type { ApiSuccess, Paginated, Rating, RatingPayload } from "@/types/api";

const RATINGS_KEY = "ratings";

export async function createRating(payload: RatingPayload) {
  if (shouldUseMocks()) {
    const rating: Rating = {
      id: crypto.randomUUID(),
      userId: readUserId(),
      hotspotId: payload.hotspotId,
      purchaseId: payload.purchaseId,
      score: payload.score,
      comment: payload.comment ?? "",
      createdAt: new Date().toISOString()
    };
    storeRating(rating);
    return rating;
  }

  const response = await apiClient.post<ApiSuccess<Rating>>("/ratings", payload);
  return response.data.data;
}

export async function getRatings(hotspotId: string, page = 1, limit = 10) {
  if (shouldUseMocks()) {
    const stored = readStoredRatings().filter((rating) => rating.hotspotId === hotspotId);
    const contractRatings = (ratingsMock.data.items as Rating[]).filter((rating) => rating.hotspotId === hotspotId);
    const items = [...stored, ...contractRatings];

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / limit))
      }
    } as Paginated<Rating>;
  }

  const response = await apiClient.get<ApiSuccess<Paginated<Rating>>>("/ratings", { params: { hotspotId, page, limit } });
  return response.data.data;
}

function storeRating(rating: Rating) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = readStoredRatings().filter((item) => item.purchaseId !== rating.purchaseId);
  window.localStorage.setItem(RATINGS_KEY, JSON.stringify([rating, ...existing]));
}

function readStoredRatings() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(RATINGS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Rating[];
  } catch {
    return [];
  }
}

function readUserId() {
  if (typeof window === "undefined") {
    return "2c1e7b1a-df9a-4935-a75b-0579bc331c9b";
  }

  const raw = window.localStorage.getItem("authUser");
  if (!raw) {
    return "2c1e7b1a-df9a-4935-a75b-0579bc331c9b";
  }

  try {
    return JSON.parse(raw).id ?? "2c1e7b1a-df9a-4935-a75b-0579bc331c9b";
  } catch {
    return "2c1e7b1a-df9a-4935-a75b-0579bc331c9b";
  }
}
