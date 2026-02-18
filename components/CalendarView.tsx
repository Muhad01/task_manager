import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { ChevronLeft, ChevronRight, Clock, Repeat, Calendar as CalIcon } from 'lucide-react';

const CalendarView: React.FC = () => {
  const { tasks, routines } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  // Helper to get items for a specific day
  const getItemsForDay = (day: number) => {
    const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // 1. One-time tasks
    const dayTasks = tasks.filter(t => t.date === dateStr).map(t => ({
      ...t,
      type: 'task'
    }));

    // 2. Routines (Recurring)
    // Simplified logic: If frequency is daily, show every day.
    const dayRoutines = routines.filter(r => r.active && r.frequency === 'daily').map(r => ({
      id: `routine-${r.id}-${day}`,
      title: r.title,
      time: r.time,
      type: 'routine',
      status: 'TODO'
    }));

    // Merge and sort by time
    const allItems = [...dayTasks, ...dayRoutines].sort((a, b) => {
       if (!a.time) return 1;
       if (!b.time) return -1;
       return a.time.localeCompare(b.time);
    });

    return allItems;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><CalIcon className="text-secondary"/> {monthName} {year}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-800 rounded"><ChevronLeft /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-800 rounded"><ChevronRight /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-800 border border-gray-800 rounded-lg overflow-hidden flex-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-card text-center font-semibold text-gray-400 py-3 text-sm">
            {day}
          </div>
        ))}
        
        {/* Empty cells for previous month */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-card/50 min-h-[120px]"></div>
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const items = getItemsForDay(day);
          const isToday = new Date().toDateString() === new Date(year, currentDate.getMonth(), day).toDateString();

          return (
            <div key={day} className={`bg-card min-h-[120px] p-2 hover:bg-gray-800/50 transition-colors flex flex-col gap-1 ${isToday ? 'bg-gray-800/80 ring-1 ring-inset ring-primary' : ''}`}>
              <div className={`text-right text-sm mb-1 ${isToday ? 'text-primary font-bold' : 'text-gray-400'}`}>
                {day}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                {items.map((item: any) => (
                  <div 
                    key={item.id} 
                    className={`text-[10px] px-1.5 py-1 rounded truncate border-l-2 flex items-center gap-1
                      ${item.type === 'routine' 
                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500'
                      }`}
                    title={item.title}
                  >
                    {item.type === 'routine' ? <Repeat size={8} /> : (item.time ? <Clock size={8} /> : null)}
                    {item.time && <span className="opacity-75 mr-0.5">{item.time}</span>}
                    <span className={item.status === 'COMPLETED' ? 'line-through opacity-50' : ''}>{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex gap-4 text-xs text-gray-400 justify-end">
         <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500/20 border-l-2 border-blue-500 rounded"></div> Task</div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500/20 border-l-2 border-yellow-500 rounded"></div> Routine</div>
      </div>
    </div>
  );
};

export default CalendarView;