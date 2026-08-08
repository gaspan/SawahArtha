/**
 * Pure JSON backup helpers (no expo/react-native imports — unit-testable)
 */

export interface BackupPayload {
  app: string;
  formatVersion: number;
  exportedAt: string;
  data: Record<string, unknown[]>;
}

export function backupFileName(date = new Date()): string {
  return `SawahArtha_Backup_${date.toISOString().split('T')[0]}.json`;
}

export function parseBackupPayload(raw: string): BackupPayload {
  const payload = JSON.parse(raw) as BackupPayload;
  if (!payload || payload.app !== 'SawahArtha' || !payload.data) {
    throw new Error('Format file backup tidak valid.');
  }
  return payload;
}
