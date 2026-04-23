export type UserRole = "USER" | "NODE_OWNER" | "ADMIN";
export type HotspotStatus = "DRAFT" | "ACTIVE" | "OFFLINE" | "SUSPENDED" | "ARCHIVED";
export type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "EXPIRED";
export type SessionStatus = "PENDING" | "ACTIVE" | "ENDED" | "EXPIRED";
export type SortOption = "price" | "distance" | "rating" | "speed" | "newest";

export type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiError = {
  success: false;
  message: string;
  code: string;
  errors?: Array<{ field: string; message: string }>;
};

export type Pagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type Paginated<T> = {
  items: T[];
  pagination: Pagination;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  walletAddress?: string;
  createdAt: string;
};

export type Hotspot = {
  id: string;
  title: string;
  description: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  downloadSpeed: number;
  uploadSpeed: number;
  pricePerHour: number;
  rating: number;
  reviewCount: number;
  distanceKm?: number;
  status: HotspotStatus;
  isOnline: boolean;
  ownerId: string;
  createdAt: string;
};

export type HotspotDetail = Hotspot & {
  owner: {
    id: string;
    name: string;
  };
};

export type HotspotListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  minPrice?: number;
  maxPrice?: number;
  minSpeed?: number;
  status?: HotspotStatus;
  sort?: SortOption;
};

export type HotspotPayload = {
  title: string;
  description: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  downloadSpeed: number;
  uploadSpeed: number;
  pricePerHour: number;
  status?: Extract<HotspotStatus, "DRAFT" | "ACTIVE">;
};

export type Package = {
  id: string;
  hotspotId: string;
  name: string;
  durationMinutes: number;
  priceUsd: string;
  priceNativeToken: string;
  maxDevices: number;
  isActive: boolean;
};

export type PackagePayload = {
  hotspotId: string;
  name: string;
  durationMinutes: number;
  priceUsd?: string;
  priceNativeToken: string;
  maxDevices: number;
};

export type PaymentPreparation = {
  paymentId: string;
  packageId: string;
  amount: string;
  currency: "MON";
  chainId: 10143;
  contractAddress: string;
  recipientAddress: string;
  paymentStatus: PaymentStatus;
  expiresAt: string;
};

export type PaymentVerification = {
  purchaseId: string;
  paymentStatus: PaymentStatus;
  txHash: string;
};

export type WalletErrorCode = "WALLET_NOT_CONNECTED" | "WRONG_NETWORK" | "USER_REJECTED_TRANSACTION" | "INSUFFICIENT_FUNDS" | "TX_FAILED";

export type ActiveSession = {
  id: string;
  userId: string;
  purchaseId: string;
  hotspotId: string;
  status: SessionStatus;
  remainingSeconds: number;
  startedAt: string;
  endsAt: string;
};

export type CompletedSession = ActiveSession & {
  status: "ENDED" | "EXPIRED";
  endedAt: string;
};

export type OwnerAnalytics = {
  summary: {
    totalHotspots: number;
    totalRevenue: string;
    totalSessions: number;
    averageRating: number;
  };
  revenueSeries: Array<{ date: string; value: string }>;
};

export type Rating = {
  id: string;
  userId: string;
  hotspotId: string;
  purchaseId: string;
  score: number;
  comment: string;
  createdAt: string;
};

export type RatingPayload = {
  hotspotId: string;
  purchaseId: string;
  score: number;
  comment?: string;
};

export type AdminUser = User & {
  status: "ACTIVE" | "SUSPENDED";
};
