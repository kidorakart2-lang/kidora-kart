import { createSlice } from "@reduxjs/toolkit";


const initialState = {
  logo: null,
};

const logoSlice = createSlice({
  name: "logo",
  initialState,
  reducers: {
    setLogo: (state, action) => {
      state.logo = action.payload;
    },
    
  },
 
});

export const { setLogo } = logoSlice.actions;
export default logoSlice.reducer;
