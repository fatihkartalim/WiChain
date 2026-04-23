import hotspotsMock from "@/mocks/hotspots.list.json";
import packagesMock from "@/mocks/packages.list.json";
import type { AdminUser, Hotspot, HotspotPayload, HotspotStatus, Package, PackagePayload } from "@/types/api";

const HOTSPOTS_KEY = "mockHotspots";
const PACKAGES_KEY = "mockPackages";

const fallbackUsers: AdminUser[] = [
  {
    id: "2c1e7b1a-df9a-4935-a75b-0579bc331c9b",
    name: "Demo User",
    email: "user@depin.test",
    role: "USER",
    walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    createdAt: "2026-04-22T10:30:00.000Z",
    status: "ACTIVE"
  },
  {
    id: "ed240f15-f73a-4ddf-b448-0b67044f59c1",
    name: "Demo Owner",
    email: "owner@depin.test",
    role: "NODE_OWNER",
    createdAt: "2026-04-22T11:10:00.000Z",
    status: "ACTIVE"
  },
  {
    id: "c6b37d5a-1149-4bda-b07b-26ef29bbefad",
    name: "Demo Admin",
    email: "admin@depin.test",
    role: "ADMIN",
    createdAt: "2026-04-22T12:45:00.000Z",
    status: "ACTIVE"
  }
];

export function readMockHotspots() {
  const stored = readStorage<Hotspot[]>(HOTSPOTS_KEY);
  if (stored) {
    return stored;
  }

  return hotspotsMock.data.items as Hotspot[];
}

export function createMockHotspot(payload: HotspotPayload, ownerId = "ed240f15-f73a-4ddf-b448-0b67044f59c1") {
  const now = new Date().toISOString();
  const hotspot: Hotspot = {
    ...payload,
    id: crypto.randomUUID(),
    ownerId,
    rating: 0,
    reviewCount: 0,
    distanceKm: 0,
    isOnline: payload.status === "ACTIVE",
    status: payload.status ?? "DRAFT",
    createdAt: now
  };
  writeMockHotspots([hotspot, ...readMockHotspots()]);
  return { id: hotspot.id, ownerId: hotspot.ownerId, title: hotspot.title, status: hotspot.status, createdAt: hotspot.createdAt };
}

export function updateMockHotspot(id: string, payload: Partial<Hotspot>) {
  let updatedStatus: HotspotStatus = "DRAFT";
  const updated = readMockHotspots().map((item) => {
    if (item.id !== id) {
      return item;
    }

    const next = { ...item, ...payload };
    updatedStatus = next.status;
    return next;
  });
  writeMockHotspots(updated);
  return { id, status: updatedStatus, updatedAt: new Date().toISOString() };
}

export function archiveMockHotspot(id: string) {
  updateMockHotspot(id, { status: "ARCHIVED", isOnline: false });
  return { id, status: "ARCHIVED" };
}

export function readMockPackages(hotspotId?: string) {
  const stored = readStorage<Package[]>(PACKAGES_KEY) ?? [];
  const seeded = packagesMock.data as Package[];
  const items = [...stored, ...seeded.filter((seed) => !stored.some((item) => item.id === seed.id))];
  return hotspotId ? items.filter((item) => item.hotspotId === hotspotId) : items;
}

export function createMockPackage(payload: PackagePayload) {
  const item: Package = {
    id: crypto.randomUUID(),
    hotspotId: payload.hotspotId,
    name: payload.name,
    durationMinutes: payload.durationMinutes,
    priceUsd: payload.priceUsd ?? "",
    priceNativeToken: payload.priceNativeToken,
    maxDevices: payload.maxDevices,
    isActive: true
  };
  writeMockPackages([item, ...readMockPackages()]);
  return { id: item.id, hotspotId: item.hotspotId, name: item.name };
}

export function updateMockPackage(id: string, payload: Partial<Package>) {
  let isActive = true;
  const updated = readMockPackages().map((item) => {
    if (item.id !== id) {
      return item;
    }

    const next = { ...item, ...payload };
    isActive = next.isActive;
    return next;
  });
  writeMockPackages(updated);
  return { id, isActive, updatedAt: new Date().toISOString() };
}

export function readMockUsers() {
  return fallbackUsers;
}

function writeMockHotspots(items: Hotspot[]) {
  writeStorage(HOTSPOTS_KEY, items);
}

function writeMockPackages(items: Package[]) {
  writeStorage(PACKAGES_KEY, items);
}

function readStorage<T>(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}
