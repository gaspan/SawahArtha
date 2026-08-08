# SawahArtha 🌾
> **Aplikasi Manajemen Permodalan & Produktivitas Hasil Tani Padi**

SawahArtha adalah aplikasi mobile berbasis Android yang dirancang khusus untuk membantu para petani padi mengelola siklus operasional, pencatatan keuangan (modal, pendapatan, piutang/hutang), anggaran per kategori, multi-petak lahan, jurnal kegiatan tani, analisis produktivitas lahan, hingga perhitungan kewajiban zakat hasil tani secara terstruktur per musim tanam — lengkap dengan pengingat terjadwal dan laporan PDF siap cetak.

---

## 🚀 Teknologi Utama

Aplikasi ini dibangun menggunakan tumpukan teknologi modern untuk memastikan stabilitas di lapangan tanpa koneksi internet (*Offline-First*):

*   **Framework Core:** React Native (Expo SDK 57)
*   **Bahasa Pemrograman:** TypeScript (Type-Safe & Clean Code)
*   **Database Lokal:** SQLite via `expo-sqlite` (dilengkapi dengan WAL mode untuk performa transaksi cepat)
*   **Visualisasi Data:** `react-native-gifted-charts` & `react-native-svg` (grafik interaktif dan responsif)
*   **Manajemen Status:** React Context API (untuk sinkronisasi data musim tanam global)
*   **Notifikasi:** `expo-notifications` (pengingat terjadwal lokal, tanpa server)
*   **Laporan & Berkas:** `expo-print` + `expo-sharing` (laporan PDF), `expo-document-picker` (impor backup)
*   **Sinkronisasi Cloud:** `expo-auth-session` + `expo-secure-store` (Google Drive OAuth PKCE, opsional)

---

## ✨ Fitur Utama

### 1. Manajemen Musim Tanam Dinamis (Data Isolation)
Semua pencatatan pengeluaran, pemasukan, penjualan, piutang/hutang, dan anggaran dikelompokkan berdasarkan kode musim tanam (misalnya: `MT-2026-1`). Anda dapat membuat musim baru melalui tombol **"Mulai Musim Tanam Baru"**, yang secara otomatis menonaktifkan musim lama dan membuka lembaran baru tanpa menghapus riwayat data musim-musim sebelumnya di database SQLite.

*   **Edit Luas Lahan Inline**: Ukuran luas lahan dapat diedit langsung pada dashboard untuk memperbarui kalkulasi produktivitas secara instan.
*   **Harga Referensi Jual (Rp/kg)**: Harga jual gabah per kilogram dapat diatur per musim, digunakan sebagai dasar estimasi pendapatan gabah yang belum dijual dan perhitungan kartu potensi harga jual (Break-Even & Simulasi Harga).

### 2. Analisis Keuangan & KPI Produktivitas Lahan
*   **ROI / Profit Margin (%)**: Menampilkan persentase laba bersih terhadap total pengeluaran modal (teks hijau untuk untung, merah untuk rugi). Laba bersih dihitung setelah dikurangi zakat.
*   **Harga Pokok Produksi (HPP/kg)**: Menghitung batas minimal harga jual gabah kering panen agar modal awal kembali (Break-Even Point).
*   **Produktivitas Lahan**: Mengukur tingkat efisiensi tani dalam satuan **Kuintal/Ha** dan **Ton/Ha** menggunakan ukuran luas lahan riil ($m^2$).
*   **Analisis Per Hektar**: Rincian modal, pendapatan, dan laba bersih per hektar lahan untuk perbandingan efisiensi antar musim.
*   **Estimasi Hasil Tani Gabah**: Menampilkan total GKG hasil panen, estimasi harga jual per kg (harga aktual atau harga referensi musim), serta estimasi total pendapatan berdasarkan gabah yang sudah dijual dan yang masih belum dijual (*unsold*).

### 3. Kartu Analisis Mendalam
*   **Kartu Break-Even Point**: Menghitung HPP (Harga Pokok Produksi) per kg berdasarkan total pengeluaran dibagi total GKG, serta margin keuntungan/kerugian terhadap harga jual aktual atau harga referensi.
*   **Kartu Simulasi Harga**: Alat bantu simulasi untuk melihat estimasi pendapatan bersih (setelah zakat) di berbagai titik harga jual gabah, dengan batas minimum = HPP (break-even point).
*   **Kartu Waterfall Profit**: Visualisasi alur pendapatan kotor → Zakat → Total Pengeluaran → Laba Bersih dalam bentuk kartu ringkas. Biaya gacong ditampilkan sebagai informasi (tidak dikurangkan dari laba bersih).
*   **Kartu Gabah Belum Dijual**: Melacak stok gabah GKG yang belum memiliki harga jual, menampilkan estimasi potensi pendapatan jika menggunakan harga referensi musim.

### 4. Grafik Pengeluaran & Pendapatan Visual
*   **Donut Chart**: Grafik perbandingan persentase total modal keluar dibandingkan total omzet pendapatan hasil panen, dengan tampilan responsif menyesuaikan lebar layar.
*   **Bar Chart Kategori**: Visualisasi pengeluaran modal berdasarkan 8 kategori tani khusus: *Pupuk, Insektisida, Fungisida, Rodentisida, Herbisida, Moluksida, Jasa Pegawai,* dan *Item Barang*. Menampilkan informasi HPP per kg (total pengeluaran / total GKG) di bawah grafik.
*   **Grafik Perbandingan Musim (Line Chart)**: Membandingkan metrik lintas musim (Laba Bersih, Total Panen, Total Pendapatan) dalam grafik garis responsif, dengan filter tab untuk setiap metrik.

