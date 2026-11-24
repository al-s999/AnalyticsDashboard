# Product Requirements Document (PRD) - Version 2.0
## GameForSmart - AnalyticsDashboard (Educational Intelligence & Monitoring Platform)

**Document Version:** 2.0 (V2 - Expanded Architecture & AI Model Specs)  
**Product Name:** GameForSmart AnalyticsDashboard  
**Platform:** Web Application (Responsive Desktop & Tablet-First)  
**Author / Team:** GameForSmart Product & AI Engineering Team  
**Status:** Approved - Active Implementation (Part 1, Part 2, Part 3 Live)  
**Target Release:** Q1 2027  
**Classification:** Internal & Educational Stakeholder Document  

---

## 1. Executive Summary

### 1.1 Latar Belakang
Platform **GameForSmart** telah berhasil menghadirkan lingkungan belajar gamifikasi kuis yang interaktif bagi siswa di seluruh Indonesia (`gameforsmartNewUI` dan `admin_dashboard`). Setiap sesi interaksi siswa menghasilkan jejak data (*learning traces*) yang sangat kaya: histori akurasi jawaban, waktu respon (*response latency*), butir soal yang ditaklukkan, frekuensi repetisi, serta tingkat kesulitan materi.

Meskipun demikian, data berharga tersebut selama ini masih terisolasi di sisi operasional game:
- **Guru Pengampu** kesulitan memetakan siswa mana yang belum menguasai indikator pembelajaran spesifik dan membutuhkan bimbingan remedial personal.
- **Pengelola Satuan Pendidikan (Kepala Sekolah)** tidak memiliki instrumen objektif berbasis bukti untuk membandingkan performa akademik antarkelas (*classroom benchmark*) serta audit capaian kurikulum.
- **Dinas Pendidikan (Kab/Kota, Provinsi, dan Nasional)** kekurangan data real-time berbasis bukti (*evidence-based policy*) untuk melihat sekolah mana yang telah melampaui target kompetensi nasional atau yang memerlukan intervensi bantuan pembinaan kurikulum.

**GameForSmart AnalyticsDashboard (V2.0)** hadir sebagai solusi intelijen pendidikan (*Educational Intelligence System*) yang mengolah big data interaksi kuis menjadi wawasan komprehensif melalui tiga pilar analitik terintegrasi: **Deskriptif**, **Prediktif**, dan **Preskriptif**.

---

## 2. Tujuan Produk & Indikator Keberhasilan (KPI)

### 2.1 Tujuan Utama
1. **Analisa Kemampuan Siswa Multi-Dimensi (Deskriptif):** Memberikan gambaran komprehensif mengenai profil penguasaan topik dan Kompetensi Dasar (KD) per siswa, per kelas, dan per sekolah.
2. **Estimasi Kesiapan Ujian Deterministik (Prediktif):** Menghitung estimasi skor ujian akhir/nasional siswa (skala 0–100) dan klasifikasi kesiapan (*Readiness Index*) tanpa halusinasi angka.
3. **Penyembuhan Kesenjangan Belajar Terarah (Preskriptif):** Mengidentifikasi materi belum tuntas (*learning gap*) dan menghasilkan rekomendasi narasi remedial pedagogis otomatis.
4. **Sentralisasi Hierarki Pendidikan Berbasis NPSN:** Menghubungkan guru, kepala sekolah, hingga dinas pendidikan nasional menggunakan data resmi Dapodik Kemendikbudristek.
5. **Aksi Nyata Pengajaran & Pemantauan:** Kanal penugasan kuis (*Task Assignment*) dari guru langsung ke murid dengan live tracking progres pengerjaan real-time.

### 2.2 Indikator Keberhasilan (KPI)
- **Akurasi Prediksi Ujian:** Korelasi hasil prediksi skor dengan capaian riil siswa mencapai $\ge 85\%$.
- **Adopsi Guru:** Guru aktif membuat grup pengawasan dan memberikan minimal 2 penugasan per bulan $\ge 70\%$.
- **Kecepatan Akses Analitik:** Waktu load dasbor analitik cached $< 1.5$ detik; waktu pemrosesan analitik batch $< 15$ detik dengan live progress feedback.
- **Cakupan Sekolah:** Terkoneksi dengan 400.000+ data NPSN nasional untuk pemetaan otomatis di tingkat daerah.

---

## 3. Matriks Peran Pengguna & Batasan Akses (Multi-Scope RBAC)

Sistem menerapkan kontrol akses berbasis peran (*Role-Based Access Control*) dengan 5 tingkat hierarki:

