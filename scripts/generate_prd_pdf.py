#!/usr/bin/env python3
"""
Comprehensive PDF Generator for GameForSmart AnalyticsDashboard PRD.
Faithfully renders all sections from PRD.md with high-precision layout,
balanced typography, complete tables, code blocks, and visual diagrams.
Structured cleanly across exactly 9 well-proportioned pages.
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
    HRFlowable,
    PageBreak,
    Image as RLImage
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that adds running headers and 'Halaman X dari Y' footers.
    """
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
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, page_count):
        self.saveState()
        page_w, page_h = 595.27, 841.89
        margin = 40.0

        # Header on pages 2 and later
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#1F4E79"))
            self.drawString(margin, page_h - 26, "GameForSmart - AnalyticsDashboard")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawString(margin + 160, page_h - 26, "| Product Requirements Document (PRD)")
            self.drawRightString(page_w - margin, page_h - 26, "v1.0 • Educational Intelligence")
            
            # Subtle header border
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.6)
            self.line(margin, page_h - 30, page_w - margin, page_h - 30)

        # Footer on all pages
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(margin, 22, "CONFIDENTIAL")
        self.setFont("Helvetica", 7.5)
        self.drawString(margin + 64, 22, "— GameForSmart Academic Intelligence & Monitoring Platform")
        
        page_str = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(page_w - margin, 22, page_str)

        # Subtle footer border
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(margin, 32, page_w - margin, 32)

        self.restoreState()


