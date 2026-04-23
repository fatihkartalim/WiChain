export const queryKeys = {
  authMe: ["auth", "me"] as const,
  hotspots: ["hotspots", "list"] as const,
  hotspotDetail: (id: string) => ["hotspots", "detail", id] as const,
  packages: (hotspotId: string) => ["packages", hotspotId] as const,
  activeSession: ["sessions", "active"] as const,
  ownerAnalytics: ["analytics", "owner"] as const,
  ratings: (hotspotId: string) => ["ratings", hotspotId] as const,
  adminUsers: ["admin", "users"] as const,
  adminHotspots: ["admin", "hotspots"] as const
};
