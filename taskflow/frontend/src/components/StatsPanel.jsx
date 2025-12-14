import React, { useEffect } from 'react';
import { useIssueStore } from '../store/useIssueStore';
import { BarChart3, CheckCircle2, ListTodo, CircleDashed } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
    </div>
  </div>
);

const StatsPanel = () => {
  const { stats, fetchStats } = useIssueStore();

  useEffect(() => {
    fetchStats();
  }, []);

  if (!stats) return <div className="animate-pulse h-24 bg-gray-200 rounded-lg mb-6"></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatCard 
        title="Total Issues" 
        value={stats.total_issues} 
        icon={ListTodo} 
        color="bg-blue-500" 
      />
      <StatCard 
        title="To Do" 
        value={stats.issues_by_status["To Do"] || 0} 
        icon={CircleDashed} 
        color="bg-yellow-500" 
      />
      <StatCard 
        title="In Progress" 
        value={stats.issues_by_status["In Progress"] || 0} 
        icon={BarChart3} 
        color="bg-purple-500" 
      />
      <StatCard 
        title="Done" 
        value={stats.issues_by_status["Done"] || 0} 
        icon={CheckCircle2} 
        color="bg-green-500" 
      />
    </div>
  );
};

export default StatsPanel;