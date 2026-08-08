/**
 * Full JSON backup/restore (Tier 4D)
 * Unlike CSV, this preserves ALL tables: seasons, expenses, income, sales,
 * budgets, budget_logs, debts, debt_payments, plots, farming_activities,
 * settings.
 */
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { type SQLiteDatabase, type SQLiteBindValue } from 'expo-sqlite';
import { backupFileName, parseBackupPayload, type BackupPayload } from './backupCore';

const BACKUP_TABLES = [
  'seasons',
  'expenses',
  'income',
  'sales',
  'budgets',
  'budget_logs',
  'debts',
  'debt_payments',
  'plots',
  'farming_activities',
] as const;

export async function buildBackupData(
  db: SQLiteDatabase
): Promise<BackupPayload> {
  const data: Record<string, unknown[]> = {};
  for (const table of BACKUP_TABLES) {
    try {
      data[table] = await db.getAllAsync(`SELECT * FROM ${table}`);
    } catch {
      data[table] = [];
    }
  }
  try {
    data.settings = await db.getAllAsync('SELECT * FROM settings');
  } catch {
    data.settings = [];
  }
  return {
    app: 'SawahArtha',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export async function writeBackupFile(
  db: SQLiteDatabase
): Promise<string> {
  const payload = await buildBackupData(db);
  const json = JSON.stringify(payload, null, 2);

  if (Platform.OS === 'android') {
    const { StorageAccessFramework } = FileSystem;
    const uriFile = `${FileSystem.documentDirectory}backup_dir_uri.txt`;

    let directoryUri = '';
    try {
      const exists = await FileSystem.getInfoAsync(uriFile);
      if (exists.exists) {
        directoryUri = await FileSystem.readAsStringAsync(uriFile);
      }
    } catch {
      // ignore
    }

    if (!directoryUri) {
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        throw new Error('Izin akses folder ditolak. Gagal menyimpan file backup.');
      }
      directoryUri = permissions.directoryUri;
      await FileSystem.writeAsStringAsync(uriFile, directoryUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    const cleanName = backupFileName().replace('.json', '');
    const fileUri = await StorageAccessFramework.createFileAsync(
      directoryUri,
      cleanName,
      'application/json'
    );
    await FileSystem.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return fileUri;
  }

  const filePath = `${FileSystem.documentDirectory}${backupFileName()}`;
  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return filePath;
}

/**
 * Import backup transactionally. Rows are merged: rows whose primary key
 * already exists are skipped, new rows are inserted with their original ids
 * so foreign keys (e.g. debt_payments.debt_id) stay intact.
 */
export async function restoreFromBackup(
  db: SQLiteDatabase,
  payload: BackupPayload
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  await db.withTransactionAsync(async () => {
    for (const table of BACKUP_TABLES) {
      const rows = payload.data[table] ?? [];
      let added = 0;
      for (const row of rows) {
        if (!row || typeof row !== 'object') continue;
        const record = row as Record<string, unknown>;
        const id = record.id as number | string | undefined;
        if (id == null) continue;
        const existing = await db.getFirstAsync<{ id: number }>(
          `SELECT id FROM ${table} WHERE id = ?`,
          [id]
        );
        if (existing) continue;
        const keys = Object.keys(record);
        const cols = keys.join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const values: SQLiteBindValue[] = keys.map((k) => {
          const v = record[k];
          if (v === undefined || v === null) return null;
          if (typeof v === 'number' || typeof v === 'string') return v as SQLiteBindValue;
          if (typeof v === 'boolean') return v ? 1 : 0;
          return String(v);
        });
        await db.runAsync(
          `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`,
          values
        );
        added++;
      }
      counts[table] = added;
    }
  });
  return counts;
}
