import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Folder, Trash2, Plus } from 'lucide-react';

const ProjectsPage = () => {
  const { projects, fetchProjects, createProject, deleteProject } = useProjectStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProjectName) return;
    await createProject(newProjectName, "Description here");
    setNewProjectName("");
    setIsCreating(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button onClick={() => setIsCreating(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus size={20} /> New Project
        </button>
      </div>
      {isCreating && (
        <form onSubmit={handleCreate} className="mb-6 bg-white p-4 rounded-lg shadow-sm border flex gap-3">
          <input type="text" placeholder="Project name..." className="flex-1 border rounded px-3 py-2 outline-none"
            value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} autoFocus />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
          <button type="button" onClick={() => setIsCreating(false)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
        </form>
      )}
      <div className="grid gap-4">
        {projects.map(project => (
          <div key={project.id} className="bg-white p-5 rounded-lg border flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-lg"><Folder className="text-indigo-600" size={24} /></div>
              <h3 className="font-semibold text-gray-800 text-lg">{project.name}</h3>
            </div>
            <button onClick={() => deleteProject(project.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ProjectsPage;