def build_pdf(output_path):
    # Total printable width = 595.27 - 80 = 515.27 pt
    # Printable height = 841.89 - 84 = 757.89 pt
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=42,
        bottomMargin=42
    )

    PRIMARY = colors.HexColor("#1F4E79")       # Deep Executive Navy
    SECONDARY = colors.HexColor("#2563EB")     # Bright Brand Blue
    TEXT_MAIN = colors.HexColor("#0F172A")     # Slate 900
    TEXT_MUTED = colors.HexColor("#475569")    # Slate 600
    BG_LIGHT = colors.HexColor("#F8FAFC")      # Slate 50
    BG_ALT = colors.HexColor("#F1F5F9")        # Slate 100
    BORDER_COLOR = colors.HexColor("#CBD5E1")  # Slate 300
    SUCCESS_COLOR = colors.HexColor("#15803D") # Emerald 700

    styles = getSampleStyleSheet()

    # Typography styles
    h1_style = ParagraphStyle(
        "H1_Custom",
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15.5,
        textColor=PRIMARY,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        "H2_Custom",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=SECONDARY,
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        "H3_Custom",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_MAIN,
        spaceBefore=4,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "Body_Custom",
        fontName="Helvetica",
        fontSize=8,
        leading=11.5,
        textColor=TEXT_MAIN,
        spaceAfter=3
    )

    bullet_style = ParagraphStyle(
        "Bullet_Custom",
        fontName="Helvetica",
        fontSize=8,
        leading=11.5,
        textColor=TEXT_MAIN,
        leftIndent=10,
        firstLineIndent=-7,
        spaceAfter=2
    )

    th_style = ParagraphStyle(
        "TH_Custom",
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=colors.white,
        alignment=TA_LEFT
    )

    th_center = ParagraphStyle(
        "TH_Center",
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=colors.white,
        alignment=TA_CENTER
    )

    td_style = ParagraphStyle(
        "TD_Custom",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=TEXT_MAIN
    )

    td_center = ParagraphStyle(
        "TD_Center",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=TEXT_MAIN,
        alignment=TA_CENTER
    )

    td_bold = ParagraphStyle(
        "TDBold_Custom",
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=TEXT_MAIN
    )

    code_style = ParagraphStyle(
        "Code_Custom",
        fontName="Courier",
        fontSize=6.8,
        leading=8.6,
        textColor=colors.HexColor("#0F172A")
    )

    tree_code_style = ParagraphStyle(
        "TreeCode_Custom",
        fontName="Courier",
        fontSize=6.5,
        leading=8.2,
        textColor=colors.HexColor("#0F172A")
    )

    arrow_style = ParagraphStyle(
        "ArrowStyle",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=10,
        textColor=SECONDARY,
        alignment=TA_CENTER
    )

    story = []

    def hr(thickness=0.7, color=BORDER_COLOR, before=4, after=6):
        return HRFlowable(width="100%", thickness=thickness, color=color, spaceBefore=before, spaceAfter=after)

    def wrap_code_block(code_str, title=None, is_tree=False):
        safe_str = (
            code_str.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace(" ", "&nbsp;")
            .replace("\n", "<br/>")
        )
        content = []
        if title:
            content.append(Paragraph(f"<b>{title}</b>", h3_style))
            content.append(Spacer(1, 1))
        content.append(Paragraph(f"<code>{safe_str}</code>", tree_code_style if is_tree else code_style))
        
        t = Table([[content]], colWidths=[515])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), BG_ALT),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        return KeepTogether([t, Spacer(1, 3)])

    # ========================================================
    # PAGE 1: COVER, EXECUTIVE SUMMARY & OBJECTIVES
    # ========================================================
    logo_path = "/home/alss/Code/Magang/UBIG/GameForSmart/AnalyticsDashboard/public/gameforsmartlogo.png"
    has_logo = os.path.exists(logo_path)

    header_cells = []
    if has_logo:
        img_logo = RLImage(logo_path, width=130, height=21)
        header_cells.append(img_logo)
    else:
        header_cells.append(Paragraph("<b>GameForSmart</b>", ParagraphStyle("Brand", fontName="Helvetica-Bold", fontSize=14, textColor=PRIMARY)))

    title_block = [
        Paragraph("Product Requirements Document (PRD)", ParagraphStyle("SubDoc", fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=SECONDARY, alignment=TA_RIGHT)),
        Paragraph("Educational Intelligence & Monitoring Platform", ParagraphStyle("SubName", fontName="Helvetica-Bold", fontSize=9, leading=11, textColor=PRIMARY, alignment=TA_RIGHT)),
    ]

    top_banner = Table([[header_cells[0], title_block]], colWidths=[190, 325])
    top_banner.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(top_banner)
    story.append(hr(thickness=1.2, color=PRIMARY, before=3, after=6))

    story.append(Paragraph("GameForSmart - AnalyticsDashboard", ParagraphStyle(
        "DocTitle",
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=19,
        textColor=PRIMARY,
        spaceAfter=2
    )))
    story.append(Paragraph("Cetak Biru Kebutuhan Produk & Arsitektur Sistem Intelijen Pendidikan Berbasis Gamifikasi Kuis", ParagraphStyle(
        "DocSub",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_MUTED,
        spaceAfter=5
    )))

    # Metadata Table
    meta_table_data = [
        [Paragraph("<b>Version</b>", td_bold), Paragraph("1.0 (MVP Release)", td_style),
         Paragraph("<b>Platform</b>", td_bold), Paragraph("Web Application (Responsive Desktop & Tablet-First)", td_style)],
        [Paragraph("<b>Product Name</b>", td_bold), Paragraph("GameForSmart AnalyticsDashboard", td_style),
         Paragraph("<b>Technology Stack</b>", td_bold), Paragraph("Next.js 16, Tailwind CSS v4, shadcn/ui, TypeScript, Supabase", td_style)],
        [Paragraph("<b>Target Users</b>", td_bold), Paragraph("Guru, Pengelola Sekolah (Kepsek/Admin), Dinas Pendidikan Kab/Kota, Provinsi, Nasional", td_style),
         Paragraph("<b>Core Focus</b>", td_bold), Paragraph("3-Pillar Analytics: Deskriptif, Prediktif, Preskriptif", td_style)],
    ]
    t_meta = Table(meta_table_data, colWidths=[75, 180, 85, 175])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_meta)
    story.append(hr(thickness=0.8, color=PRIMARY, before=6, after=8))

    # 1. Executive Summary
    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(Paragraph("1.1 Latar Belakang & Masalah Bisnis", h2_style))
    story.append(Paragraph(
        "Platform <b>GameForSmart</b> telah berhasil menghadirkan lingkungan belajar yang interaktif melalui gamifikasi kuis, kompetisi kuis berjenjang, dan sesi belajar mandiri (<code>learn_sessions</code> & <code>game_sessions</code>). Setiap sesi interaksi siswa menghasilkan jejak data yang sangat kaya: pola jawaban, tingkat ketelitian, kecepatan merespon (<i>response time</i>), tingkat kesulitan soal yang ditaklukkan, serta riwayat repetisi materi.",
        body_style
    ))
    story.append(Paragraph(
        "Meskipun demikian, data berharga tersebut selama ini masih terisolasi di sisi operasional game dan admin umum (<code>gameforsmartNewUI</code> dan <code>admin_dashboard</code>), tanpa adanya agregasi analitik yang dapat langsung dimanfaatkan oleh stakeholder pendidikan:",
        body_style
    ))

    stakeholder_points = [
        ("Guru (Teachers)", "Kesulitan memetakan siswa yang belum menguasai indikator pembelajaran tertentu dan membutuhkan bimbingan remedial khusus."),
        ("Pengelola Sekolah (Principals)", "Tidak memiliki alat ukur objektif untuk membandingkan kesiapan akademik antarkelas dalam menghadapi ujian resmi dan kurikulum."),
        ("Dinas Pendidikan (Kab/Kota, Prov, Nasional)", "Tidak memiliki data <i>real-time</i> berbasis bukti (<i>evidence-based policy</i>) untuk melihat sekolah mana yang telah mencapai target kompetensi nasional atau yang memerlukan intervensi bantuan kurikulum.")
    ]
    for role_name, problem_desc in stakeholder_points:
        story.append(Paragraph(f"• <b>{role_name}:</b> {problem_desc}", bullet_style))

    story.append(Spacer(1, 2))
    story.append(Paragraph(
        "<b>GameForSmart AnalyticsDashboard</b> hadir sebagai solusi intelijen pendidikan (<i>Educational Intelligence System</i>) yang mengolah big data interaksi kuis menjadi wawasan komprehensif melalui tiga pilar analitik: <b>Deskriptif</b> (kondisi saat ini), <b>Prediktif</b> (estimasi skor & kesiapan ujian), dan <b>Preskriptif</b> (deteksi kesenjangan belajar & rekomendasi remedial terarah).",
        body_style
    ))
    story.append(hr())

    # 2. Tujuan Produk (2.1)
    story.append(Paragraph("2. Tujuan Produk (Product Objectives)", h1_style))
    story.append(Paragraph("2.1 Tujuan Utama", h2_style))
    objectives_list = [
        ("1. Analisa Kemampuan Siswa Multi-Dimensi (Deskriptif)", "Memberikan gambaran akurat mengenai profil penguasaan mata pelajaran per siswa, per kelas, dan per sekolah."),
        ("2. Estimasi Kesiapan Ujian (Prediktif)", "Memprediksi potensi capaian skor ujian akhir/nasional siswa pada mata pelajaran tertentu berdasarkan trend historis data kuis, lengkap dengan tingkat kesiapannya (<i>Readiness Index</i>)."),
        ("3. Penyembuhan Kesenjangan Belajar (Preskriptif)", "Menemukan topik atau indikator kompetensi dasar yang belum tuntas (<i>learning gap</i>) dan memberikan rekomendasi penugasan/remedial terarah dalam 1-klik."),
        ("4. Sentralisasi Hierarki Pendidikan", "Menghubungkan guru, pimpinan sekolah, hingga pengawas dinas pendidikan dalam satu ekosistem data yang terpadu berdasarkan Nomor Pokok Sekolah Nasional (NPSN)."),
        ("5. Aksi Nyata Pengajaran", "Menyediakan kanal penugasan tugas (<i>Task Assignment</i>) dari guru langsung ke murid dengan tracking pengerjaan real-time dan evaluasi otomatis.")
    ]
    for obj_title, obj_desc in objectives_list:
        story.append(Paragraph(f"• <b>{obj_title}:</b> {obj_desc}", bullet_style))

    # Page 1 Break
    story.append(PageBreak())

    # ========================================================
    # PAGE 2: KPI, USER PERSONAS & HIERARKI PERAN
    # ========================================================
    story.append(Paragraph("2.2 Indikator Keberhasilan (KPI)", h2_style))
    kpi_data = [
        [Paragraph("Metrik KPI", th_style), Paragraph("Target Kuantitatif", th_style), Paragraph("Metode Verifikasi & Dampak", th_style)],
        [
            Paragraph("<b>Akurasi Prediksi Ujian</b>", td_style),
            Paragraph("Korelasi hasil prediksi &ge; 85%", td_bold),
            Paragraph("Validasi skor estimasi terhadap nilai ujian riil siswa pada akhir semester.", td_style)
        ],
        [
            Paragraph("<b>Tingkat Adopsi Guru</b>", td_style),
            Paragraph("Adopsi aktif &ge; 70%", td_bold),
            Paragraph("Guru aktif mengelola grup dan memberikan minimal 2 penugasan/remedial per bulan.", td_style)
        ],
        [
            Paragraph("<b>Kecepatan Akses Analitik</b>", td_style),
            Paragraph("Cached < 1.5s | Batch < 15s", td_bold),
            Paragraph("Pemuatan dashboard cached cepat; batch recalculation disertai live progress bar.", td_style)
        ],
        [
            Paragraph("<b>Cakupan Sekolah Nasional</b>", td_style),
            Paragraph("Direktori NPSN 100% Valid", td_bold),
            Paragraph("Terintegrasi dengan database referensi Kemendikdasmen untuk pemetaan otomatis.", td_style)
        ]
    ]
    t_kpi = Table(kpi_data, colWidths=[130, 125, 260])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(t_kpi)
    story.append(hr(before=6, after=8))

    # 3. User Personas & Hierarki Peran
    story.append(Paragraph("3. User Personas & Hierarki Peran", h1_style))
    story.append(Paragraph("Hierarchical Role-Based Access Control (HRBAC)", h2_style))
    story.append(Paragraph(
        "Platform dirancang dengan hierarki akses berjenjang dari tingkat kementerian nasional hingga ke ruang kelas:",
        body_style
    ))

    hierarchy_rows = [
        ("Dinas Pendidikan Nasional", "Skala Makro Seluruh Indonesia • Evaluasi Kebijakan & Komparasi Mutu Lintas Provinsi", "#1E3A8A"),
        ("↓", "", ""),
        ("Dinas Pendidikan Provinsi", "Skala Regional Provinsi • Pengawasan Jenjang Menengah (SMA, SMK, SLB) & Komparasi Kab/Kota", "#1D4ED8"),
        ("↓", "", ""),
        ("Dinas Pendidikan Kab/Kota", "Skala Daerah Kab/Kota • Pengawasan Jenjang Dasar (PAUD/TK, SD, SMP) & Distribusi Mutu Sekolah", "#2563EB"),
        ("↓", "", ""),
        ("Pengelola Sekolah (Kepala Sekolah / Admin IT)", "Satuan Pendidikan (Per NPSN) • Pemantauan Seluruh Rombel/Kelas, Guru, dan Kesiapan Kelulusan", "#0284C7"),
        ("↓", "", ""),
        ("Guru Mata Pelajaran / Wali Kelas", "Tingkat Kelas/Rombel Asuhan • Analitik Individu Siswa, Task Assignment, dan Remedial Preskriptif", "#0D9488"),
        ("↓", "", ""),
        ("Murid GameForSmart (Subjek Edukasi)", "Pengerjaan Sesi Kuis, Latihan Mandiri, dan Penyelesaian Tugas Guru", "#475569"),
    ]

    h_table_content = []
    for item in hierarchy_rows:
        if item[0] == "↓":
            h_table_content.append([Paragraph("↓", arrow_style)])
        else:
            box_html = f"<font color='white'><b>{item[0]}</b></font><br/><font color='#E2E8F0' size=6.5>{item[1]}</font>"
            p_box = Paragraph(box_html, ParagraphStyle("HBox", fontName="Helvetica", fontSize=7.5, leading=9.5, alignment=TA_CENTER))
            cell_table = Table([[p_box]], colWidths=[495])
            cell_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(item[2])),
                ('TOPPADDING', (0,0), (-1,-1), 2.5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            h_table_content.append([cell_table])

    t_hierarchy = Table(h_table_content, colWidths=[515])
    t_hierarchy.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_hierarchy)
    story.append(Spacer(1, 4))

    story.append(Paragraph("3.1 Profil Peran Pengguna", h2_style))
    roles_table_data = [
        [Paragraph("Peran (Role)", th_style), Paragraph("Profil & Tanggung Jawab", th_style), Paragraph("Cakupan Pengawasan (Scope)", th_style)],
        [
            Paragraph("<b>Guru (Teacher)</b>", td_style),
            Paragraph("Pendidik di sekolah yang membina satu atau beberapa kelas pada jenjang/tingkat tertentu. Membutuhkan detail per individu siswa.", td_style),
            Paragraph("Grup/kelas asuhan guru tersebut (dapat lintas jenjang/tingkat sesuai penugasan mengajar).", td_style)
        ],
        [
            Paragraph("<b>Pengelola Sekolah</b><br/>(Kepsek / Admin)", td_style),
            Paragraph("Kepala Sekolah, Wakil Kepala Kurikulum, atau Admin IT Sekolah yang memantau kualitas institusi.", td_style),
            Paragraph("Seluruh kelas, seluruh jenjang, dan seluruh guru di dalam satuan pendidikan (NPSN) yang dikelolanya.", td_style)
        ],
        [
            Paragraph("<b>Dinas Kab/Kota</b>", td_style),
            Paragraph("Pejabat dinas tingkat kabupaten/kota (misal: Disdik Kota Surabaya). Memantau jenjang PAUD/TK, SD, SMP di daerahnya.", td_style),
            Paragraph("Seluruh sekolah (NPSN) yang berada dalam yurisdiksi kabupaten/kota terkait.", td_style)
        ],
        [
            Paragraph("<b>Dinas Provinsi</b>", td_style),
            Paragraph("Pejabat dinas tingkat provinsi (misal: Disdik Jawa Timur). Memantau jenjang SMA, SMK, dan SLB.", td_style),
            Paragraph("Seluruh kabupaten/kota dan seluruh sekolah tingkat menengah di provinsi terkait.", td_style)
        ],
        [
            Paragraph("<b>Dinas Nasional</b><br/>(Kemendikdasmen)", td_style),
            Paragraph("Kementerian Pendidikan Dasar dan Menengah. Analisis makro mutu pendidikan nasional.", td_style),
            Paragraph("Agregasi nasional seluruh provinsi, kabupaten/kota, dan sekolah di Indonesia.", td_style)
        ]
    ]
    t_roles = Table(roles_table_data, colWidths=[105, 215, 195])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(t_roles)

    # Page 2 Break
    story.append(PageBreak())

    # ========================================================
    # PAGE 3: PERMISSION MATRIX & SCOPE OF PRODUCT
    # ========================================================
    story.append(Paragraph("3.2 Permission Matrix (Matriks Hak Akses)", h1_style))
    matrix_data = [
        [Paragraph("Modul / Fitur", th_style),
         Paragraph("Guru", th_center),
         Paragraph("Sekolah", th_center),
         Paragraph("Disdik Kab/Kota", th_center),
         Paragraph("Disdik Provinsi", th_center),
         Paragraph("Disdik Nasional", th_center)],
        [Paragraph("Login & Profil Pengguna", td_style), Paragraph("Semua", td_center), Paragraph("Semua", td_center), Paragraph("Semua", td_center), Paragraph("Semua", td_center), Paragraph("Semua", td_center)],
        [Paragraph("Cari & Klaim NPSN Sekolah", td_style), Paragraph("Terikat Akun", td_center), Paragraph("Admin Utama", td_center), Paragraph("View Regional", td_center), Paragraph("View Regional", td_center), Paragraph("View Nasional", td_center)],
        [Paragraph("Bentuk Grup Pengawasan", td_style), Paragraph("Buat / Ubah", td_center), Paragraph("Kelola Semua", td_center), Paragraph("Hanya Baca", td_center), Paragraph("Hanya Baca", td_center), Paragraph("Hanya Baca", td_center)],
        [Paragraph("Tambah Murid via Username / QR", td_style), Paragraph("Ya", td_center), Paragraph("Ya", td_center), Paragraph("Tidak", td_center), Paragraph("Tidak", td_center), Paragraph("Tidak", td_center)],
        [Paragraph("Berikan Task / Tugas ke Murid", td_style), Paragraph("Ya", td_center), Paragraph("Tidak", td_center), Paragraph("Tidak", td_center), Paragraph("Tidak", td_center), Paragraph("Tidak", td_center)],
        [Paragraph("Evaluasi Progres Tugas", td_style), Paragraph("Ya", td_center), Paragraph("Monitoring", td_center), Paragraph("Tidak", td_center), Paragraph("Tidak", td_center), Paragraph("Tidak", td_center)],
        [Paragraph("Analitik Deskriptif Siswa (Individu)", td_style), Paragraph("Ya", td_center), Paragraph("Ya (Sekolah)", td_center), Paragraph("Anonymized", td_center), Paragraph("Anonymized", td_center), Paragraph("Anonymized", td_center)],
        [Paragraph("Analitik Prediktif (Skor & Kesiapan)", td_style), Paragraph("Kelas Guru", td_center), Paragraph("Semua Kelas", td_center), Paragraph("Agregat Sekolah", td_center), Paragraph("Agregat Kab/Kota", td_center), Paragraph("Agregat Provinsi", td_center)],
        [Paragraph("Analitik Preskriptif (Gap Materi)", td_style), Paragraph("Kelas Guru", td_center), Paragraph("Semua Kelas", td_center), Paragraph("Trend Wilayah", td_center), Paragraph("Trend Wilayah", td_center), Paragraph("Trend Nasional", td_center)],
        [Paragraph("Trigger Update Analisis (On-Demand)", td_style), Paragraph("Ya (Grup)", td_center), Paragraph("Ya (Sekolah)", td_center), Paragraph("Ya (Wilayah)", td_center), Paragraph("Ya (Wilayah)", td_center), Paragraph("Ya (Nasional)", td_center)],
        [Paragraph("Export Laporan (PDF / Excel)", td_style), Paragraph("Ya", td_center), Paragraph("Ya", td_center), Paragraph("Ya", td_center), Paragraph("Ya", td_center), Paragraph("Ya", td_center)],
    ]
    t_mat = Table(matrix_data, colWidths=[150, 70, 75, 75, 75, 70])
    t_mat.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(t_mat)
    story.append(hr(before=6, after=8))

    # 4. Scope of Product
    story.append(Paragraph("4. Scope of Product", h1_style))
    story.append(Paragraph("4.1 In Scope (Fase 1 / MVP)", h2_style))
    
    in_scope_list = [
        ("Sistem Autentikasi Terpadu", "Mekanisme login sama dengan App,GameForSmart, dengan sedikit penyesuaian."),
        ("Integrasi Master Data NPSN", "Pencarian instan database sekolah seluruh Indonesia berdasarkan NPSN dan wilayah (Provinsi, Kab/Kota, Kecamatan) via API."),
        ("Grup & Onboarding Murid", "Pembuatan grup/kelas pengawasan oleh guru. Penambahan murid via invite username & pemindaian (Scan) QR Code profil murid."),
        ("Manajemen Task / Penugasan", "Pembuatan tugas kuis materi spesifik dengan deadline. Pelacakan status pengerjaan (Belum Mengerjakan, Sedang dikerjakan, Selesai) & evaluasi otomatis."),
        ("Mesin Analitik 3 Pilar", "Deskriptif (penguasaan mapel, akurasi, waktu respon, konsistensi belajar), Prediktif (estimasi skor ujian 0-100 & indeks kesiapan), Preskriptif (learning gaps & aksi remedial)."),
        ("Pipeline Snapshot & Caching", "Live progress bar saat data ditarik dan dihitung via API, penyimpanan JSON Snapshot, penanda waktu Last Update, trigger manual, dan scheduled cron 00:00 (tengah malam)."),
        ("Dasbor Berjenjang Sesuai Peran", "Tampilan analitik dinamis mengikuti cakupan Guru (kelas), Sekolah (antarkelas/NPSN), dan Dinas Pendidikan (daerah & nasional).")
    ]
    for title, desc in in_scope_list:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 3))
    story.append(Paragraph("4.2 Out of Scope (Batasan Sistem)", h2_style))
    out_scope_list = [
        ("Pembuatan & Editor Kuis Baru", "Pembuatan soal, media pertanyaan, dan materi kuis tetap dilakukan di App GameForSmart."),
        ("Gameplay / Pengerjaan Kuis Siswa", "Siswa memainkan game kuis dan sesi latihan langsung di GameForSmart, dasbor ini hanya mengumpulkan data histori dan mengevaluasi hasil pengerjaan."),
        ("Manajemen Akun Siswa & Gamifikasi", "Pengelolaan profil siswa dilakukan di App GameForSmart."),
        ("Aplikasi Mobile Terpisah", "Fokus dasbor adalah Web Responsive (Desktop & Mobile) untuk kemudahan analisis visual data bagi guru, kepala sekolah, dan dinas.")
    ]
    for title, desc in out_scope_list:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    # Page 3 Break
    story.append(PageBreak())

    # ========================================================
    # PAGE 4: FUNCTIONAL SPECIFICATIONS (MODUL 1 - 4)
    # ========================================================
    story.append(Paragraph("Spesifikasi Fungsional Modul (Module Specifications)", h1_style))
    
    # Modul 1
    story.append(Paragraph("Modul 1: Autentikasi & Akun Pengguna", h2_style))
    story.append(Paragraph("<b>1.1 Deskripsi:</b> Menyediakan gerbang masuk yang aman dan terintegrasi dengan akun GameForSmart. Tampilan dan alur login mengadopsi struktur visual dan kenyamanan UI dari <code>gameforsmartNewUI</code> (sama dengan App GameForSmart, dengan sedikit penyesuaian).", body_style))
    story.append(Paragraph("<b>1.2 Alur & Fitur Spesifik:</b>", body_style))
    story.append(Paragraph("• <b>Formulir Login:</b> Input <code>Username / Email</code> dan <code>Password</code> dengan toggle show/hide kata sandi.", bullet_style))
    story.append(Paragraph("• <b>Sesi & Keamanan:</b> Sesi pengguna tersimpan di HTTP-only cookie dengan token refresh berkala.", bullet_style))
    story.append(Paragraph("• <b>Role Redirection Otomatis:</b> Setelah otentikasi berhasil, sistem memeriksa peran di tabel <code>profiles</code>:<br/>"
                           "&nbsp;&nbsp;- Peran <code>guru</code> &rarr; dialihkan ke <code>/dashboard/teacher</code>.<br/>"
                           "&nbsp;&nbsp;- Peran <code>pengelola_sekolah</code> &rarr; dialihkan ke <code>/dashboard/school</code>.<br/>"
                           "&nbsp;&nbsp;- Peran <code>dinas_kabkota</code> / <code>dinas_provinsi</code> / <code>dinas_nasional</code> &rarr; dialihkan ke <code>/dashboard/dinas</code>.", bullet_style))
    story.append(Paragraph("• <b>Single Sign-On (SSO):</b> Mendukung sinkronisasi sesi aktif pada domain bersama (<code>.gameforsmart.com</code>).", bullet_style))
    story.append(Spacer(1, 3))

    # Modul 2
    story.append(Paragraph("Modul 2: Master Data Sekolah & Pencarian NPSN", h2_style))
    story.append(Paragraph("<b>2.1 Deskripsi:</b> Menghubungkan identitas pengguna dan kelompok pengawasan dengan data resmi satuan pendidikan di Indonesia.", body_style))
    story.append(Paragraph("<b>2.2 Fitur & Spesifikasi Teknis:</b>", body_style))
    story.append(Paragraph("• <b>Search by NPSN & Nama:</b> Input 8 digit NPSN atau kata kunci nama sekolah (minimal 3 karakter). Panggilan dilakukan dengan mekanisme debounce 300ms ke API gateway Dapodik.", bullet_style))
    story.append(Paragraph("• <b>Hirarki Pemilihan Wilayah:</b> Pengguna dapat menelusuri sekolah secara berjenjang: <code>Provinsi &rarr; Kab/Kota &rarr; Kecamatan &rarr; Sekolah</code>.", bullet_style))
    story.append(Paragraph("• <b>Cache-Aside Pattern:</b> Setiap sekolah yang dipilih/diklaim otomatis disimpan ke tabel lokal <code>schools</code> di PostgreSQL untuk meminimalkan beban traffic API publik dan mempercepat query berulang.", bullet_style))
    story.append(Spacer(1, 3))

    # Modul 3
    story.append(Paragraph("Modul 3: Manajemen Grup & Student Onboarding", h2_style))
    story.append(Paragraph("<b>3.1 Deskripsi:</b> Guru dapat membentuk rombel/kelompok bimbingan untuk penugasan materi dan evaluasi analitik terpusat.", body_style))
    story.append(Paragraph("<b>3.2 Metode Penambahan Murid ke Grup (2 Metode Instan):</b>", body_style))

    onboard_flow = [
        [
            Paragraph("<b>Metode 1: Ketik Username Siswa</b><br/><font size=6.5 color='#475569'>• Guru mengetik username siswa GameForSmart.<br/>• Pratinjau profil muncul & guru klik <b>'Undang ke Grup'</b>.<br/>• Siswa menerima undangan dan menyetujui untuk bergabung.</font>", td_style),
            Paragraph("<b>Metode 2: Scan QR Kamera Profil</b><br/><font size=6.5 color='#475569'>Siswa menampilkan kartu QR akun GameForSmart &rarr; Guru mengarahkan kamera &rarr; Scanner mendeteksi format <code>gfs:student:&lt;id&gt;</code> &lt;500ms &rarr; Terdaftar instan.</font>", td_style)
        ]
    ]
    t_onboard = Table(onboard_flow, colWidths=[252, 253])
    t_onboard.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#EFF6FF")),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor("#F0FDF4")),
        ('BOX', (0,0), (0,0), 0.5, SECONDARY),
        ('BOX', (1,0), (1,0), 0.5, SUCCESS_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_onboard)
    story.append(Spacer(1, 2))
    story.append(Paragraph("• <b>Struktur Fleksibel:</b> Guru dapat mengelola beberapa grup dari tingkat/jenjang berbeda (misal: 'Kelas 10-A Matematika', 'Kelas 12 UTBK Persiapan').", bullet_style))
    story.append(Spacer(1, 3))

    # Modul 4
    story.append(Paragraph("Modul 4: Manajemen Tugas (Task Assignment) & Evaluasi Progres", h2_style))
    story.append(Paragraph("<b>4.1 Deskripsi:</b> Mengubah dashboard dari sekadar sarana pemantauan pasif menjadi instrumen aksi pengajaran langsung.", body_style))
    story.append(Paragraph("<b>4.2 Fitur Penugasan & Pelacakan:</b>", body_style))
    story.append(Paragraph("• <b>Pembuatan Task:</b> Judul, instruksi, pemilihan paket materi/kuis GameForSmart, pemilihan target satu/banyak grup, dan penetapan batas waktu (<i>deadline</i>).", bullet_style))
    story.append(Paragraph("• <b>Pelacakan Status Real-Time:</b> Indikator status pengerjaan: <code>Belum Mengerjakan</code> (Abu-abu), <code>Sedang dikerjakan</code> (Kuning), <code>Selesai</code> (Hijau), dan <code>Terlambat</code> (Merah). Dilengkapi progress bar pengerjaan per siswa.", bullet_style))
    story.append(Paragraph("• <b>Evaluasi Otomatis:</b> Perhitungan instan skor akhir, akurasi per sub-indikator soal, dan durasi pengerjaan rata-rata.", bullet_style))
    story.append(Paragraph("• <b>Highlight Otomatis:</b> Penandaan visual untuk siswa unggul di atas KKM (&gt;85%) dan siswa yang memerlukan pendampingan remedial (&lt;65%).", bullet_style))

    # Page 4 Break
    story.append(PageBreak())

    # ========================================================
    # PAGE 5: FUNCTIONAL SPECIFICATIONS (MODUL 5 - 7)
    # ========================================================
    story.append(Paragraph("Modul 5: Mesin Analitik Dashboard (3 Pilar Inteligensi)", h1_style))
    story.append(Paragraph("Mesin komputasi analitik GameForSmart dirancang dengan tiga pilar berkesinambungan:", body_style))

    pillar_data = [
        [Paragraph("Pilar Analitik", th_style), Paragraph("Fokus Output & Algoritma", th_style), Paragraph("Tindakan Nyata Stakeholder", th_style)],
        [
            Paragraph("<b>Pilar 1: Deskriptif</b><br/>(Historical Mastery)", td_style),
            Paragraph("• Penguasaan materi per mapel dan jenjang.<br/>"
                      "• <b>Accuracy Rate (%):</b> rasio benar kumulatif.<br/>"
                      "• <b>Speed Index:</b> detik/soal.<br/>"
                      "• <b>Difficulty Resilience:</b> performa pada soal level Hard/HOTS.<br/>"
                      "• <b>Learning Momentum:</b> frekuensi keaktifan belajar.", td_style),
            Paragraph("Pemetaan objektif kekuatan & kelemahan materi dasar siswa dalam radar chart kompetensi.", td_style)
        ],
        [
            Paragraph("<b>Pilar 2: Prediktif</b><br/>(Exam Readiness)", td_style),
            Paragraph("• <b>Exam Score Forecast:</b> estimasi perolehan skor ujian skala 0-100 (&plusmn;5 poin error margin).<br/>"
                      "• <b>Readiness Index:</b><br/>"
                      "&nbsp;&nbsp;- <i>Sangat Siap (&ge; 85%)</i><br/>"
                      "&nbsp;&nbsp;- <i>Cukup Siap (70% - 84%)</i><br/>"
                      "&nbsp;&nbsp;- <i>Perlu Pendampingan (&lt; 70%)</i>", td_style),
            Paragraph("Simulasi kelulusan ujian dan pengelompokan kelas untuk strategi bimbingan belajar intensif.", td_style)
        ],
        [
            Paragraph("<b>Pilar 3: Preskriptif</b><br/>(Learning Gap & Remedial)", td_style),
            Paragraph("• Deteksi indikator KD belum tuntas (akurasi &lt; 65%).<br/>"
                      "• Korelasi kesalahan berulang dengan materi prasyarat.<br/>"
                      "• Pengelompokan siswa dengan tipe kelemahan materi serupa (<i>peer tutoring</i>).", td_style),
            Paragraph("Tombol 1-klik <b>'Tugaskan Remedial'</b>: otomatis membuat paket penugasan kuis relevan hanya ke siswa yang belum tuntas.", td_style)
        ]
    ]
    t_pillar = Table(pillar_data, colWidths=[110, 215, 190])
    t_pillar.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(t_pillar)
    story.append(Spacer(1, 3))

    # Modul 6
    story.append(Paragraph("Modul 6: Processing Pipeline, Progress Bar, & JSON Snapshot", h2_style))
    story.append(Paragraph("<b>6.1 Alur Pemrosesan On-Demand & Live Progress Bar:</b>", body_style))
    pipeline_steps = [
        ("Langkah 1 (0%)", "Pengguna mengklik tombol <b>'Update Analisa Sekarang'</b>. UI membuka modal live progress bar."),
        ("Langkah 2 (25%)", "Client memanggil <code>POST /api/analytics/trigger</code>. Server menarik data sesi kuis & pengerjaan dari database."),
        ("Langkah 3 (70%)", "Analytics Engine mengeksekusi komputasi 3 pilar: akurasi, estimasi skor ujian, dan deteksi learning gaps."),
        ("Langkah 4 (100%)", "Hasil agregasi disimpan ke tabel <code>analytics_snapshots</code> sebagai JSON payload. UI merefresh grafik secara instan.")
    ]
    for step_num, step_desc in pipeline_steps:
        story.append(Paragraph(f"• <b>{step_num}:</b> {step_desc}", bullet_style))

    story.append(Spacer(1, 2))
    story.append(Paragraph("<b>6.2 Struktur Penyimpanan JSON Snapshot:</b>", body_style))
    sample_json = (
        '{\n'
        '  "summary": {\n'
        '    "total_students": 32, "average_mastery": 78.4, "predicted_exam_avg": 81.2,\n'
        '    "readiness_distribution": { "ready": 18, "moderate": 10, "needs_help": 4 }\n'
        '  },\n'
        '  "subject_analysis": [\n'
        '    {\n'
        '      "subject": "Matematika", "grade": "10", "accuracy": 76.5,\n'
        '      "unmastered_topics": ["Trigonometri Dasar", "Fungsi Kuadrat"],\n'
        '      "top_performers": ["alss_dev", "budi_smart"],\n'
        '      "struggling_students": ["citra_99", "dani_k"]\n'
        '    }\n'
        '  ],\n'
        '  "student_details": [\n'
        '    {\n'
        '      "profile_id": "uuid-001", "username": "citra_99",\n'
        '      "predicted_score": 62.0, "readiness_status": "needs_help",\n'
        '      "gap_topics": ["Trigonometri Dasar"]\n'
        '    }\n'
        '  ]\n'
        '}'
    )
    story.append(wrap_code_block(sample_json, "Format JSON Agregasi pada Kolom data_snapshot"))

    story.append(Paragraph("<b>6.3 State UI & Scheduled Midnight Cron (00:00 WIB):</b>", body_style))
    story.append(Paragraph("• <b>Badge Status:</b> Menampilkan penanda waktu pembaruan terakhir: <i>'Terakhir diperbarui: Hari ini pukul 08:30 WIB'</i>.", bullet_style))
    story.append(Paragraph("• <b>Cron Job Tengah Malam (00:00 WIB):</b> Background worker berjalan otomatis setiap hari pada <b>00:00 WIB</b> untuk menghitung ulang snapshot seluruh kelas/sekolah. Menjamin saat dibuka pagi hari, data sudah terbarukan tanpa menunggu proses.", bullet_style))
    story.append(Spacer(1, 3))

    # Modul 7
    story.append(Paragraph("Modul 7: Tampilan Monitoring Berjenjang (Hierarchical Views)", h2_style))
    story.append(Paragraph("• <b>View Guru (Classroom Scope):</b> Kartu pemilihan grup aktif, visualisasi skor prediksi kelas vs KKM, grid kartu siswa dengan badge kesiapan (Hijau, Kuning, Merah), serta daftar materi yang paling banyak dijawab salah.", bullet_style))
    story.append(Paragraph("• <b>View Pengelola Sekolah (School Scope):</b> Komparasi performa antarkelas dalam satu jenjang, daftar guru/kelas dengan ketuntasan tertinggi, serta korelasi partisipasi kuis terhadap tren skor sekolah.", bullet_style))
    story.append(Paragraph("• <b>View Dinas Pendidikan (Regional & National Scope):</b> Peta mutu sebaran sekolah per kabupaten/kota, pemeringkatan indeks kesiapan ujian tingkat provinsi, dan analisis makro ketercapaian standar kompetensi nasional.", bullet_style))

    # Page 5 Break
    story.append(PageBreak())

    # ========================================================
    # PAGE 6: DATABASE DESIGN & DDL (TABLES 1 - 3)
    # ========================================================
    story.append(Paragraph("Arsitektur Data, Integrasi API & Desain Teknis", h1_style))
    story.append(Paragraph("1. Desain Skema Database", h2_style))
    story.append(Paragraph("Arsitektur database mengadopsi integrasi langsung dengan PostgreSQL/Supabase existing (<code>gameforsmartNewUI</code> & <code>admin_dashboard</code>) dengan penambahan tabel-tabel ekstensi akademik dan analitik.", body_style))

    story.append(Paragraph("1.1 Pemetaan Tabel Existing yang Digunakan:", h3_style))
    existing_tables = [
        ("profiles (GameForSmart)", "id, auth_user_id, email, fullname, avatar_url, grade, city_id, country_id. Identitas dasar siswa dan pendidik."),
        ("quizzes (GameForSmart)", "id, category, grade, description, is_public. Sumber bank materi soal untuk penugasan (Task Assignment)."),
        ("learn_sessions & game_sessions", "id, user_id, quiz_id, responses (JSON log jawaban), total_time_minutes, status. Sumber big data log interaksi."),
        ("user_activities (admin_dashboard)", "id, user_id, activity_type, created_at. Pelacakan frekuensi keterlibatan dan momentum belajar siswa.")
    ]
    for tbl_name, tbl_desc in existing_tables:
        story.append(Paragraph(f"• <b><code>{tbl_name}</code>:</b> {tbl_desc}", bullet_style))

    story.append(Spacer(1, 3))
    story.append(Paragraph("1.2 Skema Tabel Baru (Analytics & Academic Extension):", h3_style))

    ddl_schools = (
        'CREATE TABLE schools (\n'
        '    npsn VARCHAR(10) PRIMARY KEY,\n'
        '    name VARCHAR(255) NOT NULL,\n'
        '    education_level VARCHAR(20) NOT NULL, -- TK, SD, SMP, SMA, SMK\n'
        '    status VARCHAR(10) NOT NULL,          -- Negeri, Swasta\n'
        '    province VARCHAR(100) NOT NULL,\n'
        '    city VARCHAR(100) NOT NULL,\n'
        '    district VARCHAR(100) NOT NULL,\n'
        '    address TEXT,\n'
        '    created_at TIMESTAMPTZ DEFAULT NOW(),\n'
        '    updated_at TIMESTAMPTZ DEFAULT NOW()\n'
        ');'
    )
    story.append(wrap_code_block(ddl_schools, "1. Tabel schools (Data Master Satuan Pendidikan)"))

    ddl_groups = (
        'CREATE TABLE academic_groups (\n'
        '    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n'
        '    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,\n'
        '    school_npsn VARCHAR(10) REFERENCES schools(npsn),\n'
        '    name VARCHAR(150) NOT NULL,           -- Misal: "Kelas 10-A Matematika"\n'
        '    grade VARCHAR(20) NOT NULL,          -- Jenjang / Tingkat\n'
        '    subject VARCHAR(100) NOT NULL,        -- Mata Pelajaran\n'
        '    academic_year VARCHAR(20) NOT NULL,   -- Misal: "2026/2027"\n'
        '    created_at TIMESTAMPTZ DEFAULT NOW(),\n'
        '    updated_at TIMESTAMPTZ DEFAULT NOW()\n'
        ');'
    )
    story.append(wrap_code_block(ddl_groups, "2. Tabel academic_groups (Grup Pengawasan Guru)"))

    ddl_group_students = (
        'CREATE TABLE group_students (\n'
        '    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n'
        '    group_id UUID NOT NULL REFERENCES academic_groups(id) ON DELETE CASCADE,\n'
        '    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,\n'
        '    joined_method VARCHAR(20) NOT NULL,   -- \'username\' ATAU \'qr_scan\'\n'
        '    joined_at TIMESTAMPTZ DEFAULT NOW(),\n'
        '    UNIQUE(group_id, student_id)\n'
        ');'
    )
    story.append(wrap_code_block(ddl_group_students, "3. Tabel group_students (Anggota Siswa dalam Grup)"))

    # Page 6 Break
    story.append(PageBreak())

    # ========================================================
    # PAGE 7: DATABASE DDL (4-6) & INTEGRASI API NPSN
    # ========================================================
    ddl_tasks = (
        'CREATE TABLE student_tasks (\n'
        '    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n'
        '    teacher_id UUID NOT NULL REFERENCES profiles(id),\n'
        '    group_id UUID NOT NULL REFERENCES academic_groups(id) ON DELETE CASCADE,\n'
        '    quiz_id UUID NOT NULL REFERENCES quizzes(id),\n'
        '    title VARCHAR(200) NOT NULL,\n'
        '    instructions TEXT,\n'
        '    deadline TIMESTAMPTZ NOT NULL,\n'
        '    created_at TIMESTAMPTZ DEFAULT NOW()\n'
        ');\n\n'
        'CREATE TABLE task_submissions (\n'
        '    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n'
        '    task_id UUID NOT NULL REFERENCES student_tasks(id) ON DELETE CASCADE,\n'
        '    student_id UUID NOT NULL REFERENCES profiles(id),\n'
        '    learn_session_id UUID REFERENCES learn_sessions(id),\n'
        '    score NUMERIC(5,2) DEFAULT 0,\n'
        '    accuracy NUMERIC(5,2) DEFAULT 0,\n'
        '    duration_seconds INT DEFAULT 0,\n'
        '    status VARCHAR(20) DEFAULT \'submitted\', -- \'in_progress\', \'submitted\', \'late\'\n'
        '    submitted_at TIMESTAMPTZ DEFAULT NOW()\n'
        ');'
    )
    story.append(wrap_code_block(ddl_tasks, "4 & 5. Tabel student_tasks & task_submissions (Penugasan & Evaluasi)"))

    ddl_snapshots = (
        'CREATE TABLE analytics_snapshots (\n'
        '    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n'
        '    scope_level VARCHAR(20) NOT NULL,     -- \'group\', \'school\', \'city\', \'province\', \'national\'\n'
        '    scope_id VARCHAR(100) NOT NULL,       -- group_id, school_npsn, kode_wilayah\n'
        '    trigger_type VARCHAR(20) NOT NULL,    -- \'manual_user\', \'scheduled_cron\'\n'
        '    data_snapshot JSONB NOT NULL,         -- JSON agregat analitik lengkap\n'
        '    metrics_summary JSONB,                -- Ringkasan cepat metrik (avg score, readiness)\n'
        '    generated_by UUID REFERENCES profiles(id),\n'
        '    created_at TIMESTAMPTZ DEFAULT NOW()\n'
        ');\n'
        'CREATE INDEX idx_analytics_snapshots_lookup\n'
        'ON analytics_snapshots (scope_level, scope_id, created_at DESC);'
    )
    story.append(wrap_code_block(ddl_snapshots, "6. Tabel analytics_snapshots (Penyimpanan JSON Agregat Analitik)"))
    story.append(hr(before=4, after=6))

    # 2. Integrasi API Data Sekolah Indonesia
    story.append(Paragraph("2. Integrasi API Data Sekolah Indonesia (NPSN Search API)", h1_style))
    story.append(Paragraph(
        "Untuk mengakomodasi kebutuhan pencarian data sekolah seluruh Indonesia berdasarkan NPSN dan wilayah, sistem memanfaatkan integrasi API Gateway Dapodik dengan skema Proxy Caching:",
        body_style
    ))

    api_endpoints = (
        'GET https://api-sekolah-indonesia.vercel.app/sekolah/s?sekolah={query}\n'
        'GET https://api-sekolah-indonesia.vercel.app/sekolah?npsn={npsn}\n'
        'GET https://api-sekolah-indonesia.vercel.app/sekolah/{jenjang}?page={page}&perPage={perPage}'
    )
    story.append(wrap_code_block(api_endpoints, "Endpoint Referensi API Sekolah Indonesia"))

    sample_api_json = (
        '{\n'
        '  "status": "success",\n'
        '  "dataSekolah": [\n'
        '    {\n'
        '      "id": "uuid", "sekolah": "SMAN 1 SURABAYA", "npsn": "20532247",\n'
        '      "bentuk": "SMA", "status": "NEGERI",\n'
        '      "alamat_jalan": "Jl. Wijaya Kusuma No. 48",\n'
        '      "kecamatan": "Kec. Genteng", "kabupaten_kota": "Kota Surabaya",\n'
        '      "propinsi": "Prov. Jawa Timur"\n'
        '    }\n'
        '  ]\n'
        '}'
    )
    story.append(wrap_code_block(sample_api_json, "Format Output JSON Pencarian NPSN"))

    story.append(Paragraph("<b>Arsitektur Caching & Fallback Lokal (Proxy Route):</b>", body_style))
    story.append(Paragraph("• Panggilan client selalu diarahkan ke route internal: <code>GET /api/schools/search?q={query}</code>.", bullet_style))
    story.append(Paragraph("• Next.js server terlebih dahulu mencari di tabel database lokal <code>schools</code>.", bullet_style))
    story.append(Paragraph("• Jika data belum ada di lokal, server memanggil API Sekolah Indonesia, menyajikannya ke client, dan secara otomatis menyimpannya ke tabel <code>schools</code> (<i>Cache-Aside Pattern</i>).", bullet_style))

    # Page 7 Break
    story.append(PageBreak())

    # ========================================================
    # PAGE 8: API ANALYTICS, CRON & NFR ARCHITECTURE
    # ========================================================
    story.append(Paragraph("3. Spesifikasi API Pemrosesan Analitik & Cron Job", h1_style))
    story.append(Paragraph("<b>3.1 Endpoint Trigger Analitik Asinkron:</b>", body_style))
    story.append(Paragraph("• <b><code>POST /api/analytics/trigger</code>:</b> Memulai komputasi analitik batch dengan body permintaan:", bullet_style))
    
    trigger_payload = (
        '// Request Payload\n'
        '{\n'
        '  "scope_level": "group", "scope_id": "8b9a1179-843e-4b47-b5b5-f123456789ab",\n'
        '  "subject": "Matematika", "grade": "10"\n'
        '}\n\n'
        '// Response (202 Accepted)\n'
        '{\n'
        '  "job_id": "job-an-9921", "status": "processing", "estimated_duration_seconds": 6\n'
        '}'
    )
    story.append(wrap_code_block(trigger_payload, "Payload Body POST /api/analytics/trigger"))

    story.append(Paragraph("• <b><code>GET /api/analytics/progress?job_id={job_id}</code>:</b> Menyediakan stream Server-Sent Events (SSE) progres kalkulasi (0% &rarr; 25% &rarr; 70% &rarr; 100%) langsung ke UI Progress Bar.", bullet_style))
    story.append(Spacer(1, 2))

    story.append(Paragraph("<b>3.2 Scheduled Midnight Cron Worker (Jam 00:00 WIB):</b>", body_style))
    story.append(Paragraph("Dieksekusi via handler <code>/api/cron/daily-analytics</code> dengan workflow terotomasi:", body_style))
    cron_steps = [
        "1. Mengidentifikasi seluruh grup belajar aktif dan satuan pendidikan dengan aktivitas kuis pada 24 jam terakhir.",
        "2. Menjalankan agregasi batch analitik Deskriptif, Prediktif, dan Preskriptif.",
        "3. Memasukkan rekaman baru ke tabel <code>analytics_snapshots</code> dengan <code>trigger_type: 'scheduled_cron'</code>.",
        "4. Membersihkan snapshot usang yang berusia lebih dari 90 hari secara otomatis."
    ]
    for c_step in cron_steps:
        story.append(Paragraph(f"&nbsp;&nbsp;• {c_step}", bullet_style))

    story.append(hr(before=4, after=6))

    # 4. Non-Functional Requirements (NFR)
    story.append(Paragraph("4. Non-Functional Requirements (NFR)", h1_style))
    nfr_table_data = [
        [Paragraph("Kategori NFR", th_style), Paragraph("Target Metrik / Spesifikasi Teknis", th_style)],
        [
            Paragraph("<b>Performa & Response Time</b>", td_style),
            Paragraph("• Pemuatan dashboard cached snapshot: <b>&le; 1.5 detik</b>.<br/>"
                      "• Autocomplete pencarian NPSN & sekolah: <b>&le; 300 ms</b>.<br/>"
                      "• Waktu pemrosesan analitik on-demand untuk grup 100 siswa: <b>&le; 15 detik</b>.", td_style)
        ],
        [
            Paragraph("<b>Ketersediaan & Reliabilitas</b>", td_style),
            Paragraph("• Uptime ketersediaan sistem: <b>&ge; 99.5%</b> dengan dukungan Supabase High Availability.<br/>"
                      "• Graceful error handling dengan fallback lokal jika API eksternal mengalami timeout.", td_style)
        ],
        [
            Paragraph("<b>Keamanan & Row-Level Security</b>", td_style),
            Paragraph("• <b>Row-Level Security (RLS) PostgreSQL:</b><br/>"
                      "&nbsp;&nbsp;- Guru hanya dapat mengakses kelas & tugas miliknya.<br/>"
                      "&nbsp;&nbsp;- Pengelola Sekolah hanya dapat mengakses data dalam NPSN terdaftar.<br/>"
                      "&nbsp;&nbsp;- Dinas Pendidikan hanya dapat melihat statistik agregat anonim di yurisdiksinya.<br/>"
                      "• Proteksi API: <i>Rate limiting</i> maksimum 5 kali manual update per jam per user.", td_style)
        ],
        [
            Paragraph("<b>Audit Trail & Logging</b>", td_style),
            Paragraph("Pencatatan riwayat otomatis untuk setiap penambahan siswa ke grup, pembuatan task baru, dan eksekusi trigger pembaruan analitik.", td_style)
        ]
    ]
    t_nfr = Table(nfr_table_data, colWidths=[125, 390])
    t_nfr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(t_nfr)
    story.append(Spacer(1, 4))

    # Architecture Callout Box to fill Page 8 gracefully
    arch_callout = [
        Paragraph("<b>Ringkasan Prinsip Arsitektur Keamanan & Skalabilitas</b>", ParagraphStyle("ArchH", fontName="Helvetica-Bold", fontSize=8, leading=10.5, textColor=PRIMARY)),
        Spacer(1, 2),
        Paragraph("• <b>Multi-Tenancy Terisolasi:</b> Akses data per sekolah (NPSN) dan per kelas dibatasi ketat pada lapisan database PostgreSQL (RLS), menjamin privasi nilai dan profil siswa antar-institusi.<br/>"
                  "• <b>Cache-First Performance:</b> Query dasbor selalu menyajikan data agregasi dari snapshot JSON terakhir untuk kecepatan muat &lt;1.5s, menghindari lonjakan query agregat berat pada database operasional saat jam sibuk pembelajaran.<br/>"
                  "• <b>Asynchronous Resilience:</b> Pembaruan data manual diproses secara asinkron dengan polling Server-Sent Events, mencegah thread client terblokir.", body_style)
    ]
    t_arch = Table([[arch_callout]], colWidths=[515])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.6, SECONDARY),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_arch)

    # Page 8 Break
    story.append(PageBreak())

    # ========================================================
    # PAGE 9: DIRECTORY, ROADMAP, CONCLUSION & SIGN-OFF
    # ========================================================
    # 5. Struktur Direktori Proyek
    story.append(Paragraph("5. Struktur Direktori Proyek (AnalyticsDashboard)", h1_style))
    dir_tree = (
        'AnalyticsDashboard/\n'
        '|-- app/\n'
        '|   |-- (auth)/login/              # Halaman login identik GameForSmart\n'
        '|   |-- (dashboard)/               # Shell dasbor terpadu (Header + AppSidebar)\n'
        '|   |   |-- teacher/               # View Guru (Grup, Task, Siswa, Evaluasi)\n'
        '|   |   |-- school/                # View Pengelola Sekolah (Benchmark Antarkelas)\n'
        '|   |   \\-- dinas/                 # View Dinas Kab/Kota, Prov, Nasional\n'
        '|   |-- api/\n'
        '|   |   |-- analytics/             # Trigger & Progress SSE batch engine\n'
        '|   |   |-- cron/daily-analytics/  # Handler otomatisasi snapshot jam 00:00\n'
        '|   |   \\-- schools/search/        # Proxy caching Dapodik NPSN\n'
        '|   |-- globals.css & themes.css   # Tailwind CSS v4 & theme presets\n'
        '|-- components/\n'
        '|   |-- ui/                        # Koleksi 60+ komponen antarmuka shadcn UI\n'
        '|   |-- analytics/                 # Visualisasi kartu & gauge analitik 3 pilar\n'
        '|   |-- onboarding/                # Student QR Scanner & Username Invite\n'
        '|   \\-- layout/                    # Header, AppSidebar, NavMain, UserMenu\n'
        '|-- hooks/ & lib/                  # use-mobile, use-toast, Supabase client & types\n'
        '\\-- types/                         # TypeScript interfaces & contract definitions'
    )
    story.append(wrap_code_block(dir_tree, "Struktur Folder Modul AnalyticsDashboard", is_tree=True))
    story.append(Spacer(1, 2))

    # 6. Roadmap
    story.append(Paragraph("6. MVP Success Metrics & Rencana Rilis", h1_style))
    roadmap_table_data = [
        [Paragraph("Fase Rilis", th_style), Paragraph("Target Waktu", th_style), Paragraph("Cakupan Deliverable Utama", th_style)],
        [
            Paragraph("<b>Fase 1 (MVP Foundation)</b>", td_style),
            Paragraph("Minggu 1 - 3", td_bold),
            Paragraph("Autentikasi terpadu, Integrasi API Dapodik NPSN, Pembuatan Grup Guru, Onboarding Siswa (Ketik Username & Scan QR Kamera), dan Proteksi RLS Supabase.", td_style)
        ],
        [
            Paragraph("<b>Fase 2 (Task & Analytics Core)</b>", td_style),
            Paragraph("Minggu 4 - 6", td_bold),
            Paragraph("Manajemen Task Penugasan Guru, Evaluasi Progres Real-Time, Komputasi 3 Pilar Analitik (Deskriptif, Prediktif, Preskriptif), Live Progress Bar, dan Caching Snapshot JSON.", td_style)
        ],
        [
            Paragraph("<b>Fase 3 (Multi-Level & Automation)</b>", td_style),
            Paragraph("Minggu 7 - 8", td_bold),
            Paragraph("Dasbor Monitoring Pengelola Sekolah & Dinas Pendidikan, Scheduled Midnight Cron (00:00 WIB), Export Laporan Analitik ke PDF & Excel, dan Audit Trail.", td_style)
        ]
    ]
    t_road = Table(roadmap_table_data, colWidths=[115, 80, 320])
    t_road.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(t_road)
    story.append(Spacer(1, 3))

    # Executive Conclusion Box
    conclusion_content = [
        Paragraph("<b>Kesimpulan Eksekutif</b>", ParagraphStyle("ConclH", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=PRIMARY)),
        Spacer(1, 1),
        Paragraph(
            "<b>GameForSmart AnalyticsDashboard</b> mentransformasi big data interaksi gamifikasi kuis menjadi instrumen pengambilan keputusan pendidikan berbasis bukti (<i>evidence-based education</i>). Dengan memadukan komputasi 3 pilar analitik, integrasi direktori NPSN nasional, QR scanner onboarding murid yang responsif, penugasan tugas langsung, serta otomatisasi snapshot tengah malam, platform ini menjembatani kolaborasi guru, kepala sekolah, hingga kementerian pendidikan nasional secara terukur, transparan, dan berkelanjutan.",
            body_style
        ),
        Spacer(1, 1),
        Paragraph(
            "<i>Dokumen Product Requirements Document (PRD) ini disahkan sebagai spesifikasi fungsional dan teknis resmi untuk pengembangan sistem GameForSmart AnalyticsDashboard.</i>",
            ParagraphStyle("ConclItalic", fontName="Helvetica-Oblique", fontSize=7, leading=9.5, textColor=TEXT_MUTED, alignment=TA_CENTER)
        )
    ]
    t_conclusion = Table([[conclusion_content]], colWidths=[515])
    t_conclusion.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.6, PRIMARY),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_conclusion)
    story.append(Spacer(1, 3))

    # Formal Sign-off Sheet
    story.append(Paragraph("Lembar Pengesahan Dokumen (Document Approval & Sign-Off)", h2_style))
    signoff_data = [
        [
            Paragraph("Disusun Oleh (Author)", th_style),
            Paragraph("Direview Oleh (Technical Lead)", th_style),
            Paragraph("Disetujui Oleh (Stakeholder)", th_style)
        ],
        [
            Paragraph(
                "<b>Lead Product Analyst</b><br/>"
                "<font size=6 color='#475569'>Product Management Team</font><br/><br/>"
                "Status: <b>[ VERIFIED & SUBMITTED ]</b><br/>"
                "<font size=6 color='#475569'>Tanggal: 23 November 2026</font>",
                td_style
            ),
            Paragraph(
                "<b>Lead System Architect</b><br/>"
                "<font size=6 color='#475569'>Fullstack & Database Engineer</font><br/><br/>"
                "Status: <b>[ TECHNICAL APPROVED ]</b><br/>"
                "<font size=6 color='#475569'>Tanggal: 23 November 2026</font>",
                td_style
            ),
            Paragraph(
                "<b>Head of Education Intelligence</b><br/>"
                "<font size=6 color='#475569'>GameForSmart Directorate</font><br/><br/>"
                "Status: <b>[ AUTHORIZED FOR RELEASE ]</b><br/>"
                "<font size=6 color='#475569'>Tanggal: 23 November 2026</font>",
                td_style
            )
        ]
    ]
    t_signoff = Table(signoff_data, colWidths=[171, 172, 172])
    t_signoff.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white]),
    ]))
    story.append(t_signoff)
    story.append(Spacer(1, 3))

    # Document History Control
    story.append(Paragraph("Riwayat Perubahan Dokumen (Revision History)", h2_style))
    history_data = [
        [Paragraph("Versi", th_center), Paragraph("Tanggal", th_center), Paragraph("Penyusun", th_style), Paragraph("Deskripsi Perubahan", th_style)],
        [
            Paragraph("<b>v1.0 (Rev)</b>", td_center),
            Paragraph("23/11/2026", td_center),
            Paragraph("Product & Tech Team", td_style),
            Paragraph("Pembaruan PRD: Penyelarasan login App GameForSmart, onboarding invite username & approval, status pengerjaan task (Belum/Sedang dikerjakan/Selesai), learning momentum, serta penegasan Web Responsive Desktop & Mobile.", td_style)
        ]
    ]
    t_hist = Table(history_data, colWidths=[55, 75, 125, 260])
    t_hist.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white]),
    ]))
    story.append(t_hist)

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_path}")


if __name__ == "__main__":
    out_dir = "/home/alss/Code/Magang/UBIG/GameForSmart/AnalyticsDashboard"
    out_file = os.path.join(out_dir, "GameForSmart_AnalyticsDashboard_PRD.pdf")
    build_pdf(out_file)
