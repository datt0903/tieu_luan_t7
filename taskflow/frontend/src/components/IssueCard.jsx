import React from 'react';
import { useIssueStore } from '../store/useIssueStore';
import { Trash2 } from 'lucide-react';

const IssueCard = ({ issue }) => {
  const { updateIssueStatus, deleteIssue } = useIssueStore();

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-800 line-clamp-2">{issue.title}</h3>
        <button 
          onClick={() => deleteIssue(issue.id)}
          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{issue.description || "No description"}</p>
      
      <div className="flex justify-between items-center">
        <span className="text-xs font-mono text-gray-400">#{issue.id}</span>
        <select 
          value={issue.status} 
          onChange={(e) => updateIssueStatus(issue.id, e.target.value)}
          className={`text-xs font-medium px-2 py-1 rounded cursor-pointer border-0 ring-1 ring-inset focus:ring-2 
            ${issue.status === 'Done' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
              issue.status === 'In Progress' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' : 
              'bg-yellow-50 text-yellow-800 ring-yellow-600/20'}`}
        >
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>
    </div>
  );
};

export default IssueCard;