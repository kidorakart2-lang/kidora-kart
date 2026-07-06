"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, setProfile } from "@/redux/features/auth";
import { getAuthToken } from "@/lib/getAuthToken";
import {
  fetchAndDispatchCart,
  fetchAndDispatchWishlist,
} from "@/lib/fetchCartWislist";

/**
 * Restore the Redux auth state from the userToken cookie on page load.
 * redux-persist persists isLogin/details to localStorage, so they survive
 * tab close. This is a safety net: if persistence failed (e.g. corrupt
 * data), re-bootstrap from the cookie so the header/profile work.
 */
function useAuthBootstrap() {
  const dispatch = useDispatch();
  const isLogin = useSelector((state: { auth?: { isLogin?: boolean } }) => state.auth?.isLogin ?? false);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    const token = getAuthToken();
    if (!token || isLogin) return;

    bootstrapped.current = true;
    dispatch(login());

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/user/profile`,
      {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      },
    )
      .then((r) => r.json())
      .then((data) => {
        if (data._status) {
          dispatch(setProfile(data._data));
        }
      })
      .catch(() => {});

    fetchAndDispatchCart(dispatch);
    fetchAndDispatchWishlist(dispatch);
  }, [dispatch, isLogin]);
}

export default function GuestDataInitializer({ children }: { children: React.ReactNode }) {
  useAuthBootstrap();

  return children;
}
