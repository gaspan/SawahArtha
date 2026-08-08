/**
 * PDFService - Laporan PDF ringkasan musim (untuk koperasi/bank)
 * Query DB → build HTML → printToFileAsync → share.
 */
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { Platform } from 'react-native';
import { type SQLiteDatabase } from 'expo-sqlite';
import { buildReportHtml, type PdfReportData } from '../utils/pdfHtml';

export async function buildPdfReport(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<{ uri: string; fileName: string }> {
  const season = await db.getFirstAsync<{
    land_size_m2: number | null;
    ref_price_per_kg: number | null;
  }>('SELECT land_size_m2, ref_price_per_kg FROM seasons WHERE season_code = ?', [seasonCode]);

  const expenses = await db.getAllAsync<{
    title: string;
    category: string;
    amount: number;
    date: string;
  }>('SELECT title, category, amount, date FROM expenses WHERE season_code = ? ORDER BY date ASC', [seasonCode]);

  const income = await db.getAllAsync<{
    gkp_weight: number;
    gkg_weight: number;
    gacong_weight: number;
  }>('SELECT gkp_weight, gkg_weight, gacong_weight FROM income WHERE season_code = ?', [seasonCode]);

  const sales = await db.getAllAsync<{
    gkg_sold: number;
    price_per_kg: number;
    total_revenue: number;
    buyer_name: string | null;
    date: string;
  }>('SELECT gkg_sold, price_per_kg, total_revenue, buyer_name, date FROM sales WHERE season_code = ? ORDER BY date ASC', [seasonCode]);

  const budgets = await db.getAllAsync<{
    category: string;
    amount: number;
  }>('SELECT category, amount FROM budgets WHERE season_code = ?', [seasonCode]);

  const debts = await db.getAllAsync<{
    type: string;
    counterparty: string;
    amount: number;
    paid_amount: number;
    due_date: string | null;
  }>('SELECT type, counterparty, amount, paid_amount, due_date FROM debts WHERE season_code = ?', [seasonCode]);

  const plots = await db.getAllAsync<{
    name: string;
    land_size_m2: number;
    note: string | null;
  }>('SELECT name, land_size_m2, note FROM plots WHERE season_code = ?', [seasonCode]);

  const activities = await db.getAllAsync<{
    activity_type: string;
    title: string;
    date: string;
    note: string | null;
  }>('SELECT activity_type, title, date, note FROM farming_activities WHERE season_code = ? ORDER BY date ASC', [seasonCode]);

  // ── Compute totals ──
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalGKP = income.reduce((s, i) => s + i.gkp_weight, 0);
  const totalGKG = income.reduce((s, i) => s + i.gkg_weight, 0);
  const totalGacongWeight = income.reduce((s, i) => s + (i.gacong_weight || 0), 0);
  const totalRevenue = sales.reduce((s, x) => s + x.total_revenue, 0);
  const refPricePerKg = season?.ref_price_per_kg ?? 0;
  const unsoldGKG = Math.max(0, totalGKG - sales.reduce((s, x) => s + x.gkg_sold, 0));
  const totalRevenueEstimate = totalRevenue + unsoldGKG * refPricePerKg;

  const zakatRate = 0.05;
  const zakatKg = totalGKG >= 653 ? totalGKG * zakatRate : 0;
  const zakatRp =
    zakatKg > 0 && sales.length > 0
      ? zakatKg * (totalRevenue / Math.max(1, sales.reduce((s, x) => s + x.gkg_sold, 0)))
      : 0;

  const hppPerKg = totalGKG > 0 ? totalExpenses / totalGKG : 0;
  const netProfit = totalRevenueEstimate - totalExpenses - zakatRp;
  const roiPercent = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

  const actualByCat = new Map<string, number>();
  for (const e of expenses) {
    actualByCat.set(e.category, (actualByCat.get(e.category) ?? 0) + e.amount);
  }
  const budgetRows = budgets.map((b) => {
    const actual = actualByCat.get(b.category) ?? 0;
    return {
      category: b.category,
      budgetAmount: b.amount,
      actualAmount: actual,
      percentUsed: b.amount > 0 ? (actual / b.amount) * 100 : 0,
    };
  });

  const data: PdfReportData = {
    seasonCode,
    landSizeM2: season?.land_size_m2 ?? 0,
    refPricePerKg,
    exportedAt: new Date().toLocaleString('id-ID'),
    totals: {
      totalExpenses,
      totalGKP,
      totalGKG,
      totalRevenue,
      totalRevenueEstimate,
      totalGacongWeight,
      zakatKg,
      zakatRp,
      hppPerKg,
      netProfit,
      roiPercent,
    },
    budgets: budgetRows,
    debts: debts.map((d) => ({
      type: d.type,
      counterparty: d.counterparty,
      amount: d.amount,
      paidAmount: d.paid_amount,
      dueDate: d.due_date,
    })),
    plots: plots.map((p) => ({
      name: p.name,
      landSizeM2: p.land_size_m2,
      note: p.note,
    })),
    activities: activities.map((a) => ({
      activityType: a.activity_type,
      title: a.title,
      date: a.date,
      note: a.note,
    })),
    expenses,
    sales: sales.map((s) => ({
      gkgSold: s.gkg_sold,
      pricePerKg: s.price_per_kg,
      totalRevenue: s.total_revenue,
      buyerName: s.buyer_name,
      date: s.date,
    })),
  };

  const html = buildReportHtml(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const fileName = `SawahArtha_Laporan_${seasonCode.replace(/[^A-Za-z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  return { uri, fileName };
}

/** Generate then share (save-to-files / print via share sheet). */
export async function sharePdfReport(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<void> {
  const { uri, fileName } = await buildPdfReport(db, seasonCode);
  await shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Simpan / Cetak Laporan ${seasonCode}`,
    UTI: 'com.adobe.pdf',
  });
}

export const pdfSupported = Platform.OS === 'android' || Platform.OS === 'ios';
