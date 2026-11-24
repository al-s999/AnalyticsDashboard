#!/usr/bin/env python3
"""
Script to generate GameForSmart AnalyticsDashboard PRD PDF - Version 2.0 (V2)
Formatted to match StarGate - Face Recognition Attendance System PRD.
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# Numbered Canvas for "Halaman X dari Y"
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Running Header (pages after page 1)
        if self._pageNumber > 1:
            self.drawString(45, 842 - 32, "GameForSmart - AnalyticsDashboard | Product Requirements Document (PRD V2.0)")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(45, 842 - 36, 595.25 - 45, 842 - 36)
            
        # Running Footer
        footer_text = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(595.25 - 45, 25, footer_text)
        self.drawString(45, 25, "CONFIDENTIAL - GameForSmart Educational Intelligence Platform (V2.0)")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(45, 35, 595.25 - 45, 35)
        
        self.restoreState()


def build_pdf(output_paths):
    for output_path in output_paths:
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            leftMargin=45,
            rightMargin=45,
            topMargin=45,
            bottomMargin=45
        )

        styles = getSampleStyleSheet()

        # StarGate color palette
        PRIMARY_COLOR = colors.HexColor("#1F4E79")      # StarGate Navy Primary
        SECONDARY_BLUE = colors.HexColor("#2F5597")     # StarGate Subheading Blue
        TEXT_DARK = colors.HexColor("#0F172A")          # Slate 900
        TEXT_MUTED = colors.HexColor("#334155")         # Slate 700
        LINE_COLOR = colors.HexColor("#1F4E79")

        doc_header_style = ParagraphStyle(
            "DocHeader",
            fontName="Helvetica",
            fontSize=12,
            leading=15,
            textColor=SECONDARY_BLUE,
            spaceAfter=3
        )

        doc_title_style = ParagraphStyle(
            "DocTitle",
            fontName="Helvetica-Bold",
            fontSize=21,
            leading=25,
            textColor=PRIMARY_COLOR,
            spaceAfter=12
        )

        meta_label = ParagraphStyle(
            "MetaLabel",
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=13,
            textColor=TEXT_DARK
        )

        meta_val = ParagraphStyle(
            "MetaVal",
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=TEXT_DARK
        )

        h1_style = ParagraphStyle(
            "Heading1_Custom",
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=PRIMARY_COLOR,
            spaceBefore=14,
            spaceAfter=7,
            keepWithNext=True
        )

        h2_style = ParagraphStyle(
            "Heading2_Custom",
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=15,
            textColor=SECONDARY_BLUE,
            spaceBefore=9,
            spaceAfter=4,
            keepWithNext=True
        )

        body_style = ParagraphStyle(
            "Body_Custom",
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=TEXT_DARK,
            spaceAfter=5
        )

        bullet_style = ParagraphStyle(
            "Bullet_Custom",
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=TEXT_DARK,
            leftIndent=15,
            firstLineIndent=-10,
            spaceAfter=3
        )

        table_header_style = ParagraphStyle(
            "TH_Style",
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10.5,
            textColor=colors.white
        )

        table_cell_style = ParagraphStyle(
            "TD_Style",
            fontName="Helvetica",
            fontSize=8,
            leading=10.5,
            textColor=TEXT_DARK
        )

        code_style = ParagraphStyle(
            "Code_Custom",
            fontName="Courier",
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#0F172A")
        )

        story = []

        def hr(thickness=1, color=LINE_COLOR, before=6, after=10):
            return HRFlowable(width="100%", thickness=thickness, color=color, spaceBefore=before, spaceAfter=after)

        # ========================================================
        # HEADER METADATA TABLE (StarGate Document Box)
        # ========================================================
        story.append(Paragraph("Product Requirements Document (PRD) — Version 2.0", doc_header_style))
        story.append(Paragraph("GameForSmart - AnalyticsDashboard", doc_title_style))
        story.append(Paragraph("Educational Intelligence, Multi-Role Monitoring & AI Analytics Engine", h2_style))
        
        meta_data = [
            [Paragraph("Document Version:", meta_label), Paragraph("<b>2.0 (V2 - Expanded Architecture & AI Model Specs)</b>", meta_val)],
            [Paragraph("Product Name:", meta_label), Paragraph("GameForSmart AnalyticsDashboard", meta_val)],
            [Paragraph("Platform / Stack:", meta_label), Paragraph("Next.js 16 (Turbopack), Tailwind v4, shadcn/ui, Supabase (PostgreSQL), Redis/Cron", meta_val)],
            [Paragraph("Target Users:", meta_label), Paragraph("Guru Pengampu, Pengelola Sekolah (Kepsek), Disdik Kab/Kota, Provinsi, Nasional", meta_val)],
            [Paragraph("AI / ML Strategy:", meta_label), Paragraph("<b>Hybrid 2-Tier Engine:</b> Tabular ML (LightGBM/XGBoost) + Generative LLM (Prescriptive)", meta_val)],
            [Paragraph("School Data Source:", meta_label), Paragraph("Gateway API Dapodik Kemendikbud (400.000+ Satuan Pendidikan Terverifikasi)", meta_val)],
            [Paragraph("Project Status:", meta_label), Paragraph("<b>Approved — Active Implementation (Part 1, 2, 3 Live)</b>", meta_val)]
        ]
        t_meta = Table(meta_data, colWidths=[120, 385])
        t_meta.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1.5),
            ('TOPPADDING', (0,0), (-1,-1), 1.5),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(t_meta)
        story.append(hr(thickness=1.5, color=PRIMARY_COLOR, before=8, after=12))

        # ========================================================
        # 1. EXECUTIVE SUMMARY
        # ========================================================
        story.append(Paragraph("1. Executive Summary", h1_style))
        story.append(Paragraph(
            "Platform <b>GameForSmart</b> mengoperasikan lingkungan belajar gamifikasi kuis interaktif bagi peserta didik di seluruh Indonesia. Setiap sesi interaksi menghasilkan jejak data (<i>learning traces</i>) berharga: histori akurasi jawaban, waktu respon, frekuensi repetisi, dan tingkat kesulitan soal yang dituntaskan.",
            body_style
        ))
        story.append(Paragraph(
            "Meskipun demikian, data tersebut selama ini belum dimanfaatkan secara optimal oleh pemangku kepentingan pendidikan: Guru kesulitan memetakan kompetensi spesifik yang belum dikuasai siswa; Kepala Sekolah kekurangan alat ukur benchmark antarkelas; dan Dinas Pendidikan tidak memiliki data real-time berbasis bukti (<i>evidence-based</i>) untuk menentukan sasaran bantuan kurikulum.",
            body_style
        ))
        story.append(Paragraph(
            "<b>GameForSmart AnalyticsDashboard (V2.0)</b> menghadirkan ekosistem Educational Intelligence terpadu melalui 3 pilar utama: <b>Deskriptif</b> (analisis kemampuan saat ini), <b>Prediktif</b> (estimasi skor ujian & indeks kesiapan), dan <b>Preskriptif</b> (deteksi gap materi & auto-remedial pedagogis).",
            body_style
        ))
        story.append(hr(thickness=0.8, color=PRIMARY_COLOR))

        # ========================================================
        # 2. TUJUAN PRODUK & KPI
        # ========================================================
        story.append(Paragraph("2. Tujuan Produk & Indikator Keberhasilan (KPI)", h1_style))
        story.append(Paragraph("• <b>Analisa Kemampuan Multi-Dimensi:</b> Profil penguasaan materi per siswa, rombel kelas, dan sekolah.", bullet_style))
        story.append(Paragraph("• <b>Estimasi Kesiapan Ujian Deterministik:</b> Prediksi skor nilai ujian kontinu (0–100) tanpa halusinasi angka.", bullet_style))
        story.append(Paragraph("• <b>Penyembuhan Kesenjangan Belajar:</b> Identifikasi topik belum tuntas (< 75 KKM) dan auto-remedial 1 klik.", bullet_style))
        story.append(Paragraph("• <b>Sentralisasi Hierarki Sekolah (NPSN):</b> Terhubung dengan direktori resmi 400.000+ sekolah Dapodik se-Indonesia.", bullet_style))
        story.append(Paragraph("• <b>KPI Teknis:</b> Korelasi prediksi skor ≥ 85%, akses cached dashboard < 1.5 detik, inferensi skor < 10 ms.", bullet_style))
        story.append(hr(thickness=0.8, color=PRIMARY_COLOR))

        # ========================================================
        # 3. SEGMENTASI PERAN & HIERARKI AKSES (RBAC)
        # ========================================================
        story.append(Paragraph("3. Target Users & Segmentasi Peran Multi-Scope", h1_style))
        
        roles_table_data = [
            [Paragraph("Peran (Role)", table_header_style), Paragraph("Cakupan Akses (Scope)", table_header_style), Paragraph("Fitur & Tanggung Jawab Utama", table_header_style)],
            [
                Paragraph("<b>Guru Pengampu</b><br/>(`guru`)", table_cell_style),
                Paragraph("Grup kelas binaan guru dalam satu sekolah.", table_cell_style),
                Paragraph("Manajemen grup kelas (username/QR scan), penugasan task reguler & remedial, evaluasi hasil progres kuis per siswa.", table_cell_style)
            ],
            [
                Paragraph("<b>Pengelola Sekolah</b><br/>(`pengelola_sekolah`)", table_cell_style),
                Paragraph("Seluruh kelas, rombel, dan jenjang di sekolah (NPSN terkunci).", table_cell_style),
                Paragraph("Monitoring menyeluruh, benchmark komparasi antarkelas (leaderboard), audit ketuntasan Kompetensi Dasar (KD) sekolah.", table_cell_style)
            ],
            [
                Paragraph("<b>Dinas Kab/Kota</b><br/>(`dinas_kabkota`)", table_cell_style),
                Paragraph("Seluruh satuan pendidikan di wilayah kabupaten/kota.", table_cell_style),
                Paragraph("Pemetaan mutu wilayah, pemilahan sekolah Kategori Unggulan vs Butuh Intervensi, supervisi kurikulum daerah.", table_cell_style)
            ],
            [
                Paragraph("<b>Dinas Provinsi</b><br/>(`dinas_provinsi`)", table_cell_style),
                Paragraph("Seluruh kab/kota di bawah yurisdiksi provinsi (fokus SMA/SMK).", table_cell_style),
                Paragraph("Agregasi kesenjangan antardaerah, perumusan kebijakan pemerataan standar kompetensi regional.", table_cell_style)
            ],
            [
                Paragraph("<b>Dinas Nasional</b><br/>(`dinas_nasional`)", table_cell_style),
                Paragraph("Agregasi makro 38 provinsi di Indonesia.", table_cell_style),
                Paragraph("Pemetaan standar mutu kelulusan nasional, kesiapan asesmen makro, dan perbaikan kurikulum terpusat.", table_cell_style)
            ]
        ]
        t_roles = Table(roles_table_data, colWidths=[110, 150, 245])
        t_roles.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_roles)
        story.append(hr(thickness=0.8, color=PRIMARY_COLOR))

        # ========================================================
        # 4. SPESIFIKASI 3 PILAR ANALITIK
        # ========================================================
        story.append(Paragraph("4. Spesifikasi Fungsional 3 Pilar Analitik", h1_style))
        
        pillar_table_data = [
            [Paragraph("Pilar Analitik", table_header_style), Paragraph("Fokus Analisa", table_header_style), Paragraph("Metrik & Hasil Keluaran (Output)", table_header_style)],
            [
                Paragraph("<b>Pilar 1: Deskriptif</b><br/>(Kemampuan Siswa)", table_cell_style),
                Paragraph("Penguasaan materi per topik & Kompetensi Dasar (KD).", table_cell_style),
                Paragraph("Persentase ketuntasan domain materi, akurasi jawaban, rata-rata waktu respon (detik/soal), diagnosis kelemahan & kekuatan belajar.", table_cell_style)
            ],
            [
                Paragraph("<b>Pilar 2: Prediktif</b><br/>(Estimasi Skor & Kesiapan)", table_cell_style),
                Paragraph("Proyeksi hasil ujian akhir / Asesmen Nasional.", table_cell_style),
                Paragraph("Estimasi skor kontinu (0–100) dengan confidence interval 95%, indeks kesiapan kelas, distribusi kategori: <i>Sangat Siap, Siap, Perlu Pendampingan, Kritis</i>.", table_cell_style)
            ],
            [
                Paragraph("<b>Pilar 3: Preskriptif</b><br/>(Materi Belum Dikuasai)", table_cell_style),
                Paragraph("Intervensi remedial otomatis materi di bawah KKM (< 75).", table_cell_style),
                Paragraph("Identifikasi gap subtopik prasyarat, saran paket kuis GameForSmart terarah, dan pengiriman tugas remedial 1 klik ke siswa terkait.", table_cell_style)
            ]
        ]
        t_pillar = Table(pillar_table_data, colWidths=[120, 140, 245])
        t_pillar.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_pillar)
        story.append(hr(thickness=0.8, color=PRIMARY_COLOR))

        # ========================================================
        # 5. ONBOARDING & GRUP PENGAWASAN
        # ========================================================
        story.append(Paragraph("5. Manajemen Grup & Student Onboarding (Dual-Method)", h1_style))
        story.append(Paragraph("Guru dapat membuat grup pengawasan kelas (Nama, Jenjang, Tingkat, Mapel, Tahun Ajaran) dengan 2 metode pendaftaran:", body_style))
        story.append(Paragraph("• <b>Metode A (Ketik Username):</b> Pencarian autocomplete debounce (300ms) ke endpoint `/api/students/search`. Menampilkan profil lengkap: avatar, username, kelas, level, XP, estimasi skor, dan tombol 'Tambahkan ke Grup'.", bullet_style))
        story.append(Paragraph("• <b>Metode B (Scan QR Code Kamera Live):</b> Menggunakan engine `html5-qrcode` dengan visual reticle viewfinder. Otomatis membaca payload profil murid GameForSmart (`/profile/[username]`, URI `gameforsmart://`, JSON, teks username). Dilengkapi upload foto QR dan simulator chip uji coba.", bullet_style))
        story.append(hr(thickness=0.8, color=PRIMARY_COLOR))

        # ========================================================
        # 6. PENUGASAN TASK & MONITORING PROGRES GURU
        # ========================================================
        story.append(Paragraph("6. Modul Task & Monitoring Progres Guru", h1_style))
        story.append(Paragraph("• <b>Tipe Penugasan Fleksibel:</b> Guru dapat membuat penugasan kuis Reguler (seluruh siswa dalam grup) atau Preskriptif Remedial (khusus siswa yang belum mencapai KKM 75).", bullet_style))
        story.append(Paragraph("• <b>Live Progress Tracking:</b> Progress bar agregat pengumpulan kelas (% selesai), status breakdown: <i>Belum Mulai, Sedang Dikerjakan, Selesai - Tuntas, Selesai - Perlu Remedial</i>.", bullet_style))
        story.append(Paragraph("• <b>Evaluasi & Rekomendasi Terarah:</b> Dialog evaluasi hasil capaian per butir indikator KD siswa dan tombol pengiriman materi remedial instan.", bullet_style))
        story.append(hr(thickness=0.8, color=PRIMARY_COLOR))

        # ========================================================
        # 7. ARSITEKTUR MODEL AI/ML (HYBRID 2-TIER ENGINE)
        # ========================================================
        story.append(Paragraph("7. Arsitektur Model Analitik AI/ML (Pendekatan Hybrid 2-Tier Engine)", h1_style))
        story.append(Paragraph(
            "Berdasarkan analisis karakteristik data psikometri dan edukasi, sistem <b>TIDAK melatih LLM raksasa dari awal (from scratch)</b>. Sistem mengadopsi <b>Pendekatan Hybrid 2-Tier Engine</b> yang terbukti superior di industri EdTech (Khan Academy, Duolingo, Ruangguru):",
            body_style
        ))

        ai_table_data = [
            [Paragraph("Komponen Engine", table_header_style), Paragraph("Teknologi / Model", table_header_style), Paragraph("Alasan Teknis & Keunggulan", table_header_style)],
            [
                Paragraph("<b>Tier 1: Engine Prediksi Nilai</b><br/>(Deskriptif & Prediktif)", table_cell_style),
                Paragraph("<b>ML Tabular dari Nol:</b><br/>LightGBM / XGBoost / Knowledge Tracing", table_cell_style),
                Paragraph("• Dilatih dari awal dengan dataset tabular kuis GameForSmart.<br/>• 100% deterministik bebas halusinasi angka skor ujian.<br/>• Inferensi instan (< 5 ms per siswa) di CPU biasa tanpa GPU mahal.", table_cell_style)
            ],
            [
                Paragraph("<b>Tier 2: Engine Generatif</b><br/>(Preskriptif & Narasi)", table_cell_style),
                Paragraph("<b>Generative LLM:</b><br/>Gemini Flash / LoRA LLaMA-3-8B", table_cell_style),
                Paragraph("• Prompt engineering & fine-tuning data Kurikulum Merdeka.<br/>• Menghasilkan diagnosis kesulitan belajar, narasi evaluasi guru, dan rekomendasi remedial yang humanis & pedagogis.", table_cell_style)
            ]
        ]
        t_ai = Table(ai_table_data, colWidths=[120, 140, 245])
        t_ai.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_ai)
        story.append(Spacer(1, 4))
        story.append(Paragraph(
            "<b>Penyimpanan Snapshot JSON & Cron Jam 00:00 WIB:</b> Hasil analisis disimpan dalam format JSON snapshot. Tombol 'Perbarui Analisa' menampilkan live progress bar (0–100%) dan mencatat timestamp pembaruan. Background worker `/api/analytics/cron` menyinkronkan data otomatis setiap jam 12 dini hari (00:00 WIB).",
            body_style
        ))
        story.append(hr(thickness=0.8, color=PRIMARY_COLOR))

        # ========================================================
        # 8. SUMBER DATA MASTER SEKOLAH (DAPODIK KEMENDIKBUD)
        # ========================================================
        story.append(Paragraph("8. Integrasi Sumber Data Sekolah Indonesia (API Dapodik)", h1_style))
        story.append(Paragraph(
            "Mengatasi ketiadaan master data sekolah nasional dengan mengintegrasikan <b>Gateway API Sekolah Indonesia (Dapodik Kemendikbudristek)</b> menggunakan arsitektur <b>Hybrid Dual-Layer Cache</b>:",
            body_style
        ))
        story.append(Paragraph("• <b>Cakupan Nasional:</b> Mencakup <b>400.000+ satuan pendidikan</b> di 38 Provinsi, 514 Kab/Kota, seluruh jenjang (SD, SMP, SMA, SMK, SLB, PAUD), dan status Negeri/Swasta.", bullet_style))
        story.append(Paragraph("• <b>Kelengkapan Data:</b> NPSN 8-digit, nama resmi, hierarki wilayah (provinsi, kab/kota, kecamatan), status akreditasi, dan koordinat geospasial GIS (latitude/longitude) untuk peta mutu.", bullet_style))
        story.append(Paragraph("• <b>Dual-Layer Performance:</b> Online gateway Dapodik dipadukan dengan database cache PostgreSQL lokal berbasis trigram GIN index (`pg_trgm`) untuk pencarian instan sub-30ms dan zero-downtime saat offline.", bullet_style))
        story.append(hr(thickness=0.8, color=PRIMARY_COLOR))

        # ========================================================
        # 9. DASHBOARD PENGELOLA SEKOLAH & DINAS PENDIDIKAN
        # ========================================================
        story.append(Paragraph("9. Dashboard Pengelola Sekolah & Dinas Pendidikan", h1_style))
        story.append(Paragraph("• <b>Pengelola Sekolah (Kepsek):</b> Benchmark komparasi antarkelas (`/dashboard/school/benchmark`) dengan leaderboard rombel, serta audit ketuntasan indikator KD (`/dashboard/school/competencies`).", bullet_style))
        story.append(Paragraph("• <b>Dinas Pendidikan Multi-Scope:</b> Direktori sekolah berdasar yurisdiksi (`/dashboard/dinas/schools`) dan pemetaan Kesiapan Ujian Wilayah (`/dashboard/dinas/readiness`):", bullet_style))
        story.append(Paragraph("  - <i>Kategori Unggulan:</i> Rata-rata skor > 85, siswa melampaui target kompetensi (siap seleksi PTN / olimpiade).", bullet_style))
        story.append(Paragraph("  - <i>Kategori Mandiri:</i> Rata-rata skor 75–84, ketuntasan kurikulum tercapai aman.", bullet_style))
        story.append(Paragraph("  - <i>Kategori Prioritas Intervensi:</i> Rata-rata skor < 75, dilengkapi tombol 'Kirim Supervisi Dinas' untuk intervensi kurikulum terarah.", bullet_style))
        story.append(hr(thickness=0.8, color=PRIMARY_COLOR))

        # ========================================================
        # 10. NON-FUNCTIONAL REQUIREMENTS
        # ========================================================
        story.append(Paragraph("10. Non-Functional Requirements & Keamanan", h1_style))
        
        nfr_data = [
            [Paragraph("Aspek Teknis", table_header_style), Paragraph("Spesifikasi Kriteria", table_header_style), Paragraph("Metode Verifikasi", table_header_style)],
            [Paragraph("Kecepatan UI", table_cell_style), Paragraph("< 1.2 detik render dasbor, < 30 ms pencarian NPSN lokal.", table_cell_style), Paragraph("Lighthouse Score ≥ 90.", table_cell_style)],
            [Paragraph("Keamanan & Otorisasi", table_cell_style), Paragraph("PostgreSQL Row Level Security (RLS) & cookie scope separation.", table_cell_style), Paragraph("Uji penetrasi otorisasi multi-role.", table_cell_style)],
            [Paragraph("Skalabilitas Data", table_cell_style), Paragraph("Mampu memproses agregasi 100.000+ data pengerjaan kuis.", table_cell_style), Paragraph("GIN Trigram & JSON Snapshot Cache.", table_cell_style)],
            [Paragraph("Ketahanan Layanan", table_cell_style), Paragraph("Zero-downtime offline fallback saat gateway API luar lambat.", table_cell_style), Paragraph("Simulasi blackout API eksternal.", table_cell_style)]
        ]
        t_nfr = Table(nfr_data, colWidths=[120, 240, 145])
        t_nfr.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('TOPPADDING', (0,0), (-1,-1), 3.5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ]))
        story.append(t_nfr)
        story.append(hr(thickness=0.8, color=PRIMARY_COLOR))

        # ========================================================
        # 11. ROADMAP PRODUK
        # ========================================================
        story.append(Paragraph("11. Roadmap Implementasi Produk", h1_style))
        story.append(Paragraph(
            "<b>[PART 1: SELESAI]</b> Role RBAC, Login Flow, Unified App Shell<br/>"
            "<b>[PART 2: SELESAI]</b> API Dapodik NPSN, QR Profil Scanner, Manajemen Grup & Task Guru<br/>"
            "<b>[PART 3: SELESAI]</b> School Benchmark, Peta Mutu Dinas, Snapshot Engine & Midnight Cron<br/>"
            "<b>[PART 4: UPCOMING]</b> Pelatihan Model Tabular XGBoost & Microservice FastAPI Integration",
            body_style
        ))
        story.append(Spacer(1, 10))
        story.append(Paragraph(
            "<i>Dokumen PRD V2.0 ini disahkan sebagai cetak biru resmi pengembangan GameForSmart AnalyticsDashboard.</i>",
            ParagraphStyle("EndingNote", fontName="Helvetica-Oblique", fontSize=8.5, textColor=TEXT_MUTED, alignment=1)
        ))

        # Build document
        doc.build(story, canvasmaker=NumberedCanvas)
        print(f"✅ Generated: {output_path}")

if __name__ == "__main__":
    targets = ["/home/alss/Code/Magang/UBIG/GameForSmart/AnalyticsDashboard/GameForSmart_AnalyticsDashboard_PRD_V2.pdf"]
    build_pdf(targets)
