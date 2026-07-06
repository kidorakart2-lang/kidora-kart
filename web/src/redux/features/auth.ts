import { createSlice } from "@reduxjs/toolkit";
import type { UserDetails } from "@/types";

const initialState: {
  isLogin: boolean;
  details: UserDetails;
} = {
  isLogin: false,
  details: {},
};

export const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    login: (state) => {
      state.isLogin = true;
    },
    logout: (state) => {
      state.details = {};
      state.isLogin = false;
    },
    register: (state) => {
      state.isLogin = true;
    },
    setProfile: (state, action) => {
      state.details = action.payload;
    },
  },
});

export const { login, logout, register, setProfile } = authSlice.actions;
export default authSlice.reducer;
