import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Trash2, Tag, Layout, List, Folder, Users, 
  ArrowLeft, Edit3, MessageSquare, X, GripVertical, CheckCircle2, Send
} from "lucide-react";

const JiraFullFinal = () => {
  // --- 1. KHỞI TẠO DỮ LIỆU ---
  const [projects] = useState([
    { id: 1, name: 'Hệ thống Quản lý Kho (WMS)', key: 'WMS', lead: 'Trần Văn A' },
    { id: 2, name: 'Ứng dụng E-Commerce Mobile', key: 'ECO', lead: 'Nguyễn Thị B' },
  ]);

  const [issues, setIssues] = useState(() => {
    const saved = localStorage.getItem("jira_final_tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentProject, setCurrentProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  
  // Form quản lý
  const [formData, setFormData] = useState({ tieuDe: "", mucDo: "Trung bình", loai: "Tác vụ", moTa: "", comments: [] });
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    localStorage.setItem("jira_final_tasks", JSON.stringify(issues));
  }, [issues]);

  // --- 2. LOGIC KÉO THẢ (DRAG & DROP) ---
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("taskId", id);
  };

  const handleDrop = (e, newStatus) => {
    const id = e.dataTransfer.getData("taskId");
    setIssues(prev => prev.map(i => i.id.toString() === id ? { ...i, trangThai: newStatus } : i));
  };

  // --- 3. XỬ LÝ CÔNG VIỆC ---
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
        ngayTao: new Date().toLocaleString("vi-VN")
      };
      setIssues([newTask, ...issues]);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingIssue(null);
    setFormData({ tieuDe: "", mucDo: "Trung bình", loai: "Tác vụ", moTa: "", comments: [] });
  };

  const openEdit = (issue) => {
    setEditingIssue(issue);
    setFormData({ ...issue });
    setShowModal(true);
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const commentObj = {
      id: Date.now(),
      text: newComment,
      user: "Đạt (Admin)",
      time: new Date().toLocaleTimeString("vi-VN")
    };
    setFormData({ ...formData, comments: [...formData.comments, commentObj] });
    setNewComment("");
  };

  const filteredIssues = issues.filter(i => 
    i.projectId === currentProject?.id && 
    i.tieuDe.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- 4. GIAO DIỆN ---

  // Màn hình chọn Project
  if (!currentProject) return (
    <div className="min-h-screen bg-slate-50 p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-slate-800 mb-8 tracking-tighter uppercase">TaskFlow Projects</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(p => (
            <div key={p.id} onClick={() => setCurrentProject(p)} className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all shadow-sm group">
              <Folder className="text-blue-500 group-hover:scale-110 transition-transform mb-4" size={40} />
              <h3 className="text-xl font-bold text-slate-800">{p.name}</h3>
              <div className="mt-4 flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-widest">{p.key} Project</span>
                <span className="text-xs">{issues.filter(i => i.projectId === p.id).length} Issues</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b px-6 py-3 flex justify-between items-center bg-white sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentProject(null)} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft size={20}/></button>
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase leading-none mb-1">{currentProject.key}</h2>
            <h1 className="text-lg font-black text-slate-800 leading-none">{currentProject.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input className="pl-10 pr-4 py-2 border rounded-full text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Tìm kiếm công việc..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Tạo mới</button>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 p-6 overflow-x-auto bg-slate-50">
        <div className="flex gap-6 h-full min-h-[500px]">
          {["Cần làm", "Đang làm", "Hoàn thành"].map((status) => (
            <div key={status} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, status)} className="flex-1 min-w-[300px] bg-slate-200/50 rounded-xl p-3 flex flex-col">
              <h3 className="text-[11px] font-black text-slate-500 uppercase mb-4 px-2 tracking-widest flex justify-between">
                <span>{status}</span>
                <span className="bg-slate-300 px-2 rounded-full">{filteredIssues.filter(i => i.trangThai === status).length}</span>
              </h3>
              
              <div className="space-y-3 overflow-y-auto flex-1">
                {filteredIssues.filter(i => i.trangThai === status).map((item) => (
                  <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item.id)} onClick={() => openEdit(item)} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-400 cursor-grab active:cursor-grabbing transition-all group">
                    <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400">{item.maTask}</span>
                        <GripVertical size={14} className="text-slate-200 group-hover:text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-4 line-clamp-2">{item.tieuDe}</p>
                    <div className="flex justify-between items-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${item.mucDo === 'Cao' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{item.mucDo}</span>
                        {item.comments.length > 0 && <div className="flex items-center gap-1 text-slate-400 text-xs"><MessageSquare size={12}/> {item.comments.length}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal Chi tiết / Tạo mới */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
               <span className="text-sm font-bold text-slate-400">{editingIssue ? editingIssue.maTask : "Tạo Issue mới"}</span>
               <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto flex">
                {/* Cột trái: Nội dung */}
                <div className="flex-[2] p-8 space-y-6 border-r">
                    <div>
                        <input className="text-2xl font-bold w-full outline-none border-b border-transparent focus:border-blue-500 pb-2" placeholder="Tóm tắt công việc..." value={formData.tieuDe} onChange={e => setFormData({...formData, tieuDe: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2">Mô tả</label>
                        <textarea rows="5" className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" placeholder="Viết mô tả chi tiết tại đây..." value={formData.moTa} onChange={e => setFormData({...formData, moTa: e.target.value})} />
                    </div>

                    {/* Section Bình luận */}
                    <div className="pt-6 border-t">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><MessageSquare size={16}/> Bình luận ({formData.comments.length})</h3>
                        <div className="space-y-4 mb-6">
                            {formData.comments.map(c => (
                                <div key={c.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">D</div>
                                    <div className="flex-1 bg-slate-50 p-3 rounded-xl relative">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs font-bold text-slate-700">{c.user}</span>
                                            <span className="text-[10px] text-slate-400">{c.time}</span>
                                        </div>
                                        <p className="text-sm text-slate-600">{c.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                             <input className="flex-1 bg-white border p-3 rounded-lg text-sm outline-none focus:border-blue-500" placeholder="Viết bình luận..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyPress={e => e.key === 'Enter' && addComment()} />
                             <button onClick={addComment} className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"><Send size={18}/></button>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Thông số */}
                <div className="flex-1 p-8 bg-slate-50/50 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Mức độ ưu tiên</label>
                        <select className="w-full bg-white border-2 p-2 rounded-lg text-sm font-bold" value={formData.mucDo} onChange={e => setFormData({...formData, mucDo: e.target.value})}>
                            <option value="Cao">🔥 Cao</option>
                            <option value="Trung bình">⚡ Trung bình</option>
                            <option value="Thấp">🌱 Thấp</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Loại Issue</label>
                        <select className="w-full bg-white border-2 p-2 rounded-lg text-sm font-bold" value={formData.loai} onChange={e => setFormData({...formData, loai: e.target.value})}>
                            <option value="Tác vụ">Tác vụ</option>
                            <option value="Lỗi (Bug)">Lỗi (Bug)</option>
                            <option value="Tính năng">Tính năng</option>
                        </select>
                    </div>
                    {editingIssue && (
                        <button onClick={() => { setIssues(issues.filter(i => i.id !== editingIssue.id)); closeModal(); }} className="w-full mt-10 flex items-center justify-center gap-2 text-red-500 text-xs font-bold hover:bg-red-50 p-2 rounded-lg transition">
                            <Trash2 size={14}/> Xóa công việc
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6 border-t bg-white flex justify-end gap-3">
                <button onClick={closeModal} className="px-6 py-2 text-sm font-bold text-slate-400">Hủy bỏ</button>
                <button onClick={handleSaveIssue} className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JiraFullFinal;