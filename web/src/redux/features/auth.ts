import { createSlice } from "@reduxjs/toolkit";
import type { UserDetails } from "@/types";

const initialState: {
  user: string | null;
  isLogin: boolean;
  details: UserDetails;
} = {
  user: null,
  isLogin: false,
  details: {},
};

export const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isLogin = true;
    },
    logout: (state) => {
      state.user = null;
      state.details = {};
      state.isLogin = false;
    },
    register: (state, action) => {
      state.user = action.payload;
      state.isLogin = true;
    },
    setProfile: (state, action) => {
      state.details = action.payload;
    },
  },
});

export const { login, logout, register, setProfile } = authSlice.actions;
export default authSlice.reducer;
