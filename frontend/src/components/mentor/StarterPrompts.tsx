import { SaarthiLogo } from "@/components/common/SaarthiLogo";

import { activeDomain } from "@/domain";

type StarterPromptsProps = {
  disabled?: boolean;
  onSelect?: (prompt: string) => void;
  prompts?: readonly string[];
};

export function StarterPrompts({
  disabled,
  onSelect,
  prompts,
}: StarterPromptsProps) {
  const starterPrompts = prompts ?? activeDomain.pages.mentor.starterPrompts;

  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-[8px] bg-slate-950 text-white shadow-lg">
        <SaarthiLogo className="h-8 w-9" />
      </span>
      <h2 className="mt-5 text-2xl font-bold text-slate-950">
        {activeDomain.pages.mentor.welcomeTitle}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
        {activeDomain.pages.mentor.welcomeDescription}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {starterPrompts.map((prompt) => (
          <button
            className="glass-control rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-800 transition hover:border-blue-300 disabled:opacity-50"
            disabled={disabled}
            key={prompt}
            onClick={() => onSelect?.(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>
    </section>
  );
}
