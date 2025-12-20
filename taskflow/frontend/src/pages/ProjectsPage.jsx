import React from 'react';
import { Folder, Star, Users, ArrowUpRight } from 'lucide-react';

const projects = [
  { id: 1, name: 'Hệ thống Quản lý Kho (WMS)', key: 'WMS-2024', lead: 'Trần Văn A', type: 'Phần mềm' },
  { id: 2, name: 'Ứng dụng E-Commerce Mobile', key: 'ECO-APP', lead: 'Nguyễn Thị B', type: 'Di động' },
];

const ProjectsPage = () => (
  <div className="p-8">
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-slate-800">Dự án của bạn</h2>
      <p className="text-slate-500 text-sm">Quản lý và theo dõi tiến độ các dự án đang tham gia.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((p) => (
        <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all group cursor-pointer">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Folder size={24} />
            </div>
            <ArrowUpRight size={20} className="text-slate-300 group-hover:text-blue-600" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">{p.name}</h3>
          <p className="text-xs text-slate-400 font-mono mb-6">{p.key}</p>
          <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center"><Users size={12}/></div>
                <span className="text-xs text-slate-600 font-medium">{p.lead}</span>
             </div>
             <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-500 tracking-tighter">{p.type}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ProjectsPage;