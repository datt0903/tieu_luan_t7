import { create } from "zustand";
import axios from "axios";
import { API_URL } from "../lib/config";

export const useProjectStore = create((set) => ({
  projects: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    const res = await axios.get(`${API_URL}/projects/`);
    set({ projects: res.data, loading: false });
  },

  createProject: async (name) => {
    const res = await axios.post(`${API_URL}/projects/`, {
      name,
      description: ""
    });
    set((state) => ({ projects: [res.data, ...state.projects] }));
  }
}));
