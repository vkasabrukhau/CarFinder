"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AutocompleteFieldProps {
  items: string[];
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  /** Pass the same `field` className used for bare inputs — border is kept on the input only. */
  className?: string;
  disabled?: boolean;
  type?: string;
}

export function AutocompleteField({
  items,
  value,
  onValueChange,
  placeholder,
  className,
  disabled,
  type,
}: AutocompleteFieldProps) {
  const [ghost, setGhost] = useState("");

  function getMatch(typed: string): string | null {
    if (!typed) return null;
    const lower = typed.toLowerCase();
    return items.find((item) => item.toLowerCase().startsWith(lower)) ?? null;
  }

  function accept() {
    if (!ghost) return;
    onValueChange(value + ghost);
    setGhost("");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const typed = e.target.value;
    onValueChange(typed);
    const match = getMatch(typed);
    setGhost(
      match && match.toLowerCase() !== typed.toLowerCase()
        ? match.slice(typed.length)
        : "",
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!ghost) return;
    if (e.key === "Tab" || e.key === "ArrowRight") {
      // Accept and let Tab move focus naturally (no preventDefault on Tab)
      if (e.key === "ArrowRight") e.preventDefault();
      accept();
    } else if (e.key === "Escape" || e.key === "Backspace") {
      setGhost("");
    }
  }

  return (
    <div className="relative w-full">
      {/* Input renders in normal flow, below absolutely-positioned ghost */}
      <input
        className={cn(className, "relative z-10 bg-transparent")}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        type={type}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck={false}
      />

      {/* Ghost text overlay — sits on top (absolute, after input in DOM → higher paint order) */}
      {ghost && (
        <div
          className={cn(
            "pointer-events-none select-none",
            "absolute top-0 left-0 right-0 z-20",
            "overflow-hidden whitespace-pre bg-transparent",
            // Mirror the input's text styling exactly
            "pt-2 text-[45px] leading-none",
          )}
          aria-hidden
        >
          {/* Invisible spacer = width of typed text, pushes ghost to correct x offset */}
          <span className="invisible">{value}</span>
          <span className="text-foreground/30">{ghost}</span>
        </div>
      )}
    </div>
  );
}
