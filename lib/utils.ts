import { Metadata } from "next";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAvatarFallback(string: string) {
  const names = string.split(" ").filter((name: string) => name);
  const mapped = names.map((name: string) => name.charAt(0).toUpperCase());

  return mapped.join("");
}

export function generateMeta({
  title,
  description,
  canonical
}: {
  title: string;
  description: string;
  canonical: string;
}): Metadata {
  return {
    title: `${title} - GameForSmart.com`,
    description: description,
    metadataBase: new URL(`https://gameforsmart.com`),
    alternates: {
      canonical: `/dashboard${canonical}`
    },
    openGraph: {
      images: [`logo.png`]
    }
  };
}

// a function to get the first letter of the first and last name of names
export const getInitials = (fullName: string) => {
  const nameParts = fullName.split(" ");
  const firstNameInitial = nameParts[0].charAt(0).toUpperCase();
  const lastNameInitial = nameParts[1].charAt(0).toUpperCase();
  return `${firstNameInitial}${lastNameInitial}`;
};

// Time format translations
const timeTranslations = {
  en: {
    justNow: "Just now",
    onlineNow: "Online now",
    neverActive: "Never active",
    never: "Never",
    active: "Active",
    lastSeen: "Last seen",
    yesterday: "Yesterday",
    lastWeek: "Last week",
    lastMonth: "Last month",
    lastYear: "Last year",
    ago: "ago",
    minute: "minute",
    minutes: "minutes",
    hour: "hour",
    hours: "hours",
    day: "day",
    days: "days",
    week: "week",
    weeks: "weeks",
    month: "month",
    months: "months",
    year: "year",
    years: "years",
    lastSeenYesterday: "Last seen yesterday",
    lastSeenLastWeek: "Last seen last week",
    lastSeenLastMonth: "Last seen last month",
    lastSeenLastYear: "Last seen last year",
  },
  id: {
    justNow: "Baru saja",
    onlineNow: "Online sekarang",
    neverActive: "Tidak pernah aktif",
    never: "Tidak pernah",
    active: "Aktif",
    lastSeen: "Terakhir terlihat",
    yesterday: "Kemarin",
    lastWeek: "Minggu lalu",
    lastMonth: "Bulan lalu",
    lastYear: "Tahun lalu",
    ago: "lalu",
    minute: "menit",
    minutes: "menit",
    hour: "jam",
    hours: "jam",
    day: "hari",
    days: "hari",
    week: "minggu",
    weeks: "minggu",
    month: "bulan",
    months: "bulan",
    year: "tahun",
    years: "tahun",
    lastSeenYesterday: "Terakhir terlihat kemarin",
    lastSeenLastWeek: "Terakhir terlihat minggu lalu",
    lastSeenLastMonth: "Terakhir terlihat bulan lalu",
    lastSeenLastYear: "Terakhir terlihat tahun lalu",
  },
  ar: {
    justNow: "الآن فقط",
    onlineNow: "متصل الآن",
    neverActive: "لم ينشط أبدا",
    never: "أبدا",
    active: "نشط",
    lastSeen: "آخر ظهور",
    yesterday: "أمس",
    lastWeek: "الأسبوع الماضي",
    lastMonth: "الشهر الماضي",
    lastYear: "العام الماضي",
    ago: "مضت",
    minute: "دقيقة",
    minutes: "دقائق",
    hour: "ساعة",
    hours: "ساعات",
    day: "يوم",
    days: "أيام",
    week: "أسبوع",
    weeks: "أسابيع",
    month: "شهر",
    months: "أشهر",
    year: "سنة",
    years: "سنوات",
    lastSeenYesterday: "آخر ظهور أمس",
    lastSeenLastWeek: "آخر ظهور الأسبوع الماضي",
    lastSeenLastMonth: "آخر ظهور الشهر الماضي",
    lastSeenLastYear: "آخر ظهور العام الماضي",
  },
};

/**
 * Format waktu menjadi "berapa waktu yang lalu" dengan dukungan multi-bahasa
 * @param date - Date object atau string tanggal
 * @param style - Style format: 'short' | 'long' | 'relative' (default: 'short')
 * @param language - Bahasa: 'en' | 'id' (default: 'en')
 * @returns String waktu relatif dengan format yang lebih user-friendly
 *
 * Contoh dengan style 'short' (default):
 * - formatTimeAgo(new Date()) → "Just now" / "Baru saja"
 * - formatTimeAgo(date5MinutesAgo) → "5m ago" / "5m yang lalu"
 * - formatTimeAgo(date2HoursAgo) → "2h ago" / "2j yang lalu"
 * - formatTimeAgo(date3DaysAgo) → "3d ago" / "3h yang lalu"
 * - formatTimeAgo(date2WeeksAgo) → "2w ago" / "2m yang lalu"
 *
 * Contoh dengan style 'long':
 * - formatTimeAgo(date, 'long') → "5 minutes ago" / "5 menit yang lalu"
 * - formatTimeAgo(date, 'long') → "2 hours ago" / "2 jam yang lalu"
 *
 * Contoh dengan style 'relative':
 * - formatTimeAgo(date, 'relative') → "Active 5m ago" / "Aktif 5m yang lalu"
 * - formatTimeAgo(date, 'relative') → "Last seen 2h ago" / "Terakhir terlihat 2j yang lalu"
 */