### 5. Ekspor & Impor Backup Data (CSV)
Aplikasi mendukung portabilitas data dengan menyediakan fitur ekspor dan impor data:
*   **Ekspor Data**: Mengonversi seluruh rekaman pengeluaran, pemasukan (panen), dan penjualan menjadi file format CSV standar secara lokal di direktori dokumen aplikasi, menampilkan letak path penyimpanan file tersebut di Dashboard secara interaktif (dapat ditekankan/salin), serta meniadakan alur share sheet eksternal.
*   **Impor Data**: Memilih file backup CSV menggunakan *Native Document Picker*, mem-parsing isi file secara aman (termasuk deteksi desimal lokal), menghindari data duplikat secara otomatis, dan memperbarui database lokal seketika melalui transaksi SQLite atomic.

### 6. Pencatatan Data Panen & Biaya Gacong
Tab **Penghasilan** memiliki dua sub-tab terpisah 🌾 **Panen** dan 💰 **Jual**.

#### Sub-tab Panen
*   **Input Berat GKP (Gabah Kering Panen)**: Berat kotor hasil panen dalam kilogram.
*   **Biaya Gacong (Upah Panen)**: Mendukung dua metode pemotongan biaya panen:
    *   *Berat (kg)*: potongan langsung dalam kilogram.
    *   *Pembagian (1/n)*: potongan berbasis pecahan hasil panen, misal 1/6 dari total GKP.
*   **Input Berat GKG Riil**: Berat GKG aktual hasil penimbangan dapat dimasukkan langsung (bukan hanya estimasi otomatis `netGKP × 0.8`). Badge menunjukkan apakah nilai masih estimasi atau berat riil. Zakat dihitung mengikuti angka stok riil.
*   **Kartu Stok Gabah**: Menampilkan Total Panen → Terjual → Sisa (dengan progress bar).
*   **Ringkasan Panen Terpadu**: Menampilkan alur GKP kotor → Gacong → Hasil Bersih → GKG → Zakat → Estimasi Pendapatan dalam satu kartu ringkasan.
*   **Riwayat Panen Detail**: Setiap record menampilkan GKP, Gacong (beserta metode), Hasil Bersih, dan GKG — dengan **tombol Edit GKG inline** (input berat riil + badge estimasi/riil) dan **peringatan otomatis** jika GKG baru kurang dari total yang sudah terjual.

#### Sub-tab Jual
*   **Form Penjualan Baru**: Input jumlah GKG terjual (dengan tombol "Semua" untuk stok penuh), harga per kg, nama pembeli, status bayar, dan catatan.
*   **Validasi Stok**: Sistem memvalidasi jumlah GKG terjual terhadap stok sisa agar tidak terjual berlebih.
*   **Daftar Riwayat Penjualan**: Setiap record menampilkan jumlah, harga, total, dan badge "⏳ Piutang" jika belum dibayar, dengan tombol "Tandai Lunas" atau edit inline.
*   **Harga Rata-rata Tertimbang**: Menghitung rata-rata harga jual berdasarkan berat terjual (weighted average).

### 7. Riwayat Pengeluaran dengan Pagination & Filter
Tab **Pengeluaran** mendukung pengelolaan riwayat yang efisien:
*   **Lazy-Load Pagination**: Data dimuat per-batch 10 record (LIMIT/OFFSET di level database), dimuat otomatis saat pengguna menggulir ke bawah (*infinite scroll*).
*   **Filter Berdasarkan Kategori**: Chip filter horizontal "Semua" + 8 kategori tani memungkinkan penyaringan riwayat pengeluaran secara instan; jumlah record disesuaikan sesuai filter aktif.
*   **Status Pembayaran**: Mendukung penandaan apakah pengeluaran sudah dibayar (lunas) atau belum, serta pencatatan nama vendor.
*   **Kartu Anggaran (Budget vs Aktual)**: Setiap kategori memiliki anggaran RAB yang ditampilkan sebagai progress bar + banner peringatan otomatis jika realisasi > 80% anggaran.

### 8. Anggaran RAB per Kategori
Terintegrasi di Dashboard dan Pengeluaran:
*   **Budget Card (8 kategori)**: Progress bar per kategori dengan status *safe* (<80%), *warning* (80-99%), atau *danger* (≥100%).
*   **Anggaran Default**: Disiapkan otomatis saat musim baru dibuat berdasarkan luas lahan × Rp 25jt/ha, dengan rasio per kategori (Pupuk 30%, Insektisida 15%, dsb.).
*   **Edit & Hapus Anggaran**: Tap kartu anggaran → modal edit/delete dengan validasi.
*   **Log Audit**: Setiap perubahan anggaran (seed/create/update/delete) tercatat untuk audit.
*   **Badge Merah**: Tab bar menampilkan badge merah jika ada kategori yang realisasi melebihi anggaran.

