import { create } from 'zustand';
import axios from 'axios';
import { API_BASE_URL } from '../lib/config';

export const useIssueStore = create((set, get) => ({
  issues: [],
  stats: null,
  currentProjectId: null,

  fetchIssues: async (projectId = null) => {
    try {
      const url = projectId 
        ? `${API_BASE_URL}/issues?project_id=${projectId}` 
        : `${API_BASE_URL}/issues`;
      const res = await axios.get(url);
      set({ issues: res.data, currentProjectId: projectId });
    } catch (error) { console.error(error); }
  },

  fetchStats: async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/statistics`);
      set({ stats: res.data });
    } catch (error) { console.error(error); }
  },

  createIssue: async (issueData) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/issues`, issueData);
      const currentPid = get().currentProjectId;
      if (!currentPid || currentPid === issueData.project_id) {
          set(state => ({ issues: [...state.issues, res.data] }));
      }
      get().fetchStats();
    } catch (error) { 
        console.error(error); 
        alert("Lỗi tạo Task! Hãy kiểm tra xem đã chọn Project chưa.");
    }
  },

  updateIssueStatus: async (id, newStatus) => {
    try {
      set(state => ({
        issues: state.issues.map(i => i.id === id ? { ...i, status: newStatus } : i)
      }));
      await axios.put(`${API_BASE_URL}/issues/${id}`, { status: newStatus });
      get().fetchStats();
    } catch (error) { get().fetchIssues(get().currentProjectId); }
  },

  deleteIssue: async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/issues/${id}`);
      set(state => ({ issues: state.issues.filter(i => i.id !== id) }));
      get().fetchStats();
    } catch (error) { console.error(error); }
  }
}));