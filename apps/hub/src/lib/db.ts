import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface ShowData {
  id: string; // ユニークID（例：日時やUUID）
  createdAt: string;
  venue: string;
  date: string;
  droneCount: string;
  heightMin: string;
  heightMax: string;
  notes: string;
}

class RDSystemDatabase extends Dexie {
  shows!: Table<ShowData, string>;

  constructor() {
    super('rdhsystem');
    this.version(1).stores({
      shows: 'id, date, venue',
    });
  }
}

export const db = new RDSystemDatabase();
