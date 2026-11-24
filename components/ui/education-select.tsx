import { getEducationLevels } from '@/lib/constants/education-levels';
import { Label } from './label';

interface EducationSelectProps {
  value: string;
  onChange: (value: string) => void;
  locale?: 'id' | 'en';
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function EducationSelect({
  value,
  onChange,
  locale = 'id',
  required = false,
  error,
  disabled = false
}: EducationSelectProps) {
  const options = getEducationLevels(locale);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor="grade" className="text-orange-900 dark:text-zinc-300">
        {locale === 'id' ? 'Tingkat Pendidikan' : 'Education Level'}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <select
        id="grade"
        name="grade"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={`input w-full h-10 rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? 'input-error border-red-500' : ''
        }`}
      >
        <option value="">
          {locale === 'id' ? 'Pilih Tingkat Pendidikan' : 'Select Education Level'}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
