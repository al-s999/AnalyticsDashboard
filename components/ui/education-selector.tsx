"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEducationLevels, getEducationLabel } from "@/lib/constants/education-levels";
import type { EducationLevel } from "@/lib/constants/education-levels";
import { useI18n } from "@/hooks/use-i18n";
import { SearchableSelect } from "./searchable-select";

interface EducationSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  showClearButton?: boolean;
  inlineDropdown?: boolean;
}

export function EducationSelector({
  value,
  onChange,
  className,
  disabled = false,
  label,
  placeholder,
  showClearButton = true,
  inlineDropdown = false
}: EducationSelectorProps) {
  const { t, currentLanguage } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");

  const locale = currentLanguage === 'id' ? 'id' : currentLanguage === 'ar' ? 'ar' : 'en';
  const educationOptions = getEducationLevels(locale);

  const selectedLabel = value ? getEducationLabel(value as EducationLevel, locale) : "";

  const handleSelect = (option: { id: number; name: string }) => {
    // Find the original value from options
    const selected = educationOptions.find(opt => opt.label === option.name);
    if (selected) {
      onChange(selected.value);
    }
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
  };

  const displayLabel = label || t("friendsPage.educationLevel");
  const displayPlaceholder = placeholder || t("friendsPage.selectEducation");

  // Transform education options to match SearchableSelect format
  const transformedOptions = educationOptions.map((opt, index) => ({
    id: index + 1, // Generate numeric ID for SearchableSelect
    name: opt.label
  }));

  return (
    <div className={cn("w-full", className)}>
      <SearchableSelect
        label={displayLabel}
        placeholder={displayPlaceholder}
        value={{ 
          id: value ? transformedOptions.find(opt => opt.name === selectedLabel)?.id || null : null, 
          name: selectedLabel 
        }}
        options={transformedOptions}
        onSearch={setSearchQuery}
        onSelect={handleSelect}
        onClear={handleClear}
        loading={false}
        disabled={disabled}
        searchQuery={searchQuery}
        icon={<GraduationCap className="h-4 w-4" />}
        showClearButton={showClearButton}
        inlineDropdown={inlineDropdown}
      />
    </div>
  );
}
