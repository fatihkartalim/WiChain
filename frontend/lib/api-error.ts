import { AxiosError } from "axios";
import type { ApiError } from "@/types/api";

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong.") {
  const apiError = getApiError(error);
  return apiError?.message ?? fallback;
}

export function getApiErrorCode(error: unknown) {
  return getApiError(error)?.code;
}

export function getHttpStatus(error: unknown) {
  if (error instanceof AxiosError) {
    return error.response?.status;
  }

  return undefined;
}

function getApiError(error: unknown) {
  if (error instanceof AxiosError && error.response?.data && typeof error.response.data === "object") {
    return error.response.data as ApiError;
  }

  return null;
}
