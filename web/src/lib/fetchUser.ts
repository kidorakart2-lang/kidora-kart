import { logout } from "@/redux/features/auth";
import Cookies from "js-cookie";

export const getUser = async () => {
  const token = Cookies.get("user");

  if (!token) {
    return null;
  }
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}api/website/user/profile`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
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
  return data;
};
