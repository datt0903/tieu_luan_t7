import React, { useEffect } from 'react';
import { useIssueStore } from '../store/useIssueStore';
import IssueCard from './IssueCard';

const KanbanBoard = () => {
  const { issues, fetchIssues } = useIssueStore();

  useEffect(() => {
    fetchIssues();
  }, []);

  const columns = [
    { id: "To Do", label: "To Do", color: "bg-yellow-500" },
    { id: "In Progress", label: "In Progress", color: "bg-purple-500" },
    { id: "Done", label: "Done", color: "bg-green-500" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map(col => (
        <div key={col.id} className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 min-h-[500px]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${col.color}`} />
              {col.label}
            </h2>
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
              {issues.filter(i => i.status === col.id).length}
            </span>
          </div>
          
          <div className="space-y-3">
            {issues
              .filter(i => i.status === col.id)
              .map(issue => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            {issues.filter(i => i.status === col.id).length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm italic">
                No tasks
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;