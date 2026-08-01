import { Moon, Sparkles, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import type {
  AppLayoutOutletContext,
  WorkspaceTheme,
} from "@/layouts/AppLayout";
import { cn } from "@/utils/cn";

const aiToneOptions = [
  "Warm and encouraging",
  "Calm and gentle",
  "Direct and practical",
  "Reflective and deep",
  "Playful and energizing",
] as const;

type AiTone = (typeof aiToneOptions)[number];

const toneStorageKey = "ai-learning-agent-tone";

export function SettingsPage() {
  const { setTheme, theme } = useOutletContext<AppLayoutOutletContext>();
  const [aiTone, setAiTone] = useState<AiTone>(() => {
    const storedTone = localStorage.getItem(toneStorageKey);
    return aiToneOptions.includes(storedTone as AiTone)
      ? (storedTone as AiTone)
      : "Warm and encouraging";
  });

  useEffect(() => {
    localStorage.setItem(toneStorageKey, aiTone);
  }, [aiTone]);

  function handleThemeSelect(nextTheme: WorkspaceTheme) {
    setTheme(nextTheme);
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
      <section className="glass-panel rounded-[8px] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="glass-control inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700">
            <Sun className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-normal text-slate-950">
              Appearance
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Choose how the workspace feels on screen.
            </p>
          </div>
        </div>

        <div
          aria-label="Theme"
          className="glass-control inline-flex h-11 items-center rounded-full p-1"
          role="group"
        >
          <button
            aria-pressed={theme === "light"}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-600",
              theme === "light" && "blue-pill text-white"
            )}
            onClick={() => handleThemeSelect("light")}
            type="button"
          >
            <Sun className="h-4 w-4" aria-hidden="true" />
            Light
          </button>
          <button
            aria-pressed={theme === "dark"}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-600",
              theme === "dark" && "blue-pill text-white"
            )}
            onClick={() => handleThemeSelect("dark")}
            type="button"
          >
            <Moon className="h-4 w-4" aria-hidden="true" />
            Dark
          </button>
        </div>
      </section>

      <section className="glass-panel rounded-[8px] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="glass-control inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-normal text-slate-950">
              AI tone
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Match the coach voice to your mood.
            </p>
          </div>
        </div>

        <label
          className="text-sm font-semibold text-slate-700"
          htmlFor="ai-tone"
        >
          Coaching mood
        </label>
        <select
          className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-[0_8px_20px_rgba(42,42,42,0.06)] outline-none focus:border-slate-400"
          id="ai-tone"
          onChange={(event) => setAiTone(event.target.value as AiTone)}
          value={aiTone}
        >
          {aiToneOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </section>
    </div>
  );
}
