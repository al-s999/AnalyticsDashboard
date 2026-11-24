import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeAnalyticsRole, UserRole } from "@/types/auth-roles";
import {
  isValidNuptk,
  isValidSchoolPasscode
} from "@/lib/auth-verification";
import { parseGovEmailDomain } from "@/lib/gov-domains";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      fullname,
      username,
      email,
      password,
      role = "teacher",
      schoolName,
      npsn,
      verificationMethod, // 'nuptk' | 'school_code'
      nuptk,
      schoolCode,
      region
    } = body;

    // 1. Validasi input wajib dasar
    if (!fullname || !username || !email || !password) {
      return NextResponse.json(
        { error: "Nama lengkap, username, email, dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const cleanFullname = String(fullname).trim();
    const cleanUsername = String(username).toLowerCase().trim().replace(/[^a-z0-9_.-]/g, "");
    const cleanEmail = String(email).toLowerCase().trim();
    const cleanPassword = String(password);

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Username minimal 3 karakter (hanya huruf kecil, angka, titik, atau garis bawah)." },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal 6 karakter." },
        { status: 400 }
      );
    }

    // 2. Normalisasi & Validasi Role
    const normalizedRole = normalizeAnalyticsRole(role) || "teacher";
    const allowedRoles: UserRole[] = ["teacher", "school_admin", "dinas_kota", "dinas_provinsi", "dinas_nasional"];
    if (!allowedRoles.includes(normalizedRole)) {
      return NextResponse.json(
        { error: "Pilihan peran tidak valid." },
        { status: 400 }
      );
    }

    // 3. Validasi Keaslian Berdasarkan Peran & Kredensial

    // A. Role GURU (Teacher)
    if (normalizedRole === "teacher") {
      if (!schoolName) {
        return NextResponse.json(
          { error: "Pencarian sekolah (NPSN / Nama Sekolah) wajib diisi untuk Guru." },
          { status: 400 }
        );
      }

      if (!verificationMethod) {
        return NextResponse.json(
          { error: "Harap pilih metode verifikasi guru (NUPTK atau Kode Undangan Sekolah)." },
          { status: 400 }
        );
      }

      if (verificationMethod === "nuptk") {
        if (!nuptk || !isValidNuptk(String(nuptk))) {
          return NextResponse.json(
            { error: "Nomor NUPTK harus terdiri dari 16 digit angka yang valid." },
            { status: 400 }
          );
        }
      } else if (verificationMethod === "school_code") {
        if (!schoolCode || !isValidSchoolPasscode(String(schoolCode))) {
          return NextResponse.json(
            { error: "Kode Undangan Guru dari sekolah tidak valid atau kurang dari 4 karakter." },
            { status: 400 }
          );
        }
      }
    }

    // B. Role PENGELOLA SEKOLAH (Kepala Sekolah / Admin IT Sekolah)
    if (normalizedRole === "school_admin") {
      if (!schoolName) {
        return NextResponse.json(
          { error: "Sekolah dengan Nomor Pokok Sekolah Nasional (NPSN) wajib dipilih untuk Pengelola Sekolah." },
          { status: 400 }
        );
      }

      if (!schoolCode || !isValidSchoolPasscode(String(schoolCode))) {
        return NextResponse.json(
          { error: "Kode Otorisasi Satuan Pendidikan wajib diisi dan valid." },
          { status: 400 }
        );
      }
    }

    // C. Role DINAS PENDIDIKAN (Kabupaten / Kota / Provinsi / Nasional)
    let finalRole = normalizedRole;
    let finalRegion = region;

    if (normalizedRole.startsWith("dinas")) {
      const govInfo = parseGovEmailDomain(cleanEmail);
      if (!govInfo) {
        return NextResponse.json(
          {
            error:
              "Pendaftaran akun Dinas gagal: Email wajib menggunakan domain resmi pemerintahan (@*.go.id atau @kemdikbud.go.id)."
          },
          { status: 403 }
        );
      }

      // Kunci role dan region dari hasil parse domain resmi, mengabaikan klaim manual user
      finalRole = govInfo.role;
      finalRegion = govInfo.regionName;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Konfigurasi server database belum lengkap." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 4. Cek apakah username atau email sudah digunakan di public.profiles
    const { data: existingUser } = await supabaseAdmin
      .from("profiles")
      .select("id, username, email")
      .or(`username.ilike.${cleanUsername},email.ilike.${cleanEmail}`)
      .maybeSingle();

    if (existingUser) {
      if (existingUser.username?.toLowerCase() === cleanUsername) {
        return NextResponse.json(
          { error: `Username '${cleanUsername}' sudah digunakan. Silakan pilih username lain.` },
          { status: 409 }
        );
      }
      if (existingUser.email?.toLowerCase() === cleanEmail) {
        return NextResponse.json(
          { error: `Email '${cleanEmail}' sudah terdaftar. Silakan langsung login.` },
          { status: 409 }
        );
      }
    }

    // 5. Cek First-Claim Lock untuk Pengelola Sekolah
    if (normalizedRole === "school_admin" && schoolName) {
      const { data: existingAdmin } = await supabaseAdmin
        .from("profiles")
        .select("id, fullname")
        .eq("role", "school_admin")
        .eq("organization", schoolName)
        .maybeSingle();

      if (existingAdmin) {
        return NextResponse.json(
          {
            error: `Sekolah '${schoolName}' sudah memiliki Pengelola Sekolah terdaftar (${existingAdmin.fullname}). Silakan hubungi admin sekolah terkait untuk akses pengelola.`
          },
          { status: 409 }
        );
      }
    }

    // 6. Daftarkan user ke Supabase Auth
    let authUserId: string | null = null;
    const organizationName = schoolName || finalRegion || null;

    const createRes = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username: cleanUsername,
        fullname: cleanFullname,
        role: finalRole,
        organization: organizationName
      }
    });

    if (createRes.error) {
      const isAlready =
        createRes.error.message?.toLowerCase().includes("already") ||
        (createRes.error as any).status === 422;

      if (isAlready) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const orphanUser = listData?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );

        if (orphanUser) {
          authUserId = orphanUser.id;
          await supabaseAdmin.auth.admin.updateUserById(orphanUser.id, {
            password: cleanPassword,
            email_confirm: true,
            user_metadata: {
              username: cleanUsername,
              fullname: cleanFullname,
              role: finalRole
            }
          });
        } else {
          return NextResponse.json(
            { error: "Email sudah terdaftar. Silakan masuk menggunakan akun tersebut." },
            { status: 409 }
          );
        }
      } else {
        return NextResponse.json(
          { error: createRes.error.message || "Gagal membuat akun." },
          { status: 400 }
        );
      }
    } else {
      authUserId = createRes.data?.user?.id || null;
    }

    if (!authUserId) {
      return NextResponse.json(
        { error: "Gagal menginisialisasi akun pengguna." },
        { status: 500 }
      );
    }

    // 7. Simpan record di public.profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (existingProfile) {
      await supabaseAdmin
        .from("profiles")
        .update({
          username: cleanUsername,
          fullname: cleanFullname,
          email: cleanEmail,
          role: finalRole,
          organization: organizationName,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingProfile.id);
    } else {
      await supabaseAdmin
        .from("profiles")
        .insert({
          auth_user_id: authUserId,
          username: cleanUsername,
          fullname: cleanFullname,
          email: cleanEmail,
          role: finalRole,
          organization: organizationName,
          updated_at: new Date().toISOString()
        });
    }

    // 8. Cache data sekolah jika ada NPSN
    if (npsn && schoolName) {
      try {
        await supabaseAdmin.from("schools").upsert(
          {
            npsn: String(npsn),
            name: schoolName,
            status: "Aktif",
            education_level: "SMA",
            province: region || "Indonesia",
            city: region || "",
            district: "",
            updated_at: new Date().toISOString()
          },
          { onConflict: "npsn" }
        );
      } catch (schoolErr) {
        console.warn("[Register API] Non-blocking error saving school cache:", schoolErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pendaftaran berhasil! Akun resmi pendidik Anda telah aktif.",
      user: {
        username: cleanUsername,
        email: cleanEmail,
        role: normalizedRole,
        fullname: cleanFullname,
        organization: organizationName
      }
    });
  } catch (error: any) {
    console.error("[Register Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan pada server saat pendaftaran." },
      { status: 500 }
    );
  }
}