| Peran Pengguna (*Role*) | Cakupan Akses (*Scope*) | Fokus Tanggung Jawab Utama | Rute Utama (*Home Route*) |
| :--- | :--- | :--- | :--- |
| **Guru Pengampu** (`guru`) | Kelas/Grup yang diampu dalam satu sekolah. | Monitoring siswa binaan, pembentukan grup (via username/QR), penugasan task reguler & remedial, serta analisis kemampuan per butir KD. | `/dashboard/teacher` |
| **Pengelola Sekolah** (`pengelola_sekolah`) | Seluruh kelas, jenjang, dan rombel di sekolah (NPSN terkunci). | Monitoring seluruh rombel, benchmark performa antarkelas (*leaderboard*), audit capaian kurikulum sekolah, dan kesiapan ujian sekolah. | `/dashboard/school` |
| **Dinas Kab/Kota** (`dinas_kabkota`) | Seluruh sekolah dalam yurisdiksi kabupaten/kota. | Pemetaan mutu wilayah kab/kota, identifikasi sekolah unggulan vs sekolah butuh intervensi kurikulum, dan pengawasan kesiapan ujian daerah. | `/dashboard/dinas` |
| **Dinas Provinsi** (`dinas_provinsi`) | Seluruh kab/kota di bawah provinsi bersangkutan. | Agregasi kesenjangan mutu antarkabupaten/kota, alokasi program pemerataan mutu, dan pemantauan standar kelulusan provinsi. | `/dashboard/dinas` |
| **Dinas Nasional** (`dinas_nasional`) | Makro agregat 38 provinsi di Indonesia. | Pemetaan standar kompetensi nasional, benchmarking mutu antarprovinsi, dan kebijakan kurikulum berbasis data makro. | `/dashboard/dinas` |

---

## 4. Spesifikasi Fungsional: 3 Pilar Analitik Pendidikan

### 4.1 Pilar 1: Analisis Deskriptif (Kemampuan Siswa)
- **Penguasaan per Domain Kompetensi:** Menghitung persentase ketuntasan per topik materi (contoh Matematika: Aljabar, Eksponen & Akar, Trigonometri, Pertidaksamaan Rasional, Statistika).
- **Distribusi Akurasi & Kecepatan:** Menganalisis perbandingan akurasi jawaban benar/salah terhadap waktu respon rata-rata per soal.
- **Diagnosis Kekuatan & Kelemahan:** Menghasilkan ringkasan otomatis butir materi yang sudah dikuasai vs materi yang menjadi kendala utama kelas.

### 4.2 Pilar 2: Analisis Prediktif (Estimasi Skor & Kesiapan Ujian)
- **Estimasi Skor Ujian Kontinu (0–100):** Proyeksi nilai riil yang akan diraih siswa pada ujian semester atau asesmen nasional berbasis bobot reliabilitas pengerjaan kuis.
- **Rentang Kepercayaan (*Confidence Interval*):** Menampilkan batas estimasi bawah dan atas (contoh: $78.6 \pm 4.4$).
- **Indeks & Distribusi Kesiapan Ujian:** Klasifikasi siswa ke dalam 4 kategori:
  1. *Sangat Siap* (Skor $\ge 85$, 0 gap materi kritis)
  2. *Siap* (Skor 75–84, $\le 1$ gap materi minor)
  3. *Perlu Pendampingan* (Skor 60–74, 2–3 gap materi)
  4. *Kritis* (Skor $< 60$, $> 3$ gap materi fundamental)
- **Trend Historis:** Indikator kenaikan/penurunan ($\uparrow / \downarrow$) performa dibanding periode evaluasi sebelumnya.

### 4.3 Pilar 3: Analisis Preskriptif (Materi Belum Tuntas & Auto-Remedial)
- **Deteksi Gap Pembelajaran:** Menemukan topik atau indikator KD dengan rata-rata skor $< 75$ (KKM).
- **Rekomendasi Paket Remedial Terarah:** Menghasilkan saran kuis remedial spesifik dari katalog GameForSmart sesuai subtopik prasyarat yang belum dikuasai siswa.
- **Penugasan Cepat (*One-Click Remedial*):** Guru dapat langsung mengirimkan penugasan remedial ke kelompok siswa yang terindikasi membutuhkan bantuan khusus.

---

## 5. Manajemen Grup & Onboarding Siswa (Dual-Method)

Guru dapat membuat grup pengawasan kelas (Nama Kelas, Jenjang [SD/SMP/SMA/SMK], Tingkat, Mata Pelajaran, Tahun Ajaran) dan mendaftarkan siswa menggunakan 2 metode fleksibel:

### 5.1 Metode A: Ketik Username Siswa
- Input pencarian berbasis *debounce* (300ms) ke endpoint `/api/students/search?q=...`.
- Menampilkan kartu profil lengkap: Avatar, Nama Lengkap, `@username`, Tingkat Kelas, Level & XP GameForSmart, serta estimasi skor ujian.
- Tombol satu klik *"Tambahkan ke Grup"* dengan proteksi pencegahan duplikasi siswa.

