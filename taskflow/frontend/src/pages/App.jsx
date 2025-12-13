import { Routes, Route, Link } from "react-router-dom";
import ProjectsPage from "./ProjectsPage";
import IssuesPage from "./IssuesPage";

export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Project Management Tool</h2>

      <nav style={{ marginBottom: 20 }}>
        <Link to="/" style={{ marginRight: 20 }}>Projects</Link>
        <Link to="/issues">Issues</Link>
      </nav>

      <Routes>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/issues" element={<IssuesPage />} />
      </Routes>
    </div>
  );
}