### 9. Tab Bar Hutang & Piutang 💳
Tab keempat untuk pengelolaan utang piutang:
*   **3 Jenis Hutang**: Piutang gabah, hutang saprotan, dan pinjaman modal.
*   **Bunga & Jatuh Tempo**: Mendukung input suku bunga per tahun dan tanggal jatuh tempo, dengan badge *overdue* otomatis.
*   **Cicilan Bertahap**: Mencicil hutang dalam beberapa kali pembayaran, dengan progress bar (terbayar / total + bunga).
*   **Kas Riil vs Akrual**: Menampilkan kartu Cash Position yang membandingkan kas riil (uang tunai masuk/keluar riil) vs kas akrual (seluruh transaksi tercatat).
*   **Filter & Ringkasan**: Filter *All / Piutang / Hutang*, ringkasan total piutang masuk vs hutang keluar, banner overdue jika ada yang melewati jatuh tempo.

### 10. Kalkulator Zakat Hasil Tani Otomatis
Mengalkulasi kewajiban zakat pertanian secara otomatis:
*   Mendukung konversi otomatis dari **Hasil Bersih GKP (setelah dikurangi biaya gacong)** ke Gabah Kering Giling (GKG) dengan rasio penyusutan standar 80% (atau berat riil jika dimasukkan manual).
*   Validasi otomatis terhadap batas minimal kewajiban zakat (Nisab pertanian sebesar $653 \text{ kg GKG}$).
*   Penerapan kadar zakat sebesar 5% (untuk sistem pengairan berbayar/irigasi pompa).
*   **Estimasi Zakat dalam Rupiah**: Perhitungan estimasi nilai zakat dalam mata uang Rupiah dengan mengalikan berat zakat (kg) terhadap harga rata-rata tertimbang berat GKG (apabila ada data harga jual yang tercatat).
*   **Total Pendapatan Net Zakat**: Estimasi total pendapatan ditampilkan setelah dikurangi kewajiban zakat, baik pada banner ringkasan maupun pada setiap record riwayat panen.
*   **Zakat Mengikuti Stok Riil**: Jika GKG diinput langsung (bukan estimasi), zakat dihitung berdasarkan berat tersebut.

### 11. Notifikasi Pengingat Lokal 🔔
Pengingat terjadwal offline via `expo-notifications` (tanpa server):
*   **Jatuh Tempo Hutang**: pengingat H-3 dan hari-H pukul 09:00 untuk setiap hutang belum lunas; jika sudah lewat jatuh tempo, pengingat harian sampai dilunasi.
*   **Anggaran Terlampaui**: notifikasi harian 09:00 selama ada kategori dengan realisasi ≥ 80%, menyebut kategori yang terdampak.
*   **Jadwal Tani**: pengingat harian 07:00 (opsional).
*   **Kontrol di Settings**: toggle notifikasi, toggle jadwal tani, dan tombol "Kirim Notifikasi Uji" (muncul 5 detik) untuk memverifikasi izin.
*   **Sinkronisasi Otomatis**: jadwal dihitung ulang dari data SQLite setiap aplikasi dibuka/fokus, sehingga selalu mengikuti kondisi hutang & anggaran terbaru.

### 12. Multi-Lahan (Petak) 🌱
Satu musim tanam dapat dipecah menjadi beberapa petak lahan:
*   **Kartu Petak Lahan** di Dashboard: daftar petak, ringkasan jumlah petak + total luas, tambah/edit/hapus lewat modal.
*   **Tagging Transaksi**: form Pengeluaran, Panen, Penjualan, dan Jurnal memiliki *chip picker* petak (opsional, default "Semua"). Picker otomatis tersembunyi bila belum ada petak.
*   **Hapus Aman**: menghapus petak tidak menghapus transaksi — kolom `plot_id` pada catatan terkait di-set `NULL` dalam satu transaksi SQLite.

### 13. Jurnal Kegiatan Tani 📔
Tab kelima untuk mencatat kronologi kegiatan di sawah:
*   **5 Jenis Kegiatan**: Tanam, Pupuk, Semprot, Panen, dan Lainnya.
*   **Filter Chip**: menyaring riwayat per jenis kegiatan (tap ulang untuk reset).
*   **Form Ringkas**: nama kegiatan, pilihan petak lahan, dan catatan; tanggal terisi otomatis hari ini.
*   **Riwayat Kronologis**: diurutkan dari terbaru, menampilkan badge jenis, label "Hari ini", nama petak, dan catatan, dengan opsi hapus berkonfirmasi.

### 14. Laporan PDF Musim 📄
Ekspor ringkasan musim siap cetak untuk keperluan koperasi/bank (Settings → Data & Backup → **Laporan PDF Musim**):
*   **7 Section**: Ringkasan Keuangan (11 metrik), Anggaran per Kategori, Hutang & Piutang, Petak Lahan, Jurnal Kegiatan Tani, Pengeluaran, dan Penjualan Gabah.
*   **Metrik Ringkasan**: total modal, GKP, GKG, biaya gacong, pendapatan terjual, estimasi pendapatan, HPP/kg, zakat (kg & Rp), laba bersih setelah zakat, serta ROI.
*   **Cetak & Bagikan**: PDF dihasilkan `expo-print` lalu dibuka melalui share sheet OS (`expo-sharing`) untuk disimpan, dikirim, atau dicetak.

