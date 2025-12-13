import { create } from "zustand";
import axios from "axios";
import { API_URL, WS_URL } from "../lib/config";

export const useIssueStore = create((set) => ({
  issues: [],
  messages: [],
  ws: null,

  fetchIssues: async () => {
    const res = await axios.get(`${API_URL}/issues/`);
    set({ issues: res.data });
  },

  createIssue: async (title, projectId) => {
    const res = await axios.post(`${API_URL}/issues/`, {
      title,
      description: "",
      project_id: projectId,
    });

    set((s) => ({ issues: [res.data, ...s.issues] }));
  },

  connectWS: () => {
    const socket = new WebSocket(`${WS_URL}/ws`);
    socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "issue_created") {
          set((s) => ({ issues: [data.issue, ...s.issues] }));
        }
        set((s) => ({ messages: [ev.data, ...s.messages] }));
      } catch (_) {}
    };
    set({ ws: socket });
  }
}));
