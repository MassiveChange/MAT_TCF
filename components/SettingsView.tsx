

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { StorageService } from '../services/storage';

export const SettingsView: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateCredentials } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    // Initial load
    const creds = StorageService.getAuth();
    setUsername(creds.username);
    
    // Check for draft username only
    const draft = StorageService.getDraft('settings_username');
    if (draft && draft.username && draft.username !== creds.username) {
       setUsername(draft.username);
    }
  }, []);

  // Auto-save username draft
  useEffect(() => {
      if (username) {
        StorageService.saveDraft('settings_username', { username });
      }
  }, [username]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: t.passwordMismatch });
      return;
    }
    
    if (!username || !password) {
        setMessage({ type: 'error', text: t.invalidCredentials });
        return;
    }

    updateCredentials(username, password);
    StorageService.clearDraft('settings_username');
    
    setMessage({ type: 'success', text: t.credentialsUpdated });
    setPassword('');
    setConfirmPassword('');
  };

  const handleBackup = () => {
    const data = StorageService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tcf_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
    if (window.confirm(t.restoreWarning)) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importData(content);
      if (success) {
        alert(t.dataRestored);
        window.location.reload();
      } else {
        alert(t.invalidFile);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credentials Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="me-2">🔐</span> {t.changeCredentials}
          </h2>
          
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.newUsername}</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.newPassword}</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.confirmPassword}</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                dir="ltr"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow transition-colors"
              >
                {t.updateCredentials}
              </button>
            </div>
          </form>
        </div>

        {/* Database Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="me-2">💾</span> {t.databaseManagement}
          </h2>
          
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-600 mb-4">{t.downloadBackup}</p>
              <button
                onClick={handleBackup}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 rounded-lg flex items-center justify-center transition-colors"
              >
                <span className="me-2">⬇️</span> {t.backupData}
              </button>
            </div>

            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-sm text-red-700 mb-4">{t.uploadRestore}</p>
              <button
                onClick={handleRestoreClick}
                className="w-full bg-white border border-red-300 text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg flex items-center justify-center transition-colors"
              >
                <span className="me-2">⬆️</span> {t.restoreData}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