---

## 🗺️ Roadmap

### ✅ Sudah Diimplementasikan

| Tier | Fitur | Status |
|---|---|---|
| **Tier 1** | Perbaikan akurasi keuangan: HPP per GKG (bukan GKP), laba bersih setelah zakat, harga referensi jual per musim | ✅ |
| **Tier 1** | Kartu analisis: Profit Waterfall, Break-Even Point, Simulasi Harga, Gabah Belum Dijual, KPI (ROI, margin, produktivitas) | ✅ |
| **Tier 1** | 40 unit test dashboard (nisab, HPP, waterfall, simulasi, edge cases) | ✅ |
| **Tier 2** | Migrasi chart ke `react-native-gifted-charts`: Donut Chart, Bar Chart Kategori (Rp/kg) | ✅ |
| **Tier 2** | Analisis per hektar & perbandingan antar musim (line chart, 3 tab metrik) | ✅ |
| **Tier 2** | `analyticsService` lintas musim + 107 total unit test | ✅ |
| **Tier 3A** | Anggaran RAB per kategori: budget default Rp 25jt/ha, progress bar, badge merah, edit/hapus, audit log | ✅ |
| **Tier 3A** | 37 unit test anggaran (seed, realisasi vs anggaran, audit, edge cases) | ✅ |
| **Tier 3B** | Piutang gabah: status bayar + buyer + tanggal bayar (`is_paid` di income/sales) | ✅ |
| **Tier 3B** | Hutang saprotan: `is_paid` + vendor di expenses, `markExpensePaid`, daftar belum bayar | ✅ |
| **Tier 3B** | Pinjaman modal: tabel `debts` + `debt_payments`, bunga, jatuh tempo, cicilan, badge overdue, kas riil vs akrual (`CashPositionCard`) | ✅ |
| **Tier 3B** | Tab keempat 💳 Hutang & Piutang, `MarkPaidModal` terbagi (penjualan + pengeluaran) | ✅ |
| **Bonus** | Split panen/penjualan: tabel `sales` terpisah, sub-tab 🌾 Panen / 💰 Jual, `StockCard` (panen/terjual/sisa), harga rata-rata tertimbang, validasi stok | ✅ |
| **Bonus** | Input GKG riil saat panen (fallback estimasi ×0.8), edit GKG inline di riwayat, badge estimasi/riil, peringatan jika GKG < stok terjual | ✅ |
| **Bonus** | Ekspor/Impor CSV dengan tipe Panen/Penjualan + backward compat legacy | ✅ |
| **Tier 4A** | Layar Settings (`app/settings.tsx`), ikon ⚙️ di header dashboard, CSV dipindah dari dashboard ke Settings | ✅ |
| **Tier 4B** | Tema gelap penuh: `ThemeContext` + `useThemedStyles`, palet light/dark (`LIGHT_COLORS`/`DARK_COLORS`), opsi Terang/Gelap/Sistem, StatusBar reaktif | ✅ |
| **Tier 4C** | Preferensi: ukuran font (kecil/sedang/besar via `FONT_SCALE_MAP`), format angka (titik/koma), default luas lahan & harga referensi musim baru (prefill `NewSeasonModal`), reset anggaran default (`resetBudgetsToDefault`) | ✅ |
| **Tier 4D** | Backup/restore JSON penuh (10 tabel data + `settings`, termasuk petak & jurnal — memperbaiki bug CSV yang kehilangan anggaran/hutang/status bayar) | ✅ |
| **Tier 4D** | Sinkronisasi Google Drive via `expo-auth-session` (scope `drive.file`): upload/list/restore, refresh token di `expo-secure-store`, indikator backup terakhir | ✅ (perlu OAuth client ID) |
| **Tier 5** | Notifikasi lokal (`expo-notifications`): reminder hutang H-3/H-0/overdue harian, peringatan anggaran harian (≥80%), pengingat jadwal tani harian (opsional), toggle di Settings + notifikasi uji | ✅ |
| **Tier 6** | Laporan PDF musim (`expo-print` + `expo-sharing`): 7 section, 11 metrik ringkasan, share sheet untuk simpan/cetak | ✅ |
| **Tier 6** | Multi-lahan: tabel `plots`, kolom `plot_id` di expenses/income/sales/farming_activities, `PlotCard`/`PlotModal`/`PlotPicker`, hapus petak tanpa menghapus transaksi | ✅ |
| **Tier 6** | Jurnal kegiatan tani: tabel `farming_activities`, tab kelima 📔, 5 jenis kegiatan, filter chip, tagging petak | ✅ |
| **Bonus** | App icon & splash/launcher baru dari gambar AI (`xCode_Generated_Image-5/6`): icon 1024px + adaptive icon Android, splash screen via plugin `expo-splash-screen` (cover) | ✅ |
| **Testing** | 187 unit test / 49 suite, `tsc --noEmit` bersih | ✅ |

### 🔜 Belum Diimplementasikan (Rencana)