export function formatTimeAgo(
  date: Date | string | null | undefined,
  style: "short" | "long" | "relative" = "short",
  language: "en" | "id" | "ar" = "en"
): string {
  // Get translations for the selected language
  const t = timeTranslations[language] || timeTranslations.en;

  // Handle null or undefined
  if (!date) {
    return style === "relative" ? t.neverActive : t.never;
  }

  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;

  // Check if date is invalid
  if (!targetDate || isNaN(targetDate.getTime())) {
    return style === "relative" ? t.neverActive : t.never;
  }

  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000
  );

  // Just now (less than 1 minute)
  if (diffInSeconds < 60) {
    return style === "relative" ? t.onlineNow : t.justNow;
  }

  // Minutes ago
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    if (style === "short") {
      // Use abbreviated format for Indonesian: m for menit
      return language === "id"
        ? `${diffInMinutes} menit ${t.ago}`
        : language === "ar"
        ? `منذ ${diffInMinutes} د`
        : `${diffInMinutes}m ${t.ago}`;
    }
    if (style === "relative") {
      return language === "id"
        ? `${t.active} ${diffInMinutes} menit ${t.ago}`
        : language === "ar"
        ? `${t.active} منذ ${diffInMinutes} د`
        : `${t.active} ${diffInMinutes}m ${t.ago}`;
    }
    // Long format
    const unit = diffInMinutes === 1 ? t.minute : t.minutes;
    return language === "ar" ? `منذ ${diffInMinutes} ${unit}` : `${diffInMinutes} ${unit} ${t.ago}`;
  }

  // Hours ago
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    if (style === "short") {
      // Use abbreviated format: h for hour, jam for Indonesian
      const abbrev = language === "id" ? "jam" : language === "ar" ? "س" : "hours";
      return language === "ar" ? `منذ ${diffInHours} ${abbrev}` : `${diffInHours} ${abbrev} ${t.ago}`;
    }
    if (style === "relative") {
      const abbrev = language === "id" ? "jam" : language === "ar" ? "س" : "hours";
      return language === "ar" ? `${t.active} منذ ${diffInHours} ${abbrev}` : `${t.active} ${diffInHours} ${abbrev} ${t.ago}`;
    }
    // Long format
    const unit = diffInHours === 1 ? t.hour : t.hours;
    return language === "ar" ? `منذ ${diffInHours} ${unit}` : `${diffInHours} ${unit} ${t.ago}`;
  }

  // Days ago
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    if (style === "short") return t.yesterday;
    if (style === "relative") return t.lastSeenYesterday;
    return t.yesterday;
  }
  if (diffInDays < 7) {
    if (style === "short") {
      // Use abbreviated format: d for day, hari for Indonesian
      const abbrev = language === "id" ? "hari" : language === "ar" ? "يوم" : "days";
      return language === "ar" ? `منذ ${diffInDays} ${abbrev}` : `${diffInDays} ${abbrev} ${t.ago}`;
    }
    if (style === "relative") {
      const abbrev = language === "id" ? "hari" : language === "ar" ? "يوم" : "days";
      return language === "ar" ? `${t.lastSeen} منذ ${diffInDays} ${abbrev}` : `${t.lastSeen} ${diffInDays} ${abbrev} ${t.ago}`;
    }
    return language === "ar" ? `منذ ${diffInDays} ${t.days}` : `${diffInDays} ${t.days} ${t.ago}`;
  }

  // Weeks ago
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) {
    if (style === "short") return t.lastWeek;
    if (style === "relative") return t.lastSeenLastWeek;
    return t.lastWeek;
  }
  if (diffInWeeks < 4) {
    if (style === "short") {
      // Use abbreviated format: w for week, minggu for Indonesian
      const abbrev = language === "id" ? "minggu" : language === "ar" ? "أسبوع" : "weeks";
      return language === "ar" ? `منذ ${diffInWeeks} ${abbrev}` : `${diffInWeeks} ${abbrev} ${t.ago}`;
    }
    if (style === "relative") {
      const abbrev = language === "id" ? "minggu" : language === "ar" ? "أسبوع" : "weeks";
      return language === "ar" ? `${t.lastSeen} منذ ${diffInWeeks} ${abbrev}` : `${t.lastSeen} ${diffInWeeks} ${abbrev} ${t.ago}`;
    }
    return language === "ar" ? `منذ ${diffInWeeks} ${t.weeks}` : `${diffInWeeks} ${t.weeks} ${t.ago}`;
  }

  // Months ago
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths === 1) {
    if (style === "short") return t.lastMonth;
    if (style === "relative") return t.lastSeenLastMonth;
    return t.lastMonth;
  }
  if (diffInMonths < 12) {
    if (style === "short") {
      // Use abbreviated format: mo for month, bulan for Indonesian
      const abbrev = language === "id" ? "bulan" : language === "ar" ? "شهر" : "months";
      return language === "ar" ? `منذ ${diffInMonths} ${abbrev}` : `${diffInMonths} ${abbrev} ${t.ago}`;
    }
    if (style === "relative") {
      const abbrev = language === "id" ? "bulan" : language === "ar" ? "شهر" : "months";
      return language === "ar" ? `${t.lastSeen} منذ ${diffInMonths} ${abbrev}` : `${t.lastSeen} ${diffInMonths} ${abbrev} ${t.ago}`;
    }
    return language === "ar" ? `منذ ${diffInMonths} ${t.months}` : `${diffInMonths} ${t.months} ${t.ago}`;
  }

  // Years ago
  const diffInYears = Math.floor(diffInDays / 365);
  if (diffInYears === 1) {
    if (style === "short") return t.lastYear;
    if (style === "relative") return t.lastSeenLastYear;
    return t.lastYear;
  }
  if (style === "short") {
    // Use abbreviated format: y for year, tahun for Indonesian
    const abbrev = language === "id" ? "tahun" : language === "ar" ? "سنة" : "years";
    return language === "ar" ? `منذ ${diffInYears} ${abbrev}` : `${diffInYears} ${abbrev} ${t.ago}`;
  }
  if (style === "relative") {
    const abbrev = language === "id" ? "tahun" : language === "ar" ? "سنة" : "years";
    return language === "ar" ? `${t.lastSeen} منذ ${diffInYears} ${abbrev}` : `${t.lastSeen} ${diffInYears} ${abbrev} ${t.ago}`;
  }
  return language === "ar" ? `منذ ${diffInYears} ${t.years}` : `${diffInYears} ${t.years} ${t.ago}`;
}

