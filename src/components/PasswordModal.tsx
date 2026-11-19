"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

interface PasswordModalProps {
  accent: string;
  accentFg: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function PasswordModal({
  accent,
  accentFg,
  onSuccess,
  onClose,
}: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        setError(true);
        setPassword("");
        inputRef.current?.focus();
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      {/* Ultra-minimalist single-bar prompt matching user's screenshot #3 */}
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className={`anim-modal w-full max-w-[388px] rounded-[14px] border bg-[#111215] p-4 transition-colors ${
          error ? "anim-shake border-[#D9535F]" : "border-[#343844]"
        }`}
      >
        <div
          className={`flex h-14 items-center gap-2 rounded-[10px] border bg-[#181A1F] pl-4 pr-1.5 transition-colors ${
            error ? "border-[#D9535F]" : "border-[#343844] focus-within:border-[#555B6E]"
          }`}
        >
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(false);
            }}
            placeholder="••••••••••••"
            autoComplete="current-password"
            className="font-mono-ui w-full bg-transparent text-lg tracking-[0.22em] text-[#ECEAE4] placeholder-[#4B505E] outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            aria-label="Войти"
            style={{ backgroundColor: accent, color: accentFg }}
            className="flex h-11 w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
