const StatsPanel = ({ stats }) => {
  if (!stats) {
    return (
      <div className="stats-panel">
        <h3>📊 Statistics</h3>
        <p>Loading statistics...</p>
      </div>
    )
  }

  return (
    <div className="stats-panel">
      <h3>📊 Statistics</h3>
      
      <div className="stat-item">
        <span>Total Projects:</span>
        <span className="stat-value">{stats.total_projects}</span>
      </div>
      
      <div className="stat-item">
        <span>Total Issues:</span>
        <span className="stat-value">{stats.total_issues}</span>
      </div>
      
      {Object.entries(stats.issues_by_status).map(([status, count]) => (
        <div key={status} className="stat-item">
          <span>{status}:</span>
          <span className="stat-value">{count}</span>
        </div>
      ))}
      
      <div className="recent-issues">
        <h4>Recent Issues</h4>
        {stats.recent_issues.slice(0, 3).map(issue => (
          <div key={issue.id} className="recent-issue">
            <strong>{issue.title}</strong>
            <small>{issue.status}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatsPanel