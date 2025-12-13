import { useEffect, useState } from "react";
import { useProjectStore } from "../store/useProjectStore";

export default function ProjectsPage() {
  const { projects, fetchProjects, createProject } = useProjectStore();
  const [name, setName] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!name) return;
    createProject(name);
    setName("");
  };

  return (
    <div>
      <h3>Projects</h3>

      <form onSubmit={submit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
        />
        <button>Create</button>
      </form>

      <ul>
        {projects.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}
