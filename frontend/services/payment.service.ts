import { apiClient } from "@/lib/api-client";
import { shouldUseMocks } from "@/lib/mock-mode";
import prepareMock from "@/mocks/payment.prepare.json";
import verifyMock from "@/mocks/payment.verify.json";
import type { ApiSuccess, PaymentPreparation, PaymentVerification } from "@/types/api";

export async function preparePayment(packageId: string) {
  if (shouldUseMocks()) {
    return { ...prepareMock.data, packageId } as PaymentPreparation;
  }

  const response = await apiClient.post<ApiSuccess<PaymentPreparation>>("/payments/prepare", { packageId });
  return response.data.data;
}

export async function verifyPayment(packageId: string, txHash: string) {
  if (shouldUseMocks()) {
    return { ...verifyMock.data, txHash } as PaymentVerification;
  }

  const response = await apiClient.post<ApiSuccess<PaymentVerification>>("/payments/verify", { packageId, txHash });
  return response.data.data;
}
