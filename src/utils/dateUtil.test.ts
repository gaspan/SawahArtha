/**
 * Unit tests for date formatting (jurnal kegiatan tani)
 * Run: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from './dateUtil';

describe('formatDate', () => {
  it('memformat ISO date menjadi format id-ID', () => {
    const out = formatDate('2026-08-08');
    assert.equal(out, '8 Agu 2026');
  });

  it('menangani tanggal dengan angka bulan dua digit', () => {
    const out = formatDate('2026-12-25');
    assert.equal(out, '25 Des 2026');
  });

  it('mengembalikan string asli jika format tidak valid', () => {
    assert.equal(formatDate('not-a-date'), 'not-a-date');
    assert.equal(formatDate(''), '');
  });
});
