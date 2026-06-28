import { getAuthToken } from "@/lib/getAuthToken";

export const getUser = async () => {
  const token = getAuthToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/user/profile`,
      {
        headers,
        credentials: "include",
      }
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (!data._status) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
};
