import type { UserRole } from "@/types/api";

export function routeForRole(role: UserRole) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "NODE_OWNER") {
    return "/owner";
  }

  return "/dashboard";
}
