import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Trash2, Folder, ArrowLeft, MessageSquare, X, 
  GripVertical, Send, LogOut, Lock, Mail, User, AlertCircle,
  BarChart3, LayoutDashboard, CheckCircle2, Clock, ListTodo
} from "lucide-react";

const TaskFlowUltimate = () => {
  // --- 1. AUTH & VIEW STATE ---
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("tf_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [authMode, setAuthMode] = useState("login");
  const [view, setView] = useState("kanban"); // 'kanban' hoặc 'dashboard'
  const [authData, setAuthData] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const handleAuthAction = (e) => {
    e.preventDefault();
    setAuthError("");
    if (authMode === "login") {
      if (authData.email === "dat123" && authData.password === "1234") {
        const admin = { name: "Đạt Admin", email: "dat123", role: "Admin", id: "admin-root" };
        setCurrentUser(admin);
        localStorage.setItem("tf_user", JSON.stringify(admin));
        return;
      }
      const users = JSON.parse(localStorage.getItem("tf_users") || "[]");
      const user = users.find(u => u.email === authData.email && u.password === authData.password);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem("tf_user", JSON.stringify(user));
      } else setAuthError("Sai tài khoản hoặc mật khẩu!");
    } else {
      const users = JSON.parse(localStorage.getItem("tf_users") || "[]");
      if (authData.email === "dat123") return setAuthError("Tài khoản này đã được bảo vệ!");
      const newUser = { ...authData, id: Date.now(), role: "Member" };
      users.push(newUser);
      localStorage.setItem("tf_users", JSON.stringify(users));
      alert("Đăng ký thành công!"); setAuthMode("login");
    }
  };

  // --- 2. DATA MANAGEMENT ---
  const [projects] = useState([
    { id: 1, name: 'Hệ thống Quản lý Kho', key: 'WMS' },
    { id: 2, name: 'Ứng dụng E-Commerce', key: 'ECO' },
  ]);

  const [issues, setIssues] = useState(() => {
    const saved = localStorage.getItem("tf_tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentProject, setCurrentProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [formData, setFormData] = useState({ tieuDe: "", mucDo: "Trung bình", loai: "Tác vụ", moTa: "", comments: [] });
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    localStorage.setItem("tf_tasks", JSON.stringify(issues));
  }, [issues]);

  const isAdmin = currentUser?.role === "Admin";
  const projectIssues = issues.filter(i => i.projectId === currentProject?.id);

  // --- 3. DASHBOARD LOGIC (Thống kê) ---
  const stats = {
    total: projectIssues.length,
    todo: projectIssues.filter(i => i.trangThai === "Cần làm").length,
    doing: projectIssues.filter(i => i.trangThai === "Đang làm").length,
    done: projectIssues.filter(i => i.trangThai === "Hoàn thành").length,
    high: projectIssues.filter(i => i.mucDo === "Cao").length,
    medium: projectIssues.filter(i => i.mucDo === "Trung bình").length,
    low: projectIssues.filter(i => i.mucDo === "Thấp").length,
    percent: projectIssues.length > 0 ? Math.round((projectIssues.filter(i => i.trangThai === "Hoàn thành").length / projectIssues.length) * 100) : 0
  };

  // --- 4. ACTIONS ---
  const handleSaveIssue = (e) => {
    e.preventDefault();
    if (editingIssue) {
      setIssues(issues.map(i => i.id === editingIssue.id ? { ...i, ...formData } : i));
    } else {
      const newTask = {
        id: Date.now(), projectId: currentProject.id,
        maTask: `${currentProject.key}-${projectIssues.length + 101}`,
        ...formData, trangThai: "Cần làm", creator: currentUser.name
      };
      setIssues([newTask, ...issues]);
    }
    closeModal();
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const c = { id: Date.now(), text: newComment, user: currentUser.name, time: "Vừa xong" };
    setFormData({ ...formData, comments: [...(formData.comments || []), c] });
    setNewComment("");
  };

  const closeModal = () => {
    setShowModal(false); setEditingIssue(null);
    setFormData({ tieuDe: "", mucDo: "Trung bình", loai: "Tác vụ", moTa: "", comments: [] });
  };

  // --- 5. UI COMPONENTS ---
  if (!currentUser) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border p-10">
        <h1 className="text-4xl font-black text-center text-indigo-600 mb-2">TASKFLOW</h1>
        <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mb-10">Management System</p>
        <form onSubmit={handleAuthAction} className="space-y-4">
          {authError && <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold">{authError}</div>}
          {authMode === "register" && (
            <input required className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none" placeholder="Họ tên" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} />
          )}
          <input required className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none" placeholder="Tài khoản (Admin: dat123)" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} />
          <input required type="password" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none" placeholder="Mật khẩu" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} />
          <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100">{authMode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</button>
          <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full text-[10px] font-black text-slate-400 uppercase underline">
            {authMode === "login" ? "Đăng ký tài khoản Member" : "Quay lại đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navbar */}
      <nav className="border-b px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-6">
          {currentProject && <button onClick={() => {setCurrentProject(null); setView("kanban")}} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20}/></button>}
          <h1 className="text-2xl font-black tracking-tighter italic">TASKFLOW</h1>
          {currentProject && (
            <div className="flex bg-slate-100 p-1 rounded-xl ml-4">
              <button onClick={() => setView("kanban")} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${view === 'kanban' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>KANBAN</button>
              <button onClick={() => setView("dashboard")} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${view === 'dashboard' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>DASHBOARD</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-sm font-black">{currentUser.name}</p>
                <span className={`text-[9px] font-black uppercase ${isAdmin ? 'text-red-500' : 'text-indigo-500'}`}>{currentUser.role}</span>
            </div>
            <button onClick={() => setCurrentUser(null)} className="p-2 text-slate-300 hover:text-red-500"><LogOut size={20}/></button>
        </div>
      </nav>

      {!currentProject ? (
        <div className="max-w-4xl mx-auto w-full p-12">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Chọn dự án vận hành</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map(p => (
                <div key={p.id} onClick={() => setCurrentProject(p)} className="bg-slate-50 p-12 rounded-[3.5rem] hover:bg-white border-2 border-transparent hover:border-indigo-600 cursor-pointer transition-all shadow-sm hover:shadow-2xl group">
                  <Folder className="text-indigo-600 mb-6 group-hover:scale-110 transition-transform" size={48} />
                  <h3 className="text-2xl font-black">{p.name}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-4">{p.key} • {issues.filter(i => i.projectId === p.id).length} Công việc</p>
                </div>
              ))}
            </div>
        </div>
      ) : view === "kanban" ? (
        <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
          <div className="px-8 py-5 flex justify-between items-center bg-white border-b">
             <div className="relative w-80">
                <Search className="absolute left-4 top-3 text-slate-300" size={18} />
                <input className="pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm w-full outline-none" placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100"> + Tạo Task</button>
          </div>
          <main className="flex-1 overflow-x-auto p-8 flex gap-8">
            {["Cần làm", "Đang làm", "Hoàn thành"].map((status) => (
              <div key={status} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                const id = e.dataTransfer.getData("taskId");
                setIssues(prev => prev.map(i => i.id.toString() === id ? { ...i, trangThai: status } : i));
              }} className="flex-1 min-w-[340px] bg-slate-200/40 rounded-[2.5rem] p-6 flex flex-col">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">{status}</h3>
                <div className="space-y-4 overflow-y-auto flex-1">
                  {projectIssues.filter(i => i.trangThai === status && i.tieuDe.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                    <div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData("taskId", item.id)} onClick={() => { setEditingIssue(item); setFormData({...item}); setShowModal(true); }} className="bg-white p-6 rounded-3xl shadow-sm border border-transparent hover:border-indigo-600 transition-all cursor-grab active:cursor-grabbing">
                      <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded uppercase">{item.maTask}</span>
                      <p className="text-sm font-bold text-slate-800 my-4 leading-relaxed">{item.tieuDe}</p>
                      <div className="flex justify-between items-center">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${item.mucDo === 'Cao' ? 'text-red-600 bg-red-50' : 'text-indigo-600 bg-indigo-50'}`}>{item.mucDo}</span>
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">{item.creator?.charAt(0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </main>
        </div>
      ) : (
        /* --- DASHBOARD VIEW --- */
        <div className="flex-1 bg-slate-50 p-10 overflow-y-auto">
           <div className="max-w-6xl mx-auto space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="bg-white p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center">
                    <ListTodo className="text-slate-300 mb-4" size={32} />
                    <span className="text-4xl font-black">{stats.total}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Tổng Task</span>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center border-b-4 border-indigo-500">
                    <Clock className="text-indigo-500 mb-4" size={32} />
                    <span className="text-4xl font-black">{stats.todo + stats.doing}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Đang xử lý</span>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center border-b-4 border-green-500">
                    <CheckCircle2 className="text-green-500 mb-4" size={32} />
                    <span className="text-4xl font-black">{stats.done}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Đã xong</span>
                 </div>
                 <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col items-center">
                    <LayoutDashboard className="text-indigo-200 mb-4" size={32} />
                    <span className="text-4xl font-black">{stats.percent}%</span>
                    <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mt-2">Hoàn thành</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 {/* Progress Chart */}
                 <div className="bg-white p-10 rounded-[3rem] shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Trạng thái công việc</h4>
                    <div className="space-y-6">
                        {[{l: 'Cần làm', v: stats.todo, c: 'bg-slate-200'}, {l: 'Đang làm', v: stats.doing, c: 'bg-indigo-500'}, {l: 'Hoàn thành', v: stats.done, c: 'bg-green-500'}].map(s => (
                           <div key={s.l}>
                              <div className="flex justify-between text-[10px] font-black uppercase mb-2"><span>{s.l}</span><span>{s.v}</span></div>
                              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                 <div className={`h-full ${s.c} transition-all duration-1000`} style={{width: `${(s.v/stats.total)*100}%`}}></div>
                              </div>
                           </div>
                        ))}
                    </div>
                 </div>
                 {/* Priority Chart */}
                 <div className="bg-white p-10 rounded-[3rem] shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Mức độ ưu tiên</h4>
                    <div className="flex items-end justify-between h-48 gap-4 px-4">
                        {[{l: 'Thấp', v: stats.low, c: 'bg-blue-400'}, {l: 'Trung bình', v: stats.medium, c: 'bg-orange-400'}, {l: 'Cao', v: stats.high, c: 'bg-red-500'}].map(p => (
                            <div key={p.l} className="flex-1 flex flex-col items-center gap-4">
                               <div className={`w-full ${p.c} rounded-t-2xl transition-all duration-1000`} style={{height: `${(p.v/stats.total)*100 || 5}%`}}></div>
                               <span className="text-[9px] font-black text-slate-400 uppercase">{p.l}</span>
                            </div>
                        ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Modal & Comment - Giữ nguyên như bản trước */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex justify-center items-center z-[100] p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{editingIssue ? editingIssue.maTask : "Tạo Issue mới"}</span>
                <button onClick={closeModal} className="p-2 hover:bg-white rounded-full transition shadow-sm border"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 flex flex-col lg:flex-row gap-10">
                <div className="flex-[2] space-y-8">
                  <input className="text-4xl font-black w-full outline-none" placeholder="Tên công việc..." value={formData.tieuDe} onChange={e => setFormData({...formData, tieuDe: e.target.value})} />
                  <textarea rows="4" className="w-full bg-slate-50 p-6 rounded-3xl outline-none text-sm" placeholder="Mô tả nội dung..." value={formData.moTa} onChange={e => setFormData({...formData, moTa: e.target.value})} />
                  <div className="pt-8 border-t">
                    <h4 className="text-xs font-black uppercase mb-6 flex items-center gap-2"><MessageSquare size={16}/> Bình luận ({formData.comments?.length || 0})</h4>
                    <div className="space-y-4 mb-6">
                        {formData.comments?.map(c => (
                            <div key={c.id} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[10px]">{c.user.charAt(0)}</div>
                                <div className="bg-slate-50 p-4 rounded-2xl flex-1 text-sm"><p className="font-black text-[10px] mb-1">{c.user}</p>{c.text}</div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <input className="flex-1 bg-white border-2 px-6 py-3 rounded-2xl text-sm outline-none" placeholder="Viết phản hồi..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyPress={e => e.key === 'Enter' && addComment()} />
                        <button onClick={addComment} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100"><Send size={18}/></button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                   <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Ưu tiên</label>
                        <select className="w-full border-2 bg-white p-3 rounded-xl font-bold text-xs" value={formData.mucDo} onChange={e => setFormData({...formData, mucDo: e.target.value})}>
                          <option value="Cao">🔥 Cao</option><option value="Trung bình">⚡ Trung bình</option><option value="Thấp">🌱 Thấp</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Phân loại</label>
                        <select className="w-full border-2 bg-white p-3 rounded-xl font-bold text-xs" value={formData.loai} onChange={e => setFormData({...formData, loai: e.target.value})}>
                          <option value="Tác vụ">Tính năng</option><option value="Lỗi (Bug)">Báo lỗi</option>
                        </select>
                      </div>
                   </div>
                   {isAdmin && editingIssue && (
                    <button onClick={() => { if(window.confirm("Xóa?")) { setIssues(issues.filter(i => i.id !== editingIssue.id)); closeModal(); } }} className="w-full py-4 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-2xl transition"> <Trash2 size={16} className="inline mr-2"/> Xóa Task này </button>
                   )}
                </div>
              </div>
              <div className="p-8 border-t bg-slate-50/50 flex justify-end gap-4">
                <button onClick={handleSaveIssue} className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">Cập nhật</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TaskFlowUltimate;