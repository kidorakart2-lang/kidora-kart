import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import type { UserDetails } from "@/types";

const initialState: {
  user: string | null;
  isLogin: boolean;
  details: UserDetails;
} = {
  user: Cookies.get("user") || null,
  isLogin: !!Cookies.get("user"),
  details: {},
};

export const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      Cookies.set("user", action.payload, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: 7,
      });
      Cookies.set("expires", String(Date.now() + 6 * 24 * 60 * 60 * 1000), {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      state.isLogin = true;
    },
    logout: (state) => {
      state.user = null;
      state.details = {};
      Cookies.remove("user");
      Cookies.remove("expires");
      state.isLogin = false;
    },
    register: (state, action) => {
      state.user = action.payload;
      Cookies.set("user", action.payload, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: 7,
      });
      Cookies.set("expires", String(Date.now() + 7 * 24 * 60 * 60 * 1000), {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      state.isLogin = true;
    },
    setProfile: (state, action) => {
      state.details = action.payload;
    },
  },
});

export const { login, logout, register, setProfile } = authSlice.actions;
export default authSlice.reducer;
