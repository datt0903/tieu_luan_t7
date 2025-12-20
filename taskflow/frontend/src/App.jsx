import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Trash2, Folder, ArrowLeft, MessageSquare, X, 
  GripVertical, Send, LogOut, Lock, Mail, User, AlertCircle,
  BarChart3, LayoutDashboard, CheckCircle2, Clock, ListTodo,
  TrendingUp, Bell
} from "lucide-react";

// 1. KHỞI TẠO KÊNH TRUYỀN TIN REAL-TIME (BROADCAST CHANNEL)
const rtChannel = new BroadcastChannel("taskflow_realtime_sync");

const TaskFlowUltimate = () => {
  // --- STATE QUẢN LÝ NGƯỜI DÙNG & GIAO DIỆN ---
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("tf_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [authMode, setAuthMode] = useState("login");
  const [view, setView] = useState("kanban"); // 'kanban' hoặc 'dashboard'
  const [authData, setAuthData] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [notifications, setNotifications] = useState([]);

  // --- STATE QUẢN LÝ DỮ LIỆU ---
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
  
  // Form State cho Task
  const [formData, setFormData] = useState({ tieuDe: "", mucDo: "Trung bình", loai: "Tác vụ", moTa: "", comments: [] });
  const [newComment, setNewComment] = useState("");

  // --- LOGIC REAL-TIME: LẮNG NGHE THAY ĐỔI TỪ TAB KHÁC ---
  useEffect(() => {
    rtChannel.onmessage = (event) => {
      const { type, payload, sender } = event.data;
      if (type === "SYNC_DATA") {
        setIssues(payload);
        showToast(`${sender} vừa cập nhật dữ liệu hệ thống!`);
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("tf_tasks", JSON.stringify(issues));
  }, [issues]);

  const showToast = (msg) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const isAdmin = currentUser?.role === "Admin";
  const projectIssues = issues.filter(i => i.projectId === currentProject?.id);

  // --- HÀM ĐỒNG BỘ DỮ LIỆU ---
  const broadcastSync = (updatedIssues) => {
    setIssues(updatedIssues);
    rtChannel.postMessage({
      type: "SYNC_DATA",
      payload: updatedIssues,
      sender: currentUser.name
    });
  };

  // --- XỬ LÝ AUTH ---
  const handleAuthAction = (e) => {
    e.preventDefault();
    setAuthError("");
    if (authMode === "login") {
      // Tài khoản Admin cố định theo yêu cầu của Đạt
      if (authData.email === "dat123" && authData.password === "1234") {
        const admin = { name: "Đạt Admin", email: "dat123", role: "Admin", id: "admin-root" };
        setCurrentUser(admin);
        localStorage.setItem("tf_user", JSON.stringify(admin));
        return;
      }
      // Check Member
      const users = JSON.parse(localStorage.getItem("tf_users") || "[]");
      const user = users.find(u => u.email === authData.email && u.password === authData.password);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem("tf_user", JSON.stringify(user));
      } else setAuthError("Tài khoản hoặc mật khẩu không chính xác!");
    } else {
      const users = JSON.parse(localStorage.getItem("tf_users") || "[]");
      if (authData.email === "dat123") return setAuthError("Tên tài khoản này đã được bảo mật!");
      const newUser = { ...authData, id: Date.now(), role: "Member" };
      users.push(newUser);
      localStorage.setItem("tf_users", JSON.stringify(users));
      alert("Đăng ký Member thành công!"); setAuthMode("login");
    }
  };

  // --- XỬ LÝ TASK ---
  const handleSaveIssue = (e) => {
    e.preventDefault();
    let updated;
    if (editingIssue) {
      updated = issues.map(i => i.id === editingIssue.id ? { ...i, ...formData } : i);
    } else {
      const newTask = {
        id: Date.now(), projectId: currentProject.id,
        maTask: `${currentProject.key}-${projectIssues.length + 101}`,
        ...formData, trangThai: "Cần làm", creator: currentUser.name, comments: []
      };
      updated = [newTask, ...issues];
    }
    broadcastSync(updated);
    closeModal();
  };

  const handleDelete = () => {
    if (!isAdmin) return alert("Chỉ Admin Đạt mới có quyền xóa!");
    if (window.confirm("Xác nhận xóa vĩnh viễn công việc này?")) {
      const updated = issues.filter(i => i.id !== editingIssue.id);
      broadcastSync(updated);
      closeModal();
    }
  };

  const handleDrop = (e, newStatus) => {
    const id = e.dataTransfer.getData("taskId");
    const updated = issues.map(i => i.id.toString() === id ? { ...i, trangThai: newStatus } : i);
    broadcastSync(updated);
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const c = { 
        id: Date.now(), text: newComment, 
        user: currentUser.name, 
        time: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) 
    };
    const updatedFormData = { ...formData, comments: [...(formData.comments || []), c] };
    setFormData(updatedFormData);
    // Lưu ngay vào danh sách chính
    const updatedIssues = issues.map(i => i.id === editingIssue.id ? { ...i, ...updatedFormData } : i);
    broadcastSync(updatedIssues);
    setNewComment("");
  };

  const closeModal = () => {
    setShowModal(false); setEditingIssue(null);
    setFormData({ tieuDe: "", mucDo: "Trung bình", loai: "Tác vụ", moTa: "", comments: [] });
  };

  // --- THỐNG KÊ DASHBOARD ---
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

  // --- GIAO DIỆN ĐĂNG NHẬP ---
  if (!currentUser) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border">
        <div className="bg-indigo-600 p-12 text-white text-center">
          <h1 className="text-5xl font-black tracking-tighter">TASKFLOW</h1>
          <p className="text-indigo-200 text-[10px] font-bold uppercase mt-3 tracking-[0.4em]">Quản lý dự án thông minh</p>
        </div>
        <form onSubmit={handleAuthAction} className="p-10 space-y-5">
          {authError && <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold flex items-center gap-2"><AlertCircle size={16}/> {authError}</div>}
          {authMode === "register" && (
            <input required className="w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="Họ và tên của bạn" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} />
          )}
          <input required className="w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none font-bold" placeholder={authMode === "login" ? "Tài khoản (Admin: dat123)" : "Email/Tài khoản mới"} value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} />
          <input required type="password" className="w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none" placeholder="Mật khẩu" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} />
          <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 uppercase text-sm tracking-widest hover:bg-indigo-700 active:scale-95 transition-all">
            {authMode === "login" ? "Vào hệ thống" : "Đăng ký Member"}
          </button>
          <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full text-xs font-black text-slate-400 uppercase underline decoration-2 underline-offset-4">
            {authMode === "login" ? "Bạn là Member mới? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      {/* Toast Notification Layer */}
      <div className="fixed top-24 right-8 z-[100] space-y-4">
        {notifications.map(n => (
          <div key={n.id} className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-300">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs font-bold tracking-wide">{n.msg}</p>
          </div>
        ))}
      </div>

      {/* Navbar */}
      <nav className="border-b px-10 py-5 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-8">
          {currentProject && <button onClick={() => {setCurrentProject(null); setView("kanban")}} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft size={24}/></button>}
          <h1 className="text-3xl font-black tracking-tighter italic text-indigo-600">TASKFLOW</h1>
          {currentProject && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl ml-4">
              <button onClick={() => setView("kanban")} className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${view === 'kanban' ? 'bg-white shadow-lg text-indigo-600' : 'text-slate-400'}`}>KANBAN</button>
              <button onClick={() => setView("dashboard")} className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${view === 'dashboard' ? 'bg-white shadow-lg text-indigo-600' : 'text-slate-400'}`}>DASHBOARD</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
                <p className="text-sm font-black text-slate-800">{currentUser.name}</p>
                <span className={`text-[9px] font-black uppercase tracking-widest ${isAdmin ? 'text-red-500' : 'text-indigo-500'}`}>{currentUser.role} Account</span>
            </div>
            <button onClick={() => {setCurrentUser(null); localStorage.removeItem("tf_user");}} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition"><LogOut size={20}/></button>
        </div>
      </nav>

      {!currentProject ? (
        <div className="max-w-5xl mx-auto w-full p-16">
            <h2 className="text-xs font-black text-slate-300 uppercase tracking-[0.4em] mb-12">Hệ thống dự án của Đạt</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {projects.map(p => (
                <div key={p.id} onClick={() => setCurrentProject(p)} className="bg-slate-50 p-12 rounded-[4rem] hover:bg-white border-2 border-transparent hover:border-indigo-600 cursor-pointer transition-all shadow-sm hover:shadow-2xl group relative overflow-hidden">
                  <Folder className="text-indigo-600 mb-8 group-hover:scale-110 transition-transform relative z-10" size={56} />
                  <h3 className="text-3xl font-black relative z-10">{p.name}</h3>
                  <div className="mt-10 flex justify-between items-center relative z-10">
                    <span className="bg-white px-5 py-2 rounded-2xl text-[10px] font-black text-slate-400 border">{p.key} PROJECT</span>
                    <p className="text-sm font-bold text-indigo-600 italic">{issues.filter(i => i.projectId === p.id).length} Issues</p>
                  </div>
                </div>
              ))}
            </div>
        </div>
      ) : view === "kanban" ? (
        /* --- KANBAN VIEW --- */
        <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
          <div className="px-10 py-6 flex justify-between items-center bg-white border-b">
             <div className="relative w-96">
                <Search className="absolute left-5 top-3.5 text-slate-300" size={20} />
                <input className="pl-14 pr-6 py-3.5 bg-slate-50 border-none rounded-[1.5rem] text-sm w-full outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all" placeholder="Tìm kiếm công việc trong dự án..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-10 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-2xl shadow-indigo-100 flex items-center gap-3 active:scale-95 transition-all"> <Plus size={20}/> Tạo công việc mới</button>
          </div>
          <main className="flex-1 overflow-x-auto p-10 flex gap-10">
            {["Cần làm", "Đang làm", "Hoàn thành"].map((status) => (
              <div key={status} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, status)} className="flex-1 min-w-[360px] bg-slate-200/40 rounded-[3rem] p-6 flex flex-col border border-slate-200/50">
                <div className="flex justify-between items-center mb-8 px-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{status}</h3>
                    <span className="bg-white px-3 py-1 rounded-xl text-[10px] font-black border">{projectIssues.filter(i => i.trangThai === status).length}</span>
                </div>
                <div className="space-y-5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                  {projectIssues.filter(i => i.trangThai === status && i.tieuDe.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                    <div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData("taskId", item.id)} onClick={() => { setEditingIssue(item); setFormData({...item}); setShowModal(true); }} className="bg-white p-7 rounded-[2.5rem] shadow-sm border-2 border-transparent hover:border-indigo-600 transition-all cursor-grab active:cursor-grabbing group">
                      <div className="flex justify-between items-start mb-5">
                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{item.maTask}</span>
                        <GripVertical size={16} className="text-slate-200 group-hover:text-indigo-200 transition-colors" />
                      </div>
                      <p className="text-[15px] font-bold text-slate-800 my-5 leading-relaxed line-clamp-2">{item.tieuDe}</p>
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-3">
                            <span className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase ${item.mucDo === 'Cao' ? 'text-red-600 bg-red-50' : 'text-indigo-600 bg-indigo-50'}`}>{item.mucDo}</span>
                            {item.comments?.length > 0 && <span className="text-[10px] text-slate-300 font-bold flex items-center gap-1"><MessageSquare size={12}/> {item.comments.length}</span>}
                        </div>
                        <div className="w-8 h-8 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black border-4 border-white shadow-lg" title={item.creator}>{item.creator?.charAt(0)}</div>
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
        <div className="flex-1 bg-slate-50 p-12 overflow-y-auto">
           <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                 <div className="bg-white p-10 rounded-[3.5rem] shadow-sm flex flex-col items-center border border-slate-100">
                    <ListTodo className="text-slate-200 mb-6" size={40} />
                    <span className="text-5xl font-black">{stats.total}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Tổng số Task</span>
                 </div>
                 <div className="bg-white p-10 rounded-[3.5rem] shadow-sm flex flex-col items-center border-b-8 border-indigo-500">
                    <Clock className="text-indigo-500 mb-6" size={40} />
                    <span className="text-5xl font-black">{stats.todo + stats.doing}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Chưa hoàn thành</span>
                 </div>
                 <div className="bg-white p-10 rounded-[3.5rem] shadow-sm flex flex-col items-center border-b-8 border-green-500">
                    <CheckCircle2 className="text-green-500 mb-6" size={40} />
                    <span className="text-5xl font-black">{stats.done}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Đã hoàn tất</span>
                 </div>
                 <div className="bg-indigo-600 p-10 rounded-[3.5rem] shadow-2xl text-white flex flex-col items-center transform hover:scale-105 transition-transform">
                    <TrendingUp className="text-indigo-200 mb-6" size={40} />
                    <span className="text-5xl font-black">{stats.percent}%</span>
                    <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mt-3">Tỷ lệ hoàn thành</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Tiến độ quy trình (Kanban Status)</h4>
                    <div className="space-y-10">
                        {[{l: 'Cần làm', v: stats.todo, c: 'bg-slate-200'}, {l: 'Đang làm', v: stats.doing, c: 'bg-indigo-500'}, {l: 'Hoàn thành', v: stats.done, c: 'bg-green-500'}].map(s => (
                           <div key={s.l}>
                              <div className="flex justify-between text-[11px] font-black uppercase mb-3"><span>{s.l}</span><span>{s.v} Task ({Math.round((s.v/stats.total)*100 || 0)}%)</span></div>
                              <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden p-1 border">
                                 <div className={`h-full ${s.c} rounded-full transition-all duration-1000 shadow-sm`} style={{width: `${(s.v/stats.total)*100}%`}}></div>
                              </div>
                           </div>
                        ))}
                    </div>
                 </div>
                 <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Phân loại mức độ ưu tiên</h4>
                    <div className="flex items-end justify-between h-56 gap-8 px-6">
                        {[{l: 'Thấp', v: stats.low, c: 'bg-blue-400'}, {l: 'Trung bình', v: stats.medium, c: 'bg-orange-400'}, {l: 'Cấp bách', v: stats.high, c: 'bg-red-500'}].map(p => (
                            <div key={p.l} className="flex-1 flex flex-col items-center gap-6 group">
                               <div className="relative w-full flex flex-col items-center">
                                  <span className="absolute -top-8 text-[10px] font-black text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">{p.v}</span>
                                  <div className={`w-full ${p.c} rounded-t-[1.5rem] transition-all duration-1000 shadow-lg`} style={{height: `${(p.v/stats.total)*120 || 10}px`}}></div>
                               </div>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.l}</span>
                            </div>
                        ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL CHI TIẾT CÔNG VIỆC --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex justify-center items-center z-[100] p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[4rem] w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative border border-white/20">
              <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <span className="text-[11px] font-black text-white bg-indigo-600 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">{editingIssue ? editingIssue.maTask : "Issue Mới"}</span>
                    {editingIssue && <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">• Tạo bởi {editingIssue.creator}</span>}
                </div>
                <button onClick={closeModal} className="p-3 hover:bg-white rounded-full transition shadow-md border bg-white/50"><X size={24}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-12 flex flex-col lg:flex-row gap-16 custom-scrollbar">
                {/* Cột Trái: Nội dung & Comment */}
                <div className="flex-[2] space-y-10">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Tiêu đề công việc</label>
                     <input className="text-4xl font-black w-full outline-none text-slate-900 placeholder-slate-100 bg-transparent" placeholder="Bạn đang xử lý việc gì?" value={formData.tieuDe} onChange={e => setFormData({...formData, tieuDe: e.target.value})} />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Mô tả chi tiết</label>
                    <textarea rows="6" className="w-full bg-slate-50 p-8 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-indigo-600/5 text-[15px] leading-relaxed border border-slate-100" placeholder="Chi tiết các bước thực hiện hoặc yêu cầu đặc biệt..." value={formData.moTa} onChange={e => setFormData({...formData, moTa: e.target.value})} />
                  </div>

                  {/* KHU VỰC BÌNH LUẬN (COMMENTS) */}
                  <div className="pt-10 border-t space-y-8">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><MessageSquare size={20} className="text-indigo-500"/> Thảo luận nội bộ ({formData.comments?.length || 0})</h4>
                    
                    <div className="space-y-6">
                        {formData.comments?.length === 0 && <p className="text-sm italic text-slate-300">Chưa có bình luận nào cho công việc này.</p>}
                        {formData.comments?.map(c => (
                            <div key={c.id} className="flex gap-5 group animate-in slide-in-from-bottom-2 duration-300">
                                <div className="w-10 h-10 rounded-[1.2rem] bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shadow-sm border-2 border-white">{c.user.charAt(0)}</div>
                                <div className="flex-1 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group-hover:bg-white group-hover:shadow-md transition-all">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[11px] font-black text-slate-900 tracking-wide uppercase">{c.user}</span>
                                        <span className="text-[9px] font-bold text-slate-300">{c.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">{c.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {editingIssue && (
                        <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-[2rem] border border-indigo-100">
                            <input className="flex-1 bg-transparent px-6 py-2 text-sm outline-none font-medium" placeholder="Viết phản hồi hoặc đặt câu hỏi..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyPress={e => e.key === 'Enter' && addComment()} />
                            <button onClick={addComment} className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-90"><Send size={20}/></button>
                        </div>
                    )}
                  </div>
                </div>

                {/* Cột Phải: Phân loại & Quyền xóa */}
                <div className="flex-1 space-y-8">
                  <div className="bg-slate-50 p-10 rounded-[3rem] space-y-8 border border-slate-100">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mức độ ưu tiên</label>
                      <select className="w-full border-2 bg-white px-5 py-3 rounded-2xl font-black text-xs appearance-none cursor-pointer focus:border-indigo-600 transition-colors" value={formData.mucDo} onChange={e => setFormData({...formData, mucDo: e.target.value})}>
                        <option value="Cao">🔥 Cấp bách (High)</option>
                        <option value="Trung bình">⚡ Bình thường (Med)</option>
                        <option value="Thấp">🌱 Ưu tiên thấp (Low)</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại hình công việc</label>
                      <select className="w-full border-2 bg-white px-5 py-3 rounded-2xl font-black text-xs appearance-none cursor-pointer focus:border-indigo-600 transition-colors" value={formData.loai} onChange={e => setFormData({...formData, loai: e.target.value})}>
                        <option value="Tác vụ">Tính năng / Task</option>
                        <option value="Lỗi (Bug)">Sửa lỗi / Bug</option>
                        <option value="Nghiên cứu">Nghiên cứu / R&D</option>
                      </select>
                    </div>
                    <div className="pt-6 border-t border-slate-200">
                       <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Trạng thái hiện tại</label>
                       <p className="text-sm font-black text-indigo-600 mt-2 uppercase italic">{editingIssue ? editingIssue.trangThai : "Khởi tạo"}</p>
                    </div>
                  </div>
                  
                  {isAdmin && editingIssue && (
                    <button onClick={handleDelete} className="w-full py-5 text-red-500 font-black text-[10px] flex items-center justify-center gap-3 hover:bg-red-50 rounded-[2rem] transition-all uppercase tracking-[0.2em] border-2 border-transparent hover:border-red-200">
                      <Trash2 size={20}/> Xóa vĩnh viễn Issue
                    </button>
                  )}
                </div>
              </div>

              <div className="p-10 border-t bg-slate-50/50 flex justify-end gap-6">
                <button onClick={closeModal} className="px-10 py-4 font-black text-slate-400 text-xs uppercase tracking-[0.2em] hover:text-slate-600">Đóng lại</button>
                <button onClick={handleSaveIssue} className="px-16 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Lưu thay đổi</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TaskFlowUltimate;