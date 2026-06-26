"use client";

import { useState } from "react";

const ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"],
];

const NUM_ROWS = [
  ["1","2","3"],
  ["4","5","6"],
  ["7","8","9"],
  ["⌫","0","OK"],
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  onConfirm?: () => void;
  mode?: "text" | "numeric";
}

export default function VirtualKeyboard({ value, onChange, onConfirm, mode = "text" }: Props) {
  const [upper, setUpper] = useState(true);

  function press(char: string) {
    onChange(value + (upper ? char : char.toLowerCase()));
  }

  function del() {
    onChange(value.slice(0, -1));
  }

  /* ── Teclado numérico ── */
  if (mode === "numeric") {
    return (
      <div className="bg-orange-500 border-t-2 border-orange-600 px-5 py-5 grid grid-cols-3 gap-3 select-none">
        {NUM_ROWS.flat().map((key, i) => {
          if (key === "⌫") return (
            <button key={i} tabIndex={-1} onClick={del}
              className="rounded-2xl bg-red-600 text-white font-black active:scale-95 transition-transform"
              style={{ minHeight: "clamp(64px, 9vh, 120px)", fontSize: "clamp(1.5rem, 3vh, 2.5rem)" }}
            >⌫</button>
          );
          if (key === "OK") return (
            <button key={i} tabIndex={-1} onClick={() => onConfirm?.()}
              disabled={value.replace(/\D/g,"").length < 10}
              className="rounded-2xl bg-orange-800 disabled:opacity-30 text-white font-black active:scale-95 transition-transform"
              style={{ minHeight: "clamp(64px, 9vh, 120px)", fontSize: "clamp(1.2rem, 2.5vh, 2rem)" }}
            >OK ✓</button>
          );
          return (
            <button key={i} tabIndex={-1} onClick={() => press(key)}
              className="rounded-2xl bg-orange-300 text-orange-900 font-bold active:bg-orange-200 active:scale-95 transition-all shadow-sm"
              style={{ minHeight: "clamp(64px, 9vh, 120px)", fontSize: "clamp(1.8rem, 4vh, 3rem)" }}
            >{key}</button>
          );
        })}
      </div>
    );
  }

  /* ── Teclado QWERTY ── */
  return (
    <div className="bg-orange-500 border-t-2 border-orange-600 px-3 pt-3 pb-4 space-y-2 select-none">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1.5">

          {ri === 2 && (
            <button tabIndex={-1} onClick={() => setUpper((u) => !u)}
              className={`rounded-xl font-black active:scale-95 transition-all flex-none
                ${upper ? "bg-orange-800 text-white" : "bg-orange-300 text-orange-900"}`}
              style={{ minHeight: "clamp(48px, 6vh, 90px)", width: "clamp(48px, 6.5vw, 88px)", fontSize: "clamp(1rem, 2.5vh, 1.8rem)" }}
            >⇧</button>
          )}

          {row.map((key) => (
            <button key={key} tabIndex={-1} onClick={() => press(key)}
              className="flex-1 rounded-xl bg-orange-300 text-orange-900 font-bold active:bg-orange-200 active:scale-95 transition-all shadow-sm"
              style={{ minHeight: "clamp(48px, 6vh, 90px)", fontSize: "clamp(0.9rem, 2.2vh, 1.6rem)" }}
            >{upper ? key : key.toLowerCase()}</button>
          ))}

          {ri === 2 && (
            <button tabIndex={-1} onClick={del}
              className="rounded-xl bg-red-600 text-white font-bold active:scale-95 transition-transform flex-none"
              style={{ minHeight: "clamp(48px, 6vh, 90px)", width: "clamp(52px, 7vw, 100px)", fontSize: "clamp(1rem, 2.5vh, 1.8rem)" }}
            >⌫</button>
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <button tabIndex={-1} onClick={() => press(" ")}
          className="flex-1 rounded-xl bg-orange-300 text-orange-900 font-semibold active:bg-orange-200 active:scale-95 transition-all"
          style={{ minHeight: "clamp(48px, 6vh, 90px)", fontSize: "clamp(0.85rem, 2vh, 1.4rem)" }}
        >ESPAÇO</button>
        {onConfirm && (
          <button tabIndex={-1} onClick={onConfirm}
            disabled={!value.trim()}
            className="rounded-xl bg-orange-800 disabled:opacity-30 text-white font-black active:scale-95 transition-transform"
            style={{ minHeight: "clamp(48px, 6vh, 90px)", minWidth: "clamp(80px, 12vw, 160px)", fontSize: "clamp(0.9rem, 2vh, 1.4rem)" }}
          >OK ✓</button>
        )}
      </div>
    </div>
  );
}
