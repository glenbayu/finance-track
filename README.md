<div align="center">

# 💰 Finance Journal

### *Personal Wealth, Smart Allocation & Cashflow Manager*

Aplikasi manajemen keuangan pribadi modern berkonsep **Wealth & Allocation Management**. Dirancang bukan sekadar mencatat uang masuk dan keluar, tetapi membantu Anda memantau saldo riil berdasarkan sebaran dompet fisik, bank, dan piutang, serta mengontrol arus kas bulanan dengan sistem **Auto-Rollover** yang akurat.

---

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-0ea5e9?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## 🌟 Fitur Unggulan (Key Features)

### 1. 💼 Multi-Wallet & Smart Allocation
- **3 Kategori Dompet Utama:** Pantau saldo Anda secara terpisah di **Cash on Hand** (Uang Tunai), **Bank & E-Wallet** (BCA, Mandiri, GoPay, OVO), dan **Saldo Tertahan** (Piutang / Titipan).
- **One-Click Transfer (Pindah Saldo):** Transfer antar-dompet tidak tercatat sebagai pengeluaran/pemasukan, sehingga grafik *cash flow* bulanan tetap suci dan akurat.
- **Koreksi Saldo Cepat:** Sesuaikan saldo fisik kapan pun tanpa merusak riwayat transaksi pengeluaran.

### 2. 🔄 Automatic Monthly Rollover
- **Sisa Saldo Otomatis Pindah:** Berapa pun sisa saldo di akhir bulan, sistem otomatis memindahkannya ke tanggal 1 bulan berikutnya sebagai transaksi *"Pemasukan: Sisa uang bulan kemarin (Rollover)"*.
- **Auto Admin Fee:** Opsi pemotongan biaya admin bank secara otomatis di setiap akhir bulan untuk rekening yang ditentukan.

### 3. 📊 Dasbor Analitik & Visualisasi Arus Kas
- **Status Finansial Real-time:** Pantau status bulan berjalan apakah sedang *Surplus* atau *Defisit*.
- **Grafik Interaktif (Recharts):** Visualisasi *Pie Chart* pengeluaran per kategori dan tren pengeluaran bulanan (*Monthly Trend*).
- **Riwayat Bulanan:** Komparasi pemasukan, pengeluaran, dan net cashflow beberapa bulan terakhir.

### 4. 🎯 Anggaran & Batas Pengeluaran (Budgets)
- Tetapkan limit anggaran bulanan untuk setiap kategori pengeluaran (misal: *Makan & Minum*, *Transportasi*, *Belanja*).
- Indikator progres dinamis dengan kode warna visual: **Aman (Hijau)**, **Peringatan (Kuning)**, dan **Overbudget (Merah)**.

### 5. ⚡ Quick Add & Template Cepat
- Buat template pengeluaran harian (misal: *Kopi Pagi Rp 15.000*, *Bensin Rp 30.000*).
- Catat transaksi harian berulang hanya dalam 1 klik dari dashboard utama, lengkap dengan opsi *Undo*.

### 6. 📱 UI Modern, Mobile-First & Privacy Friendly
- **Glassmorphism & Dual Theme:** Tampilan clean minimalis untuk *Light Mode*, dan *OLED Deep Glassmorphism* yang mewah untuk *Dark Mode*.
- **Mobile Swipeable Rows:** Geser baris transaksi ke kiri pada smartphone untuk mengakses tombol aksi *Duplikat* dan *Hapus*.
- **Masked Currency (Privacy Mode):** Tombol intip/sembunyikan nominal saldo untuk kenyamanan saat membuka aplikasi di ruang publik.

---

