/**
 * Pure PDF report HTML builder (no expo/react-native imports — testable)
 * Tier: Laporan PDF/Cetak ringkasan musim.
 */

export interface PdfBudgetRow {
  category: string;
  budgetAmount: number;
  actualAmount: number;
  percentUsed: number;
}

export interface PdfDebtRow {
  type: string;
  counterparty: string;
  amount: number;
  paidAmount: number;
  dueDate: string | null;
}

export interface PdfReportData {
  seasonCode: string;
  landSizeM2: number;
  refPricePerKg: number;
  exportedAt: string;
  totals: {
    totalExpenses: number;
    totalGKP: number;
    totalGKG: number;
    totalRevenue: number;
    totalRevenueEstimate: number;
    totalGacongWeight: number;
    zakatKg: number;
    zakatRp: number;
    hppPerKg: number;
    netProfit: number;
    roiPercent: number;
  };
  budgets: PdfBudgetRow[];
  debts: PdfDebtRow[];
  plots: Array<{ name: string; landSizeM2: number; note: string | null }>;
  activities: Array<{
    activityType: string;
    title: string;
    date: string;
    note: string | null;
  }>;
  expenses: Array<{ title: string; category: string; amount: number; date: string }>;
  sales: Array<{
    gkgSold: number;
    pricePerKg: number;
    totalRevenue: number;
    buyerName: string | null;
    date: string;
  }>;
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rupiah(n: number): string {
  if (!isFinite(n)) return 'Rp 0';
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

function kg(n: number): string {
  if (!isFinite(n)) return '0';
  return `${(Math.round(n * 10) / 10).toLocaleString('id-ID')} kg`;
}

function table(headers: string[], rows: string[][]): string {
  const thead = headers.map((h) => `<th>${esc(h)}</th>`).join('');
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${thead}</tr></thead><tbody>${body}</tbody></table>`;
}

export function buildReportHtml(data: PdfReportData): string {
  const { totals: t } = data;
  const ha = data.landSizeM2 > 0 ? data.landSizeM2 / 10000 : 0;

  const summaryRows: string[][] = [
    ['Total Pengeluaran (Modal)', rupiah(t.totalExpenses)],
    ['Total Panen (GKP)', kg(t.totalGKP)],
    ['Hasil Bersih GKG', kg(t.totalGKG)],
    ['Biaya Gacong', kg(t.totalGacongWeight)],
    ['Pendapatan Terjual', rupiah(t.totalRevenue)],
    ['Estimasi Pendapatan Total', rupiah(t.totalRevenueEstimate)],
    ['HPP per kg', rupiah(t.hppPerKg)],
    ['Zakat (kg)', kg(t.zakatKg)],
    ['Zakat (Rp)', rupiah(t.zakatRp)],
    ['Laba Bersih (setelah zakat)', rupiah(t.netProfit)],
    ['ROI / Margin', `${t.roiPercent.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`],
  ];

  const budgetRows = data.budgets.map((b) => [
    esc(b.category),
    rupiah(b.budgetAmount),
    rupiah(b.actualAmount),
    `${b.percentUsed.toFixed(0)}%`,
  ]);

  const debtRows = data.debts.map((d) => [
    d.type === 'loan_in' ? 'Piutang' : 'Hutang',
    esc(d.counterparty),
    rupiah(d.amount),
    rupiah(d.paidAmount),
    d.dueDate ? esc(d.dueDate) : '—',
  ]);

  const plotRows = data.plots.map((p) => [
    esc(p.name),
    `${Math.round(p.landSizeM2).toLocaleString('id-ID')} m²`,
    esc(p.note ?? ''),
  ]);

  const activityRows = data.activities.map((a) => [
    esc(a.date),
    esc(a.activityType),
    esc(a.title),
    esc(a.note ?? ''),
  ]);

  const expenseRows = data.expenses.map((e) => [
    esc(e.date),
    esc(e.title),
    esc(e.category),
    rupiah(e.amount),
  ]);

  const saleRows = data.sales.map((s) => [
    esc(s.date),
    `${Math.round(s.gkgSold).toLocaleString('id-ID')} kg`,
    rupiah(s.pricePerKg),
    esc(s.buyerName ?? ''),
    rupiah(s.totalRevenue),
  ]);

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  @page { margin: 16mm; }
  body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #1f2937; margin: 0; }
  h1 { font-size: 20px; color: #047857; margin: 0 0 2px; }
  h2 { font-size: 13px; color: #047857; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; margin: 18px 0 8px; }
  .sub { color: #6b7280; font-size: 11px; margin-bottom: 14px; }
  .meta { color: #374151; font-size: 11px; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: #ecfdf5; color: #065f46; text-align: left; padding: 5px 6px; border: 1px solid #d1d5db; font-size: 10px; }
  td { padding: 4px 6px; border: 1px solid #e5e7eb; font-size: 10px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .total-line { font-weight: bold; }
  .empty { color: #9ca3af; font-style: italic; }
</style>
</head>
<body>
  <h1>SawahArtha — Laporan Musim ${esc(data.seasonCode)}</h1>
  <div class="sub">Dibuat ${esc(data.exportedAt)} · Laporan ringkasan untuk koperasi/bank</div>
  <div class="meta">Luas lahan: ${Math.round(data.landSizeM2).toLocaleString('id-ID')} m² (${ha.toFixed(2)} ha)</div>
  <div class="meta">Harga referensi: ${rupiah(data.refPricePerKg)}/kg</div>

  <h2>Ringkasan Keuangan</h2>
  ${table(['Metrik', 'Nilai'], summaryRows)}

  <h2>Anggaran per Kategori</h2>
  ${data.budgets.length ? table(['Kategori', 'Anggaran', 'Realisasi', 'Terpakai'], budgetRows) : '<div class="empty">Tidak ada data anggaran.</div>'}

  <h2>Hutang & Piutang</h2>
  ${data.debts.length ? table(['Jenis', 'Lawan Transaksi', 'Pokok', 'Terbayar', 'Jatuh Tempo'], debtRows) : '<div class="empty">Tidak ada data hutang/piutang.</div>'}

  <h2>Petak Lahan</h2>
  ${data.plots.length ? table(['Nama', 'Luas', 'Catatan'], plotRows) : '<div class="empty">Belum ada petak lahan.</div>'}

  <h2>Jurnal Kegiatan Tani</h2>
  ${data.activities.length ? table(['Tanggal', 'Jenis', 'Kegiatan', 'Catatan'], activityRows) : '<div class="empty">Belum ada kegiatan tercatat.</div>'}

  <h2>Pengeluaran</h2>
  ${data.expenses.length ? table(['Tanggal', 'Judul', 'Kategori', 'Jumlah'], expenseRows) : '<div class="empty">Tidak ada pengeluaran.</div>'}

  <h2>Penjualan Gabah</h2>
  ${data.sales.length ? table(['Tanggal', 'Berat', 'Harga/kg', 'Pembeli', 'Total'], saleRows) : '<div class="empty">Tidak ada penjualan.</div>'}
</body>
</html>`;
}
