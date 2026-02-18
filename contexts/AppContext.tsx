import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Routine, AppSettings, TaskStatus } from '../types';

interface AppContextType {
  tasks: Task[];
  routines: Routine[];
  settings: AppSettings;
  activeTab: string;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setRoutines: React.Dispatch<React.SetStateAction<Routine[]>>;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setActiveTab: (tab: string) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  addRoutine: (routine: Routine) => void;
  toggleRoutine: (id: string) => void;
  deleteRoutine: (id: string) => void;
}

const defaultSettings: AppSettings = {
  userName: 'User',
  enableGestures: false,
  enableVoiceResponse: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [routines, setRoutines] = useState<Routine[]>(() => {
    const saved = localStorage.getItem('routines');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('routines', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const addTask = (task: Task) => setTasks(prev => [...prev, task]);
  
  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addRoutine = (routine: Routine) => setRoutines(prev => [...prev, routine]);

  const toggleRoutine = (id: string) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRoutine = (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  return (
    <AppContext.Provider value={{
      tasks, routines, settings, activeTab,
      setTasks, setRoutines, setSettings, setActiveTab,
      addTask, updateTask, deleteTask,
      addRoutine, toggleRoutine, deleteRoutine
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};