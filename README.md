# 📽️ Budgeting Produksi

Aplikasi web untuk rekapitulasi perencanaan dan budgeting tugas bulanan produksi konten video di channel rumaysho.com.

## 🚀 Cara Menjalankan Lokal

### Prasyarat
- Node.js v18 atau lebih baru
- npm atau yarn

### Instalasi & Jalankan

```bash
# 1. Install dependencies
npm install

# 2. Jalankan development server
npm run dev

# 3. Buka browser ke:
# http://localhost:5173
```

### Build untuk Production

```bash
npm run build
# Output siap deploy ada di folder /dist
```

### Preview Build

```bash
npm run preview
```

---

## 📁 Struktur Folder

```
budgeting-produksi/
├── index.html          # Entry point HTML
├── vite.config.js      # Konfigurasi Vite
├── package.json
├── .gitignore
└── src/
    ├── main.jsx        # Bootstrap React
    ├── App.jsx         # Komponen utama (semua logic ada di sini)
    └── index.css       # Global styles
```

---

## 🔐 Login Admin

Default PIN: **1234**

Untuk mengubah PIN, edit variabel `ADMIN_PASSCODE` di `src/App.jsx` baris pertama constants.

---

## ☁️ Sinkronisasi Google Sheets (Opsional)

Aplikasi ini mendukung sinkronisasi data via Google Apps Script.

1. Buat Google Apps Script baru dengan endpoint yang menerima `action=pull` (GET) dan `action=push` (POST)
2. Deploy sebagai Web App
3. Simpan URL-nya di localStorage browser dengan key `tracker_gs_url`:
   ```js
   localStorage.setItem('tracker_gs_url', 'https://script.google.com/macros/s/...')
   ```

Tanpa konfigurasi GS, aplikasi tetap berjalan normal menggunakan **localStorage** browser.

---

## 🌐 Deploy ke GitHub Pages

```bash
# 1. Build
npm run build

# 2. Push folder /dist ke branch gh-pages
# (atau gunakan plugin vite-plugin-gh-pages)
```

Atau deploy ke **Netlify / Vercel** — cukup drag & drop folder `/dist`.

---

## ⚙️ Konfigurasi

Edit konstanta di bagian atas `src/App.jsx`:

| Konstanta       | Default     | Keterangan                     |
|-----------------|-------------|--------------------------------|
| `ADMIN_PASSCODE`| `"1234"`    | PIN login admin                |
| `BASE_SALARY`   | `3000000`   | Gaji pokok tetap (Rp)          |
| `DEFAULT_GS_URL`| (url GAS)   | URL Google Apps Script default |
