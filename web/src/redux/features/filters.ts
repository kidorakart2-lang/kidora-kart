import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../store/store";

interface FiltersState {
  category: string[];
  color: string[];
  material: string[];
  priceFrom: number;
  priceTo: number;
  sortBy: string;
  quickFilter: string | null;
}

const initialState: FiltersState = {
  category: [],
  color: [],
  material: [],
  priceFrom: 0,
  priceTo: 100000,
  sortBy: "featured",
  quickFilter: null,
};

export const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setCategory: (state, action) => {
      state.category = action.payload;
    },
    toggleCategory: (state, action) => {
      const category = action.payload;
      state.category = state.category.includes(category)
        ? state.category.filter((c) => c !== category)
        : [...state.category, category];
    },
    setColor: (state, action) => {
      state.color = action.payload;
    },
    toggleColor: (state, action) => {
      const color = action.payload;
      state.color = state.color.includes(color)
        ? state.color.filter((c) => c !== color)
        : [...state.color, color];
    },
    setMaterial: (state, action) => {
      state.material = action.payload;
    },
    toggleMaterial: (state, action) => {
      const material = action.payload;
      state.material = state.material.includes(material)
        ? state.material.filter((m) => m !== material)
        : [...state.material, material];
    },
    setPriceRange: (state, action) => {
      const { priceFrom, priceTo } = action.payload;
      state.priceFrom = priceFrom;
      state.priceTo = priceTo;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    resetFilters: (state) => {
      Object.assign(state, initialState);
    },
    setFiltersFromURL: (state, action) => {
      Object.assign(state, action.payload);
    },
    setQuickFilter: (state, action) => {
      // Toggle off if same filter is selected
      state.quickFilter =
        state.quickFilter === action.payload ? null : action.payload;
    },
  },
});

export const {
  setCategory,
  toggleCategory,
  setColor,
  toggleColor,
  setMaterial,
  toggleMaterial,
  setPriceRange,
  setSortBy,
  resetFilters,
  setFiltersFromURL,
  setQuickFilter,
} = filtersSlice.actions;

export const selectFilters = (state: RootState) => state.filters;
export const selectCategory = (state: RootState) => state.filters.category;
export const selectColor = (state: RootState) => state.filters.color;
export const selectMaterial = (state: RootState) => state.filters.material;
export const selectPriceRange = (state: RootState) => ({
  priceFrom: state.filters.priceFrom,
  priceTo: state.filters.priceTo,
});
export const selectSortBy = (state: RootState) => state.filters.sortBy;

export default filtersSlice.reducer;
