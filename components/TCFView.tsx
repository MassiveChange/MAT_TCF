
import React, { useState, useEffect } from 'react';
import { TCF } from '../types';
import { StorageService } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';

export const TCFView: React.FC = () => {
  const [tcfs, setTcfs] = useState<TCF[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TCF>>({});
  const [draftLoaded, setDraftLoaded] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setTcfs(StorageService.getTCFs());
  }, []);

  // Auto-load draft
  useEffect(() => {
    if (isFormOpen && !formData.id && !draftLoaded) {
      const draft = StorageService.getDraft('tcf');
      if (draft) setFormData(draft);
      setDraftLoaded(true);
    }
  }, [isFormOpen, formData.id, draftLoaded]);

  // Auto-save draft
  useEffect(() => {
    if (isFormOpen && !formData.id && draftLoaded) {
      const timeout = setTimeout(() => {
        StorageService.saveDraft('tcf', formData);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [formData, isFormOpen, draftLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newTCF: TCF = {
      id: formData.id || crypto.randomUUID(),
      name: formData.name,
      description: formData.description || '',
    };

    StorageService.saveTCF(newTCF);
    setTcfs(StorageService.getTCFs());
    
    if (!formData.id) StorageService.clearDraft('tcf');
    
    setIsFormOpen(false);
    setFormData({});
    setDraftLoaded(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.deleteTcfConfirm)) {
      StorageService.deleteTCF(id);
      setTcfs(StorageService.getTCFs());
    }
  };

  const handleEdit = (tcf: TCF) => {
    setFormData(tcf);
    setIsFormOpen(true);
    setDraftLoaded(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t.tcfTitle}</h2>
        <button
          onClick={() => { setIsFormOpen(true); setFormData({}); setDraftLoaded(false); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
        >
          + {t.newTcf}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">{formData.id ? t.editTcf : t.newTcf}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.tcfName}</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Daily Safety Check"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.description} <span className="text-slate-400 text-xs">({t.optional})</span></label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t.describeProcedure}
              />
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
                {t.saveDef}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tcfs.map((tcf) => (
          <div key={tcf.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-slate-800">{tcf.name}</h3>
              <div className="flex space-x-2 space-x-reverse shrink-0">
                 <button onClick={() => handleEdit(tcf)} className="text-indigo-500 hover:text-indigo-700 text-sm ms-2">{t.edit}</button>
                 <button onClick={() => handleDelete(tcf.id)} className="text-red-400 hover:text-red-600 text-sm">{t.delete}</button>
              </div>
            </div>
            {tcf.description && (
              <p className="text-slate-600 text-sm leading-relaxed mt-2">{tcf.description}</p>
            )}
          </div>
        ))}
        {tcfs.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-slate-100 rounded-xl border border-dashed border-slate-300">
            {t.noTcfs}
          </div>
        )}
      </div>
    </div>
  );
};
