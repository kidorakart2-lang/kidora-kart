import { api } from "@/lib/api";
import type { MaterialItem, ColorItem } from "@/lib/types";

export const fetchMaterials = async (isDeletedAt?: string): Promise<MaterialItem[]> => {
  const data = await api.post<MaterialItem[]>("/api/admin/material/view", { isDeletedAt });
  return data ?? [];
};

export const fetchColors = async (isDeletedAt?: string): Promise<ColorItem[]> => {
  const data = await api.post<ColorItem[]>("/api/admin/color/view", { isDeletedAt });
  return data ?? [];
};

export const createMaterial = async (data: Record<string, unknown>) => {
  return api.post("/api/admin/material/create", data);
};

export const updateMaterial = async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
  return api.put(`/api/admin/material/update/${id}`, data);
};

export const deleteMaterial = async (id: string) => {
  return api.put("/api/admin/material/destroy", { id });
};

export const changeMaterialStatus = async (id: string) => {
  return api.post("/api/admin/material/change-status", { id });
};

export const createColor = async (data: Record<string, unknown>) => {
  return api.post("/api/admin/color/create", data);
};

export const updateColor = async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
  return api.put(`/api/admin/color/update/${id}`, data);
};

export const deleteColor = async (id: string) => {
  return api.put("/api/admin/color/destroy", { id });
};

export const changeColorStatus = async (id: string) => {
  return api.post("/api/admin/color/change-status", { id });
};
