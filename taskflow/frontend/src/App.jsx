import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import IssuesPage from './pages/IssuesPage';
import ProjectsPage from './pages/ProjectsPage';
import { Layout, ListTodo, Layers } from 'lucide-react';

const NavLink = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-700 font-medium' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon size={20} />
      {children}
    </Link>
  );
};

const Navigation = () => (
  <nav className="border-b bg-white sticky top-0 z-10 mb-8 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <div className="flex-shrink-0 flex items-center gap-2 text-blue-600 font-bold text-xl mr-8">
            <Layout size={24} />
            TaskFlow
          </div>
          <div className="flex space-x-2">
            <NavLink to="/" icon={ListTodo}>Issues</NavLink>
            <NavLink to="/projects" icon={Layers}>Projects</NavLink>
          </div>
        </div>
      </div>
    </div>
  </nav>
);

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-red-500">
        
        <h1 className="text-4xl text-red-600 font-bold p-4">ĐÃ CHẠY ĐÚNG FILE APP!</h1>
        
        <Navigation />
        <main className="px-4 sm:px-6 lg:px-8 pb-12">
          <Routes>
            <Route path="/" element={<IssuesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
export default App;