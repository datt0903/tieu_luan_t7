import React, { useState, useEffect } from 'react';
import KanbanBoard from '../components/KanbanBoard';
import StatsPanel from '../components/StatsPanel';
import { useIssueStore } from '../store/useIssueStore';
import { useProjectStore } from '../store/useProjectStore';
import { Plus, Filter } from 'lucide-react';

const IssuesPage = () => {
  const { fetchIssues, createIssue } = useIssueStore();
  const { projects, fetchProjects } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(""); 
  const [formData, setFormData] = useState({ title: "", description: "" });

  useEffect(() => { fetchProjects(); }, []);

  // Tự động chọn dự án đầu tiên
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  // Lọc task theo dự án
  useEffect(() => {
    if (selectedProjectId) fetchIssues(selectedProjectId);
    else fetchIssues(null);
  }, [selectedProjectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;
    await createIssue({
      title: formData.title,
      description: formData.description,
      status: "To Do",
      project_id: Number(selectedProjectId)
    });
    setFormData({ title: "", description: "" });
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500"/>
            <select className="border border-gray-300 rounded px-2 py-1 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedProjectId} onChange={(e) => setSelectedProjectId(Number(e.target.value))}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                {projects.length === 0 && <option value="">No Projects</option>}
            </select>
          </div>
        </div>
        <button onClick={() => projects.length > 0 ? setShowModal(true) : alert("Create a project first!")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm font-medium">
          <Plus size={20} /> New Issue
        </button>
      </div>
      <StatsPanel />
      {projects.length > 0 ? <KanbanBoard /> : <div className="text-center py-20 text-gray-500">Please go to <b>Projects</b> page and create a new project first.</div>}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">New Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" className="w-full border rounded-lg p-2 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Title" autoFocus />
              <textarea className="w-full border rounded-lg p-2 outline-none h-24 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Description" />
              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default IssuesPage;