import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Plus, Trash2, CheckCircle, Circle, Clock } from 'lucide-react';
import { TaskStatus } from '../types';

const TaskList: React.FC = () => {
  const { tasks, addTask, deleteTask, updateTask } = useApp();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAdd = () => {
    if (!newTaskTitle.trim()) return;
    addTask({
      id: Date.now().toString(),
      title: newTaskTitle,
      date: newTaskDate,
      status: TaskStatus.TODO,
      category: 'General'
    });
    setNewTaskTitle('');
  };

  const toggleStatus = (id: string, currentStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask({
        ...task,
        status: currentStatus === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-xl border border-gray-800">
        <h2 className="text-xl font-bold mb-4">Add New Task</h2>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done?" 
            className="flex-1 bg-dark rounded-lg px-4 py-2 border border-gray-700 focus:border-primary outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input 
            type="date" 
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
            className="bg-dark rounded-lg px-4 py-2 border border-gray-700 focus:border-primary outline-none"
          />
          <button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">
            <Plus size={18} /> Add
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {tasks.map(task => (
          <div key={task.id} className="bg-card p-4 rounded-xl border border-gray-800 flex items-center justify-between group hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => toggleStatus(task.id, task.status)}
                className={`text-gray-400 hover:text-primary transition-colors ${task.status === TaskStatus.COMPLETED ? 'text-green-500' : ''}`}
              >
                {task.status === TaskStatus.COMPLETED ? <CheckCircle size={24} /> : <Circle size={24} />}
              </button>
              <div>
                <h3 className={`font-medium ${task.status === TaskStatus.COMPLETED ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={12}/> {task.date}</span>
                  <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">{task.category}</span>
                </div>
              </div>
            </div>
            <button onClick={() => deleteTask(task.id)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No tasks yet. Add one or ask AI!
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;