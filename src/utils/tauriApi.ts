import { invoke } from "@tauri-apps/api/core";

export const getOrganizationPlan = async (path: string, customCategories: [string, string[]][]) => {
  return await invoke("get_organization_plan", { path, customCategories });
};

export const organizeFiles = async (path: string, customCategories: [string, string[]][]) => {
  return await invoke("organize_files", { path, customCategories });
};

export const undoOrganization = async (path: string) => {
  return await invoke("undo_organization", { path });
};
