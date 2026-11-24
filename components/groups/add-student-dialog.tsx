"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, QrCode, UserPlus, Check, Sparkles, AlertCircle } from "lucide-react";
import { StudentProfile } from "@/data/students-data";
import { QrProfileScanner } from "./qr-profile-scanner";
import { toast } from "sonner";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  groupId: string;
  existingStudentIds: string[];
  onStudentAdded: (student: StudentProfile) => void;
}

export function AddStudentDialog({
  open,
  onOpenChange,
  groupName,
  groupId,
  existingStudentIds,
  onStudentAdded
}: AddStudentDialogProps) {
  const [activeTab, setActiveTab] = useState<"search" | "qr">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  // Search API saat searchQuery berubah
  useEffect(() => {
    let cancelled = false;
    const q = searchQuery.trim();

    setIsLoading(true);
    fetch(`/api/students/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled && res.success) {
          setSearchResults(res.students || []);
        }
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const handleAdd = (student: StudentProfile) => {
    if (existingStudentIds.includes(student.id)) {
      toast.warning(`${student.fullname} sudah berada di grup ${groupName}`);
      return;
    }

    onStudentAdded(student);
    toast.success(`Berhasil menambahkan @${student.username} ke ${groupName}!`);
    onOpenChange(false);
  };

  const handleQrDetected = async (username: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/search?q=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.success && data.students && data.students.length > 0) {
        const found = data.students.find(
          (s: StudentProfile) => s.username.toLowerCase() === username.toLowerCase()
        ) || data.students[0];

        setSelectedStudent(found);
        setActiveTab("search");
        setSearchQuery(found.username);
        toast.info(`Profil @${found.username} ditemukan. Klik "Tambahkan ke Grup".`);
      } else {
        toast.error(`Siswa dengan username @${username} tidak ditemukan.`);
      }
    } catch {
      toast.error("Gagal memuat profil dari QR Code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-6 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-600" />
            Tambah Siswa ke Grup
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Grup Target: <span className="font-semibold text-foreground">{groupName}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2 rounded-xl mb-4">
            <TabsTrigger value="search" className="flex items-center gap-2 text-xs py-2">
              <Search className="w-3.5 h-3.5" /> Ketik Username
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2 text-xs py-2">
              <QrCode className="w-3.5 h-3.5" /> Scan QR Profil
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: KETIK USERNAME SISWA */}
          <TabsContent value="search" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ketik username (contoh: budi_santoso) atau nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            {/* List Hasil Pencarian */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Memuat profil siswa...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-muted-foreground" />
                  <span>Tidak ada siswa dengan kata kunci "{searchQuery}"</span>
                </div>
              ) : (
                searchResults.map((student) => {
                  const isAlreadyInGroup = existingStudentIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      className="p-3 rounded-2xl border bg-card hover:bg-muted/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-10 h-10 border">
                          <AvatarImage src={student.avatarUrl} alt={student.fullname} />
                          <AvatarFallback>{student.fullname.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold truncate">{student.fullname}</h4>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Lvl {student.level}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            @{student.username} • {student.grade}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              Estimasi Ujian:{" "}
                              <strong className="text-foreground">{student.predictedExamScore}</strong>
                            </span>
                            <Badge
                              className={`text-[9px] px-1.5 py-0 ${
                                student.readinessStatus === "Sangat Siap"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : student.readinessStatus === "Siap"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}
                            >
                              {student.readinessStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        disabled={isAlreadyInGroup}
                        onClick={() => handleAdd(student)}
                        className={`shrink-0 rounded-xl text-xs font-semibold ${
                          isAlreadyInGroup
                            ? "bg-muted text-muted-foreground hover:bg-muted"
                            : "bg-orange-600 hover:bg-orange-700 text-white"
                        }`}
                      >
                        {isAlreadyInGroup ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" /> Terdaftar
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 mr-1" /> Tambahkan
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* TAB 2: SCAN QR CODE DARI PROFIL SISWA */}
          <TabsContent value="qr" className="space-y-4">
            <QrProfileScanner onScanSuccess={handleQrDetected} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

