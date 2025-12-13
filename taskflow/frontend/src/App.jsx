import { useState, useEffect } from 'react'
import KanbanBoard from './components/KanbanBoard'
import StatsPanel from './components/StatsPanel'
import './index.css'

function App() {
  const [projects, setProjects] = useState([])
  const [issues, setIssues] = useState([])
  const [stats, setStats] = useState(null)
  const [notifications, setNotifications] = useState([])

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchData()
    setupWebSocket()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, issuesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/projects`),
        fetch(`${API_URL}/api/v1/issues`),
        fetch(`${API_URL}/api/v1/statistics`)
      ])
      
      setProjects(await projectsRes.json())
      setIssues(await issuesRes.json())
      setStats(await statsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const setupWebSocket = () => {
    const ws = new WebSocket(`ws://localhost:8000/ws`)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('WebSocket message:', data)
      
      if (data.type === 'notification') {
        setNotifications(prev => [
          { message: data.message, timestamp: new Date().toLocaleTimeString() },
          ...prev.slice(0, 9)
        ])
      } else if (data.type === 'issue_created' || data.type === 'issue_updated') {
        fetchData() // Refresh data
      }
    }
    
    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }
  }

  const createIssue = async (issueData) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData)
      })
      
      if (response.ok) {
        await fetchData()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating issue:', error)
      return false
    }
  }

  const updateIssueStatus = async (issueId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        await fetchData()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating issue:', error)
      return false
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>TaskFlow - Project Management Tool</h1>
        <div className="header-actions">
          <button onClick={fetchData} className="btn refresh-btn">
            Refresh
          </button>
          <div className="notification-badge">
            <span>📢 {notifications.length}</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="sidebar">
          <StatsPanel stats={stats} />
          <div className="notifications-panel">
            <h3>Recent Notifications</h3>
            {notifications.map((note, index) => (
              <div key={index} className="notification-item">
                <p>{note.message}</p>
                <small>{note.timestamp}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="main-content">
          <KanbanBoard 
            issues={issues}
            projects={projects}
            onCreateIssue={createIssue}
            onUpdateIssue={updateIssueStatus}
          />
        </div>
      </main>

      <footer className="app-footer">
        <p>TaskFlow v1.0.0 - Real-time Project Management Tool</p>
      </footer>
    </div>
  )
}

export default App