# SawahArtha 🌾
> **Aplikasi Manajemen Permodalan & Produktivitas Hasil Tani Padi**

SawahArtha adalah aplikasi mobile berbasis Android yang dirancang khusus untuk membantu para petani padi mengelola siklus operasional, pencatatan keuangan (modal & pendapatan), analisis produktivitas lahan, hingga perhitungan kewajiban zakat hasil tani secara terstruktur per musim tanam.

---

## 🚀 Teknologi Utama

Aplikasi ini dibangun menggunakan tumpukan teknologi modern untuk memastikan stabilitas di lapangan tanpa koneksi internet (*Offline-First*):

*   **Framework Core:** React Native (Expo SDK 57)
*   **Bahasa Pemrograman:** TypeScript (Type-Safe & Clean Code)
*   **Database Lokal:** SQLite via `expo-sqlite` (dilengkapi dengan WAL mode untuk performa transaksi cepat)
*   **Visualisasi Data:** `react-native-chart-kit` & `react-native-svg` (grafik interaktif dan responsif)
*   **Manajemen Status:** React Context API (untuk sinkronisasi data musim tanam global)

---

## ✨ Fitur Utama

### 1. Manajemen Musim Tanam Dinamis (Data Isolation)
Semua pencatatan pengeluaran dan pendapatan dikelompokkan berdasarkan kode musim tanam (misalnya: `MT-2026-1`). Anda dapat membuat musim baru melalui tombol **"Mulai Musim Tanam Baru"**, yang secara otomatis menonaktifkan musim lama dan membuka lembaran baru tanpa menghapus riwayat data musim-musim sebelumnya di database SQLite.

*   **Edit Luas Lahan Inline**: Ukuran luas lahan dapat diedit langsung pada dashboard untuk memperbarui kalkulasi produktivitas secara instan.
*   **Harga Referensi Jual (Rp/kg)**: Harga jual gabah per kilogram dapat diatur per musim, digunakan sebagai dasar estimasi pendapatan gabah yang belum dijual dan perhitungan kartu potensi harga jual (Break-Even & Simulasi Harga).

### 2. Analisis Keuangan & KPI Produktivitas Lahan
*   **ROI / Profit Margin (%)**: Menampilkan persentase laba bersih terhadap total pengeluaran modal (teks hijau untuk untung, merah untuk rugi).
*   **Harga Pokok Produksi (HPP/kg)**: Menghitung batas minimal harga jual gabah kering panen agar modal awal kembali (Break-Even Point).
*   **Produktivitas Lahan**: Mengukur tingkat efisiensi tani dalam satuan **Kuintal/Ha** dan **Ton/Ha** menggunakan ukuran luas lahan riil ($m^2$).
*   **Estimasi Hasil Tani Gabah**: Menampilkan total GKG hasil panen, estimasi harga jual per kg (harga aktual atau harga referensi musim), serta estimasi total pendapatan berdasarkan gabah yang sudah dijual dan yang masih belum dijual (*unsold*).

### 3. Kartu Analisis Mendalam
*   **Kartu Break-Even Point**: Menghitung HPP (Harga Pokok Produksi) per kg berdasarkan total pengeluaran dibagi total GKG, serta margin keuntungan/kerugian terhadap harga jual aktual atau harga referensi.
*   **Kartu Simulasi Harga**: Alat bantu simulasi untuk melihat estimasi pendapatan bersih (setelah zakat) di berbagai titik harga jual gabah, dengan batas minimum = HPP (break-even point).
*   **Kartu Waterfall Profit**: Visualisasi alur pendapatan kotor → Zakat → Biaya Gacong → Total Pengeluaran → Laba Bersih dalam bentuk kartu ringkas.
*   **Kartu Gabah Belum Dijual**: Melacak stok gabah GKG yang belum memiliki harga jual, menampilkan estimasi potensi pendapatan jika menggunakan harga referensi musim.

### 4. Grafik Pengeluaran & Pendapatan Visual
*   **Donut Chart**: Grafik perbandingan persentase total modal keluar dibandingkan total omzet pendapatan hasil panen.
*   **Bar Chart Kategori**: Visualisasi pengeluaran modal berdasarkan 8 kategori tani khusus: *Pupuk, Insektisida, Fungisida, Rodentisida, Herbisida, Moluksida, Jasa Pegawai,* dan *Item Barang*.

### 5. Ekspor & Impor Backup Data (CSV)
Aplikasi mendukung portabilitas data dengan menyediakan fitur ekspor dan impor data:
*   **Ekspor Data**: Mengonversi seluruh rekaman pengeluaran dan pemasukan menjadi file format CSV standar secara lokal di direktori dokumen aplikasi, menampilkan letak path penyimpanan file tersebut di Dashboard secara interaktif (dapat ditekankan/salin), serta meniadakan alur share sheet eksternal.
*   **Impor Data**: Memilih file backup CSV menggunakan *Native Document Picker*, mem-parsing isi file secara aman (termasuk deteksi desimal lokal), menghindari data duplikat secara otomatis, dan memperbarui database lokal seketika melalui transaksi SQLite atomic.

