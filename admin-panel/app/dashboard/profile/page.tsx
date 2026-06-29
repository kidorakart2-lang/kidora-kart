import React from "react";
import { cookies } from "next/headers";
import Profile from "./Profile";
import { api } from "@/lib/api";
async function getDetails() {
  const cookie = await cookies();
  const token = cookie.get("adminToken");

  if (!token) return null;
  try {
    return await api.post("/api/website/user/profile", undefined, token.value);
  } catch {
    return null;
  }
}
export default async function page() {
  const details = await getDetails();
  return <Profile details={details} />;
}
