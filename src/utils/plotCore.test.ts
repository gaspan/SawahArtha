/**
 * Unit tests for multi-lahan (plot) pure logic
 * Run: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { totalPlotArea } from './plotCore';

describe('totalPlotArea', () => {
  it('menjumlahkan luas semua petak', () => {
    const plots = [
      { land_size_m2: 700 },
      { land_size_m2: 500 },
      { land_size_m2: 200 },
    ];
    assert.equal(totalPlotArea(plots), 1400);
  });

  it('mengembalikan 0 untuk daftar kosong', () => {
    assert.equal(totalPlotArea([]), 0);
  });

  it('mengabaikan nilai null/undefined', () => {
    const plots = [
      { land_size_m2: 700 },
      { land_size_m2: null as unknown as number },
      { land_size_m2: undefined as unknown as number },
    ];
    assert.equal(totalPlotArea(plots), 700);
  });
});
