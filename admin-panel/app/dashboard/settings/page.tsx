import SettingsSection, { type SettingsData } from "@/components/SettingsSection";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

interface StoreSettings {
  storePickupPincode: string;
}

async function getDetails(): Promise<SettingsData | null> {
  const cookie = await cookies();
  const token = cookie.get("adminToken");

  if (!token) return null;
  try {
    return await api.get<SettingsData>("/api/website/user/profile", token.value);
  } catch {
    return null;
  }
}

async function getStoreSettings(): Promise<StoreSettings | null> {
  try {
    const data = await api.get<StoreSettings>("/api/admin/settings");
    return data;
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const [data, storeSettings] = await Promise.all([getDetails(), getStoreSettings()]);
  return <SettingsSection data={data ?? undefined} storeSettings={storeSettings ?? undefined} />;
}
