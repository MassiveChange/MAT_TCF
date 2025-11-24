import React, { ReactNode } from 'react';
import { ViewState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  const { t, language, setLanguage, dir } = useLanguage();
  const { logout } = useAuth();

  const navItems: { id: ViewState; label: string; icon: string }[] = [
    { id: 'DASHBOARD', label: t.dashboard, icon: '📊' },
    { id: 'MEMBERS', label: t.members, icon: '👥' },
    { id: 'TCF', label: t.tcfDefs, icon: '📋' },
    { id: 'SCHEDULE', label: t.schedule, icon: '📅' },
    { id: 'REPORTS', label: t.reports, icon: '📈' },
    { id: 'SETTINGS', label: t.settings, icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" dir={dir}>
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-700 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold tracking-wider text-indigo-400">{t.appTitle}</h1>
            <p className="text-xs text-slate-400 mt-1">{t.enterprise}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 text-start ${
                currentView === item.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium ms-3">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4">
           <div className="flex items-center justify-center space-x-2 bg-slate-800 rounded-lg p-1 mb-4">
              <button 
                onClick={() => setLanguage('en')}
                className={`flex-1 text-xs py-1 rounded ${language === 'en' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLanguage('fa')}
                className={`flex-1 text-xs py-1 rounded ${language === 'fa' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
              >
                فارسی
              </button>
           </div>
           
           <button 
             onClick={logout}
             className="w-full flex items-center justify-center px-4 py-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors text-sm"
           >
             <span>🚪</span>
             <span className="ms-2">{t.logout}</span>
           </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold shrink-0">
              AI
            </div>
            <div className="ms-3">
              <p className="text-sm font-medium">Gemini 2.5</p>
              <p className="text-xs text-green-400">{t.aiConnected}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-50 flex items-center justify-between px-4 text-white shadow-md">
        <span className="font-bold truncate">{t.appTitle}</span>
        <div className="flex items-center space-x-2 space-x-reverse">
            <button 
                onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
                className="text-xs border border-slate-600 px-2 py-1 rounded text-slate-300 me-2"
            >
               {language === 'en' ? 'FA' : 'EN'}
            </button>
           {navItems.map((item) => (
             <button key={item.id} onClick={() => onChangeView(item.id)} className={`text-xl ${currentView === item.id ? 'text-indigo-400' : 'text-slate-400'}`}>
                {item.icon}
             </button>
           ))}
           <button onClick={logout} className="text-red-400 ms-2">
             🚪
           </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:p-8 p-4 pt-20 md:pt-8 relative">
        <div className="max-w-7xl mx-auto h-full">
           {children}
        </div>
      </main>
    </div>
  );
};