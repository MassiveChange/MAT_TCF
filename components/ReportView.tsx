

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Report, Member, TCF, Schedule } from '../types';
import { StorageService } from '../services/storage';
import { analyzeReports } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface ReportViewProps {
  initialMemberId?: string | null;
  onClearInitialMember?: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ initialMemberId, onClearInitialMember }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tcfs, setTcfs] = useState<TCF[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const { t, language } = useLanguage();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Report>>({});
  const [draftLoaded, setDraftLoaded] = useState(false);
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    setReports(StorageService.getReports().sort((a,b) => b.timestamp - a.timestamp));
    setMembers(StorageService.getMembers());
    setTcfs(StorageService.getTCFs());
    setSchedules(StorageService.getSchedules());
  }, []);

  // Handle initial member selection from navigation
  useEffect(() => {
    if (initialMemberId) {
      setIsFormOpen(true);
      setFormData(prev => ({ ...prev, memberId: initialMemberId }));
      setDraftLoaded(true); // Treat as loaded to prevent overwriting with generic draft
      if (onClearInitialMember) {
        onClearInitialMember();
      }
    }
  }, [initialMemberId, onClearInitialMember]);

  // Auto-load draft
  useEffect(() => {
    if (isFormOpen && !formData.id && !initialMemberId && !draftLoaded) {
      const draft = StorageService.getDraft('report');
      if (draft) setFormData(draft);
      setDraftLoaded(true);
    }
  }, [isFormOpen, formData.id, initialMemberId, draftLoaded]);

  // Auto-save draft
  useEffect(() => {
    if (isFormOpen && !formData.id && draftLoaded) {
      const timeout = setTimeout(() => {
        // Exclude audio note from draft to prevent localStorage quota issues
        const { audioNote, ...draftData } = formData;
        StorageService.saveDraft('report', draftData);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [formData, isFormOpen, draftLoaded]);

  // Derived state: Available TCFs based on selected member's schedule
  const availableTcfs = useMemo(() => {
    if (!formData.memberId) return [];
    
    // Find all schedule entries for this member
    const memberSchedules = schedules.filter(s => s.memberId === formData.memberId);
    
    // Collect all TCF IDs from these schedules
    const scheduledTcfIds = new Set<string>();
    memberSchedules.forEach(s => {
      s.tcfIds.forEach(id => scheduledTcfIds.add(id));
    });

    // Return TCF objects that match the scheduled IDs
    return tcfs.filter(tcf => scheduledTcfIds.has(tcf.id));
  }, [formData.memberId, schedules, tcfs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.tcfId) return;

    const newReport: Report = {
      id: crypto.randomUUID(),
      memberId: formData.memberId,
      tcfId: formData.tcfId,
      startTime: formData.startTime,
      description: formData.description,
      timestamp: Date.now(),
      audioNote: formData.audioNote
    };

    StorageService.saveReport(newReport);
    setReports(StorageService.getReports().sort((a,b) => b.timestamp - a.timestamp));
    StorageService.clearDraft('report');
    resetForm();
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setFormData({});
    setDraftLoaded(false);
    setPreviewAudioUrl(null);
    setIsRecording(false);
    mediaRecorderRef.current = null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setPreviewAudioUrl(url);
        
        // Convert to Base64 for storage
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setFormData(prev => ({ ...prev, audioNote: base64data }));
        };

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    setPreviewAudioUrl(null);
    setFormData(prev => ({ ...prev, audioNote: undefined }));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAiAnalysis('');
    const result = await analyzeReports(reports, members, tcfs, language);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown';
  const getTCFName = (id: string) => tcfs.find(t => t.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t.reportsTitle}</h2>
        <div className="space-x-3 space-x-reverse">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || reports.length === 0}
            className={`px-4 py-2 rounded-lg shadow font-medium transition-all ms-3 ${
              isAnalyzing 
                ? 'bg-indigo-300 cursor-not-allowed' 
                : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            {isAnalyzing ? t.analyzing : `✨ ${t.aiInsights}`}
          </button>
          <button
            onClick={() => { setIsFormOpen(true); setFormData({}); setDraftLoaded(false); setPreviewAudioUrl(null); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
          >
            + {t.logEntry}
          </button>
        </div>
      </div>

      {aiAnalysis && (
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl animate-fade-in">
          <h3 className="text-indigo-900 font-semibold mb-2 flex items-center">
            <span className="me-2">✨</span> {t.geminiAnalysis}
          </h3>
          <div className="prose prose-sm text-indigo-800 max-w-none whitespace-pre-wrap font-sans">
            {aiAnalysis}
          </div>
          <button 
            onClick={() => setAiAnalysis('')} 
            className="mt-3 text-xs text-indigo-500 underline hover:text-indigo-700"
          >
            {t.dismiss}
          </button>
        </div>
      )}

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
           <h3 className="text-lg font-semibold mb-4">{t.logExecution}</h3>
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">{t.members}</label>
               <select
                 required
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                 value={formData.memberId || ''}
                 onChange={(e) => {
                   setFormData({...formData, memberId: e.target.value, tcfId: ''}); 
                 }}
               >
                 <option value="">{t.selectMember}</option>
                 {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
               </select>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">{t.relatedTcf}</label>
               <select
                 required
                 disabled={!formData.memberId}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-400"
                 value={formData.tcfId || ''}
                 onChange={(e) => setFormData({...formData, tcfId: e.target.value})}
               >
                 <option value="">{formData.memberId ? t.selectTcf : t.selectMember}</option>
                 {availableTcfs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
               </select>
               {formData.memberId && availableTcfs.length === 0 && (
                 <p className="text-xs text-red-500 mt-1">{t.noScheduledTcfs}</p>
               )}
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.actualStartTime} <span className="text-xs text-slate-400">({t.optional})</span></label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={formData.startTime || ''}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.description} <span className="text-xs text-slate-400">({t.optional})</span></label>
                <textarea
                  rows={1}
                  placeholder={t.enterReportDescription}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
             </div>

             <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.audioNote}</label>
                <div className="flex items-center space-x-4 space-x-reverse bg-slate-50 p-4 rounded-lg">
                  {!isRecording && !previewAudioUrl && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center px-4 py-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                    >
                      <span className="w-3 h-3 bg-red-600 rounded-full me-2"></span>
                      {t.startRecording}
                    </button>
                  )}

                  {isRecording && (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center px-4 py-2 bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 transition-colors animate-pulse"
                    >
                      <span className="w-3 h-3 bg-slate-700 rounded-sm me-2"></span>
                      {t.stopRecording}
                    </button>
                  )}

                  {previewAudioUrl && (
                    <div className="flex items-center w-full space-x-4 space-x-reverse">
                      <audio controls src={previewAudioUrl} className="h-10 flex-1" />
                      <button
                        type="button"
                        onClick={deleteRecording}
                        className="text-red-500 hover:text-red-700 text-sm px-2"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {isRecording && <span className="text-xs text-red-500 font-medium animate-pulse ms-2">{t.recording}</span>}
                </div>
             </div>

             <div className="md:col-span-2 flex justify-end space-x-3 space-x-reverse mt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg ms-3">{t.cancel}</button>
                <button type="submit" disabled={isRecording || !formData.tcfId} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400">{t.submitLog}</button>
             </div>
           </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-start">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-slate-600 text-start">{t.logTime}</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-start">{t.members}</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-start">{t.tcfDefs}</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-start">{t.description}</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-start">{t.startTime}</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-center">🎙️</th>
              <th className="px-6 py-4 text-end">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map(report => (
              <tr key={report.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-xs text-slate-500 text-start">
                  {new Date(report.timestamp).toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US')}
                </td>
                <td className="px-6 py-4 text-slate-900 font-medium text-start">
                  {getMemberName(report.memberId)}
                </td>
                <td className="px-6 py-4 text-slate-700 text-start">
                  {getTCFName(report.tcfId)}
                </td>
                <td className="px-6 py-4 text-slate-700 text-start max-w-xs truncate">
                  {report.description || '-'}
                </td>
                <td className="px-6 py-4 text-slate-700 font-mono text-sm text-start">
                  {report.startTime || '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  {report.audioNote ? (
                    <audio 
                      src={report.audioNote} 
                      controls 
                      className="h-8 w-24 md:w-40 mx-auto"
                      preload="none" 
                    />
                  ) : (
                    <span className="text-slate-300 text-xs">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-end">
                  <button 
                    onClick={() => {
                        if(confirm(t.confirm)) {
                            StorageService.deleteReport(report.id);
                            setReports(StorageService.getReports().sort((a,b) => b.timestamp - a.timestamp));
                        }
                    }}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    {t.delete}
                  </button>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
               <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">{t.noReports}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
