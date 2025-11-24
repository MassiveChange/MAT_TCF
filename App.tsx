
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { ViewState } from './types';
import { MemberView } from './components/MemberView';
import { TCFView } from './components/TCFView';
import { ScheduleView } from './components/ScheduleView';
import { ReportView } from './components/ReportView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const { isAuthenticated } = useAuth();
  
  // State to hold selected member when navigating from MemberView or ScheduleView to ReportView
  const [reportMemberId, setReportMemberId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleNavigateToReport = (memberId: string) => {
    setReportMemberId(memberId);
    setCurrentView('REPORTS');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'MEMBERS':
        return <MemberView onReportClick={handleNavigateToReport} />;
      case 'TCF':
        return <TCFView />;
      case 'SCHEDULE':
        return <ScheduleView onReportClick={handleNavigateToReport} />;
      case 'REPORTS':
        return (
          <ReportView 
            initialMemberId={reportMemberId} 
            onClearInitialMember={() => setReportMemberId(null)} 
          />
        );
      case 'SETTINGS':
        return <SettingsView />;
      case 'DASHBOARD':
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

const Dashboard: React.FC<{ onViewChange: (v: ViewState) => void }> = ({ onViewChange }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">{t.welcome}</h1>
        <p className="text-indigo-100 max-w-2xl">
          {t.welcomeSubtitle}
        </p>
        <button 
           onClick={() => onViewChange('REPORTS')}
           className="mt-6 bg-white text-indigo-700 px-6 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
        >
          {t.viewReports}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => onViewChange('MEMBERS')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
            👥
          </div>
          <h3 className="font-bold text-lg text-slate-800">{t.membersTitle}</h3>
          <p className="text-slate-500 text-sm mt-1">{t.managePersonnel}</p>
        </div>

        <div 
          onClick={() => onViewChange('TCF')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
             📋
          </div>
          <h3 className="font-bold text-lg text-slate-800">{t.tcfTitle}</h3>
          <p className="text-slate-500 text-sm mt-1">{t.createAndEdit}</p>
        </div>

        <div 
          onClick={() => onViewChange('SCHEDULE')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
            📅
          </div>
          <h3 className="font-bold text-lg text-slate-800">{t.schedule}</h3>
          <p className="text-slate-500 text-sm mt-1">{t.assignTasks}</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
