import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const LoginView: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { login } = useAuth();
  const { t, dir, language, setLanguage } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir={dir}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{t.appTitle}</h1>
          <p className="text-slate-500">{t.loginTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
              {t.invalidCredentials}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.username}</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              dir="ltr" // Force LTR for credentials usually
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.password}</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg"
          >
            {t.login}
          </button>
        </form>

        <div className="mt-8 flex justify-center border-t border-slate-100 pt-4">
           <div className="flex space-x-4 space-x-reverse">
             <button 
               onClick={() => setLanguage('en')}
               className={`text-sm ${language === 'en' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}
             >
               English
             </button>
             <span className="text-slate-300">|</span>
             <button 
               onClick={() => setLanguage('fa')}
               className={`text-sm ${language === 'fa' ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}
             >
               فارسی
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};