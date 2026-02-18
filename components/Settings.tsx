import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Save } from 'lucide-react';

const Settings: React.FC = () => {
  const { settings, setSettings } = useApp();
  const [localSettings, setLocalSettings] = React.useState(settings);

  const handleSave = () => {
    setSettings(localSettings);
    alert('Settings Saved!');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-card p-8 rounded-xl border border-gray-800">
        <h2 className="text-2xl font-bold mb-6">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
               <h4 className="font-medium">Hand Gestures</h4>
               <p className="text-sm text-gray-400">Navigate and control cursor using webcam</p>
               <p className="text-xs text-gray-500 mt-1">Pointer: Index Finger | Click: Pinch | Scroll: Open Palm | Nav: Swipe</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={localSettings.enableGestures} onChange={(e) => setLocalSettings({...localSettings, enableGestures: e.target.checked})} />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
               <h4 className="font-medium">User Name</h4>
               <p className="text-sm text-gray-400">How the AI addresses you</p>
            </div>
            <input 
                type="text" 
                value={localSettings.userName}
                onChange={(e) => setLocalSettings({...localSettings, userName: e.target.value})}
                className="bg-dark rounded px-3 py-1 border border-gray-700 w-32 text-right" 
            />
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-primary/25 transition-shadow flex items-center justify-center gap-2">
        <Save size={20} /> Save Configuration
      </button>
    </div>
  );
};

export default Settings;