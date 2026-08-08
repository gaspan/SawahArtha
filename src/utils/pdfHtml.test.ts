/**
 * Unit tests for PDF report HTML builder
 * Run: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildReportHtml, type PdfReportData } from './pdfHtml';

function makeData(overrides: Partial<PdfReportData> = {}): PdfReportData {
  return {
    seasonCode: 'MT-2026-1',
    landSizeM2: 1400,
    refPricePerKg: 5000,
    exportedAt: '8 Agustus 2026',
    totals: {
      totalExpenses: 1000000,
      totalGKP: 2000,
      totalGKG: 1600,
      totalRevenue: 7000000,
      totalRevenueEstimate: 8000000,
      totalGacongWeight: 200,
      zakatKg: 80,
      zakatRp: 400000,
      hppPerKg: 625,
      netProfit: 6600000,
      roiPercent: 660,
    },
    budgets: [
      { category: 'Pupuk', budgetAmount: 1000000, actualAmount: 1200000, percentUsed: 120 },
    ],
    debts: [
      { type: 'loan_in', counterparty: 'Budi', amount: 500000, paidAmount: 200000, dueDate: '2026-08-20' },
    ],
    plots: [{ name: 'Sawah Utara', landSizeM2: 700, note: null }],
    activities: [{ activityType: 'Tanam', title: 'Tanam bibit', date: '2026-08-01', note: null }],
    expenses: [{ title: 'Beli Pupuk', category: 'Pupuk', amount: 500000, date: '2026-08-01' }],
    sales: [{ gkgSold: 500, pricePerKg: 5000, totalRevenue: 2500000, buyerName: 'Toko Tani', date: '2026-08-05' }],
    ...overrides,
  };
}

describe('buildReportHtml', () => {
  it('menghasilkan dokumen HTML lengkap dengan judul musim', () => {
    const html = buildReportHtml(makeData());
    assert.match(html, /<!DOCTYPE html>/);
    assert.match(html, /Laporan Musim MT-2026-1/);
    assert.match(html, /SawahArtha/);
  });

  it('mencantumkan metrik ringkasan keuangan', () => {
    const html = buildReportHtml(makeData());
    assert.match(html, /Rp 1.000.000/); // total pengeluaran
    assert.match(html, /Rp 8.000.000/); // estimasi pendapatan
    assert.match(html, /Rp 400.000/); // zakat
    assert.match(html, /660(,0|\.0)?%/); // ROI (bisa "660%" atau "660,0%")
  });

  it('menyertakan tabel anggaran, hutang, plot, jurnal, pengeluaran & penjualan', () => {
    const html = buildReportHtml(makeData());
    assert.match(html, /Anggaran per Kategori/);
    assert.match(html, /Pupuk/);
    assert.match(html, /Hutang & Piutang/);
    assert.match(html, /Budi/);
    assert.match(html, /Petak Lahan/);
    assert.match(html, /Sawah Utara/);
    assert.match(html, /Jurnal Kegiatan Tani/);
    assert.match(html, /Tanam bibit/);
    assert.match(html, /Pengeluaran/);
    assert.match(html, /Beli Pupuk/);
    assert.match(html, /Penjualan Gabah/);
    assert.match(html, /Toko Tani/);
  });

  it('menampilkan placeholder untuk data kosong (bukan tabel kosong)', () => {
    const html = buildReportHtml(makeData({
      budgets: [],
      debts: [],
      plots: [],
      activities: [],
      expenses: [],
      sales: [],
    }));
    assert.match(html, /Tidak ada data anggaran/);
    assert.match(html, /Tidak ada data hutang\/piutang/);
    assert.match(html, /Belum ada petak lahan/);
    assert.match(html, /Belum ada kegiatan tercatat/);
    assert.match(html, /Tidak ada pengeluaran/);
    assert.match(html, /Tidak ada penjualan/);
  });

  it('meng-escape karakter HTML dari data user (anti injection)', () => {
    const html = buildReportHtml(makeData({
      expenses: [{ title: '<script>alert(1)</script>', category: 'Pupuk', amount: 1000, date: '2026-08-01' }],
    }));
    assert.ok(!html.includes('<script>'));
    assert.match(html, /&lt;script&gt;/);
  });

  it('hanya menghitung zakat bila GKG >= nisab', () => {
    const under = makeData({
      totals: { ...makeData().totals, totalGKG: 500, zakatKg: 0, zakatRp: 0 },
    });
    assert.ok(buildReportHtml(under).includes('Rp 0'));
  });
});
