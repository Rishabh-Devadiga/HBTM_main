import type { LucideIcon } from "lucide-react";
import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/utils/cn";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({ className, label, ...props }: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <input
        className={cn(
          "mt-2 h-12 w-full rounded-md border border-white/12 bg-white/8 px-4 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:bg-white/12 focus:ring-2 focus:ring-cyan-300/20",
          className
        )}
        {...props}
      />
    </label>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function TextAreaField({
  className,
  label,
  ...props
}: TextAreaFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <textarea
        className={cn(
          "mt-2 min-h-28 w-full resize-none rounded-md border border-white/12 bg-white/8 px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:bg-white/12 focus:ring-2 focus:ring-cyan-300/20",
          className
        )}
        {...props}
      />
    </label>
  );
}

type OptionButtonProps = {
  children?: ReactNode;
  icon?: LucideIcon;
  isSelected: boolean;
  label: string;
  onClick: () => void;
};

export function OptionButton({
  children,
  icon: Icon,
  isSelected,
  label,
  onClick,
}: OptionButtonProps) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        "group flex min-h-16 items-center gap-3 rounded-md border p-3 text-left transition hover:-translate-y-0.5",
        isSelected
          ? "border-cyan-300/70 bg-cyan-300/12 text-white shadow-[0_18px_44px_rgba(34,211,238,0.12)]"
          : "border-white/12 bg-white/7 text-slate-300 hover:border-white/24 hover:bg-white/10"
      )}
      onClick={onClick}
      type="button"
    >
      {Icon ? (
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition",
            isSelected
              ? "border-cyan-200/50 bg-cyan-200/16 text-cyan-100"
              : "border-white/10 bg-black/10 text-slate-400 group-hover:text-slate-100"
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        {children ? (
          <span className="mt-1 block text-xs font-medium leading-5 text-slate-400">
            {children}
          </span>
        ) : null}
      </span>
    </button>
  );
}

type ErrorMessageProps = {
  error: string | null;
};

export function ErrorMessage({ error }: ErrorMessageProps) {
  if (!error) {
    return null;
  }

  return (
    <p
      className="rounded-md border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100"
      role="alert"
    >
      {error}
    </p>
  );
}