| Tier | Fitur | Catatan |
|---|---|---|
| — | **Edit kegiatan jurnal** — saat ini hanya tambah & hapus | perlu `updateActivity` + modal edit |
| — | **Pilih tanggal kegiatan** — jurnal selalu memakai tanggal hari ini | butuh date picker |
| — | **Analisis per petak** — bandingkan produktivitas & biaya antar petak | data `plot_id` sudah tersedia |
| — | **Auto-backup terjadwal ke Drive** — cadangkan otomatis + rotasi 5 file terakhir | butuh background task |

---

### ✅ Tier 5 — Notifikasi (Selesai)

> Reminder lokal via `expo-notifications` (jadwal lokal, offline-first).

*   **Reminder jatuh tempo hutang**: H-3 (09:00) dan hari H (09:00) per hutang belum lunas; jika sudah lewat jatuh tempo, pengingat harian 09:00 sampai dilunasi.
*   **Peringatan anggaran terlampaui**: notifikasi harian 09:00 selama ada kategori realisasi ≥ 80% (warning/danger), menyebut kategori yang terpengaruh.
*   **Pengingat jadwal tani**: notifikasi harian 07:00 (opsional, toggle di Settings).
*   **Settings → Notifikasi**: toggle global, toggle jadwal tani, tombol "Kirim Notifikasi Uji" (5 detik).
*   **Sync otomatis**: jadwal di-reschedule saat app dibuka/fokus dan saat toggle berubah (data dibaca langsung dari SQLite).
*   Plugin `expo-notifications` terpasang di `app.json` (channel `reminders`, warna `#059669`). Android 13+ meminta izin saat toggle diaktifkan pertama kali.

---

### ✅ Tier 4 — Pengaturan & Tema (Selesai)

> Semua item 4A–4D sudah diimplementasikan. Sisa pekerjaan opsional di bawah.

#### 4A. Layar Settings — ✅ DONE

*   Ikon ⚙️ di header dashboard membuka layar stack `app/settings.tsx`.
*   Section list: **Tampilan** (tema, ukuran font), **Preferensi** (format angka, default musim baru, reset anggaran), **Data & Backup** (ekspor/impor CSV, backup/restore JSON), **Google Drive**, **Tentang**.

#### 4B. Tema Gelap — ✅ DONE (Pendekatan A: refactor penuh)

*   **Arsitektur**: `ThemeContext` menyediakan `colors` + `fs` (font scale) secara reaktif; `useThemedStyles(makeStyles)` membungkus `StyleSheet.create` dalam `useMemo`. Semua 37 blok `StyleSheet.create` di 34 file dikonversi.
*   **Palet**: `LIGHT_COLORS` / `DARK_COLORS` di `src/constants/theme.ts` dengan struktur kunci identik (termasuk `categoryBg`/`categoryText`).
*   **Mode**: Terang / Gelap / Sistem (`useColorScheme`), preferensi tersimpan di tabel `settings`.
*   `app.json` `userInterfaceStyle` diubah ke `"automatic"`.

#### 4C. Preferensi — ✅ DONE

*   **Ukuran font**: kecil/sedang/besar via `FONT_SCALE_MAP` (0.9/1/1.15), diterapkan melalui `fs` di semua style.
*   **Format angka**: pemisah ribuan titik/koma via `setThousandsSeparator` (singleton `formatConfig`), `formatIDR`/`formatNumber`/`formatCurrencyInput` otomatis mengikutinya.
*   **Default musim baru**: luas lahan & harga referensi tersimpan di settings, `NewSeasonModal` ter-prefill.
*   **Reset anggaran default**: `resetBudgetsToDefault` mengembalikan semua kategori ke `DEFAULT_BUDGET_RATIO`, tercatat di log audit.

#### 4D. Backup & Restore — ✅ DONE

*   **Backup JSON penuh** (`src/utils/jsonBackup.ts`): mengekspor seluruh 10 tabel data (seasons, expenses, income, sales, budgets, budget_logs, debts, debt_payments, plots, farming_activities) + settings. **Ini memperbaiki bug lama**: CSV sebelumnya kehilangan anggaran, hutang, cicilan, status bayar, vendor, dan buyer.
*   **Restore transaksional**: merge dengan ID asli, duplikat di-skip, FK cicilan tetap utuh.
*   **Google Drive sync** (`src/services/driveService.ts`): OAuth authorization-code + PKCE via `expo-auth-session`. Kode otorisasi ditukar menjadi token lewat `exchangeDriveCode` (`exchangeCodeAsync` + `code_verifier`), refresh token disimpan di `expo-secure-store`, scope `drive.file` (hanya file buatan app), folder `SawahArtha Backups`, upload/list/download-restore.
*   **Indikator**: "Terakhir dicadangkan" di Settings (disimpan di settings `last_backup_at`).

#### ⚠️ Prasyarat Google Drive

Client ID Android sudah terisi di `app.json` → `extra.googleDriveClientIds.android` (iOS & web masih kosong). Bila membuat OAuth client sendiri, ikuti langkah berikut:

1.  Buat project Google Cloud + aktifkan **Google Drive API**.
2.  Buat **OAuth 2.0 Client ID** tipe *Android* dengan:
    *   **Package name**: `com.gentur.ariya.SawahArtha` (harus sama dengan `app.json` → `android.package`)
    *   **SHA-1**: fingerprint keystore yang menandatangani APK terpasang — ambil dengan `eas credentials` (pilih platform Android → build profile yang dipakai). Salah SHA-1 = OAuth selalu gagal walau redirect sudah benar.
