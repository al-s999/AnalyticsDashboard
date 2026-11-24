/**
 * Education Level Constants
 * Database stores English codes, UI displays localized labels
 */

export const EDUCATION_LEVELS = {
  kindergarten: {
    id: 'kindergarten',
    labelId: 'TK',
    labelEn: 'Kindergarten',
    labelAr: 'رَوْضَةُ الْأَطْفَالِ',
    order: 1
  },
  elementary_school: {
    id: 'elementary_school',
    labelId: 'SD',
    labelEn: 'Elementary School',
    labelAr: 'مَدْرَسَةٌ ابْتِدَائِيَّةٌ',
    order: 2
  },
  junior_high_school: {
    id: 'junior_high_school',
    labelId: 'SMP',
    labelEn: 'Junior High School',
    labelAr: 'مَدْرَسَةٌ مُتَوَسِّطَةٌ',
    order: 3
  },
  senior_high_school: {
    id: 'senior_high_school',
    labelId: 'SMA',
    labelEn: 'Senior High School',
    labelAr: 'مَدْرَسَةٌ ثَانَوِيَّةٌ',
    order: 4
  },
  vocational_high_school: {
    id: 'vocational_high_school',
    labelId: 'SMK',
    labelEn: 'Vocational High School',
    labelAr: 'مَدْرَسَةٌ مِهَنِيَّةٌ',
    order: 5
  },
  diploma_1: {
    id: 'diploma_1',
    labelId: 'D1',
    labelEn: 'Diploma 1',
    labelAr: 'دِبْلُومٌ 1',
    order: 6
  },
  diploma_2: {
    id: 'diploma_2',
    labelId: 'D2',
    labelEn: 'Diploma 2',
    labelAr: 'دِبْلُومٌ 2',
    order: 7
  },
  diploma_3: {
    id: 'diploma_3',
    labelId: 'D3',
    labelEn: 'Diploma 3',
    labelAr: 'دِبْلُومٌ 3',
    order: 8
  },
  diploma_4: {
    id: 'diploma_4',
    labelId: 'D4',
    labelEn: 'Diploma 4',
    labelAr: 'دِبْلُومٌ 4',
    order: 9
  },
  bachelor: {
    id: 'bachelor',
    labelId: 'S1',
    labelEn: "Bachelor's Degree",
    labelAr: 'دَرَجَةُ الْبَكَالُورْيُوس',
    order: 10
  },
  master: {
    id: 'master',
    labelId: 'S2',
    labelEn: "Master's Degree",
    labelAr: 'دَرَجَةُ الْمَاجِسْتِير',
    order: 11
  },
  doctorate: {
    id: 'doctorate',
    labelId: 'S3',
    labelEn: 'Doctorate',
    labelAr: 'دَرَجَةُ الدُّكْتُورَاه',
    order: 12
  }
} as const;

export type EducationLevel = keyof typeof EDUCATION_LEVELS;

/**
 * Get list of education levels for dropdown
 * @param locale - 'id' for Indonesian, 'en' for English, 'ar' for Arabic
 */
export function getEducationLevels(locale: 'id' | 'en' | 'ar' = 'en') {
  return Object.values(EDUCATION_LEVELS)
    .sort((a, b) => a.order - b.order)
    .map(level => ({
      value: level.id,
      label: locale === 'id' ? level.labelId : locale === 'ar' ? level.labelAr : level.labelEn
    }));
}

/**
 * Get localized label for education level
 * @param level - Education level code
 * @param locale - 'id' for Indonesian, 'en' for English, 'ar' for Arabic
 */
export function getEducationLabel(
  level: EducationLevel | string | null,
  locale: 'id' | 'en' | 'ar' = 'en'
): string {
  if (!level) return '-';
  
  const eduLevel = EDUCATION_LEVELS[level as EducationLevel];
  if (!eduLevel) return level; // Return as-is if not found
  
  if (locale === 'id') return eduLevel.labelId;
  if (locale === 'ar') return eduLevel.labelAr;
  return eduLevel.labelEn;
}

/**
 * Validate if a string is a valid education level
 */
export function isValidEducationLevel(value: string): value is EducationLevel {
  return value in EDUCATION_LEVELS;
}

/**
 * Map old grade values to new education level enum
 * Used for data migration
 */
export function mapLegacyGrade(oldGrade: string | null): EducationLevel {
  if (!oldGrade || oldGrade === '') {
    return 'senior_high_school'; // Default to SMA
  }

  const normalized = oldGrade.toLowerCase().trim();

  // Mapping rules
  if (normalized.includes('junior high') || normalized === 'smp') {
    return 'junior_high_school';
  }
  if (normalized.includes('senior high') || normalized === 'sma') {
    return 'senior_high_school';
  }
  if (normalized.includes('vocational') || normalized === 'smk') {
    return 'vocational_high_school';
  }
  if (normalized.includes('kuliah') || normalized.includes('sarjana') || normalized === 's1') {
    return 'bachelor';
  }
  if (normalized.includes('elementary') || normalized === 'sd') {
    return 'elementary_school';
  }
  if (normalized.includes('kindergarten') || normalized === 'tk') {
    return 'kindergarten';
  }
  if (normalized === 'd1') return 'diploma_1';
  if (normalized === 'd2') return 'diploma_2';
  if (normalized === 'd3') return 'diploma_3';
  if (normalized === 'd4') return 'diploma_4';
  if (normalized === 's2' || normalized.includes('master')) return 'master';
  if (normalized === 's3' || normalized.includes('doctor')) return 'doctorate';

  // Default to senior_high_school for anything else
  return 'senior_high_school';
}
