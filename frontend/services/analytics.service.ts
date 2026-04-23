import { apiClient } from "@/lib/api-client";
import { shouldUseMocks } from "@/lib/mock-mode";
import analyticsMock from "@/mocks/analytics.owner.json";
import type { ApiSuccess, OwnerAnalytics } from "@/types/api";

export async function getOwnerAnalytics() {
  if (shouldUseMocks()) {
    return analyticsMock.data as OwnerAnalytics;
  }

  const response = await apiClient.get<ApiSuccess<OwnerAnalytics>>("/analytics/owner");
  return response.data.data;
}
