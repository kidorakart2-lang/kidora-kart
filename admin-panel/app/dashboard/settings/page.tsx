import SettingsSection, { type SettingsData } from "@/components/SettingsSection";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

async function getDetails(): Promise<SettingsData | null> {
  const cookie = await cookies();
  const token = cookie.get("adminToken");

  if (!token) return null;
  try {
    return await api.post<SettingsData>("/api/website/user/profile", undefined, token.value);
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const data = await getDetails();
  return <SettingsSection data={data ?? undefined} />;
}
