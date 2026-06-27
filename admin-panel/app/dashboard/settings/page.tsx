import SettingsSection from "@/components/SettingsSection";
import { cookies } from "next/headers";

async function getDetails() {
  const cookie = await cookies();
  const token = cookie.get("adminToken");

  if (!token) return null;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}api/website/user/profile`,
    {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      method: "post",
    }
  );
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  if (!response.ok || !data._status) {
    return null;
  }
  return data._data;
}

export default async function SettingsPage() {
  return <SettingsSection data={await getDetails()} />;
}
