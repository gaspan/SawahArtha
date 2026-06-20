import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export function convertToCSV(expenses: any[], incomes: any[]): string {
  const headers = [
    'Tipe',
    'ID',
    'Musim',
    'Tanggal',
    'Item/Keterangan',
    'Kategori/Detail',
    'Jumlah/Total (Rp)',
    'Catatan/Harga',
  ];
  
  const rows = [headers.join(',')];

  // Process Expenses
  expenses.forEach((e) => {
    const row = [
      'Pengeluaran',
      e.id,
      `"${(e.season_code || '').replace(/"/g, '""')}"`,
      e.date || '',
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      e.amount || 0,
      `"${(e.description || '').replace(/"/g, '""')}"`,
    ];
    rows.push(row.join(','));
  });

  // Process Incomes
  incomes.forEach((i) => {
    const detailText = `GKP: ${i.gkp_weight || 0} kg | GKG: ${i.gkg_weight || 0} kg`;
    const noteText = i.price_per_kg > 0 ? `Harga per kg: Rp ${i.price_per_kg}` : 'Belum dijual';
    
    const row = [
      'Penghasilan',
      i.id,
      `"${(i.season_code || '').replace(/"/g, '""')}"`,
      i.date || '',
      '"Hasil Panen Gabah"',
      `"${detailText.replace(/"/g, '""')}"`,
      i.total_revenue || 0,
      `"${noteText.replace(/"/g, '""')}"`,
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

export async function exportToCSVFile(csvContent: string): Promise<void> {
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `SawahArtha_Backup_${dateStr}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write CSV content to file
    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    // Check if sharing is available
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert(
        'Fitur Tidak Didukung ⚠️',
        'Perangkat Anda tidak mendukung fitur berbagi file.'
      );
      return;
    }
    
    // Share file
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Ekspor Data SawahArtha',
      UTI: 'public.comma-separated-values-text', // iOS UTI standard
    });
  } catch (error) {
    console.error('Error sharing CSV:', error);
    Alert.alert(
      'Gagal Ekspor ❌',
      'Terjadi kesalahan saat memproses ekspor data backup.'
    );
  }
}
