import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/common/buttonVariants";
import { activeDomain } from "@/domain";
import { AuthBrand, AuthShell } from "@/pages/LoginPage";
import { cn } from "@/utils/cn";

export function AuthChoicePage() {
  return (
    <AuthShell>
      <section className="glass-panel w-full max-w-md rounded-[8px] p-6 text-center">
        <div className="flex justify-center">
          <AuthBrand />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-slate-950">
          Welcome to {activeDomain.application.name}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500">
          Choose how you want to enter your growth workspace. You can continue
          with an existing account or create a new profile.
        </p>
        <div className="mt-7 grid gap-3">
          <Link
            className={cn(
              buttonVariants({ size: "large" }),
              "w-full bg-slate-950 text-white"
            )}
            to="/login"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Login
          </Link>
          <Link
            className={buttonVariants({ size: "large", variant: "secondary" })}
            to="/register"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Register
          </Link>
        </div>
        <Link
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-950"
          to="/"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to intro
        </Link>
      </section>
    </AuthShell>
  );
}
