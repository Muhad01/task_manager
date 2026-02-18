export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  status: TaskStatus;
  category: string;
}

export interface Routine {
  id: string;
  title: string;
  time: string; // HH:mm
  frequency: 'daily' | 'weekly' | 'weekdays';
  active: boolean;
}

export interface AppSettings {
  userName: string;
  enableGestures: boolean;
  enableVoiceResponse: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}