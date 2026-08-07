import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { type SQLiteDatabase } from 'expo-sqlite';

export function convertToCSV(expenses: any[], incomes: any[], sales?: any[]): string {
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

  // Process Incomes (harvest data)
  incomes.forEach((i) => {
    const detailText = `GKP: ${i.gkp_weight || 0} kg | GKG: ${i.gkg_weight || 0} kg`;
    const row = [
      'Panen',
      i.id,
      `"${(i.season_code || '').replace(/"/g, '""')}"`,
      i.date || '',
      '"Hasil Panen Gabah"',
      `"${detailText.replace(/"/g, '""')}"`,
      '',  // no amount column for harvest
      `"${detailText.replace(/"/g, '""')}"`,
    ];
    rows.push(row.join(','));
  });

  // Process Sales
  if (sales) {
    sales.forEach((s) => {
      const detailText = `Jual: ${s.gkg_sold || 0} kg × Rp ${s.price_per_kg || 0}/kg`;
      const row = [
        'Penjualan',
        s.id,
        `"${(s.season_code || '').replace(/"/g, '""')}"`,
        s.date || '',
        s.buyer_name ? `"${s.buyer_name.replace(/"/g, '""')}"` : '"Penjualan Gabah"',
        `"${detailText.replace(/"/g, '""')}"`,
        s.total_revenue || 0,
        s.note ? `"${s.note.replace(/"/g, '""')}"` : '',
      ];
      rows.push(row.join(','));
    });
  }

  return rows.join('\n');
}

export async function exportToCSVFile(csvContent: string): Promise<string> {
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `SawahArtha_Backup_${dateStr}.csv`;

  if (Platform.OS === 'android') {
    const { StorageAccessFramework } = FileSystem;
    const uriFile = `${FileSystem.documentDirectory}directory_uri.txt`;
    
    let directoryUri = '';
    try {
      const exists = await FileSystem.getInfoAsync(uriFile);
      if (exists.exists) {
        directoryUri = await FileSystem.readAsStringAsync(uriFile);
      }
    } catch (e) {
      console.log('Error reading saved directory URI:', e);
    }

    // If no saved directory URI, request permission
    if (!directoryUri) {
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        throw new Error('Izin akses folder ditolak. Gagal menyimpan file backup.');
      }
      directoryUri = permissions.directoryUri;
      // Save it for next time
      await FileSystem.writeAsStringAsync(uriFile, directoryUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    try {
      // Create the file in the selected directory (mime text/csv)
      const cleanFileName = fileName.replace('.csv', '');
      const fileUri = await StorageAccessFramework.createFileAsync(
        directoryUri,
        cleanFileName,
        'text/csv'
      );
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      return fileUri;
    } catch (error) {
      // If failed, maybe the permission was revoked. Clear the saved URI so we prompt next time.
      try {
        await FileSystem.deleteAsync(uriFile, { idempotent: true });
      } catch (e) {}
      
      // Request permission again
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        throw new Error('Izin akses folder ditolak. Gagal menyimpan file backup.');
      }
      directoryUri = permissions.directoryUri;
      await FileSystem.writeAsStringAsync(uriFile, directoryUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const cleanFileName = fileName.replace('.csv', '');
      const fileUri = await StorageAccessFramework.createFileAsync(
        directoryUri,
        cleanFileName,
        'text/csv'
      );
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      return fileUri;
    }
  } else {
    // iOS flow: Save to App documents directory
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return filePath;
  }
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentVal = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal.trim());
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal.trim());
  return result;
}

function parseLocaleNumber(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/[^\d.,]/g, '');
  if (clean.includes('.') && clean.includes(',')) {
    return parseFloat(clean.replace(/\./g, '').replace(/,/g, '.'));
  }
  if (clean.includes(',')) {
    return parseFloat(clean.replace(/,/g, '.'));
  }
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts[parts.length - 1].length === 3) {
      return parseFloat(clean.replace(/\./g, ''));
    } else {
      return parseFloat(clean);
    }
  }
  return parseFloat(clean) || 0;
}

