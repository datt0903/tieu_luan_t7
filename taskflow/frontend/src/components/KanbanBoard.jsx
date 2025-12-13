import React, { useState } from 'react';
import IssueCard from './IssueCard';

const KanbanBoard = ({ issues = [], projects = [], onCreateIssue, onUpdateIssue }) => {
  const [showForm, setShowForm] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    status: 'To Do',
    project_id: projects.length > 0 ? projects[0].id : 1,
    assignee: 'Unassigned'
  });

  // Phân cột
  const columns = {
    'To Do': issues.filter(issue => issue.status === 'To Do'),
    'In Progress': issues.filter(issue => issue.status === 'In Progress'),
    'Done': issues.filter(issue => issue.status === 'Done')
  };

  const handleDragStart = (e, issueId) => {
    e.dataTransfer.setData('issueId', issueId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const issueId = e.dataTransfer.getData('issueId');
    
    if (issueId) {
      await onUpdateIssue(parseInt(issueId), targetStatus);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newIssue.title.trim()) return;

    const success = await onCreateIssue({
      ...newIssue,
      priority: 3, // default medium
    });

    if (success) {
      setNewIssue({
        title: '',
        description: '',
        status: 'To Do',
        project_id: projects.length > 0 ? projects[0].id : 1,
        assignee: 'Unassigned'
      });
      setShowForm(false);
    }
  };

  return (
    <div className="kanban-container">
      <div className="board-header">
        <h2>Kanban Board</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add New Issue'}
        </button>
      </div>

      {/* Form tạo Issue */}
      {showForm && (
        <form onSubmit={handleSubmit} className="add-issue-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={newIssue.title}
              onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
              required
              placeholder="Enter issue title"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newIssue.description}
              onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
              placeholder="Enter issue description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Project</label>
            <select
              value={newIssue.project_id}
              onChange={(e) => setNewIssue({ ...newIssue, project_id: parseInt(e.target.value) })}
            >
              {projects.length > 0 ? (
                projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              ) : (
                <option value={1}>Default Project</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Assignee</label>
            <input
              type="text"
              value={newIssue.assignee}
              onChange={(e) => setNewIssue({ ...newIssue, assignee: e.target.value })}
              placeholder="Enter assignee name"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Create Issue
            </button>
          </div>
        </form>
      )}

      {/* Kanban Columns */}
      <div className="kanban-board">
        {Object.entries(columns).map(([status, columnIssues]) => (
          <div
            key={status}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="column-header">
              <h3>{status}</h3>
              <span className="issue-count">{columnIssues.length}</span>
            </div>

            <div className="column-content">
              {columnIssues.map(issue => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onDragStart={handleDragStart}
                  onUpdateIssue={onUpdateIssue}  
                  onDeleteIssue={onDeleteIssue}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;