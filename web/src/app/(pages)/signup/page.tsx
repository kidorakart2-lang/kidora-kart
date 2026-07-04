import SignUpPage from '@/app/(sections)/SignUp';
import React from 'react'
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Sign Up",
    description:
      "Sign Up Page",
  };

export default async function page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("userToken");
  if (token) {
    redirect("/");
  }

  return (
    <>
    <SignUpPage />
    </>
  )
}
