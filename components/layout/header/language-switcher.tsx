"use client";

import * as React from "react";
import Flag from "react-world-flags";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/hooks/use-i18n";
import { Language } from "@/lib/i18n";

export default function LanguageSwitcher() {
    const { currentLanguage, changeLanguage, supportedLanguages } = useI18n();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleLanguageChange = async (langCode: Language) => {
        await changeLanguage(langCode);
    };

    if (!mounted) {
        return (
            <Button variant="outline" size="sm" className="w-[140px] justify-start opacity-50">
                <div className="mr-2 h-4 w-4 rounded-full bg-muted" />
                <span className="h-4 w-20 bg-muted" />
            </Button>
        );
    }

    const currentLangObj = supportedLanguages.find((l) => l.code === currentLanguage) || supportedLanguages[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 rounded-full border px-3">
                    <span className="relative flex h-5 w-5 overflow-hidden rounded-full border object-cover">
                        <Flag code={currentLangObj.flag} className="h-full w-full object-cover" />
                    </span>
                    <span className="text-sm font-medium">{currentLangObj.name}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
                {supportedLanguages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className="flex items-center gap-3 p-2 cursor-pointer"
                    >
                        <span className="relative flex h-5 w-5 overflow-hidden rounded-full border object-cover shadow-sm">
                            <Flag code={lang.flag} className="h-full w-full object-cover" />
                        </span>
                        <span className="flex-1 text-sm">{lang.name}</span>
                        {currentLanguage === lang.code && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