3.  Isi `extra.googleDriveClientIds.android`, lalu **build ulang** (`eas build -p android --profile preview`).

> **Redirect URI**: aplikasi memakai `com.gentur.ariya.SawahArtha:/oauthredirect` (pola resmi *installed app* yang juga dipakai provider Google bawaan `expo-auth-session`). Redirect ini **diterima otomatis** oleh client Android — tidak perlu didaftarkan di console. Karena itu package name juga terdaftar pada `app.json` → `scheme` agar browser dapat kembali ke aplikasi.
>
> **Jangan** memakai custom scheme seperti `sawahartha://` sebagai redirect — client Android akan menolaknya dengan `redirect_uri_mismatch` (gejalanya: alert "Gagal" saat menekan *Hubungkan Google Drive*).
>
> **Expo Go tidak didukung** untuk alur ini: redirect di Expo Go menjadi `exp://…` sehingga tidak pernah cocok. Gunakan APK/dev build.

#### ❓ Pertanyaan Tier 4 — Sudah Dijawab

1.  Tema gelap → **A. Refactor penuh ke hook** (tema instan).
2.  Backup JSON penuh → **Ya, dijadikan prasyarat** dan sudah diimplementasikan sebelum Drive.
3.  Letak Settings → **Ikon ⚙️ di header dashboard** (bukan tab kelima).
4.  Cakupan → **Seluruh Tier 4 sekaligus** (4A → 4C → 4B → 4D).

---

## 🗄️ Arsitektur Database (SQLite Schema)

Database SQLite lokal terdiri dari 12 tabel (11 tabel data + 1 tabel marker migrasi):

```sql
-- 1. Tabel Musim Tanam
CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_code TEXT UNIQUE NOT NULL,
  land_size_m2 REAL,
  ref_price_per_kg REAL DEFAULT 0,
  is_active INTEGER DEFAULT 0
);

-- 2. Tabel Catatan Pengeluaran
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  season_code TEXT NOT NULL,
  date TEXT NOT NULL,
  is_paid INTEGER DEFAULT 1,
  vendor_name TEXT,
  payment_date TEXT
);

-- 3. Tabel Catatan Hasil Panen
CREATE TABLE IF NOT EXISTS income (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gkp_weight REAL NOT NULL,
  gkg_weight REAL NOT NULL,
  gacong_type TEXT NOT NULL DEFAULT 'berat',
  gacong_input REAL DEFAULT 0,
  gacong_weight REAL DEFAULT 0,
  net_gkp REAL NOT NULL DEFAULT 0,
  season_code TEXT NOT NULL,
  date TEXT NOT NULL
);

-- 4. Tabel Penjualan Gabah (dipisah dari income)
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gkg_sold REAL NOT NULL,
  price_per_kg REAL NOT NULL,
  total_revenue REAL NOT NULL,
  buyer_name TEXT,
  is_paid INTEGER DEFAULT 1,
  payment_date TEXT,
  note TEXT,
  season_code TEXT NOT NULL,
  date TEXT NOT NULL
);

-- 5. Tabel Anggaran per Kategori
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_code TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  UNIQUE(season_code, category)
);

-- 6. Tabel Audit Log Anggaran
CREATE TABLE IF NOT EXISTS budget_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_code TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  old_amount REAL DEFAULT 0,
  new_amount REAL DEFAULT 0,
  note TEXT,
  date TEXT NOT NULL
);

-- 7. Tabel Hutang & Piutang
CREATE TABLE IF NOT EXISTS debts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_code TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('loan_in', 'loan_out')),
  counterparty TEXT NOT NULL,
  amount REAL NOT NULL,
  paid_amount REAL DEFAULT 0,
  interest_rate REAL DEFAULT 0,
  due_date TEXT,
  is_settled INTEGER DEFAULT 0,
  note TEXT,
  date TEXT NOT NULL
);

-- 8. Tabel Pembayaran Cicilan Hutang
CREATE TABLE IF NOT EXISTS debt_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  debt_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  note TEXT,
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
);

-- 9. Tabel Migrasi (marker satu-kali)
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  applied_at TEXT NOT NULL
);

-- 10. Tabel Preferensi (key-value)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 11. Tabel Petak Lahan (multi-lahan)
CREATE TABLE IF NOT EXISTS plots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_code TEXT NOT NULL,
  name TEXT NOT NULL,
  land_size_m2 REAL NOT NULL DEFAULT 0,
  note TEXT,
  date TEXT NOT NULL
);

-- 12. Tabel Jurnal Kegiatan Tani
CREATE TABLE IF NOT EXISTS farming_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_code TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  plot_id INTEGER,
  note TEXT
);

-- Kolom multi-lahan pada tabel transaksi (via ALTER TABLE, idempotent)
-- expenses.plot_id, income.plot_id, sales.plot_id  → INTEGER, nullable
```

