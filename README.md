# Justa Premium Email

Aplikasi web email pribadi yang memungkinkan pengguna untuk melindungi alamat email dengan kata sandi dan memeriksa kotak masuk yang terhubung ke akun Gmail pusat melalui perutean email Cloudflare.

![Tampilan Aplikasi](https://i.imgur.com/8aZz4Jc.png)

---

## Fitur Utama

-   **Proteksi Email:** Pengguna dapat "mendaftarkan" atau melindungi alamat email dengan kata sandi.
-   **Pemeriksaan Kotak Masuk Aman:** Hanya pengguna yang mengetahui kata sandi yang benar yang dapat melihat isi kotak masuk.
-   **Dukungan Multi-Domain:** Mudah untuk menambahkan beberapa pilihan domain melalui dropdown.
-   **Tampilan Email HTML:** Menampilkan konten email dalam format HTML yang kaya, mirip dengan klien email modern.
-   **Backend Aman:** Menggunakan enkripsi `bcrypt` untuk kata sandi dan siap untuk deployment dengan *Environment Variables*.

---

## Teknologi yang Digunakan

-   **Frontend:** HTML, JavaScript, [Tailwind CSS](https://tailwindcss.com/)
-   **Backend:** [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)
-   **Database:** [Google Firestore](https://firebase.google.com/docs/firestore) untuk menyimpan kredensial pengguna.
-   **Otentikasi & API:** [Google API (Gmail API)](https://developers.google.com/gmail/api) untuk membaca email.
-   **Infrastruktur Tambahan:**
    -   [Cloudflare Email Routing](https://www.cloudflare.com/products/email-routing/) untuk meneruskan email ke akun penampungan.

---

## Prasyarat

Sebelum menjalankan proyek ini secara lokal, pastikan Anda memiliki:
1.  [Node.js](https://nodejs.org/en/download/) (versi 16 atau lebih baru).
2.  Akun Google (Gmail) yang akan digunakan sebagai penampung email.
3.  Domain yang dikonfigurasi dengan Cloudflare Email Routing.
4.  Proyek di [Google Cloud Console](https://console.cloud.google.com/) dengan **Gmail API** yang sudah diaktifkan.
5.  Proyek di [Firebase](https://console.firebase.google.com/) dengan **Firestore Database** yang sudah dibuat.

---

## Instalasi dan Menjalankan Lokal

### 1. Backend (`temp-email-backend`)

a. **Navigasi ke folder backend:**
```bash
cd temp-email-backend

b. Install semua dependensi:

npm install

c. Setup Kunci API Google:

Ikuti panduan di Google Cloud Console untuk membuat kredensial OAuth 2.0 Client ID dengan tipe "Desktop app".

Download file JSON yang dihasilkan, ganti namanya menjadi credentials.json, dan letakkan di dalam folder temp-email-backend.

d. Lakukan Otorisasi Awal:

Jalankan script otorisasi sekali untuk menghasilkan token.json. Script ini akan membuka browser Anda untuk meminta izin.

node authorize.js

Setelah berhasil, file token.json akan dibuat.

e. Jalankan Server Backend:

node index.js

Server akan berjalan di http://localhost:3001.

2. Frontend (index.html)
Tidak perlu instalasi khusus.

Cukup buka file index.html yang ada di folder utama proyek dengan browser web Anda.

Frontend secara otomatis akan mencoba terhubung ke server backend di http://localhost:3001.

Rencana Deployment
Proyek ini dirancang untuk di-deploy secara terpisah (frontend dan backend) untuk skalabilitas dan pengelolaan yang lebih baik.

Backend (Render.com):

Kode di temp-email-backend di-deploy sebagai "Web Service" di Render.

PENTING: Informasi rahasia tidak di-upload ke GitHub. Anda harus mengaturnya sebagai Environment Variables di dashboard Render:

FIREBASE_CONFIG_JSON: Salin seluruh isi objek firebaseConfig dari index.js sebagai satu baris teks.

CREDENTIALS_JSON: Salin seluruh isi file credentials.json sebagai satu baris teks.

TOKEN_JSON: Salin seluruh isi file token.json sebagai satu baris teks.

Frontend (Vercel.com):

Hubungkan repositori GitHub Anda ke Vercel.

Vercel akan secara otomatis mendeteksi index.html dan men-deploy-nya.

PENTING: Jangan lupa untuk mengubah variabel API_URL di dalam index.html dari http://localhost:3001 menjadi URL backend Anda yang ada di Render.

Struktur File
/
├── temp-email-backend/       # Folder untuk semua kode backend
│   ├── node_modules/         # Dependensi backend
│   ├── authorize.js          # Script untuk otorisasi awal Gmail
│   ├── credentials.json      # (RAHASIA - Jangan di-commit) Kunci dari Google Cloud
│   ├── index.js              # File server utama
│   ├── package.json
│   └── token.json            # (RAHASIA - Jangan di-commit) Token izin Gmail
│
├── .gitignore                # Mengabaikan file rahasia dan node_modules
├── index.html                # File utama untuk frontend/tampilan
└── README.md                 # Dokumentasi ini