### 5.2 Metode B: Pemindai QR Code Kamera Live
- **Live Camera Scanner:** Menggunakan pustaka industri `html5-qrcode` dengan overlay viewfinder target beranimasi.
- **Kompatibilitas QR GameForSmart:** Mendukung pemindaian QR code profil yang dihasilkan dari modal profil murid GameForSmart (`/profile/[username]`, URI `gameforsmart://`, JSON, atau teks username).
- **Upload File Foto QR:** Fitur unggah gambar QR bila komputer guru tidak memiliki perangkat kamera webcam.
- **Simulasi Pengujian Cepat:** Tombol chip simulasi QR murid langsung untuk kemudahan demonstrasi dan pengetesan sistem.

---

## 6. Modul Task & Monitoring Progres Guru

Platform memfasilitasi siklus evaluasi pengajaran secara menyeluruh:
- **Pembuatan Penugasan Baru:** Guru memilih kuis GameForSmart, menetapkan batas waktu pengerjaan (*deadline*), KKM kelulusan (default 75), dan memilih tipe penugasan:
  - *Reguler:* Diberikan ke seluruh siswa di dalam grup kelas.
  - *Preskriptif Remedial:* Otomatis ditargetkan hanya kepada siswa yang belum tuntas pada materi bersangkutan.
- **Live Progress Monitoring:** Menampilkan *progress bar* agregat kelas, rincian status per siswa (`Belum Mulai`, `Sedang Dikerjakan`, `Selesai - Tuntas`, `Selesai - Perlu Remedial`), skor perolehan, waktu pengumpulan, dan durasi pengerjaan.
- **Evaluasi Capaian Siswa:** Dialog interaktif evaluasi per butir indikator kompetensi siswa dan opsi pengiriman paket remedial instan.

---

## 7. Arsitektur Model Analitik AI/ML (Pendekatan Hybrid 2-Tier Engine)

Berdasarkan analisis kebutuhan data edukasi, sistem **TIDAK melatih LLM raksasa dari awal (*from scratch*)**, melainkan mengadopsi **Pendekatan Hybrid 2-Tier Engine**:

```
[DATA KUIS & HISTORI SISWA: game_sessions, learn_sessions, response_latency]
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
 [TIER 1: ML TABULAR DARI AWAL]          [TIER 2: GENERATIVE LLM]
 (LightGBM / XGBoost / Knowledge Tracing) (Gemini Flash / LoRA LLaMA-3-8B)
 • Melatih model dari awal dengan data   • Prompt Engineering + JSON Output
   tabular kuis GameForSmart.              terstruktur berbasis Kurikulum Merdeka.
 • Menghitung: Akurasi, Estimasi Skor    • Menghasilkan: Diagnosis pedagogis,
   Ujian (0-100), dan Kategori Kesiapan.   narasi evaluasi guru, dan rekomendasi
 • Inferensi super cepat (< 5 milidetik).  paket remedial terarah.
 • 100% Deterministik (Bebas Halusinasi) • Berjalan hanya saat narasi dibutuhkan.
          │                                       │
          └───────────────────┬───────────────────┘
                              │
                              ▼
            [API GATEWAY: /api/analytics/trigger]
            [STORAGE: JSON Snapshot + Midnight Cron]
```

### 7.1 Mengapa Bukan LLM dari Nol (*From Scratch*)?
1. **Biaya & Sumber Daya:** Melatih LLM dari awal membutuhkan miliaran rupiah dan komputasi superkomputer yang tidak efisien untuk kalkulasi data tabular kuis.
2. **Kerapuhan Halusinasi Angka:** LLM terkenal memiliki kelemahan matematis (*hallucination*) jika disuruh memprediksi skor kontinu angka desimal persis.
3. **Efisiensi Inferensi:** Model ML tabular (XGBoost/LightGBM) dapat mengeksekusi inferensi skor 1.000 siswa dalam hitungan milidetik di CPU biasa tanpa GPU server mahal.

### 7.2 Struktur JSON Snapshot & Automasi Cron 00:00 WIB
- Hasil analitik disimpan dalam format **JSON Snapshot** yang mencakup ringkasan deskriptif, prediktif, dan preskriptif.
- **Live Progress Feedback:** Tombol *"Perbarui Analisa"* menampilkan *progress bar* visual (0–100%) dan mencatat timestamp pembaruan terakhir.
- **Midnight Auto-Cron (00:00 WIB):** Endpoint `/api/analytics/cron` menjalankan pembaruan otomatis setiap jam 12 dini hari untuk menyegarkan snapshot seluruh sekolah tanpa membebani jam operasional sekolah.

---

## 8. Sumber Data Master Sekolah Indonesia (API Dapodik Kemendikbud)

