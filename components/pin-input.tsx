"use client";
import { useRef, useState } from "react";

interface PinInputProps {
  onComplete: (pin: string) => void;
  loading?: boolean;
  dark?: boolean;
  reset?: number; // increment to reset
}

export function PinInput({ onComplete, loading, dark, reset = 0 }: PinInputProps) {
  const [digits, setDigits] = useState(["", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset when `reset` counter changes
  const [localReset, setLocalReset] = useState(reset);
  if (localReset !== reset) {
    setLocalReset(reset);
    setDigits(["", "", "", "", ""]);
  }

  const focusAt = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < 4) focusAt(i + 1);
    // All 5 slots filled — every slot must be a single digit character
    if (next.every((d) => d !== "")) onComplete(next.join(""));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) {
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        next[i - 1] = "";
        setDigits(next);
        focusAt(i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusAt(i - 1);
    } else if (e.key === "ArrowRight" && i < 4) {
      focusAt(i + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (pasted.length === 5) {
      setDigits(pasted.split(""));
      onComplete(pasted);
    }
  };

  const box = dark
    ? "w-11 h-13 text-center font-bold bg-white/8 border border-white/15 focus:border-teal-400 focus:bg-white/12 text-white rounded-xl outline-none transition-all caret-transparent placeholder-white/20 disabled:opacity-40"
    : "w-11 h-13 text-center font-bold bg-slate-50 border-2 border-slate-200 focus:border-teal-400 focus:bg-white text-slate-800 rounded-xl outline-none transition-all caret-transparent placeholder-slate-300 disabled:opacity-40";

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={1}
          value={d}
          placeholder="·"
          autoFocus={i === 0}
          disabled={loading}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          style={{ fontSize: '20px' }}
          className={box}
        />
      ))}
    </div>
  );
}
