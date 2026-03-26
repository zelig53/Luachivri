import Dexie, { type Table } from 'dexie';

export interface GoogleEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string;
  seriesId?: string; // For Hebrew recurrence
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: string;
  seriesId?: string; // For Hebrew recurrence
}

export interface ChassidicEvent {
  id: string;
  title: string;
  date: string; // ISO string
  description: string;
}

export class ChabadSyncDB extends Dexie {
  events!: Table<GoogleEvent>;
  tasks!: Table<GoogleTask>;
  chassidicEvents!: Table<ChassidicEvent>;

  constructor() {
    super('ChabadSyncDB');
    this.version(2).stores({
      events: 'id, start.date, start.dateTime, seriesId',
      tasks: 'id, due, seriesId',
      chassidicEvents: 'id, date'
    });
  }
}

export const db = new ChabadSyncDB();
