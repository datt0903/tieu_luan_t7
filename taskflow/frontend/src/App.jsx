import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Trash2, Folder, ArrowLeft, MessageSquare, X, 
  GripVertical, Send, LogOut, Lock, Mail, User, AlertCircle
} from "lucide-react";

const TaskFlowProFinal = () => {
  // --- 1. AUTH & ROLE LOGIC ---
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("tf_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const handleAuthAction = (e) => {
    e.preventDefault();
    setAuthError("");
    
    if (authMode === "login") {
      // Admin cố định
      if (authData.email === "dat123" && authData.password === "1234") {
        const admin = { name: "Đạt Admin", email: "dat123", role: "Admin", id: "admin-root" };
        setCurrentUser(admin);
        localStorage.setItem("tf_user", JSON.stringify(admin));
        return;
      }
      // Member check
      const users = JSON.parse(localStorage.getItem("tf_users") || "[]");
      const user = users.find(u => u.email === authData.email && u.password === authData.password);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem("tf_user", JSON.stringify(user));
      } else setAuthError("Sai tài khoản hoặc mật khẩu!");
    } else {
      // Đăng ký Member
      const users = JSON.parse(localStorage.getItem("tf_users") || "[]");
      if (authData.email === "dat123") return setAuthError("Không thể dùng tên này!");
      if (users.find(u => u.email === authData.email)) return setAuthError("Tài khoản đã tồn tại!");

      const newUser = { ...authData, id: Date.now(), role: "Member" };
      users.push(newUser);
      localStorage.setItem("tf_users", JSON.stringify(users));
      alert("Đăng ký Member thành công!");
      setAuthMode("login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tf_user");
    setCurrentUser(null);
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
  
  // Form State
  const [formData, setFormData] = useState({ tieuDe: "", mucDo: "Trung bình", loai: "Tác vụ", moTa: "", comments: [] });
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    localStorage.setItem("tf_tasks", JSON.stringify(issues));
  }, [issues]);

  const isAdmin = currentUser?.role === "Admin";

  // --- 3. ACTIONS ---
  const handleSaveIssue = (e) => {
    e.preventDefault();
    if (editingIssue) {
      setIssues(issues.map(i => i.id === editingIssue.id ? { ...i, ...formData } : i));
    } else {
      const newTask = {
        id: Date.now(),
        projectId: currentProject.id,
        maTask: `${currentProject.key}-${issues.filter(x => x.projectId === currentProject.id).length + 101}`,
        ...formData,
        trangThai: "Cần làm",
        creator: currentUser.name
      };
      setIssues([newTask, ...issues]);
    }
    closeModal();
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const commentObj = {
      id: Date.now(),
      text: newComment,
      user: currentUser.name,
      time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
    };
    setFormData({ ...formData, comments: [...(formData.comments || []), commentObj] });
    setNewComment("");
  };

  const handleDelete = (id) => {
    if (!isAdmin) return alert("Chỉ Admin Đạt mới có quyền xóa!");
    if (window.confirm("Xóa vĩnh viễn công việc này?")) {
      setIssues(issues.filter(i => i.id !== id));
      closeModal();
    }
  };

  const closeModal = () => {
    setShowModal(false); setEditingIssue(null);
    setFormData({ tieuDe: "", mucDo: "Trung bình", loai: "Tác vụ", moTa: "", comments: [] });
  };

  // --- 4. RENDER AUTH ---
  if (!currentUser) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 p-10 text-white text-center">
          <h1 className="text-4xl font-black tracking-tighter">TASKFLOW</h1>
          <p className="text-indigo-200 text-[10px] font-bold uppercase mt-2 tracking-widest">Quản lý dự án chuyên nghiệp</p>
        </div>
        <form onSubmit={handleAuthAction} className="p-10 space-y-4">
          {authError && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold flex items-center gap-2"><AlertCircle size={14}/> {authError}</div>}
          {authMode === "register" && (
            <input required className="w-full px-5 py-3 bg-slate-50 border rounded-2xl outline-none" placeholder="Họ và tên" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} />
          )}
          <input required className="w-full px-5 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" placeholder={authMode === "login" ? "Tài khoản (Admin: dat123)" : "Email/Tài khoản mới"} value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} />
          <input required type="password" className="w-full px-5 py-3 bg-slate-50 border rounded-2xl outline-none" placeholder="Mật khẩu" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} />
          <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 uppercase text-sm tracking-widest">
            {authMode === "login" ? "Đăng nhập" : "Đăng ký Member"}
          </button>
          <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full text-xs font-bold text-indigo-500 underline uppercase">
            {authMode === "login" ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );

  // --- 5. MAIN UI ---
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      <nav className="border-b px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-6">
          {currentProject && <button onClick={() => setCurrentProject(null)} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20}/></button>}
          <h1 className="text-2xl font-black tracking-tighter">TASKFLOW</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-sm font-black leading-none">{currentUser.name}</p>
                <span className={`text-[9px] font-black uppercase ${isAdmin ? 'text-red-500' : 'text-indigo-500'}`}>{currentUser.role}</span>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-300 hover:text-red-500 transition"><LogOut size={20}/></button>
        </div>
      </nav>

      {!currentProject ? (
        <div className="max-w-4xl mx-auto w-full p-12">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Dự án hiện có</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map(p => (
                <div key={p.id} onClick={() => setCurrentProject(p)} className="bg-slate-50 p-10 rounded-[3rem] border-2 border-transparent hover:border-indigo-600 hover:bg-white cursor-pointer transition-all shadow-sm hover:shadow-2xl group">
                  <Folder className="text-indigo-600 mb-6 group-hover:scale-110 transition-transform" size={48} />
                  <h3 className="text-2xl font-bold">{p.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-widest">{p.key} Project • {issues.filter(i => i.projectId === p.id).length} Task</p>
                </div>
              ))}
            </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
          <div className="px-8 py-5 flex justify-between items-center bg-white border-b">
             <div className="relative w-80">
                <Search className="absolute left-4 top-3 text-slate-300" size={18} />
                <input className="pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm w-full outline-none focus:ring-2 focus:ring-indigo-600/10" placeholder="Tìm tên công việc..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-8 py-2.5 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 uppercase tracking-widest"><Plus size={18}/> Tạo Task</button>
          </div>

          <main className="flex-1 overflow-x-auto p-8 flex gap-8">
            {["Cần làm", "Đang làm", "Hoàn thành"].map((status) => (
              <div key={status} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                const id = e.dataTransfer.getData("taskId");
                setIssues(prev => prev.map(i => i.id.toString() === id ? { ...i, trangThai: status } : i));
              }} className="flex-1 min-w-[320px] bg-slate-200/40 rounded-[2.5rem] p-5 flex flex-col">
                <div className="flex justify-between items-center mb-6 px-3">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{status}</h3>
                    <span className="bg-white/50 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-white">{issues.filter(i => i.projectId === currentProject.id && i.trangThai === status).length}</span>
                </div>
                <div className="space-y-4 overflow-y-auto flex-1">
                  {issues.filter(i => i.projectId === currentProject.id && i.trangThai === status && i.tieuDe.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                    <div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData("taskId", item.id)} onClick={() => { setEditingIssue(item); setFormData({...item}); setShowModal(true); }} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-transparent hover:border-indigo-400 hover:shadow-xl cursor-grab active:cursor-grabbing transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">{item.maTask}</span>
                        <GripVertical size={14} className="text-slate-200" />
                      </div>
                      <p className="text-sm font-bold text-slate-700 mb-4">{item.tieuDe}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${item.mucDo === 'Cao' ? 'text-red-600 bg-red-50' : 'text-indigo-600 bg-indigo-50'}`}>{item.mucDo}</span>
                           {item.comments?.length > 0 && <span className="text-[9px] text-slate-300 flex items-center gap-1"><MessageSquare size={10}/> {item.comments.length}</span>}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">{item.creator?.charAt(0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </main>
        </div>
      )}

      {/* --- MODAL CHI TIẾT + COMMENT --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex justify-center items-center z-50 p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-300">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{editingIssue ? editingIssue.maTask : "Tạo Issue"}</span>
                <button onClick={closeModal} className="p-2 hover:bg-white rounded-full transition shadow-sm border"><X size={20}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 flex flex-col lg:flex-row gap-10">
                {/* Cột trái: Nội dung & Comment */}
                <div className="flex-[2] space-y-8">
                  <input className="text-4xl font-black w-full outline-none text-slate-900 placeholder-slate-200" placeholder="Tên công việc..." value={formData.tieuDe} onChange={e => setFormData({...formData, tieuDe: e.target.value})} />
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.2em]">Mô tả công việc</label>
                    <textarea rows="5" className="w-full bg-slate-50 p-6 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-600/5 text-sm" placeholder="Nhập chi tiết yêu cầu..." value={formData.moTa} onChange={e => setFormData({...formData, moTa: e.target.value})} />
                  </div>

                  {/* SECTION BÌNH LUẬN */}
                  <div className="pt-8 border-t">
                    <h4 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2"><MessageSquare size={16}/> Thảo luận ({formData.comments?.length || 0})</h4>
                    
                    <div className="space-y-4 mb-6">
                        {formData.comments?.map(c => (
                            <div key={c.id} className="flex gap-4">
                                <div className="w-8 h-8 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[10px]">{c.user.charAt(0)}</div>
                                <div className="flex-1 bg-slate-50 p-4 rounded-2xl">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-[11px] font-black text-slate-900">{c.user}</span>
                                        <span className="text-[9px] font-bold text-slate-300 uppercase">{c.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{c.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <input className="flex-1 bg-white border-2 px-6 py-3 rounded-2xl text-sm outline-none focus:border-indigo-600 transition-all shadow-sm" placeholder="Viết phản hồi của bạn..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyPress={e => e.key === 'Enter' && addComment()} />
                        <button onClick={addComment} className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"><Send size={18}/></button>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Cài đặt */}
                <div className="flex-1 space-y-8">
                  <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6 border border-slate-100">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Mức độ ưu tiên</label>
                      <select className="w-full border-2 bg-white px-4 py-2.5 rounded-xl font-bold text-xs" value={formData.mucDo} onChange={e => setFormData({...formData, mucDo: e.target.value})}>
                        <option value="Cao">🔥 Cấp bách</option>
                        <option value="Trung bình">⚡ Bình thường</option>
                        <option value="Thấp">🌱 Ưu tiên thấp</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Phân loại</label>
                      <select className="w-full border-2 bg-white px-4 py-2.5 rounded-xl font-bold text-xs" value={formData.loai} onChange={e => setFormData({...formData, loai: e.target.value})}>
                        <option value="Tác vụ">Tính năng</option>
                        <option value="Lỗi (Bug)">Báo lỗi (Bug)</option>
                      </select>
                    </div>
                    <div className="pt-4">
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Người tạo</label>
                       <p className="text-xs font-bold text-slate-800">{editingIssue ? editingIssue.creator : currentUser.name}</p>
                    </div>
                  </div>
                  
                  {isAdmin && editingIssue && (
                    <button onClick={() => handleDelete(editingIssue.id)} className="w-full py-4 text-red-500 font-black text-[10px] flex items-center justify-center gap-2 hover:bg-red-50 rounded-2xl transition uppercase tracking-widest">
                      <Trash2 size={16}/> Xóa vĩnh viễn Task
                    </button>
                  )}
                </div>
              </div>

              <div className="p-8 border-t bg-slate-50/50 flex justify-end gap-4">
                <button onClick={closeModal} className="px-8 py-3 font-black text-slate-400 text-xs uppercase tracking-widest">Hủy bỏ</button>
                <button onClick={handleSaveIssue} className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-[0.2em]">Cập nhật Task</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TaskFlowProFinal;