Untuk mengatasi ketiadaan master data sekolah nasional, sistem mengintegrasikan **Gateway API Sekolah Indonesia (Dapodik Kemendikbudristek)** dengan arsitektur **Hybrid Dual-Layer**:

```
[UI Input / Selector: Pencarian Nama atau 8 Digit NPSN]
                     │
                     ▼
       [API Route: /api/schools/search]
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
[Layer 1: Online Gateway]   [Layer 2: Local Database Cache]
api-sekolah-indonesia       PostgreSQL public.schools (pg_trgm)
• Menjangkau 400.000+ data  • Index Trigram GIN (< 30ms latency)
  sekolah Dapodik terbaru.  • B-Tree index pada kolom npsn
• 38 Provinsi, 514 Kota     • Fallback lokal jika internet down
```

### 8.1 Kelengkapan Data Satuan Pendidikan
- **Identitas Satuan:** NPSN 8-digit unik, Nama Resmi, Jenjang (`SD`, `SMP`, `SMA`, `SMK`, `SLB`, `PAUD`), dan Status (`Negeri` / `Swasta`).
- **Hierarki Wilayah Administrasi:** Kode & Nama Provinsi, Kode & Nama Kabupaten/Kota, Kode & Nama Kecamatan.
- **Geospasial GIS:** Titik koordinat Lintang (*Latitude*) dan Bujur (*Longitude*) untuk visualisasi peta mutu wilayah pada dashboard dinas.
- **Kualitas:** Status Akreditasi (`A`, `B`, `C`) dan status verifikasi resmi Dapodik.

---

## 9. Dashboard Pengelola Sekolah & Dinas Pendidikan Multi-Scope

### 9.1 Dashboard Pengelola Sekolah (Kepala Sekolah)
- **Ringkasan Mutu Sekolah:** Profil NPSN, total rombel, ketuntasan kurikulum semester, dan kesiapan ujian sekolah.
- **Benchmark Antarkelas (`/dashboard/school/benchmark`):** Leaderboard performa komparatif seluruh kelas (Kelas 10, 11, 12) untuk supervisi kepala sekolah.
- **Ketuntasan Kompetensi (`/dashboard/school/competencies`):** Audit pencapaian target Kompetensi Dasar (KD) per mata pelajaran.

### 9.2 Dashboard Dinas Pendidikan Multi-Scope
- **Peta Mutu Wilayah (`/dashboard/dinas`):** Agregasi sekolah yang mencapai target kelulusan vs sekolah butuh pembinaan.
- **Direktori Satuan Pendidikan (`/dashboard/dinas/schools`):** Filter sekolah berdasarkan wilayah, jenjang, dan status kepemilikan.
- **Kesiapan Ujian Wilayah (`/dashboard/dinas/readiness`):**
  - *Kategori Unggulan:* Rata-rata skor $> 85$, siap seleksi PTN / olimpiade.
  - *Kategori Mandiri:* Rata-rata skor 75–84, ketuntasan aman.
  - *Kategori Prioritas Intervensi:* Rata-rata skor $< 75$, dilengkapi tombol *"Kirim Supervisi Dinas"* untuk intervensi kurikulum terarah.

---

## 10. Non-Functional Requirements (NFR)

| Aspek | Spesifikasi Teknis | Standar Pengujian |
| :--- | :--- | :--- |
| **Response Time UI** | $< 1.2$ detik pada interaksi halaman, $< 50$ milidetik pada pencarian cache NPSN lokal. | Lighthouse Performance Score $\ge 90$. |
| **Keamanan & RBAC** | Row Level Security (RLS) PostgreSQL pada Supabase; pemisahan session cookie per role. | Uji penetrasi otorisasi lintas scope. |
| **Skalabilitas Data** | Mampu melayani query agregasi 100.000+ data pengerjaan kuis tanpa degradasi performa. | Trigram Indexing `pg_trgm` & JSON Snapshot Caching. |
| **Ketahanan Layanan** | *Zero-Downtime Fallback*: Sistem tetap berfungsi normal menampilkan data curated saat gateway API eksternal offline. | Simulasi network blackout gateway API. |

---

## 11. Roadmap Implementasi Produk

```
[PART 1: SELESAI]  -->  [PART 2: SELESAI]  -->  [PART 3: SELESAI]  -->  [PART 4: NEXT PHASE]
• Role & Scope RBAC     • API Dapodik NPSN      • School Benchmark      • Training Model XGBoost
• Auth & Login Flow     • QR Profil Scanner     • Dinas Readiness       • Integrasi API Microservice
• Unified App Shell     • Teacher Groups & Task • Midnight Auto-Cron    • Piloting Sekolah Binaan
```

---

*Dokumen ini merupakan spesifikasi resmi V2.0 yang menjadi acuan arsitektur pengembangan dan integrasi platform GameForSmart AnalyticsDashboard.*

