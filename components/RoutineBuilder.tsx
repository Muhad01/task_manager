import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Plus, X, Sun, Clock } from 'lucide-react';

const RoutineBuilder: React.FC = () => {
  const { routines, addRoutine, deleteRoutine, toggleRoutine } = useApp();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');

  const handleAdd = () => {
    if (!title.trim()) return;
    addRoutine({
      id: Date.now().toString(),
      title,
      time,
      frequency: 'daily',
      active: true
    });
    setTitle('');
  };

  const sortedRoutines = [...routines].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Sun className="text-yellow-500"/> Daily Routine</h2>
        
        <div className="space-y-3">
          {sortedRoutines.map(routine => (
            <div key={routine.id} className="relative overflow-hidden bg-card rounded-xl border border-gray-800 p-4 flex items-center justify-between">
              {routine.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary"></div>}
              
              <div className="flex items-center gap-4 pl-2">
                 <div className="bg-gray-800 px-3 py-1 rounded text-sm font-mono text-secondary flex items-center gap-1">
                    <Clock size={14}/> {routine.time}
                 </div>
                 <span className={`font-medium ${!routine.active && 'text-gray-500 line-through'}`}>{routine.title}</span>
              </div>
              
              <div className="flex items-center gap-2">
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={routine.active} onChange={() => toggleRoutine(routine.id)} />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                 </label>
                 <button onClick={() => deleteRoutine(routine.id)} className="p-2 text-gray-500 hover:text-red-500">
                    <X size={18} />
                 </button>
              </div>
            </div>
          ))}
          {routines.length === 0 && <p className="text-gray-500 text-center py-8">No routines set. Start your day right!</p>}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-gray-800 p-6 h-fit">
        <h3 className="font-bold mb-4">Add Routine Item</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Time</label>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-dark rounded-lg px-3 py-2 border border-gray-700 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Activity</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning Jog"
              className="w-full bg-dark rounded-lg px-3 py-2 border border-gray-700 focus:border-primary outline-none"
            />
          </div>
          <button onClick={handleAdd} className="w-full bg-secondary hover:bg-secondary/90 text-white py-2 rounded-lg font-medium">
             Add to Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoutineBuilder;