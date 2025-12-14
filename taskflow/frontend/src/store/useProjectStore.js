import { create } from 'zustand';
import axios from 'axios';
import { API_BASE_URL } from '../lib/config';

export const useProjectStore = create((set) => ({
  projects: [],
  fetchProjects: async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/projects`);
      set({ projects: res.data });
    } catch (error) { console.error(error); }
  },
  createProject: async (name, description) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/projects`, { name, description });
      set(state => ({ projects: [...state.projects, res.data] }));
    } catch (error) { console.error(error); }
  },
  deleteProject: async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/projects/${id}`);
      set(state => ({ projects: state.projects.filter(p => p.id !== id) }));
    } catch (error) { console.error(error); }
  }
}));