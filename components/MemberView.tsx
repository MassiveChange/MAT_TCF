

import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import { StorageService } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';

interface MemberViewProps {
  onReportClick?: (memberId: string) => void;
}

export const MemberView: React.FC<MemberViewProps> = ({ onReportClick }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Member>>({});
  const [draftLoaded, setDraftLoaded] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setMembers(StorageService.getMembers());
  }, []);

  // Auto-load draft for new entries
  useEffect(() => {
    if (isFormOpen && !formData.id && !draftLoaded) {
      const draft = StorageService.getDraft('member');
      if (draft) {
        setFormData(draft);
      }
      setDraftLoaded(true);
    }
  }, [isFormOpen, formData.id, draftLoaded]);

  // Auto-save draft for new entries
  useEffect(() => {
    if (isFormOpen && !formData.id && draftLoaded) {
      const timeoutId = setTimeout(() => {
        StorageService.saveDraft('member', formData);
      }, 500); // Debounce save
      return () => clearTimeout(timeoutId);
    }
  }, [formData, isFormOpen, draftLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newMember: Member = {
      id: formData.id || crypto.randomUUID(),
      name: formData.name,
      startDate: formData.startDate || new Date().toISOString().split('T')[0], // Automatic start date if new
      phoneNumber: formData.phoneNumber || '',
      age: formData.age || '',
      description: formData.description || '',
    };

    StorageService.saveMember(newMember);
    setMembers(StorageService.getMembers());
    
    if (!formData.id) {
      StorageService.clearDraft('member');
    }
    
    setIsFormOpen(false);
    setFormData({});
    setDraftLoaded(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.confirm)) {
      StorageService.deleteMember(id);
      setMembers(StorageService.getMembers());
    }
  };

  const handleEdit = (member: Member) => {
    setFormData(member);
    setIsFormOpen(true);
    setDraftLoaded(true); // Treat as loaded so we don't overwrite with new-member draft
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t.membersTitle}</h2>
        <button
          onClick={() => { setIsFormOpen(true); setFormData({}); setDraftLoaded(false); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition-colors"
        >
          + {t.addMember}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4">{formData.id ? t.editMember : t.newMember}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.fullName}</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.phoneNumber} <span className="text-xs text-slate-400">({t.optional})</span></label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.age} <span className="text-xs text-slate-400">({t.optional})</span></label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.memberDescription} <span className="text-xs text-slate-400">({t.optional})</span></label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse mt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg ms-3"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {t.saveMember}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-slate-600 text-start">{t.fullName}</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-start">{t.phoneNumber}</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-start">{t.startDate}</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-end">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  {t.noMembers}
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-900">
                      <div className="font-medium">{member.name}</div>
                      {member.description && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{member.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{member.phoneNumber || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{member.startDate}</td>
                  <td className="px-6 py-4 text-end space-x-2 space-x-reverse">
                    <button
                        onClick={() => onReportClick && onReportClick(member.id)}
                        className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors ms-2"
                    >
                        <span>📝</span>
                        <span className="hidden md:inline ms-1">{t.reportAction}</span>
                    </button>
                    <button
                      onClick={() => handleEdit(member)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm ms-2"
                    >
                      {t.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
                    >
                      {t.delete}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
