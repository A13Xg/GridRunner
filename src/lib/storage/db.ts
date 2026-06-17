import Dexie, { type Table } from "dexie";
import type { OperationRecord } from "./types";

interface SettingsRow {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

class NeuralFoundryDB extends Dexie {
  operations!: Table<OperationRecord, string>;
  settings!: Table<SettingsRow, string>;

  constructor() {
    super("NeuralFoundry");
    this.version(1).stores({
      operations: "id, createdAt, status",
      settings: "key",
    });
  }
}

let _db: NeuralFoundryDB | null = null;

export function getDB(): NeuralFoundryDB {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is not available outside of a browser context");
  }
  if (!_db) {
    _db = new NeuralFoundryDB();
  }
  return _db;
}
