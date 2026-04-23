import { apiClient } from "@/lib/api-client";
import { shouldUseMocks } from "@/lib/mock-mode";
import { createMockPackage, readMockPackages, updateMockPackage } from "@/services/mock-store";
import type { ApiSuccess, Package, PackagePayload } from "@/types/api";

export async function getPackagesByHotspot(hotspotId: string) {
  if (shouldUseMocks()) {
    return readMockPackages(hotspotId);
  }

  const response = await apiClient.get<ApiSuccess<Package[]>>(`/hotspots/${hotspotId}/packages`);
  return response.data.data;
}

export async function createPackage(payload: Partial<Package>) {
  if (shouldUseMocks()) {
    return createMockPackage(payload as PackagePayload);
  }

  const response = await apiClient.post<ApiSuccess<{ id: string; hotspotId: string; name: string }>>("/packages", payload);
  return response.data.data;
}

export async function updatePackage(id: string, payload: Partial<Package>) {
  if (shouldUseMocks()) {
    return updateMockPackage(id, payload);
  }

  const response = await apiClient.patch<ApiSuccess<{ id: string; isActive: boolean; updatedAt: string }>>(`/packages/${id}`, payload);
  return response.data.data;
}
