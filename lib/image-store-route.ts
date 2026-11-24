export type ImageStoreAction = "store-data" | "store-url" | "keep";

/**
 * Decide what to do with an image URL before saving a quiz.
 * Pure (no I/O) so it can be unit-checked without the browser/supabase chain.
 */
export function imageStoreAction(url: string | null): ImageStoreAction {
  if (!url) return "keep";
  if (url.startsWith("data:")) return "store-data";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    // Already stored on our own Supabase Storage -> already a compressed WebP.
    return new URL(url).hostname.includes("supabase.co") ? "keep" : "store-url";
  }
  return "keep";
}