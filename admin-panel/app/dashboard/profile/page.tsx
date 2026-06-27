import React from "react";
import { cookies } from "next/headers";
import Profile from "./Profile";
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
export default async function page() {
  const details = await getDetails();
  return <Profile details={details} />;
}
