import React from 'react';
import { useApp } from '../contexts/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { CheckCircle, Clock, Calendar } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { tasks, routines } = useApp();

  const todoCount = tasks.filter(t => t.status === 'TODO').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalTasks = tasks.length;

  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const pieData = [
    { name: 'To Do', value: todoCount, color: '#f472b6' },
    { name: 'In Progress', value: inProgressCount, color: '#60a5fa' },
    { name: 'Completed', value: completedCount, color: '#4ade80' },
  ].filter(d => d.value > 0);

  // Group tasks by date for Bar Chart
  const tasksByDate = tasks.reduce((acc, task) => {
    acc[task.date] = (acc[task.date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.keys(tasksByDate).slice(-5).map(date => ({
    name: date,
    tasks: tasksByDate[date]
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-xl border border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Clock size={24}/></div>
          <div>
            <p className="text-gray-400 text-sm">Pending Tasks</p>
            <h3 className="text-2xl font-bold">{todoCount + inProgressCount}</h3>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><CheckCircle size={24}/></div>
          <div>
            <p className="text-gray-400 text-sm">Completed</p>
            <h3 className="text-2xl font-bold">{completedCount}</h3>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500"><Calendar size={24}/></div>
          <div>
            <p className="text-gray-400 text-sm">Active Routines</p>
            <h3 className="text-2xl font-bold">{routines.filter(r => r.active).length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl border border-gray-800">
          <h3 className="font-semibold mb-6">Task Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-gray-800">
          <h3 className="font-semibold mb-6">Workload by Date</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#334155' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                <Bar dataKey="tasks" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="bg-card p-6 rounded-xl border border-gray-800">
         <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Overall Productivity</span>
            <span className="text-sm text-gray-400">{completionRate}%</span>
         </div>
         <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;