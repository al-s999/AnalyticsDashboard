/**
 * Helper penyimpanan draft berbasis LocalStorage dengan batas waktu (TTL / Time-To-Live).
 * Standar kadaluarsa: 1 Jam (3.600.000 ms).
 *
 * Keamanan Arsitektur:
 * - Data di LocalStorage TIDAK PERNAH dikirim ke server via HTTP Request Header (bebas error HTTP 431).
 * - Tidak menyimpan data binary / Base64 gambar agar ukuran tetap sangat kecil (< 2 KB).
 */

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 Jam (3.600.000 ms)

export interface DraftPayload<T> {
  savedAt: number;
  expiresAt: number;
  data: T;
}

export const DraftStorage = {
  /**
   * Menyimpan data draft beserta metadata masa berlaku (1 jam)
   */
  set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    if (typeof window === "undefined") return;
    try {
      const now = Date.now();
      const payload: DraftPayload<T> = {
        savedAt: now,
        expiresAt: now + ttlMs,
        data,
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      console.warn(`[DraftStorage] Gagal menyimpan draft "${key}":`, err);
    }
  },

  /**
   * Mengambil data draft. Jika sudah kadaluarsa (> 1 jam), otomatis dihapus dan mengembalikan null.
   */
  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const payload = JSON.parse(raw);

      // Migrasi data lama tanpa properti expiresAt
      if (!payload || typeof payload !== "object" || !payload.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      // Periksa apakah draft sudah kadaluarsa (> 1 jam)
      if (Date.now() > payload.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return payload.data as T;
    } catch (err) {
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Menghapus draft secara manual (misal setelah berhasil submit)
   */
  remove(key: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  },
};

