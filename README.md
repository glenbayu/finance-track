# Finance Track

Finance Track adalah aplikasi manajemen keuangan pribadi untuk mencatat transaksi, memantau saldo berdasarkan wallet, mengelola anggaran, dan melihat ringkasan arus kas.

Aplikasi ini menggunakan Next.js App Router dan Supabase. Operasi finansial penting divalidasi di sisi server dan data pengguna dipisahkan melalui autentikasi serta Row Level Security (RLS).

## Fitur utama

- Manajemen wallet untuk uang tunai, rekening bank, dan e-wallet.
- Transaksi income, expense, transfer antar-wallet, dan balance adjustment.
- Kategori transaksi dengan validasi tipe dan status archive.
- Budget bulanan berdasarkan kategori.
- Quick-add templates untuk transaksi berulang.
- Monthly rollover untuk memindahkan saldo ke periode berikutnya.
- Admin fee pada wallet yang dikonfigurasi.
- Dashboard, laporan bulanan, tren pengeluaran, dan forecast.
- Mode penyamaran nominal untuk menjaga privasi saat aplikasi digunakan di tempat umum.
- Tampilan responsif dan dukungan Progressive Web App (PWA).
- Perhitungan business date menggunakan timezone `Asia/Jakarta`.

## Teknologi

| Area | Teknologi |
| --- | --- |
| Framework | Next.js 16.4.3 dengan App Router |
| UI | React 19 dan Tailwind CSS 4 |
| Bahasa | TypeScript |
| Backend dan database | Supabase, PostgreSQL, dan Supabase SSR |
| Visualisasi | Recharts |
| Ikon | Lucide React |
| Testing | Node.js built-in test runner |

## Persyaratan

- Node.js 22 atau versi yang kompatibel dengan Next.js 16.
- npm.
- Project Supabase untuk development.

Gunakan project Supabase non-production untuk pengembangan dan pengujian.

## Menjalankan project secara lokal

### 1. Clone repository

```bash
git clone https://github.com/glenbayu/finance-track.git
cd finance-track
```

### 2. Install dependency

```bash
npm ci
```

Gunakan `npm install` jika lockfile perlu diperbarui secara sengaja.

### 3. Konfigurasi environment

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Jangan memasukkan service-role key atau credential production ke source code, repository, maupun log.

### 4. Terapkan database migration

Jalankan migration di `supabase/migrations/` secara berurutan berdasarkan nama file pada project Supabase development. Migration mencakup:

1. Schema kategori, wallet, transaksi, budget, dan quick-add template.
2. Onboarding user dan default data.
3. Signed balance adjustment.
4. Atomic monthly rollover.
5. Ownership validation untuk related finance records.
6. Penguatan privilege dan `search_path` pada database function.

Migration dapat dijalankan melalui Supabase CLI atau SQL Editor. Jangan menjalankannya pada database production tanpa prosedur backup dan persetujuan yang sesuai.

### 5. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Perintah development

```bash
npm run dev                         # Development server
npm run lint                        # ESLint
npm run typecheck                   # TypeScript type checking
npm test                            # Unit dan regression tests
npm run build                       # Production build
npm run start                       # Menjalankan hasil production build
npm audit --audit-level=low         # Dependency security audit
```

Test yang tersedia berada di folder `tests/` dan dijalankan oleh script `npm test`. Test tersebut memverifikasi business date, validasi quick-add, serta perhitungan saldo wallet.

## Struktur project

```text
finance-track/
├── app/                 # Route, page, layout, API route, dan server action Next.js
├── components/          # Komponen UI dan fitur yang dapat digunakan kembali
├── hooks/               # React hooks untuk state dan tampilan aplikasi
├── lib/                 # Business logic, Supabase helper, dan utility
├── public/              # Asset PWA, manifest, favicon, dan service worker
├── supabase/migrations/ # Database schema, policy, trigger, dan function
├── tests/               # Unit dan regression tests
├── package.json         # Script dan dependency project
├── package-lock.json    # Lockfile dependency npm
└── tsconfig.json        # Konfigurasi TypeScript
```

## Keamanan dan isolasi data

- Autentikasi menggunakan Supabase Auth dan server-side session helper.
- Akses data dibatasi berdasarkan user ownership.
- RLS, trigger, foreign key, constraint, dan database function digunakan untuk memperkuat integritas data.
- Validasi input finansial dilakukan di server, termasuk validasi wallet, kategori, tanggal, dan tipe transaksi.
- Transfer dan balance adjustment diproses sebagai tipe transaksi khusus agar tidak berubah menjadi income atau expense melalui manipulasi request.
- Data sensitif tidak boleh ditampilkan dalam error response, log, atau commit.

## Kontribusi

Sebelum membuat perubahan:

1. Pastikan perubahan berada pada branch development.
2. Jalankan lint, typecheck, test, dan build yang relevan.
3. Periksa `git diff` dan `git diff --check`.
4. Jangan mengubah atau menguji database production.

Untuk perubahan schema, sertakan migration baru dan regression test yang menjelaskan perilaku yang dilindungi.

## Lisensi

Project ini bersifat privat sesuai konfigurasi `package.json`.
