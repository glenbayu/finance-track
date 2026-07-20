# Finance Tracker - Personal Wealth & Allocation Manager
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)

## About The Project

Finance Tracker adalah sebuah aplikasi manajemen keuangan pribadi berkonsep *Wealth & Allocation Manager*. Ini bukan sekadar pencatat uang keluar-masuk biasa. Sistem ini dirancang untuk memisahkan dan memantau saldo pengguna berdasarkan kategori dompet aktual (Kas, E-Wallet, dan Piutang), sehingga Anda dapat melihat sebaran aset finansial secara mutlak (All-Time Balance) namun tetap dapat mengontrol arus kas masuk-keluar bulanan secara akurat tanpa terganggu oleh mutasi saldo.

## Key Features (Fitur Unggulan)

* **Multi-Wallet Management:** Pemisahan dan pemantauan saldo riil secara langsung ke dalam 3 kategori utama: *Cash on Hand*, *Bank & E-Wallet*, dan *Saldo Tertahan / Piutang*.
* **Smart Transfer & Allocation:** Memindahkan uang antar-dompet kini semudah *one-click transfer*. Mutasi tidak akan menggelembungkan laporan Pemasukan & Pengeluaran bulanan Anda, sehingga laporan arus kas (cash flow) tetap suci dan akurat 100%.
* **Receivable Tracking & Quick Settlement:** Punya uang yang nyangkut di teman atau tertahan sebagai deposit? Masukkan sebagai Saldo Tertahan, dan lakukan koreksi / pelunasan saldo kapan pun Anda butuh tanpa merusak statistik grafik pengeluaran Anda!
* **Dynamic Monthly Cashflow:** Dasbor cerdas yang memisahkan antara total kekayaan bersih (Net Worth/Total Semua Saldo) dengan analitik arus kas dinamis khusus untuk bulan yang sedang berjalan.
* **Clean & Responsive UI/UX:** Antarmuka bergaya *glassmorphism* modern dengan palet warna *cream-green minimalis*. Super responsif, terasa seperti aplikasi native yang mulus, baik saat diakses via Desktop maupun layar sempit *Mobile*.

## Tech Stack

| Teknologi | Peran / Deskripsi |
| --- | --- |
| **Next.js** | Framework React utama untuk rendering (Server Components & SSR) dan rute API. |
| **React** | Library UI utama. |
| **Tailwind CSS** | Styling utility-first untuk pembuatan UI responsif yang super cepat. |
| **Supabase** | Backend-as-a-Service (PostgreSQL Database & Authentication). |
| **TypeScript** | Static typing untuk meminimalisasi *bugs* pada JavaScript. |
| **Lucide React** | Koleksi ikon elegan dan modern. |

## Getting Started / Installation

Ikuti langkah-langkah mudah di bawah ini untuk menjalankan *Finance Tracker* secara lokal di perangkat Anda:

### 1. Clone Repository
```bash
git clone https://github.com/username/finance-track.git
cd finance-track
```

### 2. Install Dependencies
```bash
npm install
# atau
yarn install
```

### 3. Setup Environment Variables
Buat file bernama `.env.local` di *root directory* project Anda, lalu masukkan kredensial dari project Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
```

### 4. Setup Database
Jalankan file *migrations* yang berada di dalam folder `supabase/migrations/` ke SQL Editor di *Dashboard* Supabase Anda untuk membangun struktur tabel, relasi, dan fungsi-fungsi yang diperlukan.

### 5. Jalankan Development Server
```bash
npm run dev
# atau
yarn dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

## 📂 Folder Structure

```text
finance-track/
├── app/               # Next.js App Router (Pages, Layouts, API Routes)
├── components/        # Reusable React components (UI, Transactions, Wallets, dll)
├── lib/               # Utility functions (formatters, Supabase client auth)
├── public/            # Static assets (images, icons)
├── supabase/          # Script Database Migrations (SQL)
└── package.json       # Dependencies list & Project Config
```