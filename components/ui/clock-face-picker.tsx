"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface ClockFacePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function ClockFacePicker({ value, onChange, className }: ClockFacePickerProps) {
  const [mode, setMode] = useState<"hours" | "minutes">("hours");

  const currentHour = value.getHours();
  const currentMinute = value.getMinutes();

  const handleHourSelect = (h: number) => {
    const updated = new Date(value);
    updated.setHours(h);
    onChange(updated);
    setMode("minutes"); // Otomatis lanjut ke pemilihan menit seperti Material UI
  };

  const handleMinuteSelect = (m: number) => {
    const updated = new Date(value);
    updated.setMinutes(m);
    onChange(updated);
  };

  // Posisi polar lingkaran (center 100, 100, radius r)
  const getCoordinates = (index: number, total: number, radius: number) => {
    // 0 index di jam 12 (-90 deg atau -PI/2)
    const angle = (index * (360 / total) - 90) * (Math.PI / 180);
    const x = 100 + radius * Math.cos(angle);
    const y = 100 + radius * Math.sin(angle);
    return { x, y, angle: index * (360 / total) };
  };

  // Outer circle hours (1..12), Inner circle hours (13..24 / 00)
  const outerHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const innerHours = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  // Hitung sudut dan panjang jarum jam/menit
  let handAngle = 0;
  let handLength = 68; // default outer

  if (mode === "hours") {
    const h12 = currentHour % 12;
    handAngle = h12 * 30; // 360 / 12 = 30 deg
    if (currentHour === 0 || currentHour >= 13) {
      handLength = 46; // inner circle
    }
  } else {
    handAngle = currentMinute * 6; // 360 / 60 = 6 deg
    handLength = 70;
  }

  const handRad = (handAngle - 90) * (Math.PI / 180);
  const handTargetX = 100 + handLength * Math.cos(handRad);
  const handTargetY = 100 + handLength * Math.sin(handRad);

  return (
    <div className={cn("flex flex-col items-center select-none p-3", className)}>
      {/* Tab toggle Jam vs Menit (tanpa header besar) */}
      <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg mb-3">
        <button
          type="button"
          onClick={() => setMode("hours")}
          className={cn(
            "px-2.5 py-0.5 text-xs font-semibold rounded-md transition-all",
            mode === "hours"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {String(currentHour).padStart(2, "0")}
        </button>
        <span className="text-xs font-bold text-muted-foreground">:</span>
        <button
          type="button"
          onClick={() => setMode("minutes")}
          className={cn(
            "px-2.5 py-0.5 text-xs font-semibold rounded-md transition-all",
            mode === "minutes"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {String(currentMinute).padStart(2, "0")}
        </button>
      </div>

      {/* Clock Face SVG Canvas */}
      <div className="relative w-[200px] h-[200px] bg-muted/40 rounded-full flex items-center justify-center shadow-inner">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Titik pusat */}
          <circle cx="100" cy="100" r="3.5" className="fill-primary" />

          {/* Garis jarum jam */}
          <line
            x1="100"
            y1="100"
            x2={handTargetX}
            y2={handTargetY}
            strokeWidth="2"
            className="stroke-primary"
          />

          {/* Lingkaran penunjuk di ujung jarum */}
          <circle cx={handTargetX} cy={handTargetY} r={mode === "hours" && handLength === 46 ? "13" : "14"} className="fill-primary" />
        </svg>

        {/* Tampilan Angka Jam (Mode: Hours) */}
        {mode === "hours" && (
          <div className="absolute inset-0">
            {/* Lingkaran Luar: 1 - 12 */}
            {outerHours.map((h, i) => {
              const { x, y } = getCoordinates(i, 12, 68);
              const isSelected = currentHour === h;
              return (
                <button
                  key={`outer-${h}`}
                  type="button"
                  onClick={() => handleHourSelect(h)}
                  style={{ left: `${x}px`, top: `${y}px` }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                    isSelected ? "text-primary-foreground font-bold" : "text-foreground hover:bg-muted"
                  )}
                >
                  {h}
                </button>
              );
            })}

            {/* Lingkaran Dalam: 13 - 23, 00 */}
            {innerHours.map((h, i) => {
              const { x, y } = getCoordinates(i, 12, 45);
              const isSelected = currentHour === h;
              return (
                <button
                  key={`inner-${h}`}
                  type="button"
                  onClick={() => handleHourSelect(h)}
                  style={{ left: `${x}px`, top: `${y}px` }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-normal transition-colors",
                    isSelected ? "text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {h === 0 ? "00" : h}
                </button>
              );
            })}
          </div>
        )}

        {/* Tampilan Angka Menit (Mode: Minutes) */}
        {mode === "minutes" && (
          <div className="absolute inset-0">
            {Array.from({ length: 12 }, (_, i) => i * 5).map((m, i) => {
              const { x, y } = getCoordinates(i, 12, 70);
              const isSelected = currentMinute === m;
              return (
                <button
                  key={`minute-${m}`}
                  type="button"
                  onClick={() => handleMinuteSelect(m)}
                  style={{ left: `${x}px`, top: `${y}px` }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                    isSelected ? "text-primary-foreground font-bold" : "text-foreground hover:bg-muted"
                  )}
                >
                  {String(m).padStart(2, "0")}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

