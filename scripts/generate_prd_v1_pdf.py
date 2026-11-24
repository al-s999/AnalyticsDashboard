#!/usr/bin/env python3
"""
Script to generate GameForSmart AnalyticsDashboard PRD PDF
Formatted to match StarGate - Face Recognition Attendance System PRD.
"""

import os
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
    ListFlowable,
    ListItem
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
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
        
        # Header (pages after page 1)
        if self._pageNumber > 1:
            self.drawString(45, 842 - 32, "GameForSmart - AnalyticsDashboard | Product Requirements Document (PRD)")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(45, 842 - 36, 595.25 - 45, 842 - 36)
            
        # Footer
        footer_text = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(595.25 - 45, 25, footer_text)
        self.drawString(45, 25, "CONFIDENTIAL - GameForSmart Academic Intelligence Platform")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(45, 35, 595.25 - 45, 35)
        
        self.restoreState()


def build_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=45,
        rightMargin=45,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    # Custom styles matching StarGate PRD palette
    PRIMARY_COLOR = colors.HexColor("#1F4E79")
    SECONDARY_BLUE = colors.HexColor("#2F5597")
    TEXT_DARK = colors.HexColor("#1E293B")
    TEXT_MUTED = colors.HexColor("#475569")
    LINE_COLOR = colors.HexColor("#0F172A")

    doc_header_style = ParagraphStyle(
        "DocHeader",
        fontName="Helvetica",
        fontSize=13,
        leading=16,
        textColor=SECONDARY_BLUE,
        spaceAfter=4
    )

    doc_title_style = ParagraphStyle(
        "DocTitle",
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=PRIMARY_COLOR,
        spaceAfter=14
    )

    meta_label = ParagraphStyle(
        "MetaLabel",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK
    )

    meta_val = ParagraphStyle(
        "MetaVal",
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK
    )

    h1_style = ParagraphStyle(
        "Heading1_Custom",
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=PRIMARY_COLOR,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        "Heading2_Custom",
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=SECONDARY_BLUE,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        "Heading3_Custom",
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=TEXT_DARK,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "Body_Custom",
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        "Bullet_Custom",
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        "TH_Style",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        "TD_Style",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=TEXT_DARK
    )

    table_cell_bold = ParagraphStyle(
        "TDBold_Style",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=TEXT_DARK
    )

    code_style = ParagraphStyle(
        "Code_Custom",
        fontName="Courier",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    def hr(thickness=1, color=LINE_COLOR, before=8, after=12):
        return HRFlowable(width="100%", thickness=thickness, color=color, spaceBefore=before, spaceAfter=after)

    # ==========================
    # COVER / HEADER
    # ==========================
    story.append(Paragraph("Product Requirements Document (PRD)", doc_header_style))
    story.append(Paragraph("GameForSmart - AnalyticsDashboard", doc_title_style))
    story.append(Paragraph("Educational Intelligence & Academic Monitoring Platform", h2_style))
    
    meta_data = [
        [Paragraph("Version:", meta_label), Paragraph("1.0", meta_val)],
        [Paragraph("Product Name:", meta_label), Paragraph("GameForSmart AnalyticsDashboard", meta_val)],
        [Paragraph("Platform:", meta_label), Paragraph("Web Application (Responsive Desktop & Tablet-First)", meta_val)],
        [Paragraph("Target Users:", meta_label), Paragraph("Guru, Pengelola Sekolah, Dinas Pendidikan Kab/Kota, Provinsi, Nasional", meta_val)],
        [Paragraph("Technology:", meta_label), Paragraph("Next.js 16 (App Router, Turbopack), Tailwind CSS v4, shadcn/ui, TypeScript, Supabase (PostgreSQL), Redis/Cron", meta_val)]
    ]
    t_meta = Table(meta_data, colWidths=[100, 405])
    t_meta.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_meta)
    story.append(hr(thickness=1.5, color=PRIMARY_COLOR, before=10, after=14))

    # ==========================
    # 1. EXECUTIVE SUMMARY
    # ==========================
    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(Paragraph("Latar Belakang", h2_style))
    story.append(Paragraph(
        "Platform <b>GameForSmart</b> telah berhasil menghadirkan lingkungan belajar yang interaktif melalui gamifikasi kuis, kompetisi kuis berjenjang, dan sesi belajar mandiri (<i>learn_sessions</i> & <i>game_sessions</i>). Setiap sesi interaksi siswa menghasilkan jejak data yang sangat kaya: pola jawaban, tingkat ketelitian, kecepatan merespon (response time), tingkat kesulitan soal yang ditaklukkan, serta riwayat repetisi kuis.",
        body_style
    ))
    story.append(Paragraph("Meskipun demikian, data berharga tersebut selama ini masih terisolasi di sisi operasional game dan admin umum tanpa adanya agregasi analitik yang dapat langsung dimanfaatkan oleh stakeholder pendidikan:", body_style))
    story.append(Paragraph("• <b>Guru:</b> Kesulitan memetakan siswa mana yang belum menguasai indikator pembelajaran tertentu dan membutuhkan bimbingan khusus.", bullet_style))
    story.append(Paragraph("• <b>Pengelola Sekolah:</b> Tidak memiliki alat ukur objektif untuk membandingkan kesiapan akademik antarkelas dalam menghadapi ujian resmi.", bullet_style))
    story.append(Paragraph("• <b>Dinas Pendidikan (Kab/Kota, Provinsi, Nasional):</b> Tidak memiliki data real-time berbasis bukti (<i>evidence-based policy</i>) untuk melihat sekolah mana yang telah mencapai target kompetensi atau memerlukan intervensi kurikulum.", bullet_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "<b>GameForSmart AnalyticsDashboard</b> hadir sebagai platform intelijen pendidikan yang mengolah big data interaksi kuis menjadi wawasan terukur melalui tiga pilar analitik: <b>Deskriptif</b> (kemampuan saat ini), <b>Prediktif</b> (estimasi skor & kesiapan ujian), dan <b>Preskriptif</b> (deteksi learning gap materi & penugasan remedial langsung).",
        body_style
    ))
    story.append(hr(thickness=1, color=PRIMARY_COLOR, before=8, after=12))

    # ==========================
    # 2. TUJUAN PRODUK
    # ==========================
    story.append(Paragraph("2. Tujuan Produk", h1_style))
    story.append(Paragraph("Tujuan Utama", h2_style))
    story.append(Paragraph("Menyediakan sistem intelijen dan analitik pendidikan modern yang:", body_style))
    story.append(Paragraph("• <b>Cepat & Tervalidasi:</b> Dashboard cached JSON memuat data dalam < 1.5 detik.", bullet_style))
    story.append(Paragraph("• <b>Akurat & Prediktif:</b> Menghasilkan estimasi skor ujian mapel dengan confidence interval 95%.", bullet_style))
    story.append(Paragraph("• <b>Preskriptif & Aksi Nyata:</b> Guru dapat memberikan penugasan kuis/remedial dalam 1 klik ke siswa yang belum tuntas.", bullet_style))
    story.append(Paragraph("• <b>Onboarding Mudah (2 Metode):</b> Menambahkan murid ke kelas via ketik username atau scan QR profile GameForSmart.", bullet_style))
    story.append(Paragraph("• <b>Integrasi Sekolah Nasional:</b> Terhubung dengan direktori master sekolah seluruh Indonesia melalui pencarian NPSN resmi.", bullet_style))
    story.append(Paragraph("• <b>Multi-Level Governance:</b> Monitoring berjenjang untuk Guru, Kepala Sekolah, dan Dinas Pendidikan.", bullet_style))
    story.append(hr(thickness=1, color=PRIMARY_COLOR, before=8, after=12))

    # ==========================
    # 3. TARGET USERS & HIERARKI
    # ==========================
    story.append(Paragraph("3. Target Users & Segmentasi Peran", h1_style))
    story.append(Paragraph("Hierarki Peran & Cakupan Monitoring", h2_style))

    roles_data = [
        [Paragraph("Peran (Role)", table_header_style), Paragraph("Cakupan Pengawasan (Scope)", table_header_style), Paragraph("Tanggung Jawab Utama", table_header_style)],
        [
            Paragraph("<b>Guru</b>", table_cell_style),
            Paragraph("Grup/kelas asuhan guru bersangkutan (dapat lintas jenjang).", table_cell_style),
            Paragraph("Monitoring performa individu/kelas, pemberian task, evaluasi progres, bimbingan remedial.", table_cell_style)
        ],
        [
            Paragraph("<b>Pengelola Sekolah</b><br/>(Kepsek / Admin)", table_cell_style),
            Paragraph("Seluruh rombel/kelas dan jenjang dalam satuan pendidikan (NPSN).", table_cell_style),
            Paragraph("Benchmark performa antarkelas, evaluasi ketercapaian target kurikulum sekolah.", table_cell_style)
        ],
        [
            Paragraph("<b>Dinas Kab/Kota</b>", table_cell_style),
            Paragraph("Seluruh satuan pendidikan dalam satu wilayah kabupaten/kota.", table_cell_style),
            Paragraph("Pemetaan mutu pendidikan daerah, identifikasi sekolah unggul vs butuh bantuan.", table_cell_style)
        ],
        [
            Paragraph("<b>Dinas Provinsi</b>", table_cell_style),
            Paragraph("Seluruh kabupaten/kota di bawah naungan provinsi (fokus SMA/SMK).", table_cell_style),
            Paragraph("Agregasi mutu regional, perbandingan performa antarkabupaten/kota.", table_cell_style)
        ],
        [
            Paragraph("<b>Dinas Nasional</b><br/>(Kemendikdasmen)", table_cell_style),
            Paragraph("Agregasi seluruh provinsi di Indonesia.", table_cell_style),
            Paragraph("Pemetaan makro standar kompetensi dan indeks kesiapan ujian tingkat nasional.", table_cell_style)
        ]
    ]
    t_roles = Table(roles_data, colWidths=[110, 185, 210])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY_BLUE),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(t_roles)
    story.append(hr(thickness=1, color=PRIMARY_COLOR, before=10, after=12))

    # ==========================
    # 4. SCOPE PRODUCT
    # ==========================
    story.append(Paragraph("4. Scope Product", h1_style))
    story.append(Paragraph("In Scope (Versi 1.0 / MVP)", h2_style))
    in_scope_items = [
        "Sistem Autentikasi Terpadu: Mekanisme login sama dengan App,GameForSmart, dengan sedikit penyesuaian",
        "Integrasi Master Data NPSN: Pencarian instan database sekolah seluruh Indonesia berdasarkan NPSN dan wilayah via API",
        "Grup & Onboarding Murid: Penambahan murid via invite username & pemindaian (Scan) QR Code profil murid",
        "Manajemen Task / Penugasan: Pembuatan tugas kuis spesifik dengan deadline & pelacakan status (Belum Mengerjakan, Sedang dikerjakan, Selesai)",
        "Analitik Deskriptif: Kemampuan Siswa, Akurasi Mapel, Response Time, Konsistensi",
        "Analitik Prediktif: Estimasi Nilai Ujian (0-100) & Indeks Kesiapan (Tinggi, Sedang, Perlu Pendampingan)",
        "Analitik Preskriptif: Pemetaan Indikator Belum Tercapai (Learning Gaps) & Rekomendasi Remedial",
        "Pipeline Asinkron: Live Progress Bar (0-100%) saat penarikan & kalkulasi data API",
        "Penyimpanan Hasil Analisis dalam JSON Snapshot + Label Last Update & Trigger Manual",
        "Otomatisasi Cron Job Pembaruan Data Berkala setiap pukul 00:00 (Tengah Malam)",
        "Tampilan Dasbor Berjenjang Sesuai Peran (Guru, Sekolah, Dinas Daerah & Nasional)",
        "Export Laporan ke format Excel (.xlsx) dan PDF (.pdf)"
    ]
    for item in in_scope_items:
        story.append(Paragraph(f"[v]  {item}", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("Out of Scope (Batasan Sistem)", h2_style))
    out_scope_items = [
        "Pembuatan & Editor Kuis Baru: Pembuatan soal, media pertanyaan, dan materi kuis tetap dilakukan di App GameForSmart.",
        "Gameplay / Pengerjaan Kuis Siswa: Siswa memainkan game kuis dan sesi latihan langsung di GameForSmart, dasbor ini hanya mengumpulkan data histori dan mengevaluasi hasil pengerjaan.",
        "Manajemen Akun Siswa & Gamifikasi: Pengelolaan profil siswa dilakukan di App GameForSmart.",
        "Aplikasi Mobile Terpisah: Fokus dasbor adalah Web Responsive (Desktop & Mobile) untuk kemudahan analisis visual data bagi guru, kepala sekolah, dan dinas."
    ]
    for item in out_scope_items:
        story.append(Paragraph(f"[x]  {item}", bullet_style))

    story.append(hr(thickness=1, color=PRIMARY_COLOR, before=8, after=12))

    # ==========================
    # 5. FUNCTIONAL REQUIREMENTS
    # ==========================
    story.append(Paragraph("5. Functional Requirements (Modul Spesifikasi)", h1_style))

    # Module 1
    story.append(Paragraph("Module 1: Authentication & Session Management", h2_style))
    story.append(Paragraph("<b>Tujuan:</b> Memberikan gerbang login yang aman, responsif, dan terintegrasi dengan ekosistem GameForSmart.", body_style))
    story.append(Paragraph("<b>Fitur Utama:</b>", body_style))
    story.append(Paragraph("• Login via Email atau Username GameForSmart.", bullet_style))
    story.append(Paragraph("• Show/Hide password toggle dan proteksi sesi cookie HTTP-only.", bullet_style))
    story.append(Paragraph("• Quick Role Switcher untuk simulasi peran Guru, Kepala Sekolah, dan Dinas Pendidikan.", bullet_style))
    story.append(Paragraph("• Redirection otomatis ke rute dashboard sesuai peran pasca-autentikasi.", bullet_style))
    story.append(Spacer(1, 4))

    # Module 2
    story.append(Paragraph("Module 2: Master Data Sekolah & Pencarian NPSN", h2_style))
    story.append(Paragraph("<b>Tujuan:</b> Menghubungkan akun guru, pengelola, dan dinas dengan data master satuan pendidikan Indonesia.", body_style))
    story.append(Paragraph("<b>Spesifikasi Pencarian:</b>", body_style))
    story.append(Paragraph("• Input: 8 digit NPSN atau kata kunci nama sekolah (minimal 3 karakter).", bullet_style))
    story.append(Paragraph("• Integrasi API: Memanggil endpoint API Sekolah Indonesia Dapodik dengan debounce 300ms.", bullet_style))
    story.append(Paragraph("• Cache-Aside Pattern: Data sekolah yang telah diklaim otomatis disimpan ke tabel lokal <code>schools</code>.", bullet_style))
    story.append(Paragraph("• Output Informasi: NPSN, Nama Sekolah, Jenjang (SD/SMP/SMA/SMK), Status, Alamat, Kab/Kota, Provinsi.", bullet_style))
    story.append(Spacer(1, 4))

    # Module 3
    story.append(Paragraph("Module 3: Manajemen Grup & Student Onboarding", h2_style))
    story.append(Paragraph("<b>Tujuan:</b> Membentuk grup/kelas pengawasan guru dan mendaftarkan siswa dengan cepat.", body_style))
    story.append(Paragraph("<b>Metode Onboarding Siswa:</b>", body_style))
    story.append(Paragraph("1. <b>Metode Ketik Username (Invite):</b> Guru mengetik username siswa GameForSmart -> Pratinjau profil -> Klik 'Undang ke Grup' -> Siswa menerima undangan dan menyetujui untuk bergabung.", bullet_style))
    story.append(Paragraph("2. <b>Metode Scan QR Kamera:</b> Siswa menampilkan QR profil di aplikasi GameForSmart -> Guru mengarahkan kamera webcam/perangkat -> QR terbaca (< 500ms) -> Murid otomatis terdaftar.", bullet_style))
    story.append(Paragraph("• Guru dapat mengelola beberapa grup dari tingkat/jenjang berbeda (misal: Kelas 10-A, 11-IPA).", bullet_style))
    story.append(Spacer(1, 4))

    # Module 4
    story.append(Paragraph("Module 4: Manajemen Tugas (Task Assignment) & Evaluasi", h2_style))
    story.append(Paragraph("<b>Tujuan:</b> Guru dapat memberikan penugasan kuis/materi langsung ke grup siswa dan mengevaluasi progresnya.", body_style))
    story.append(Paragraph("<b>Fitur Task:</b>", body_style))
    story.append(Paragraph("• Pembuatan penugasan kuis GameForSmart dengan tenggat waktu (deadline).", bullet_style))
    story.append(Paragraph("• Live Progress Tracker status pengerjaan: Belum Mengerjakan, Sedang dikerjakan, Selesai.", bullet_style))
    story.append(Paragraph("• Evaluasi nilai otomatis: Skor akhir, akurasi per sub-indikator, dan durasi pengerjaan.", bullet_style))
    story.append(Paragraph("• Filter pintar untuk menandai siswa siap ujian vs butuh bimbingan remedial.", bullet_style))
    story.append(Spacer(1, 4))

    # Module 5
    story.append(Paragraph("Module 5: Mesin Analitik Dashboard (3 Pilar Utama)", h2_style))
    
    analytics_box = [
        [Paragraph("Pilar Analitik", table_header_style), Paragraph("Fokus Output & Algoritma", table_header_style), Paragraph("Aksi Nyata Pengguna", table_header_style)],
        [
            Paragraph("<b>1. Deskriptif</b><br/>(Kemampuan Siswa)", table_cell_style),
            Paragraph("Akurasi kumulatif per mapel, rata-rata waktu respon (kecepatan), ketahanan pada soal sulit (HOTS), frekuensi keaktifan belajar.", table_cell_style),
            Paragraph("Identifikasi kekuatan dan kelemahan dasar siswa dalam peta radar kompetensi.", table_cell_style)
        ],
        [
            Paragraph("<b>2. Prediktif</b><br/>(Estimasi Skor & Kesiapan)", table_cell_style),
            Paragraph("Estimasi perolehan skor ujian (0-100, CI 95%), indeks kesiapan ujian: Sangat Siap (&ge;85%), Cukup Siap (70-84%), Perlu Pendampingan (<70%).", table_cell_style),
            Paragraph("Simulasi kelulusan ujian dan pengelompokan siswa untuk program intensif.", table_cell_style)
        ],
        [
            Paragraph("<b>3. Preskriptif</b><br/>(Learning Gap & Remedial)", table_cell_style),
            Paragraph("Deteksi otomatis subtopik/KD dengan akurasi < 65% (Learning Gap). Mengkorelasikan kesalahan dengan materi prasyarat.", table_cell_style),
            Paragraph("Tombol 1-klik <b>'Tugaskan Remedial'</b> otomatis mengirimkan paket kuis relevan hanya ke siswa yang belum tuntas.", table_cell_style)
        ]
    ]
    t_analytics = Table(analytics_box, colWidths=[110, 215, 180])
    t_analytics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(t_analytics)
    story.append(Spacer(1, 6))

    # Module 6
    story.append(Paragraph("Module 6: Pipeline Pemrosesan, Progress Bar & JSON Snapshot", h2_style))
    story.append(Paragraph("<b>Alur On-Demand & Progress Bar:</b>", body_style))
    story.append(Paragraph("1. Pengguna menekan tombol <b>'Update Analisa Sekarang'</b>.", bullet_style))
    story.append(Paragraph("2. Sistem membuka modal dengan <b>Live Progress Bar (0% - 100%)</b> dan info langkah:", bullet_style))
    story.append(Paragraph("   - <i>Langkah 1 (25%):</i> Menarik data interaksi kuis siswa dari database PostgreSQL.", bullet_style))
    story.append(Paragraph("   - <i>Langkah 2 (60%):</i> Komputasi metriks kemampuan, estimasi skor, dan deteksi learning gap.", bullet_style))
    story.append(Paragraph("   - <i>Langkah 3 (85%):</i> Penyusunan struktur agregasi JSON Snapshot.", bullet_style))
    story.append(Paragraph("   - <i>Langkah 4 (100%):</i> Penyimpanan ke tabel <code>analytics_snapshots</code> & refresh UI.", bullet_style))
    story.append(Paragraph("<b>State Caching & Auto-Cron Jam 00:00:</b>", body_style))
    story.append(Paragraph("• Dasbor menampilkan status waktu terakhir pembaruan: <i>'Terakhir diperbarui: Hari ini, 00:00 WIB'</i>.", bullet_style))
    story.append(Paragraph("• Background worker (Cron) otomatis berjalan setiap malam jam <b>00:00 WIB</b> untuk menghitung ulang snapshot seluruh kelas/sekolah.", bullet_style))
    story.append(Spacer(1, 4))

    # Module 7
    story.append(Paragraph("Module 7: Tampilan Monitoring Berjenjang (Hierarchical Views)", h2_style))
    story.append(Paragraph("• <b>View Guru:</b> Monitoring kelas asuhan, grid siswa dengan badge kesiapan, top materi sering salah.", bullet_style))
    story.append(Paragraph("• <b>View Sekolah:</b> Rekapitulasi seluruh jenjang/tingkat, tabel komparasi benchmark antarkelas.", bullet_style))
    story.append(Paragraph("• <b>View Dinas (Kab/Kota, Prov, Nasional):</b> Peta mutu wilayah, indikator sekolah target tercapai vs butuh intervensi kurikulum.", bullet_style))
    story.append(hr(thickness=1, color=PRIMARY_COLOR, before=8, after=12))

    # ==========================
    # 6. DATABASE DESIGN
    # ==========================
    story.append(Paragraph("6. Database Design & Integration", h1_style))
    story.append(Paragraph("Skema Tabel Baru & Relasi ke Database Existing GameForSmart", h2_style))

    schema_tables = [
        ("schools (Master Satuan Pendidikan)", [
            "npsn VARCHAR(10) PRIMARY KEY",
            "name VARCHAR(255) NOT NULL",
            "education_level VARCHAR(20) NOT NULL -- SD, SMP, SMA, SMK",
            "status VARCHAR(10) NOT NULL -- Negeri, Swasta",
            "province VARCHAR(100) NOT NULL",
            "city VARCHAR(100) NOT NULL",
            "district VARCHAR(100) NOT NULL",
            "created_at TIMESTAMPTZ DEFAULT NOW()"
        ]),
        ("academic_groups (Grup Pengawasan Guru)", [
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
            "teacher_id UUID NOT NULL REFERENCES profiles(id)",
            "school_npsn VARCHAR(10) REFERENCES schools(npsn)",
            "name VARCHAR(150) NOT NULL -- misal: Kelas 10-A Matematika",
            "grade VARCHAR(20) NOT NULL",
            "subject VARCHAR(100) NOT NULL",
            "academic_year VARCHAR(20) NOT NULL"
        ]),
        ("group_students (Anggota Murid dalam Grup)", [
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
            "group_id UUID NOT NULL REFERENCES academic_groups(id)",
            "student_id UUID NOT NULL REFERENCES profiles(id)",
            "joined_method VARCHAR(20) NOT NULL -- 'username' | 'qr_scan'",
            "joined_at TIMESTAMPTZ DEFAULT NOW()"
        ]),
        ("student_tasks & task_submissions (Penugasan Tugas)", [
            "student_tasks: id, teacher_id, group_id, quiz_id, title, instructions, deadline",
            "task_submissions: id, task_id, student_id, score, accuracy, duration_seconds, status"
        ]),
        ("analytics_snapshots (Penyimpanan JSON Agregat)", [
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
            "scope_level VARCHAR(20) NOT NULL -- group, school, city, province, national",
            "scope_id VARCHAR(100) NOT NULL",
            "data_snapshot JSONB NOT NULL -- Full JSON output analitik",
            "metrics_summary JSONB -- Ringkasan cepat skor rata-rata & kesiapan",
            "created_at TIMESTAMPTZ DEFAULT NOW()"
        ])
    ]

    for title, fields in schema_tables:
        story.append(Paragraph(f"<b>Tabel: {title}</b>", h3_style))
        code_lines = "<br/>".join([f"&nbsp;&nbsp;{f}" for f in fields])
        box_data = [[Paragraph(f"<code>{code_lines}</code>", code_style)]]
        t_box = Table(box_data, colWidths=[505])
        t_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_box)
        story.append(Spacer(1, 4))

    story.append(hr(thickness=1, color=PRIMARY_COLOR, before=8, after=12))

    # ==========================
    # 7. NON-FUNCTIONAL REQUIREMENTS
    # ==========================
    story.append(Paragraph("7. Non Functional Requirements", h1_style))
    nfr_data = [
        [Paragraph("Kategori", table_header_style), Paragraph("Target Metrik / Spesifikasi", table_header_style)],
        [Paragraph("<b>Performance</b>", table_cell_style), Paragraph("Dashboard cached load < 1.5 detik. Autocomplete NPSN search < 300 ms. Perhitungan batch analitik < 15 detik.", table_cell_style)],
        [Paragraph("<b>Availability</b>", table_cell_style), Paragraph("Ketersediaan sistem &ge; 99.5% uptime dengan dukungan Supabase High Availability.", table_cell_style)],
        [Paragraph("<b>Security & RLS</b>", table_cell_style), Paragraph("Row-Level Security (RLS) PostgreSQL memastikan guru hanya melihat kelasnya, kepsek melihat sekolahnya, dan dinas melihat wilayahnya.", table_cell_style)],
        [Paragraph("<b>Rate Limiting</b>", table_cell_style), Paragraph("Maksimal 5 kali manual update analitik per user per jam untuk menjaga beban komputasi server.", table_cell_style)],
        [Paragraph("<b>Audit Trail</b>", table_cell_style), Paragraph("Pencatatan otomatis seluruh aktivitas perubahan penugasan, onboarding murid, dan trigger update analitik.", table_cell_style)]
    ]
    t_nfr = Table(nfr_data, colWidths=[120, 385])
    t_nfr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(t_nfr)
    story.append(hr(thickness=1, color=PRIMARY_COLOR, before=8, after=12))

    # ==========================
    # 8. ROADMAP & SUCCESS METRICS
    # ==========================
    story.append(Paragraph("8. MVP Success Metrics & Rencana Rilis", h1_style))
    roadmap_data = [
        [Paragraph("Fase", table_header_style), Paragraph("Waktu", table_header_style), Paragraph("Cakupan Deliverable", table_header_style)],
        [
            Paragraph("<b>Fase 1 (MVP)</b>", table_cell_style),
            Paragraph("Minggu 1 - 3", table_cell_style),
            Paragraph("Autentikasi login, integrasi API NPSN sekolah, pembuatan grup guru, onboarding murid via Username & Scan QR kamera.", table_cell_style)
        ],
        [
            Paragraph("<b>Fase 2 (Task & Analytics)</b>", table_cell_style),
            Paragraph("Minggu 4 - 6", table_cell_style),
            Paragraph("Penugasan tugas guru (task), evaluasi progres, komputasi 3 pilar analitik, Live Progress Bar, JSON snapshot caching.", table_cell_style)
        ],
        [
            Paragraph("<b>Fase 3 (Governance & Cron)</b>", table_cell_style),
            Paragraph("Minggu 7 - 8", table_cell_style),
            Paragraph("Dasbor Pengelola Sekolah & Dinas, scheduled cron 00:00 midnight, export laporan PDF & Excel.", table_cell_style)
        ]
    ]
    t_road = Table(roadmap_data, colWidths=[110, 85, 310])
    t_road.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY_BLUE),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(t_road)
    story.append(Spacer(1, 8))

    # Kesimpulan
    story.append(Paragraph("Kesimpulan", h2_style))
    story.append(Paragraph(
        "<b>GameForSmart AnalyticsDashboard</b> menghadirkan transformasi besar bagi tata kelola pendidikan berbasis gamifikasi kuis. Dengan memadukan arsitektur data adaptif, 3 pilar analitik (Deskriptif, Prediktif, Preskriptif), onboarding QR profil kilat, pencarian NPSN nasional, serta pipeline otomatisasi cron tengah malam, platform ini menjadi jembatan pengambilan keputusan berbasis bukti bagi guru, kepala sekolah, hingga jajaran dinas pendidikan di seluruh Indonesia.",
        body_style
    ))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_path}")

if __name__ == "__main__":
    out_dir = "/home/alss/Code/Magang/UBIG/GameForSmart/AnalyticsDashboard"
    out_file = os.path.join(out_dir, "GameForSmart_AnalyticsDashboard_PRD.pdf")
    build_pdf(out_file)