export async function importFromCSV(
  db: SQLiteDatabase,
  fileUri: string
): Promise<{ expensesAdded: number; incomesAdded: number }> {
  const fileContent = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const lines = fileContent.split(/\r?\n/);
  if (lines.length === 0) {
    throw new Error('File CSV kosong.');
  }

  // Validate headers
  const headers = parseCSVLine(lines[0]);
  if (
    headers.length < 8 ||
    !headers.includes('Tipe') ||
    !headers.includes('Musim') ||
    !headers.includes('Tanggal')
  ) {
    throw new Error('Format file CSV tidak valid. Pastikan ini adalah file backup SawahArtha.');
  }

  let expensesAdded = 0;
  let incomesAdded = 0;

  await db.withTransactionAsync(async () => {
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = parseCSVLine(line);
      if (cols.length < 8) continue;

      const type = cols[0];
      const seasonCode = cols[2];
      const date = cols[3];
      const amountOrRevenue = parseLocaleNumber(cols[6]);

      if (!seasonCode || !date) continue;

      // Ensure the season exists
      await db.runAsync(
        'INSERT OR IGNORE INTO seasons (season_code, is_active, land_size_m2) VALUES (?, 0, 1400)',
        [seasonCode]
      );

      if (type === 'Pengeluaran') {
        const title = cols[4];
        const category = cols[5];
        const description = cols[7] || '';

        const existing = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM expenses WHERE season_code = ? AND date = ? AND title = ? AND amount = ? AND category = ? AND (description = ? OR (description IS NULL AND ? = "")) LIMIT 1',
          [seasonCode, date, title, amountOrRevenue, category, description, description]
        );

        if (!existing) {
          await db.runAsync(
            'INSERT INTO expenses (title, description, amount, category, season_code, date) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description || null, amountOrRevenue, category, seasonCode, date]
          );
          expensesAdded++;
        }
      } else if (type === 'Panen') {
        const detailText = cols[5] || '';
        const gkpMatch = detailText.match(/GKP:\s*([0-9.,]+)/i);
        const gkgMatch = detailText.match(/GKG:\s*([0-9.,]+)/i);
        const gkpWeight = gkpMatch ? parseLocaleNumber(gkpMatch[1]) : 0;
        const gkgWeight = gkgMatch ? parseLocaleNumber(gkgMatch[1]) : gkpWeight * 0.85;

        const existing = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM income WHERE season_code = ? AND date = ? AND gkp_weight = ? AND gkg_weight = ? LIMIT 1',
          [seasonCode, date, gkpWeight, gkgWeight]
        );

        if (!existing) {
          await db.runAsync(
            'INSERT INTO income (gkp_weight, gkg_weight, net_gkp, season_code, date) VALUES (?, ?, ?, ?, ?)',
            [gkpWeight, gkgWeight, gkpWeight, seasonCode, date]
          );
          incomesAdded++;
        }
      } else if (type === 'Penjualan') {
        const detailText = cols[5] || '';
        const gkgMatch = detailText.match(/Jual:\s*([0-9.,]+)\s*kg/i);
        const priceMatch = detailText.match(/Rp\s*([0-9.,]+)/i);
        const gkgSold = gkgMatch ? parseLocaleNumber(gkgMatch[1]) : 0;
        const pricePerKg = priceMatch ? parseLocaleNumber(priceMatch[1]) : 0;

        if (gkgSold > 0 && pricePerKg > 0) {
          const existing = await db.getFirstAsync<{ id: number }>(
            'SELECT id FROM sales WHERE season_code = ? AND date = ? AND gkg_sold = ? AND price_per_kg = ? AND total_revenue = ? LIMIT 1',
            [seasonCode, date, gkgSold, pricePerKg, amountOrRevenue]
          );

          if (!existing) {
            await db.runAsync(
              'INSERT INTO sales (season_code, gkg_sold, price_per_kg, total_revenue, date) VALUES (?, ?, ?, ?, ?)',
              [seasonCode, gkgSold, pricePerKg, amountOrRevenue, date]
            );
            incomesAdded++;
          }
        }
      } else if (type === 'Penghasilan') {
        // Legacy: Penghasilan type — handle as harvest AND sale for backward compat
        const detailText = cols[5] || '';
        const noteText = cols[7] || '';

        const gkpMatch = detailText.match(/GKP:\s*([0-9.,]+)/i);
        const gkgMatch = detailText.match(/GKG:\s*([0-9.,]+)/i);
        const gkpWeight = gkpMatch ? parseLocaleNumber(gkpMatch[1]) : 0;
        const gkgWeight = gkgMatch ? parseLocaleNumber(gkgMatch[1]) : gkpWeight * 0.85;

        const priceMatch = noteText.match(/Harga per kg:\s*Rp\s*([0-9.,]+)/i);
        const pricePerKg = priceMatch ? parseLocaleNumber(priceMatch[1]) : 0;

        const existing = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM income WHERE season_code = ? AND date = ? AND gkp_weight = ? AND gkg_weight = ? LIMIT 1',
          [seasonCode, date, gkpWeight, gkgWeight]
        );

        if (!existing) {
          await db.runAsync(
            'INSERT INTO income (gkp_weight, gkg_weight, net_gkp, season_code, date) VALUES (?, ?, ?, ?, ?)',
            [gkpWeight, gkgWeight, gkpWeight, seasonCode, date]
          );
          incomesAdded++;
        }

        if (pricePerKg > 0 && amountOrRevenue > 0) {
          const saleExisting = await db.getFirstAsync<{ id: number }>(
            'SELECT id FROM sales WHERE season_code = ? AND date = ? AND gkg_sold = ? AND price_per_kg = ? AND total_revenue = ? LIMIT 1',
            [seasonCode, date, gkgWeight, pricePerKg, amountOrRevenue]
          );
          if (!saleExisting) {
            await db.runAsync(
              'INSERT INTO sales (season_code, gkg_sold, price_per_kg, total_revenue, date) VALUES (?, ?, ?, ?, ?)',
              [seasonCode, gkgWeight, pricePerKg, amountOrRevenue, date]
            );
          }
        }
      }
    }
  });

  return { expensesAdded, incomesAdded };
}
