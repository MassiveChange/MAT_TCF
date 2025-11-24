

import React, { useState, useEffect } from 'react';
import { Schedule, Member, TCF, RepeatStatus, RunType } from '../types';
import { StorageService } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';

interface ScheduleViewProps {
  onReportClick?: (memberId: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onReportClick }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tcfs, setTcfs] = useState<TCF[]>([]);
  const { t, language } = useLanguage();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  
  // Adjusted formData to support tcfIds array
  const [formData, setFormData] = useState<Partial<Schedule> & { tcfIds?: string[] }>({
    repeatStatus: RepeatStatus.None,
    runType: RunType.SingleDirection,
    tcfIds: []
  });

  useEffect(() => {
    setSchedules(StorageService.getSchedules());
    setMembers(StorageService.getMembers());
    setTcfs(StorageService.getTCFs());
  }, []);

  // Auto-load draft
  useEffect(() => {
    if (isFormOpen && !formData.id && !draftLoaded) {
      const draft = StorageService.getDraft('schedule');
      if (draft) setFormData(draft);
      setDraftLoaded(true);
    }
  }, [isFormOpen, formData.id, draftLoaded]);

  // Auto-save draft
  useEffect(() => {
    if (isFormOpen && !formData.id && draftLoaded) {
      const timeout = setTimeout(() => {
        StorageService.saveDraft('schedule', formData);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [formData, isFormOpen, draftLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.tcfIds || formData.tcfIds.length === 0 || !formData.startDateTime) return;

    const newSchedule: Schedule = {
      id: formData.id || crypto.randomUUID(),
      memberId: formData.memberId,
      tcfIds: formData.tcfIds,
      startDateTime: formData.startDateTime,
      repeatStatus: formData.repeatStatus || RepeatStatus.None,
      runType: formData.runType || RunType.SingleDirection,
    };

    StorageService.saveSchedule(newSchedule);
    setSchedules(StorageService.getSchedules());

    if (!formData.id) StorageService.clearDraft('schedule');

    setIsFormOpen(false);
    setFormData({ repeatStatus: RepeatStatus.None, runType: RunType.SingleDirection, tcfIds: [] });
    setDraftLoaded(false);
  };

  const handleTcfSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, tcfIds: selectedOptions });
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown';
  
  const getRepeatLabel = (status: string) => {
    switch(status) {
      case RepeatStatus.Daily: return t.daily;
      case RepeatStatus.Weekly: return t.weekly;
      case RepeatStatus.Monthly: return t.monthly;
      case RepeatStatus.None: return t.none;
      default: return status;
    }
  };

  const getRunTypeLabel = (type: string) => {
    switch(type) {
      case RunType.SingleDirection: return t.singleDirection;
      case RunType.Bidirectional: return t.bidirectional;
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t.scheduleTitle}</h2>
        <button
          onClick={() => { setIsFormOpen(true); setFormData({ repeatStatus: RepeatStatus.None, runType: RunType.SingleDirection, tcfIds: [] }); setDraftLoaded(false); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
        >
          + {t.assignSchedule}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
           <h3 className="text-lg font-semibold mb-4">{t.newAssignment}</h3>
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">{t.members}</label>
               <select
                 required
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                 value={formData.memberId || ''}
                 onChange={(e) => setFormData({...formData, memberId: e.target.value})}
               >
                 <option value="">{t.selectMember}</option>
                 {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
               </select>
             </div>
             
             <div className="row-span-2">
               <label className="block text-sm font-medium text-slate-700 mb-1">{t.relatedTcf}</label>
               <p className="text-xs text-slate-400 mb-1">{t.holdCtrl}</p>
               <select
                 multiple
                 required
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white h-32"
                 value={formData.tcfIds || []}
                 onChange={handleTcfSelection}
               >
                 {tcfs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
               </select>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.startDateHour}</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={formData.startDateTime || ''}
                  onChange={(e) => setFormData({...formData, startDateTime: e.target.value})}
                />
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">{t.repeatStatus}</label>
               <select
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                 value={formData.repeatStatus}
                 onChange={(e) => setFormData({...formData, repeatStatus: e.target.value as RepeatStatus})}
               >
                 {Object.values(RepeatStatus).map(s => <option key={s} value={s}>{getRepeatLabel(s)}</option>)}
               </select>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">{t.runType}</label>
               <select
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                 value={formData.runType}
                 onChange={(e) => setFormData({...formData, runType: e.target.value as RunType})}
               >
                 {Object.values(RunType).map(r => <option key={r} value={r}>{getRunTypeLabel(r)}</option>)}
               </select>
             </div>

             <div className="md:col-span-2 flex justify-end space-x-3 space-x-reverse mt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg ms-3">{t.cancel}</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{t.saveAssignment}</button>
             </div>
           </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-start">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-slate-600 text-start">{t.startTime}</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-start">{t.members}</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-start">{t.tcfDefs}</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-start">{t.config}</th>
              <th className="px-6 py-4 text-end font-semibold text-slate-600">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
             {schedules.map(schedule => (
               <tr key={schedule.id} className="hover:bg-slate-50">
                 <td className="px-6 py-4 text-slate-900 font-medium text-start align-top">
                   {new Date(schedule.startDateTime).toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US')}
                 </td>
                 <td className="px-6 py-4 text-slate-700 text-start align-top">{getMemberName(schedule.memberId)}</td>
                 <td className="px-6 py-4 text-slate-700 text-start align-top">
                   <div className="flex flex-wrap gap-1">
                     {schedule.tcfIds.map(id => (
                       <span key={id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                         {tcfs.find(t => t.id === id)?.name || 'Unknown'}
                       </span>
                     ))}
                   </div>
                 </td>
                 <td className="px-6 py-4 text-slate-500 text-sm text-start align-top">
                   {getRepeatLabel(schedule.repeatStatus)} / {getRunTypeLabel(schedule.runType)}
                 </td>
                 <td className="px-6 py-4 text-end align-top space-x-2 space-x-reverse">
                    <button
                        onClick={() => onReportClick && onReportClick(schedule.memberId)}
                        className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors ms-2"
                    >
                        <span>📝</span>
                        <span className="hidden md:inline ms-1">{t.reportAction}</span>
                    </button>
                    <button 
                      onClick={() => {
                        StorageService.deleteSchedule(schedule.id);
                        setSchedules(StorageService.getSchedules());
                      }}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      {t.remove}
                    </button>
                 </td>
               </tr>
             ))}
             {schedules.length === 0 && (
               <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">{t.noSchedules}</td></tr>
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
