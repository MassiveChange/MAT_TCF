

import { Member, TCF, Schedule, Report } from '../types';

const KEYS = {
  MEMBERS: 'tcf_app_members',
  TCFS: 'tcf_app_tcfs',
  SCHEDULES: 'tcf_app_schedules',
  REPORTS: 'tcf_app_reports',
  AUTH: 'tcf_app_auth',
  DRAFTS: 'tcf_app_drafts_',
};

const DEFAULT_TCF_NAMES = [
  "فرادرمانی",
  "اسکن دوگانگی",
  "همفازی کیهانی",
  "همفازی کالبدی",
  "همفازی با زمان",
  "کنترل ذهن",
  "کنترل دشارژ بیرونی",
  "کنترل دشارژ درونی",
  "کنترل تشعشعات منفی",
  "طلب خیرها",
  "تزکیه تشعشعاتی",
  "وحدت",
  "من معنوی",
  "بارش",
  "ذهن بی ذهنی",
  "قونیه یک",
  "قونیه دو",
  "شارز یونی والکترونی",
  "پاکسازی چاکرا",
  "اعوذوا",
  "گستردگی",
  "آشتی با مرگ",
  "بینام ترم ۷ (رسیدن به درک چرخه)",
  "پیوند",
  "قنوت",
  "قیام",
  "رکوع",
  "سجده",
  "سلام",
  "تعمید روح",
  "قرارگیری در لاتضادی",
  "بینام ترم‌۸ (درک دوره ۸ )",
  "اصلاح طبایع در بنیاد",
  "حلقه ترک عادت",
  "اصلاح الگوی خواب",
  "ارتباط اصلاح چرخه های نرم افزاری معیوب در ناخودآگاهی - اعتیاد",
  "ارتباط اسکن نرم افزاری کلی چیدمان وجود",
  "ارتباط تنظیم و اصلاح مبدلهای انرژی پنهان",
  "ارتباط تغذیه چاکرایی",
  "حلقه درک حضور",
  "اعلام حلقه کل برای دیگران"
];

// Generic helper to get data
const getItems = <T,>(key: string): T[] => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return [];
  }
};

// Generic helper to save data
const saveItems = <T,>(key: string, items: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
};

export const StorageService = {
  // Auth
  getAuth: () => {
    try {
      const stored = localStorage.getItem(KEYS.AUTH);
      if (stored) return JSON.parse(stored);
      // Default credentials
      const defaults = { username: 'test', password: 'test' };
      localStorage.setItem(KEYS.AUTH, JSON.stringify(defaults));
      return defaults;
    } catch (e) {
      return { username: 'test', password: 'test' };
    }
  },
  saveAuth: (creds: {username: string, password: string}) => {
    try {
      localStorage.setItem(KEYS.AUTH, JSON.stringify(creds));
    } catch (e) {
      console.error('Error saving auth', e);
    }
  },

  // Members
  getMembers: (): Member[] => getItems<Member>(KEYS.MEMBERS),
  saveMember: (member: Member) => {
    const items = getItems<Member>(KEYS.MEMBERS);
    const existingIndex = items.findIndex((i) => i.id === member.id);
    if (existingIndex >= 0) {
      items[existingIndex] = member;
    } else {
      items.push(member);
    }
    saveItems(KEYS.MEMBERS, items);
  },
  deleteMember: (id: string) => {
    const items = getItems<Member>(KEYS.MEMBERS).filter((i) => i.id !== id);
    saveItems(KEYS.MEMBERS, items);
  },

  // TCFs
  getTCFs: (): TCF[] => {
    const stored = localStorage.getItem(KEYS.TCFS);
    if (!stored) {
      // Initialize with defaults if storage is completely empty (first run)
      const defaults: TCF[] = DEFAULT_TCF_NAMES.map(name => ({
        id: crypto.randomUUID(),
        name,
        description: ''
      }));
      saveItems(KEYS.TCFS, defaults);
      return defaults;
    }
    return getItems<TCF>(KEYS.TCFS);
  },
  saveTCF: (tcf: TCF) => {
    const items = getItems<TCF>(KEYS.TCFS);
    const existingIndex = items.findIndex((i) => i.id === tcf.id);
    if (existingIndex >= 0) {
      items[existingIndex] = tcf;
    } else {
      items.push(tcf);
    }
    saveItems(KEYS.TCFS, items);
  },
  deleteTCF: (id: string) => {
    const items = getItems<TCF>(KEYS.TCFS).filter((i) => i.id !== id);
    saveItems(KEYS.TCFS, items);
  },

  // Schedules
  getSchedules: (): Schedule[] => {
    const items = getItems<any>(KEYS.SCHEDULES);
    // Migration helper: ensure tcfIds exists if reading old data
    return items.map(item => {
      if (!item.tcfIds && item.tcfId) {
        return { ...item, tcfIds: [item.tcfId] };
      }
      return item;
    });
  },
  saveSchedule: (schedule: Schedule) => {
    const items = getItems<Schedule>(KEYS.SCHEDULES);
    const existingIndex = items.findIndex((i) => i.id === schedule.id);
    if (existingIndex >= 0) {
      items[existingIndex] = schedule;
    } else {
      items.push(schedule);
    }
    saveItems(KEYS.SCHEDULES, items);
  },
  deleteSchedule: (id: string) => {
    const items = getItems<Schedule>(KEYS.SCHEDULES).filter((i) => i.id !== id);
    saveItems(KEYS.SCHEDULES, items);
  },

  // Reports
  getReports: (): Report[] => getItems<Report>(KEYS.REPORTS),
  saveReport: (report: Report) => {
    const items = getItems<Report>(KEYS.REPORTS);
    const existingIndex = items.findIndex((i) => i.id === report.id);
    if (existingIndex >= 0) {
      items[existingIndex] = report;
    } else {
      items.push(report);
    }
    saveItems(KEYS.REPORTS, items);
  },
  deleteReport: (id: string) => {
    const items = getItems<Report>(KEYS.REPORTS).filter((i) => i.id !== id);
    saveItems(KEYS.REPORTS, items);
  },

  // Draft System for Auto-save
  saveDraft: (formName: string, data: any) => {
    try {
      localStorage.setItem(KEYS.DRAFTS + formName, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving draft', e);
    }
  },
  getDraft: (formName: string): any | null => {
    try {
      const data = localStorage.getItem(KEYS.DRAFTS + formName);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },
  clearDraft: (formName: string) => {
    localStorage.removeItem(KEYS.DRAFTS + formName);
  },

  // Backup & Restore
  exportData: (): string => {
    const data = {
      members: localStorage.getItem(KEYS.MEMBERS),
      tcfs: localStorage.getItem(KEYS.TCFS),
      schedules: localStorage.getItem(KEYS.SCHEDULES),
      reports: localStorage.getItem(KEYS.REPORTS),
      auth: localStorage.getItem(KEYS.AUTH),
      lang: localStorage.getItem('tcf_app_lang'),
      version: '1.0'
    };
    return JSON.stringify(data);
  },

  importData: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data) return false;

      if (data.members) localStorage.setItem(KEYS.MEMBERS, data.members);
      if (data.tcfs) localStorage.setItem(KEYS.TCFS, data.tcfs);
      if (data.schedules) localStorage.setItem(KEYS.SCHEDULES, data.schedules);
      if (data.reports) localStorage.setItem(KEYS.REPORTS, data.reports);
      if (data.auth) localStorage.setItem(KEYS.AUTH, data.auth);
      if (data.lang) localStorage.setItem('tcf_app_lang', data.lang);
      
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
};
