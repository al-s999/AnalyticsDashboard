"use client";

import React, { useState } from "react";
import {
  School,
  Search,
  Filter,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Building2,
  Download
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { INDONESIAN_SCHOOLS_DATA } from "@/data/indonesian-schools";
import { useAnalyticsAuth } from "@/contexts/analytics-auth-context";

export default function DinasSchoolsPage() {
  const { role, user } = useAnalyticsAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Filter sekolah berdasarkan cakupan yurisdiksi dinas
  let baseSchools = INDONESIAN_SCHOOLS_DATA;
  if (role === "dinas_kab" || role === "dinas_kota" || (role as string) === "dinas_kabkota") {
    const city = user?.scope.city || "Kota Surabaya";
    baseSchools = INDONESIAN_SCHOOLS_DATA.filter((s) => s.city.toLowerCase() === city.toLowerCase());
  } else if (role === "dinas_provinsi") {
    const prov = user?.scope.province || "Jawa Timur";
    baseSchools = INDONESIAN_SCHOOLS_DATA.filter((s) => s.province.toLowerCase().includes("jawa timur"));
  }

  const filtered = baseSchools.filter((sch) => {
    const matchQ =
      !searchQuery ||
      sch.npsn.includes(searchQuery) ||
      sch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sch.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sch.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchL = selectedLevel === "all" || sch.level === selectedLevel;
    const matchS = selectedStatus === "all" || sch.status === selectedStatus;

    return matchQ && matchL && matchS;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Daftar Satuan Pendidikan Wilayah</h1>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              {role === "dinas_nasional" ? "Nasional" : user?.scope.city || user?.scope.province}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Database sekolah terakreditasi berdasarkan cakupan wilayah kerja dinas pendidikan.
          </p>
        </div>

        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs rounded-xl">
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor Rekap Wilayah</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan NPSN, Nama Sekolah, atau Kecamatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-32 h-9 text-xs rounded-xl">
                <SelectValue placeholder="Jenjang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenjang</SelectItem>
                <SelectItem value="SD">SD</SelectItem>
                <SelectItem value="SMP">SMP</SelectItem>
                <SelectItem value="SMA">SMA</SelectItem>
                <SelectItem value="SMK">SMK</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32 h-9 text-xs rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="NEGERI">Negeri</SelectItem>
                <SelectItem value="SWASTA">Swasta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Schools Directory Table */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="p-5 pb-3 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <School className="w-4 h-4 text-orange-600" />
            Satuan Pendidikan Terdata ({filtered.length} Sekolah)
          </CardTitle>
          <CardDescription className="text-xs">
            Menampilkan data sekolah lengkap dengan kode NPSN, alamat, akreditasi, dan capaian target kompetensi.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-left font-medium border-b">
                  <th className="p-3 pl-5">NPSN</th>
                  <th className="p-3">Nama Sekolah</th>
                  <th className="p-3">Jenjang / Status</th>
                  <th className="p-3">Kab/Kota & Kecamatan</th>
                  <th className="p-3">Akreditasi</th>
                  <th className="p-3">Siswa Aktif</th>
                  <th className="p-3 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((sch) => (
                  <tr key={sch.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 pl-5 font-mono font-semibold text-orange-600">
                      {sch.npsn}
                    </td>
                    <td className="p-3">
                      <strong className="text-foreground block">{sch.name}</strong>
                      <span className="text-[11px] text-muted-foreground">{sch.address}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">
                        {sch.level} • {sch.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="text-foreground">{sch.city}</div>
                      <div className="text-[11px] text-muted-foreground">Kec. {sch.district}</div>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 text-[10px]">
                        Akreditasi {sch.accreditation || "A"}
                      </Badge>
                    </td>
                    <td className="p-3 font-semibold">{sch.totalStudents} Siswa</td>
                    <td className="p-3 pr-5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        Detail Mutu
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

