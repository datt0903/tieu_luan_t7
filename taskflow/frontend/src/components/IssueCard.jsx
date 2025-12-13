import React, { useState } from 'react';

const IssueCard = ({ issue, onDragStart, onUpdateIssue, onDeleteIssue }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedIssue, setEditedIssue] = useState({ ...issue });

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 1: return '#ff4757'; // Urgent
      case 2: return '#ffa502'; // High
      case 3: return '#2ed573'; // Medium/Low
      default: return '#747d8c';
    }
  };

  const handleSave = () => {
    onUpdateIssue(editedIssue);
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Bạn có chắc muốn xóa issue "${issue.title}"?`)) {
      onDeleteIssue(issue.id);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      {/* Card chính - click để mở modal */}
      <div
        className="issue-card"
        draggable
        onDragStart={(e) => onDragStart(e, issue.id)}
        onClick={() => setIsModalOpen(true)}
        style={{ cursor: 'pointer' }}
      >
        <div className="issue-header">
          <div className="issue-title">
            {issue.title}
            <span 
              className="priority-dot"
              style={{ backgroundColor: getPriorityColor(issue.priority) }}
            />
          </div>
        </div>
        
        <div className="issue-description">
          {issue.description || 'No description'}
        </div>
        
        <div className="issue-meta">
          <span className="assignee">👤 {issue.assignee || 'Unassigned'}</span>
          <span className="project">📁 Project {issue.project_id}</span>
        </div>
        
        <div className="issue-footer">
          <small className="date">
            Created: {new Date(issue.created_at).toLocaleDateString()}
          </small>
        </div>
      </div>

      {/* Modal chi tiết + sửa + xóa */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Issue' : issue.title}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              {isEditing ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={editedIssue.title}
                      onChange={(e) => setEditedIssue({ ...editedIssue, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={editedIssue.description || ''}
                      onChange={(e) => setEditedIssue({ ...editedIssue, description: e.target.value })}
                      rows="4"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={editedIssue.status}
                      onChange={(e) => setEditedIssue({ ...editedIssue, status: e.target.value })}
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assignee</label>
                    <input
                      type="text"
                      value={editedIssue.assignee || ''}
                      onChange={(e) => setEditedIssue({ ...editedIssue, assignee: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="issue-details">
                  <p><strong>Description:</strong><br />{issue.description || 'No description'}</p>
                  <p><strong>Status:</strong> {issue.status}</p>
                  <p><strong>Assignee:</strong> {issue.assignee || 'Unassigned'}</p>
                  <p><strong>Project ID:</strong> {issue.project_id}</p>
                  <p><strong>Priority:</strong> 
                    <span style={{ color: getPriorityColor(issue.priority), marginLeft: '8px' }}>
                      {issue.priority === 1 ? 'Urgent' : issue.priority === 2 ? 'High' : 'Normal'}
                    </span>
                  </p>
                  <p><strong>Created:</strong> {new Date(issue.created_at).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {isEditing ? (
                <>
                  <button className="btn btn-success" onClick={handleSave}>Save</button>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit</button>
                  <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                  <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IssueCard;