## 🛠️ Tech Stack & Arsitektur

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (Turbopack)](https://nextjs.org/) | App Router, React Server Components (RSC), Server Actions |
| **UI Library** | [React 19](https://react.dev/) | Concurrent Features, Modern Hooks |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Theme Token Variables, Modern Glassmorphism Utilities |
| **Backend & DB** | [Supabase](https://supabase.com/) | PostgreSQL, Row Level Security (RLS), Supabase SSR Auth |
| **Charts** | [Recharts](https://recharts.org/) | Visualisasi tren dan distribusi kategori pengeluaran |
| **Icons** | [Lucide React](https://lucide.dev/) | Set ikon modern dan konsisten |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict Type Safety |

---

## 🚀 Panduan Instalasi (Getting Started)

Ikuti langkah-langkah di bawah untuk menjalankan **Finance Journal** di komputer lokal Anda:

### 1. Clone Repository
```bash
git clone https://github.com/glenbayu/finance-track.git
cd finance-track
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file bernama `.env.local` (atau salin dari template `.env`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
```

### 4. Setup Database Supabase
Jalankan file migrasi SQL di folder `supabase/migrations/` secara berurutan pada menu **SQL Editor** di Dashboard Supabase Anda:
1. `20260501000000_create_categories.sql` (Tabel kategori pengeluaran & pemasukan beserta archive & timestamp)
2. `20260501010000_create_wallets.sql` (Tabel dompet fisik & rekening bank dengan default auto-rollover)
3. `20260501020000_create_transactions.sql` (Tabel transaksi lengkap dengan foreign key wallet, transfer, koreksi & timestamps)
4. `20260526090000_create_budgets.sql` (Tabel batas anggaran bulanan per kategori)
5. `20260528100000_create_quick_add_templates.sql` (Tabel template cepat transaksi 1-klik)
6. `20260901000000_user_onboarding_trigger.sql` (Trigger auto-setup dompet cash & 10 kategori awal saat user registrasi)

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka browser di **[http://localhost:3000](http://localhost:3000)**.

---

## 📂 Struktur Direktori

```text
finance-track/
├── app/                        # Next.js App Router
│   ├── (app)/                  # Rute berotentikasi (Protected Pages)
│   │   ├── page.tsx            # Dashboard Utama (Ringkasan)
│   │   ├── transactions/       # Daftar & Form Transaksi
│   │   ├── wallets/            # Manajemen Dompet & Saldo
│   │   ├── budgets/            # Manajemen Batas Anggaran
│   │   ├── categories/         # Manajemen Kategori
│   │   ├── reports/            # Laporan Finansial Bulanan
│   │   └── settings/           # Pengaturan & Profil
│   ├── login/                  # Halaman Masuk
│   └── signup/                 # Halaman Daftar Akun Baru
├── components/                 # Komponen Modular Reusable
│   ├── dashboard/              # Komponen widget & grafik dashboard
│   ├── layout/                 # AppShell, DesktopSidebar, MobileDock
│   ├── transactions/           # Komponen tabel, form, dan tombol aksi
│   ├── ui/                     # Primitif UI (Dialog, Modal, MaskedCurrency, dll)
│   └── wallets/                # Komponen manajemen & koreksi saldo dompet
├── lib/                        # Utilitas & Business Logic
│   ├── supabase/               # Client & Server Supabase helpers
│   ├── transactions/           # Logika Rollover, Quick Add, Filter
│   └── utils/                  # Currency formatter, Date parser
└── supabase/                   # Database Migrations (SQL Scripts)
```

---

## 🔒 Keamanan Data & Privasi
- **Row Level Security (RLS):** Seluruh tabel di PostgreSQL dilindungi dengan RLS, memastikan setiap pengguna hanya memiliki akses ke data keuangannya sendiri.
- **Server Actions & CSRF Protected:** Mutasi data divalidasi langsung di sisi server dengan sesi terotentikasi.
- **Zero Third-Party Tracking:** Privasi keuangan pengguna terjaga penuh tanpa script analitik pihak ketiga.

---

<div align="center">
  <sub>Dibangun dengan dedikasi untuk kebebasan dan ketenangan finansial pribadi. 🌿</sub>
</div>