
export enum RunType {
  SingleDirection = 'Single Direction',
  Bidirectional = 'Bidirectional',
}

export enum RepeatStatus {
  None = 'None',
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}

export interface Member {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD (Automatic)
  phoneNumber?: string;
  age?: string;
  description?: string;
}

export interface TCF {
  id: string;
  name: string;
  description?: string;
}

export interface Schedule {
  id: string;
  memberId: string;
  tcfIds: string[]; // Changed to array for multi-selection
  startDateTime: string; // ISO string
  repeatStatus: RepeatStatus;
  runType: RunType;
}

export interface Report {
  id: string;
  memberId: string;
  tcfId: string;
  startTime?: string; // ISO string or Time string, now Optional
  description?: string; // Replaces targetPerson
  timestamp: number; // created at
  audioNote?: string; // Base64 encoded audio string
}

export type ViewState = 'DASHBOARD' | 'MEMBERS' | 'TCF' | 'SCHEDULE' | 'REPORTS' | 'SETTINGS';

export type Language = 'en' | 'fa';
