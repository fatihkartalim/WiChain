import { apiClient } from "@/lib/api-client";
import { shouldUseMocks } from "@/lib/mock-mode";
import hotspotDetailMock from "@/mocks/hotspot.detail.json";
import { archiveMockHotspot, createMockHotspot, readMockHotspots, updateMockHotspot } from "@/services/mock-store";
import type { ApiSuccess, Hotspot, HotspotDetail, HotspotListQuery, HotspotPayload, Paginated } from "@/types/api";

export async function getHotspots(query: HotspotListQuery = {}) {
  if (shouldUseMocks()) {
    const items = applyHotspotQuery(readMockHotspots(), query);
    return {
      items,
      pagination: {
        page: query.page ?? 1,
        limit: query.limit ?? 12,
        totalItems: items.length,
        totalPages: 1
      }
    } satisfies Paginated<Hotspot>;
  }

  const response = await apiClient.get<ApiSuccess<Paginated<Hotspot>>>("/hotspots", { params: query });
  return response.data.data;
}

export async function getHotspotById(id: string) {
  if (shouldUseMocks()) {
    return { ...(hotspotDetailMock.data as HotspotDetail), id };
  }

  const response = await apiClient.get<ApiSuccess<HotspotDetail>>(`/hotspots/${id}`);
  return response.data.data;
}

export async function createHotspot(payload: Partial<Hotspot>) {
  if (shouldUseMocks()) {
    return createMockHotspot(payload as HotspotPayload);
  }

  const response = await apiClient.post<ApiSuccess<{ id: string; ownerId: string; title: string; status: string; createdAt: string }>>(
    "/hotspots",
    payload
  );
  return response.data.data;
}

export async function updateHotspot(id: string, payload: Partial<Hotspot>) {
  if (shouldUseMocks()) {
    return updateMockHotspot(id, payload);
  }

  const response = await apiClient.patch<ApiSuccess<{ id: string; status: string; updatedAt: string }>>(`/hotspots/${id}`, payload);
  return response.data.data;
}

export async function deleteHotspot(id: string) {
  if (shouldUseMocks()) {
    return archiveMockHotspot(id);
  }

  const response = await apiClient.delete<ApiSuccess<{ id: string; status: string }>>(`/hotspots/${id}`);
  return response.data.data;
}

function applyHotspotQuery(items: Hotspot[], query: HotspotListQuery) {
  let results = [...items];
  const search = query.search?.trim().toLowerCase();

  if (search) {
    results = results.filter((item) => [item.title, item.description, item.city, item.address].join(" ").toLowerCase().includes(search));
  }
  if (query.status) {
    results = results.filter((item) => item.status === query.status);
  }

  return results.sort((a, b) => {
    if (query.sort === "price") {
      return a.pricePerHour - b.pricePerHour;
    }
    if (query.sort === "rating") {
      return b.rating - a.rating;
    }
    if (query.sort === "speed") {
      return b.downloadSpeed - a.downloadSpeed;
    }
    if (query.sort === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
  });
}
