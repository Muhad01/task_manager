import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { HashRouter } from 'react-router-dom';
import { LayoutGrid, ListTodo, Calendar as CalIcon, Settings as SettingsIcon, Sun } from 'lucide-react';

import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import CalendarView from './components/CalendarView';
import RoutineBuilder from './components/RoutineBuilder';
import AIAssistant from './components/AIAssistant';
import Settings from './components/Settings';
import GestureController from './components/GestureController';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <TaskList />;
      case 'calendar': return <CalendarView />;
      case 'routines': return <RoutineBuilder />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all duration-200 ${
        activeTab === id 
          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium hidden md:block">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-card border-r border-gray-800 flex flex-col p-4 z-10">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg"></div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">NeuralTask</h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem id="dashboard" icon={LayoutGrid} label="Dashboard" />
          <NavItem id="tasks" icon={ListTodo} label="Tasks" />
          <NavItem id="calendar" icon={CalIcon} label="Calendar" />
          <NavItem id="routines" icon={Sun} label="Routines" />
          <div className="pt-4 mt-4 border-t border-gray-800">
            <NavItem id="settings" icon={SettingsIcon} label="Settings" />
          </div>
        </nav>
        
        <div className="mt-auto pt-6 text-xs text-gray-500 px-2">
           <p>Voice: "Hey Buddy"</p>
           <p>Gesture: Wave L/R</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8 relative">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold capitalize">{activeTab}</h2>
            <p className="text-gray-400">Manage your day with AI power.</p>
          </div>
        </header>
        
        {renderContent()}
      </main>

      <AIAssistant />
      <GestureController />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <MainLayout />
      </HashRouter>
    </AppProvider>
  );
};

export default App;