// Month translations
const monthTranslations = {
  en: {
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    noDate: "No date",
    invalidDate: "Invalid date",
  },
  id: {
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ],
    noDate: "Tidak ada tanggal",
    invalidDate: "Tanggal tidak valid",
  },
  ar: {
    months: [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ],
    noDate: "لا يوجد تاريخ",
    invalidDate: "تاريخ غير صالح",
  },
};

/**
 * Format date menjadi "DD MMM YYYY" atau "DD MMM YYYY, HH:mm" dengan dukungan multi-bahasa
 * @param date - Date object atau string tanggal
 * @param language - Bahasa: 'en' | 'id' (default: 'en')
 * @param includeTime - Include time in format HH:mm (default: false)
 * @returns String tanggal yang sudah diformat
 *
 * Contoh:
 * - formatDate(new Date(2025, 9, 1)) → "1 Oct 2025" / "1 Okt 2025"
 * - formatDate("2025-10-01") → "1 Oct 2025" / "1 Okt 2025"
 * - formatDate("2025-05-15") → "15 May 2025" / "15 Mei 2025"
 * - formatDate("2025-05-15 14:30", 'en', true) → "15 May 2025, 14:30"
 * - formatDate("2025-05-15 14:30", 'id', true) → "15 Mei 2025, 14:30"
 */
export function formatDate(
  date: Date | string | null | undefined,
  language: "en" | "id" | "ar" = "en",
  includeTime: boolean = false
): string {
  const t = monthTranslations[language] || monthTranslations.en;

  // Handle null or undefined
  if (!date) {
    return t.noDate;
  }

  const targetDate = typeof date === "string" ? new Date(date) : date;

  // Check if date is invalid
  if (!targetDate || isNaN(targetDate.getTime())) {
    return t.invalidDate;
  }

  const day = targetDate.getDate().toString();
  const month = t.months[targetDate.getMonth()];
  const year = targetDate.getFullYear();

  let formattedDate = `${day} ${month} ${year}`;

  // Add time if requested
  if (includeTime) {
    const hours = targetDate.getHours().toString().padStart(2, "0");
    const minutes = targetDate.getMinutes().toString().padStart(2, "0");
    formattedDate += `, ${hours}:${minutes}`;
  }

  return formattedDate;
}