/**
 * Unit tests for JSON backup payload logic
 * Run: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { backupFileName, parseBackupPayload } from './backupCore';

describe('backupFileName', () => {
  it('menghasilkan nama file dengan tanggal YYYY-MM-DD', () => {
    const name = backupFileName(new Date('2026-08-08T10:00:00Z'));
    assert.equal(name, 'SawahArtha_Backup_2026-08-08.json');
  });
});

describe('parseBackupPayload', () => {
  it('menerima payload valid SawahArtha', () => {
    const raw = JSON.stringify({
      app: 'SawahArtha',
      formatVersion: 1,
      exportedAt: '2026-08-08T10:00:00Z',
      data: { seasons: [{ id: 1 }], expenses: [] },
    });
    const payload = parseBackupPayload(raw);
    assert.equal(payload.app, 'SawahArtha');
    assert.ok(payload.data.seasons);
  });

  it('menolak payload tanpa field app', () => {
    const raw = JSON.stringify({ data: {} });
    assert.throws(() => parseBackupPayload(raw));
  });

  it('menolak payload app lain', () => {
    const raw = JSON.stringify({ app: 'Lain', data: {} });
    assert.throws(() => parseBackupPayload(raw));
  });

  it('menolak JSON tidak valid', () => {
    assert.throws(() => parseBackupPayload('{not json'));
  });
});
