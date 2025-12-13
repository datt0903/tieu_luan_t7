import { useEffect, useState } from "react";
import { useIssueStore } from "../store/useIssueStore";
import { useProjectStore } from "../store/useProjectStore";

export default function IssuesPage() {
  const { issues, fetchIssues, createIssue, connectWS } = useIssueStore();
  const { projects, fetchProjects } = useProjectStore();

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    fetchIssues();
    fetchProjects();
    connectWS();
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!title || !projectId) return;
    createIssue(title, projectId);
    setTitle("");
  };

  return (
    <div>
      <h3>Issues</h3>

      <form onSubmit={submit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Issue title"
        />

        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button>Create Issue</button>
      </form>

      <ul>
        {issues.map((i) => (
          <li key={i.id}>
            <b>{i.title}</b> — in project {i.project_id}
          </li>
        ))}
      </ul>
    </div>
  );
}