### 6. Pencatatan Data Panen & Biaya Gacong
Tab **Penghasilan** menampilkan alur pencatatan hasil panen yang transparan dan berurutan:
*   **Input Berat GKP (Gabah Kering Panen)**: Berat kotor hasil panen dalam kilogram.
*   **Biaya Gacong (Upah Panen)**: Mendukung dua metode pemotongan biaya panen:
    *   *Berat (kg)*: potongan langsung dalam kilogram.
    *   *Pembagian (1/n)*: potongan berbasis pecahan hasil panen, misal 1/6 dari total GKP.
*   **Ringkasan Panen Terpadu**: Menampilkan alur GKP kotor → Gacong → Hasil Bersih → Estimasi GKG → Zakat → Estimasi Pendapatan dalam satu kartu ringkasan.
*   **Riwayat Panen Detail**: Setiap record menampilkan GKP, Gacong (beserta metode), Hasil Bersih, dan GKG, dengan edit harga jual langsung di tempat.

### 7. Riwayat Pengeluaran dengan Pagination & Filter
Tab **Pengeluaran** mendukung pengelolaan riwayat yang efisien:
*   **Lazy-Load Pagination**: Data dimuat per-batch 10 record (LIMIT/OFFSET di level database), dimuat otomatis saat pengguna menggulir ke bawah (*infinite scroll*).
*   **Filter Berdasarkan Kategori**: Chip filter horizontal "Semua" + 8 kategori tani memungkinkan penyaringan riwayat pengeluaran secara instan; jumlah record disesuaikan sesuai filter aktif.

### 8. Kalkulator Zakat Hasil Tani Otomatis
Mengalkulasi kewajiban zakat pertanian secara otomatis:
*   Mendukung konversi otomatis dari **Hasil Bersih GKP (setelah dikurangi biaya gacong)** ke Gabah Kering Giling (GKG) dengan rasio penyusutan standar 80%.
*   Validasi otomatis terhadap batas minimal kewajiban zakat (Nisab pertanian sebesar $653 \text{ kg GKG}$).
*   Penerapan kadar zakat sebesar 5% (untuk sistem pengairan berbayar/irigasi pompa).
*   **Estimasi Zakat dalam Rupiah**: Perhitungan estimasi nilai zakat dalam mata uang Rupiah dengan mengalikan berat zakat (kg) terhadap harga rata-rata tertimbang berat GKG (apabila ada data harga jual yang tercatat).
*   **Total Pendapatan Net Zakat**: Estimasi total pendapatan ditampilkan setelah dikurangi kewajiban zakat, baik pada banner ringkasan maupun pada setiap record riwayat panen.

---

## 🗄️ Arsitektur Database (SQLite Schema)

Database SQLite lokal didefinisikan dengan tiga tabel utama:

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
  date TEXT NOT NULL
);

-- 3. Tabel Catatan Pendapatan Hasil Panen
CREATE TABLE IF NOT EXISTS income (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gkp_weight REAL NOT NULL,
  gkg_weight REAL NOT NULL,
  gacong_type TEXT NOT NULL DEFAULT 'berat',
  gacong_input REAL DEFAULT 0,
  gacong_weight REAL DEFAULT 0,
  net_gkp REAL NOT NULL DEFAULT 0,
  price_per_kg REAL DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  season_code TEXT NOT NULL,
  date TEXT NOT NULL
);
```

> **Catatan kolom `seasons`:** `ref_price_per_kg` menyimpan harga referensi jual gabah per kilogram yang ditetapkan per musim, digunakan untuk estimasi pendapatan gabah yang belum dijual dan kartu analisis harga.

> **Catatan kolom `income`:** `gkp_weight` menyimpan berat kotor GKP, `gacong_*` menyimpan detail biaya panen (metode, input, dan hasil potongan dalam kg), `net_gkp` adalah hasil bersih setelah gacong, sedangkan `gkg_weight` dihitung dari `net_gkp × 0.8` dan `total_revenue` dihitung dari `gkg_weight × price_per_kg`.

---

## ✅ Pengujian (Unit Test)

Logika perhitungan inti (gacong, konversi GKP→GKG, nisab, dan kalkulasi zakat) diuji menggunakan **Node.js built-in test runner** (`node:test`) dengan `tsx`:

```bash
npm test
```

Berjalan pada `src/utils/zakat.test.ts` dan mencakup 25 skenario, termasuk uji batas nisab (653 kg GKG) dan skenario alur lengkap panen dengan biaya gacong.

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