> **Perubahan dari v1:** Tabel `income` tidak lagi memiliki kolom harga/pendapatan (dipisah ke `sales`). Kolom `is_paid`, `vendor_name`, `payment_date` ditambahkan ke `expenses` untuk pelacakan status pembayaran. Tabel `sales`, `budgets`, `budget_logs`, `debts`, `debt_payments`, `_migrations` adalah penambahan baru.
>
> **Perubahan terbaru:** Tabel `settings` (preferensi & tema), `plots` (multi-lahan), dan `farming_activities` (jurnal) ditambahkan; kolom `plot_id` disisipkan ke `expenses`, `income`, dan `sales` melalui `ALTER TABLE`. Kunci `settings` yang dipakai: `theme`, `font_scale`, `number_format`, `default_land_size`, `default_ref_price`, `last_backup_at`, `notifications_enabled`, `farm_reminder_enabled`. Seluruh migrasi bersifat *idempotent* (`IF NOT EXISTS` + `try/catch` pada `ALTER TABLE`), sehingga aman untuk upgrade dari instalasi lama. Indeks: `idx_plots_season(season_code)` dan `idx_activities_season(season_code, date DESC)`.

---

## 📁 Struktur File Utama

```
app/
  _layout.tsx                # SQLiteProvider → ThemeProvider → SettingsProvider → SeasonProvider → BudgetProvider → Stack
  settings.tsx               # ⚙️ Pengaturan: Tampilan, Notifikasi, Preferensi, Data & Backup (CSV/JSON/PDF), Google Drive, Tentang
  (tabs)/
    _layout.tsx              # Tab bar: 📊 Dashboard | 💰 Pengeluaran | 🌾 Penghasilan | 💳 Hutang | 📔 Jurnal
    index.tsx                # Dashboard (Ringkasan, Grafik, KPI, Petak Lahan, ⚙️ ke Settings)
    income.tsx               # Sub-tab: 🌾 Panen & 💰 Jual (StockCard + Zakat)
    expenses.tsx             # Pengeluaran + Anggaran banner
    debts.tsx                # 💳 Hutang & Piutang (DebtCard list)
    journal.tsx              # 📔 Jurnal kegiatan tani (filter jenis + form + riwayat)
src/
  components/
    StockCard.tsx            # Total Panen → Terjual → Sisa (progress bar)
    SalesForm.tsx            # Form penjualan (stok validation)
    SalesList.tsx            # Daftar penjualan + edit inline + badge piutang
    DebtCard.tsx             # Kartu hutang (progress bar, bunga, overdue)
    AddDebtModal.tsx         # Form tambah hutang
    DebtPaymentModal.tsx     # Form cicilan (maks = sisa)
    CashPositionCard.tsx     # Kas riil vs akrual
    BudgetCard.tsx           # 8 kartu anggaran per kategori
    BudgetEditModal.tsx      # Edit/hapus anggaran
    BudgetLogModal.tsx       # Audit log perubahan anggaran
    MarkPaidModal.tsx        # Modal tanda lunas (shared)
    IncomeForm.tsx           # Form panen (GKP + Gacong + GKG riil)
    IncomeList.tsx           # Riwayat panen + edit inline GKG + badge estimasi/riil
    ExpenseForm.tsx          # Form pengeluaran (+vendor, status bayar)
    ExpenseList.tsx          # Riwayat pengeluaran + badge piutang
    ProfitWaterfallCard.tsx  # Waterfall: Modal → Panen → Gacong → Laba
    BreakEvenCard.tsx        # HPP + titik impas
    PriceSimulatorCard.tsx   # Slider simulasi harga jual
    UnsoldGrainCard.tsx      # Stok gabah belum terjual
    SeasonComparisonChart.tsx# Line chart perbandingan musim (3 tab)
    DonutChart.tsx           # Pie chart gifted-charts
    CategoryBarChart.tsx     # Bar chart per kategori + Rp/kg
    ZakatSection.tsx         # Kalkulator zakat display
    PlotCard.tsx             # 🌱 Kartu daftar petak lahan (dashboard)
    PlotModal.tsx            # Modal tambah/edit/hapus petak
    PlotPicker.tsx           # Chip pemilih petak untuk form (auto-hide bila kosong)
  database/
    init.ts                  # Schema + migrasi (settings, plots, farming_activities, plot_id)
    incomeService.ts         # CRUD panen + updateIncomeGKG
    salesService.ts          # CRUD penjualan + rata-rata tertimbang
    expenseService.ts        # CRUD pengeluaran + markPaid
    budgetService.ts         # Anggaran + log audit + resetBudgetsToDefault
    debtService.ts           # CRUD hutang + cicilan
    analyticsService.ts      # Cross-season metrics (LEFT JOIN sales)
    seasonService.ts         # CRUD musim + ref price
    settingsService.ts       # Key-value preferensi (tema, font, format, default, backup, notifikasi)
    plotService.ts           # CRUD petak + detach plot_id saat hapus
    activityService.ts       # CRUD jurnal kegiatan + ACTIVITY_TYPES
    csv.ts                   # Ekspor/Impor CSV (Panen/Penjualan/Pengeluaran)
  services/
    driveService.ts          # Google Drive OAuth (PKCE + code exchange) + upload/list/restore
    notificationService.ts   # Jadwal notifikasi lokal (hutang, anggaran, jadwal tani)
    pdfService.ts            # Query musim → HTML → PDF → share sheet
  hooks/
    useIncome.ts             # State panen (GKG, GKP, gacong, updateGKG)
    useSales.ts              # State penjualan (revenue, avgPrice, unpaid)
    useExpenses.ts           # State pengeluaran + unpaid
    useDebts.ts              # State hutang + cicilan
    useBudget.ts             # State anggaran + overBudgetCount
    useSeasonMetrics.ts      # Cross-season metrics
    useNotifications.ts      # Re-sync jadwal notifikasi saat fokus/setting berubah
    usePlots.ts              # State petak lahan per musim
    useActivities.ts         # State jurnal kegiatan per musim
  context/
    SeasonContext.tsx         # Season global + auto-seed budget
    BudgetContext.tsx         # Budget global + badge driver
    SettingsContext.tsx       # Preferensi global (format angka, default, last backup, notifikasi)
    ThemeContext.tsx          # Tema + useThemedStyles + useTheme
  utils/
    zakat.ts                 # Kalkulator zakat + resolveGKG + isEstimatedGKG
    currency.ts              # FormatIDR + formatCurrencyInput (ikut preferensi separator)
    formatConfig.ts          # Singleton pemisah ribuan (titik/koma)
    csv.ts                   # CSV parser + konverter
    jsonBackup.ts            # Backup/restore JSON penuh (semua tabel)
    backupCore.ts            # Helper murni backup (testable tanpa RN)
    notificationCore.ts      # Pure logic jadwal notifikasi (testable tanpa RN)
    pdfHtml.ts               # Pure builder HTML laporan (testable tanpa RN)
    plotCore.ts              # Pure logic petak (totalPlotArea)
    dateUtil.ts              # formatDate id-ID untuk jurnal
    expenseListItems.ts      # Pure list-builder ExpenseList (regression RN 0.86)
  features/
    dashboard.test.ts        # 40 tes (KPI, waterfall, break-even, simulasi, perbandingan musim)
    budget.test.ts           # 37 tes (anggaran, seed, audit log)
    sales.test.ts            # 30 tes (stok, weighted avg, revisi, piutang, alur lengkap)
    income-form.test.ts      # 23 tes (resolveGKG, isEstimatedGKG, isValidGKG, alur form)
    expense-list.test.ts     # 8 tes (key numerik, separator, regression Fragment)
```

