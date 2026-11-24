"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, Map, Building2, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { SearchableSelect } from "./searchable-select";
import { cn } from "@/lib/utils";

interface Country {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  emoji: string;
  latitude: number;
  longitude: number;
  translations?: Record<string, string>;
}

interface State {
  id: number;
  name: string;
  country_id: number;
  country_code: string;
  latitude: number;
  longitude: number;
  translations?: Record<string, string>;
}

interface City {
  id: number;
  name: string;
  state_id: number;
  state_code: string;
  country_id: number;
  country_code: string;
  latitude: number;
  longitude: number;
  translations?: Record<string, string>;
}

interface LocationValue {
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
  countryName: string;
  stateName: string;
  cityName: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationSelectorProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  className?: string;
  disabled?: boolean;
  layout?: "vertical" | "horizontal";
  showDetectButton?: boolean;
  showClearButton?: boolean;
  inlineDropdown?: boolean;
}

export function LocationSelector({
  value,
  onChange,
  className,
  disabled,
  layout = "vertical",
  showDetectButton = true,
  showClearButton = true,
  inlineDropdown = false
}: LocationSelectorProps) {
  const { t } = useI18n();
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [countriesFetched, setCountriesFetched] = useState(false);
  const [statesFetched, setStatesFetched] = useState(false);
  const [citiesFetched, setCitiesFetched] = useState(false);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung geolocation");
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Call our reverse geocode API
          const response = await fetch(
            `/api/locations/reverse-geocode?lat=${latitude}&lon=${longitude}`
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Gagal mendeteksi lokasi");
          }

          const data = await response.json();

          if (data.success) {
            // Update location value with detected data
            onChange({
              countryId: data.country?.id || null,
              stateId: data.state?.id || null,
              cityId: data.city?.id || null,
              countryName: data.country?.name || "",
              stateName: data.state?.name || "",
              cityName: data.city?.name || "",
              latitude:
                data.city?.latitude || data.state?.latitude || data.country?.latitude || latitude,
              longitude:
                data.city?.longitude ||
                data.state?.longitude ||
                data.country?.longitude ||
                longitude
            });

            // Show success message with detected location
            const locationParts = [data.city?.name, data.state?.name, data.country?.name].filter(
              Boolean
            );
            toast.success(`Lokasi terdeteksi: ${locationParts.join(", ")}`);
          } else {
            throw new Error("Gagal mendeteksi lokasi");
          }
        } catch (error: any) {
          console.error("Error detecting location:", error);
          toast.error(error.message || "Gagal mendeteksi lokasi");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Izin lokasi ditolak. Silakan aktifkan izin lokasi di browser Anda.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Informasi lokasi tidak tersedia");
            break;
          case error.TIMEOUT:
            toast.error("Waktu permintaan lokasi habis");
            break;
          default:
            toast.error("Gagal mendapatkan lokasi");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, [onChange]);

  // Fetch countries when dropdown opens
  const fetchCountries = useCallback(async () => {
    if (countriesFetched || loadingCountries) return;

    setLoadingCountries(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "250");

      const res = await fetch(`/api/locations/countries?${params}`);
      const data = await res.json();
      const sortedCountries = (data.countries || []).sort((a: Country, b: Country) =>
        a.name.localeCompare(b.name)
      );
      setCountries(sortedCountries);
      setCountriesFetched(true);
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setLoadingCountries(false);
    }
  }, [countriesFetched, loadingCountries]);

  // Fetch states when dropdown opens
  const fetchStates = useCallback(async () => {
    if (!value.countryId || loadingStates) return;

    setLoadingStates(true);
    try {
      const params = new URLSearchParams();
      params.set("countryId", value.countryId.toString());
      params.set("limit", "500");

      const res = await fetch(`/api/locations/states?${params}`);
      const data = await res.json();
      const sortedStates = (data.states || []).sort((a: State, b: State) =>
        a.name.localeCompare(b.name)
      );
      setStates(sortedStates);
      setStatesFetched(true);
    } catch (error) {
      console.error("Error fetching states:", error);
    } finally {
      setLoadingStates(false);
    }
  }, [value.countryId, loadingStates]);

  // Fetch cities when dropdown opens
  const fetchCities = useCallback(async () => {
    if (!value.stateId || loadingCities) return;

    setLoadingCities(true);
    try {
      const params = new URLSearchParams();
      params.set("stateId", value.stateId.toString());
      params.set("limit", "500");

      const res = await fetch(`/api/locations/cities?${params}`);
      const data = await res.json();
      const sortedCities = (data.cities || []).sort((a: City, b: City) =>
        a.name.localeCompare(b.name)
      );
      setCities(sortedCities);
      setCitiesFetched(true);
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoadingCities(false);
    }
  }, [value.stateId, loadingCities]);

  // Reset states when country changes
  useEffect(() => {
    setStates([]);
    setStatesFetched(false);
    setCities([]);
    setCitiesFetched(false);
  }, [value.countryId]);

  // Reset cities when state changes
  useEffect(() => {
    setCities([]);
    setCitiesFetched(false);
  }, [value.stateId]);

  const handleCountrySelect = (country: Country) => {
    onChange({
      countryId: country.id,
      stateId: null,
      cityId: null,
      countryName: country.name,
      stateName: "",
      cityName: "",
      latitude: country.latitude,
      longitude: country.longitude
    });
  };

  const handleStateSelect = (state: State) => {
    onChange({
      ...value,
      stateId: state.id,
      cityId: null,
      stateName: state.name,
      cityName: "",
      latitude: state.latitude || value.latitude,
      longitude: state.longitude || value.longitude
    });
  };

  const handleCitySelect = (city: City) => {
    onChange({
      ...value,
      cityId: city.id,
      cityName: city.name,
      latitude: city.latitude || value.latitude,
      longitude: city.longitude || value.longitude
    });
  };

  const handleCountryClear = () => {
    onChange({
      countryId: null,
      stateId: null,
      cityId: null,
      countryName: "",
      stateName: "",
      cityName: "",
      latitude: null,
      longitude: null
    });
  };

  const handleStateClear = () => {
    onChange({
      ...value,
      stateId: null,
      cityId: null,
      stateName: "",
      cityName: "",
      latitude: countries.find((c) => c.id === value.countryId)?.latitude || null,
      longitude: countries.find((c) => c.id === value.countryId)?.longitude || null
    });
  };

  const handleCityClear = () => {
    onChange({
      ...value,
      cityId: null,
      cityName: "",
      latitude: states.find((s) => s.id === value.stateId)?.latitude || value.latitude,
      longitude: states.find((s) => s.id === value.stateId)?.longitude || value.longitude
    });
  };

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-orange-100/90 bg-slate-50/50 p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900/40",
        className
      )}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
            <Globe className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold tracking-wider text-orange-950 uppercase dark:text-zinc-200">
            DOMISILI & WILAYAH
          </span>
        </div>
      </div>

      {/* Country Select (Full Width) */}
      <SearchableSelect
        label={t("location.country")}
        placeholder={t("location.selectCountry") || "Pilih Negara..."}
        showLabel={false}
        icon={<Globe className="h-4 w-4 text-orange-500 dark:text-orange-400" />}
        value={{
          id: value.countryId,
          name: value.countryName,
          iso2: countries.find((c) => c.id === value.countryId)?.iso2
        }}
        options={countries.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, iso2: c.iso2 }))}
        onSearch={() => {}}
        onSelect={(opt) => handleCountrySelect(countries.find((c) => c.id === opt.id)!)}
        onClear={handleCountryClear}
        onOpen={fetchCountries}
        loading={loadingCountries}
        disabled={disabled}
        searchQuery=""
        showClearButton={showClearButton}
        inlineDropdown={inlineDropdown}
      />

      {/* State & City Select (2 Columns Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <SearchableSelect
          label={t("location.state")}
          placeholder={
            value.countryId
              ? t("location.selectState") || "Pilih Provinsi..."
              : t("location.selectCountryFirst") || "Pilih Negara..."
          }
          showLabel={false}
          icon={<Map className="h-4 w-4 text-orange-500 dark:text-orange-400" />}
          value={{ id: value.stateId, name: value.stateName }}
          options={states.map((s) => ({ id: s.id, name: s.name }))}
          onSearch={() => {}}
          onSelect={(opt) => handleStateSelect(states.find((s) => s.id === opt.id)!)}
          onClear={handleStateClear}
          onOpen={fetchStates}
          loading={loadingStates}
          disabled={disabled || !value.countryId}
          searchQuery=""
          showClearButton={showClearButton}
          inlineDropdown={inlineDropdown}
        />

        <SearchableSelect
          label={t("location.city")}
          placeholder={
            value.stateId
              ? t("location.selectCity") || "Pilih Kota/Kab..."
              : t("location.selectStateFirst") || "Pilih Provinsi..."
          }
          showLabel={false}
          icon={<Building2 className="h-4 w-4 text-orange-500 dark:text-orange-400" />}
          value={{ id: value.cityId, name: value.cityName }}
          options={cities.map((c) => ({ id: c.id, name: c.name }))}
          onSearch={() => {}}
          onSelect={(opt) => handleCitySelect(cities.find((c) => c.id === opt.id)!)}
          onClear={handleCityClear}
          onOpen={fetchCities}
          loading={loadingCities}
          disabled={disabled || !value.stateId}
          searchQuery=""
          showClearButton={showClearButton}
          inlineDropdown={inlineDropdown}
        />
      </div>

      {/* Detect Location Button */}
      {showDetectButton && !disabled && (
        <Button
          type="button"
          variant="outline"
          onClick={detectLocation}
          disabled={detectingLocation}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50/70 text-sm font-semibold text-amber-900 transition-all hover:bg-amber-100 hover:border-amber-400 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50">
          {detectingLocation ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
              <span className="font-medium">{t("location.detecting") || "Mendeteksi..."}</span>
            </>
          ) : (
            <>
              <LocateFixed className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="font-medium">{t("location.autoDetect") || "Deteksi Lokasi Otomatis"}</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export type { LocationValue };
