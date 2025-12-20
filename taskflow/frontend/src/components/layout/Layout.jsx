import { Outlet, Link, useLocation } from "react-router-dom";
import { Layout as Icon, ListTodo, LogOut } from "lucide-react";

export default function Layout() {
  const loc = useLocation();
  const menu = [
    { name: "Công việc", path: "/", icon: ListTodo },
    { name: "Dự án", path: "/projects", icon: Icon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="text-blue-600 font-black text-2xl flex items-center gap-2">
            <Icon /> TASKFLOW
          </div>
          <div className="flex gap-4">
            {menu.map(m => (
              <Link key={m.path} to={m.path} className={`px-3 py-2 rounded-md font-medium ${loc.pathname === m.path ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}>
                {m.name}
              </Link>
            ))}
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-gray-400 hover:text-red-500">
          <LogOut size={20} />
        </button>
      </nav>
      <main className="max-w-7xl mx-auto p-6 text-gray-800">
        <Outlet />
      </main>
    </div>
  );
}