---

## 🧪 Pengujian (Unit Test)

Logika perhitungan inti diuji menggunakan **Node.js built-in test runner** (`node:test`) dengan `tsx`:

```bash
npm test
```

**Total: 187 tes, 49 suite, 0 fail.**

| File Tes | Jumlah | Cakupan |
|---|---|---|
| `dashboard.test.ts` | 40 | KPI, waterfall, break-even, simulasi harga, perbandingan musim, per-hektar, edge cases |
| `budget.test.ts` | 37 | Hitung anggaran, seed default, realisasi vs anggaran, audit log, edge cases |
| `sales.test.ts` | 30 | Stok gabah, weighted average, revisi penjualan, piutang, gacong rupiah, migrasi legacy, alur lengkap |
| `zakat.test.ts` | 25 | Nisab, kadar zakat, gacong berat/pembagian, zakat rupiah, summary |
| `income-form.test.ts` | 23 | resolveGKG, isEstimatedGKG, isValidGKG, alur form estimasi vs riil |
| `expense-list.test.ts` | 8 | Key numerik, spacing separator, regression `<Fragment>` RN 0.86 |
| `notificationCore.test.ts` | 7 | H-3/H-0/overdue hutang, warning & danger anggaran, hutang lunas/tanpa jatuh tempo |
| `pdfHtml.test.ts` | 6 | Builder HTML laporan, escaping, section kosong |
| `jsonBackup.test.ts` | 5 | Nama file backup, validasi payload JSON |
| `plotCore.test.ts` | 3 | Total luas petak, list kosong |
| `dateUtil.test.ts` | 3 | Format tanggal id-ID, input invalid |

---

## 🛠️ Pengembangan Lokal

Ikuti langkah berikut untuk menjalankan aplikasi di mesin lokal Anda:

1.  **Clone repositori ini:**
    ```bash
    git clone <repository_url>
    cd SawahArtha
    ```
2.  **Instalasi dependensi:**
    Proyek ini menggunakan `.npmrc` dengan konfigurasi `legacy-peer-deps=true` untuk mencegah konflik peer dependency selama instalasi.
    ```bash
    npm install
    ```
3.  **Jalankan Expo server:**
    ```bash
    npm start
    ```
4.  **Buka aplikasi di Handphone:**
    Scan QR code yang muncul di terminal menggunakan aplikasi **Expo Go** (tersedia di Google Play Store atau Apple App Store).

---

## 📦 Panduan Build APK (Cloud Build via EAS)

Build APK dilakukan secara cloud menggunakan Expo Application Services (EAS) tanpa memerlukan instalasi Android Studio lokal:

1.  **Instal EAS CLI secara global:**
    ```bash
    npm install -g eas-cli
    ```
2.  **Login ke akun Expo Anda:**
    ```bash
    eas login
    ```
3.  **Jalankan perintah build APK:**
    Perintah ini akan melakukan kompilasi di server Expo dan menghasilkan link download APK yang dapat diinstal langsung di Android.
    ```bash
    eas build -p android --profile preview
    ```

---

## 📝 Lisensi
Proyek ini dilisensikan di bawah **MIT License**.
