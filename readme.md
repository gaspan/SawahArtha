# SawahArtha 🌾
> **Aplikasi Manajemen Permodalan & Produktivitas Hasil Tani Padi**

SawahArtha adalah aplikasi mobile berbasis Android yang dirancang khusus untuk membantu para petani padi mengelola siklus operasional, pencatatan keuangan (modal & pendapatan), analisis produktivitas lahan, hingga perhitungan kewajiban zakat hasil tani secara terstruktur per musim tanam.

---

## 🚀 Teknologi Utama

Aplikasi ini dibangun menggunakan tumpukan teknologi modern untuk memastikan stabilitas di lapangan tanpa koneksi internet (*Offline-First*):

*   **Framework Core:** React Native (Expo SDK 56)
*   **Bahasa Pemrograman:** TypeScript (Type-Safe & Clean Code)
*   **Database Lokal:** SQLite via `expo-sqlite` (dilengkapi dengan WAL mode untuk performa transaksi cepat)
*   **Visualisasi Data:** `react-native-chart-kit` & `react-native-svg` (grafik interaktif dan responsif)
*   **Manajemen Status:** React Context API (untuk sinkronisasi data musim tanam global)

---

## ✨ Fitur Utama

### 1. Manajemen Musim Tanam Dinamis (Data Isolation)
Semua pencatatan pengeluaran dan pendapatan dikelompokkan berdasarkan kode musim tanam (misalnya: `MT-2026-1`). Anda dapat membuat musim baru melalui tombol **"Mulai Musim Tanam Baru"**, yang secara otomatis menonaktifkan musim lama dan membuka lembaran baru tanpa menghapus riwayat data musim-musim sebelumnya di database SQLite.

### 2. Analisis Keuangan & KPI Produktivitas Lahan
*   **ROI / Profit Margin (%)**: Menampilkan persentase laba bersih terhadap total pengeluaran modal (teks hijau untuk untung, merah untuk rugi).
*   **Harga Pokok Produksi (HPP/kg)**: Menghitung batas minimal harga jual gabah kering panen agar modal awal kembali (Break-Even Point).
*   **Produktivitas Lahan**: Mengukur tingkat efisiensi tani dalam satuan **Kuintal/Ha** dan **Ton/Ha** menggunakan ukuran luas lahan riil ($m^2$).
*   **Edit Luas Lahan Inline**: Ukuran luas lahan dapat diedit langsung pada dashboard secara dinamis untuk memperbarui kalkulasi produktivitas secara instan.

### 3. Grafik Pengeluaran & Pendapatan Visual
*   **Donut Chart**: Grafik perbandingan persentase total modal keluar dibandingkan total omzet pendapatan hasil panen.
*   **Bar Chart Kategori**: Visualisasi pengeluaran modal berdasarkan 8 kategori tani khusus: *Pupuk, Insektisida, Fungisida, Rodentisida, Herbisida, Moluksida, Jasa Pegawai,* dan *Item Barang*.

### 4. Ekspor Backup Data (CSV)
Aplikasi mendukung kepatuhan data safety dengan menyediakan tombol ekspor data. Seluruh rekaman pengeluaran dan pemasukan akan dikonversi menjadi file format CSV standar secara lokal, lalu memicu *Native Android Share Sheet* untuk dibackup ke Google Drive, WhatsApp, atau Email.

### 5. Kalkulator Zakat Hasil Tani Otomatis
Mengalkulasi kewajiban zakat pertanian secara otomatis:
*   Mendukung konversi otomatis dari Gabah Kering Panen (GKP) ke Gabah Kering Giling (GKG) dengan rasio penyusutan standar 85%.
*   Validasi otomatis terhadap batas minimal kewajiban zakat (Nisab pertanian sebesar $653 \text{ kg GKG}$).
*   Penerapan kadar zakat sebesar 5% (untuk sistem pengairan berbayar/irigasi pompa).

---

## 🗄️ Arsitektur Database (SQLite Schema)

Database SQLite lokal didefinisikan dengan tiga tabel utama:

```sql
-- 1. Tabel Musim Tanam
CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_code TEXT UNIQUE NOT NULL,
  land_size_m2 REAL,
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
  price_per_kg REAL DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  season_code TEXT NOT NULL,
  date TEXT NOT NULL
);
```

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
