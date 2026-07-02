import Cookies from "js-cookie";

export const getAuthToken = (): string | null => {
  try {
    const cookieToken = Cookies.get("userToken");
    if (cookieToken) return cookieToken;
  } catch {
    // ignore
  }

  return null;
};
