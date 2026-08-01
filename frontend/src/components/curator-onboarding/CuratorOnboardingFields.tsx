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
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        className={cn(
          "mt-2 h-12 w-full rounded-[8px] border border-[#e8e8e8] bg-white px-4 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
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
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        className={cn(
          "mt-2 min-h-28 w-full resize-none rounded-[8px] border border-[#e8e8e8] bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
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
        "group flex min-h-16 items-center gap-3 rounded-[8px] border p-3 text-left transition hover:-translate-y-0.5",
        isSelected
          ? "border-slate-950 bg-[#eeeeee] text-slate-950 shadow-[0_14px_28px_rgba(24,24,24,0.08)]"
          : "border-[#e8e8e8] bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      )}
      onClick={onClick}
      type="button"
    >
      {Icon ? (
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition",
            isSelected
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-slate-200 bg-slate-100 text-slate-500 group-hover:text-slate-950"
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        {children ? (
          <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">
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
      className="rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
      role="alert"
    >
      {error}
    </p>
  );
}
