import { apiClient } from "@/lib/api-client";
import { shouldUseMocks } from "@/lib/mock-mode";
import { readMockHotspots, readMockUsers } from "@/services/mock-store";
import type { AdminUser, ApiSuccess, Hotspot, Paginated } from "@/types/api";

type AdminListResponse<T> = {
  items: T[];
  pagination?: Paginated<T>["pagination"];
};

export async function getUsers() {
  if (shouldUseMocks()) {
    return {
      items: readMockUsers(),
      pagination: {
        page: 1,
        limit: 25,
        totalItems: readMockUsers().length,
        totalPages: 1
      }
    } satisfies Paginated<AdminUser>;
  }

  const response = await apiClient.get<ApiSuccess<AdminListResponse<AdminUser>>>("/admin/users");
  return normalizeAdminList(response.data.data);
}

export async function getAdminHotspots() {
  if (shouldUseMocks()) {
    const items = readMockHotspots();
    return {
      items,
      pagination: {
        page: 1,
        limit: 25,
        totalItems: items.length,
        totalPages: 1
      }
    } satisfies Paginated<Hotspot>;
  }

  const response = await apiClient.get<ApiSuccess<AdminListResponse<Hotspot>>>("/admin/hotspots");
  return normalizeAdminList(response.data.data);
}

function normalizeAdminList<T>(data: AdminListResponse<T>) {
  return {
    items: data.items,
    pagination: data.pagination ?? {
      page: 1,
      limit: data.items.length,
      totalItems: data.items.length,
      totalPages: 1
    }
  } satisfies Paginated<T>;
}
