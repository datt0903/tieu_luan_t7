import React, { useState, useEffect } from "react";
// Đảm bảo bạn đã cài thư viện icon: npm install lucide-react
import { 
  Plus, Search, MoreHorizontal, Trash2, 
  ChevronRight, ChevronLeft, Tag, Layout, List, CheckCircle2
} from "lucide-react";

const IssuesPage = () => {
  // 1. Quản lý danh sách công việc (Lưu tại máy người dùng)
  const [issues, setIssues] = useState(() => {
    const dataLuuTru = localStorage.getItem("taskflow_jira_v2");
    return dataLuuTru ? JSON.parse(dataLuuTru) : [];
  });

  const [cheDoXem, setCheDoXem] = useState("board"); // "board" hoặc "list"
  const [tuKhoaTimKiem, setTuKhoaTimKiem] = useState("");
  const [hienModal, setHienModal] = useState(false);

  // Form nhập liệu
  const [duLieuForm, setDuLieuForm] = useState({
    tieuDe: "",
    mucDo: "Trung bình",
    loai: "Tác vụ"
  });

  // Tự động lưu mỗi khi có thay đổi
  useEffect(() => {
    localStorage.setItem("taskflow_jira_v2", JSON.stringify(issues));
  }, [issues]);

  // 2. Các hàm xử lý chức năng
  const themCongViec = (e) => {
    e.preventDefault();
    if (!duLieuForm.tieuDe.trim()) return;

    const taskMoi = {
      id: Date.now(),
      maTask: `TSK-${issues.length + 101}`,
      ...duLieuForm,
      trangThai: "Cần làm",
      ngayTao: new Date().toLocaleDateString("vi-VN")
    };

    setIssues([taskMoi, ...issues]);
    setDuLieuForm({ tieuDe: "", mucDo: "Trung bình", loai: "Tác vụ" });
    setHienModal(false);
  };

  const chuyenTrangThai = (id, huongDi) => {
    const cacBuoc = ["Cần làm", "Đang làm", "Hoàn thành"];
    setIssues(issues.map(item => {
      if (item.id === id) {
        const viTriHienTai = cacBuoc.indexOf(item.trangThai);
        const viTriMoi = viTriHienTai + huongDi;
        if (viTriMoi >= 0 && viTriMoi < cacBuoc.length) {
          return { ...item, trangThai: cacBuoc[viTriMoi] };
        }
      }
      return item;
    }));
  };

  const xoaTask = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn công việc này?")) {
      setIssues(issues.filter(i => i.id !== id));
    }
  };

  const danhSachLoc = issues.filter(i => 
    i.tieuDe.toLowerCase().includes(tuKhoaTimKiem.toLowerCase()) || 
    i.maTask.toLowerCase().includes(tuKhoaTimKiem.toLowerCase())
  );

  // 3. Thành phần giao diện con (Card công việc)
  const CardCongViec = ({ item }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-all group">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-bold text-gray-400">{item.maTask}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
          item.mucDo === "Cao" ? "bg-red-100 text-red-600" : 
          item.mucDo === "Trung bình" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
        }`}>
          {item.mucDo}
        </span>
      </div>
      <h4 className="text-sm font-semibold text-gray-800 mb-3">{item.tieuDe}</h4>
      <div className="flex items-center gap-2 mb-4">
        <Tag size={12} className="text-blue-500" />
        <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{item.loai}</span>
      </div>
      
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="flex gap-1">
          <button 
            onClick={() => chuyenTrangThai(item.id, -1)} 
            className={`p-1 hover:bg-gray-100 rounded ${item.trangThai === "Cần làm" ? "invisible" : ""}`}
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => chuyenTrangThai(item.id, 1)} 
            className={`p-1 hover:bg-gray-100 rounded ${item.trangThai === "Hoàn thành" ? "invisible" : ""}`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button onClick={() => xoaTask(item.id)} className="text-gray-300 hover:text-red-500 p-1">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-gray-800 font-sans">
      {/* Thanh Menu trên cùng */}
      <header className="bg-white border-b px-6 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-md text-white font-black">TF</div>
            <h1 className="text-lg font-bold tracking-tight">TaskFlow Project</h1>
          </div>
          <nav className="flex gap-4 text-sm font-medium">
            <button 
              onClick={() => setCheDoXem("board")} 
              className={`flex items-center gap-2 py-1 ${cheDoXem === 'board' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              <Layout size={16} /> Bảng Kanban
            </button>
            <button 
              onClick={() => setCheDoXem("list")} 
              className={`flex items-center gap-2 py-1 ${cheDoXem === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              <List size={16} /> Danh sách
            </button>
          </nav>
        </div>
        <button 
          onClick={() => setHienModal(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold text-sm transition shadow-sm"
        >
          Tạo mới
        </button>
      </header>

      {/* Thanh Tìm kiếm */}
      <div className="px-6 py-5">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc mã task..."
            className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm w-full shadow-sm"
            value={tuKhoaTimKiem}
            onChange={(e) => setTuKhoaTimKiem(e.target.value)}
          />
        </div>
      </div>

      {/* Nội dung chính */}
      <main className="px-6 pb-10">
        {cheDoXem === "board" ? (
          <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
            {/* Cột: Cần làm */}
            <div className="flex-1 min-w-[320px] bg-[#ebecf0] rounded-xl p-3 flex flex-col">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-4 px-2">Cần làm ({danhSachLoc.filter(i => i.trangThai === "Cần làm").length})</h3>
              <div className="space-y-3 overflow-y-auto pr-1">
                {danhSachLoc.filter(i => i.trangThai === "Cần làm").map(item => <CardCongViec key={item.id} item={item} />)}
              </div>
            </div>

            {/* Cột: Đang làm */}
            <div className="flex-1 min-w-[320px] bg-[#ebecf0] rounded-xl p-3 flex flex-col">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-4 px-2">Đang làm ({danhSachLoc.filter(i => i.trangThai === "Đang làm").length})</h3>
              <div className="space-y-3 overflow-y-auto pr-1">
                {danhSachLoc.filter(i => i.trangThai === "Đang làm").map(item => <CardCongViec key={item.id} item={item} />)}
              </div>
            </div>

            {/* Cột: Hoàn thành */}
            <div className="flex-1 min-w-[320px] bg-[#ebecf0] rounded-xl p-3 flex flex-col">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-4 px-2 text-green-600">Hoàn thành ({danhSachLoc.filter(i => i.trangThai === "Hoàn thành").length})</h3>
              <div className="space-y-3 overflow-y-auto pr-1">
                {danhSachLoc.filter(i => i.trangThai === "Hoàn thành").map(item => <CardCongViec key={item.id} item={item} />)}
              </div>
            </div>
          </div>
        ) : (
          /* Giao diện Danh sách */
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-4">Mã Task</th>
                  <th className="p-4">Tiêu đề</th>
                  <th className="p-4">Ưu tiên</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {danhSachLoc.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-bold text-blue-600">{item.maTask}</td>
                    <td className="p-4 font-semibold">{item.tieuDe}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.mucDo === 'Cao' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {item.mucDo}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[11px] font-bold uppercase">
                        {item.trangThai}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => xoaTask(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Cửa sổ Modal Thêm công việc */}
      {hienModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Tạo công việc mới</h2>
            <form onSubmit={themCongViec} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Tiêu đề công việc *</label>
                <input 
                  autoFocus
                  required
                  className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition"
                  placeholder="Hôm nay cần làm gì?"
                  value={duLieuForm.tieuDe}
                  onChange={e => setDuLieuForm({...duLieuForm, tieuDe: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Ưu tiên</label>
                  <select 
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white outline-none focus:border-blue-500"
                    value={duLieuForm.mucDo}
                    onChange={e => setDuLieuForm({...duLieuForm, mucDo: e.target.value})}
                  >
                    <option value="Cao">🔥 Cao</option>
                    <option value="Trung bình">⚡ Trung bình</option>
                    <option value="Thấp">🌱 Thấp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Phân loại</label>
                  <select 
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white outline-none focus:border-blue-500"
                    value={duLieuForm.loai}
                    onChange={e => setDuLieuForm({...duLieuForm, loai: e.target.value})}
                  >
                    <option value="Tác vụ">Tác vụ</option>
                    <option value="Lỗi (Bug)">Lỗi (Bug)</option>
                    <option value="Tính năng">Tính năng</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button 
                  type="button" 
                  onClick={() => setHienModal(false)} 
                  className="px-5 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition"
                >
                  Tạo Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssuesPage;