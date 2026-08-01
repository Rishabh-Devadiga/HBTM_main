import { ArrowRight, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/common/buttonVariants";
import { SaarthiLogo } from "@/components/common/SaarthiLogo";
import { activeDomain } from "@/domain";
import { cn } from "@/utils/cn";

export function HomePage() {
  return (
    <main className="workspace-shell flex min-h-screen items-center justify-center bg-[#bdbdbd] px-4 py-8 text-slate-950">
      <section className="glass-panel w-full max-w-2xl rounded-[8px] p-6 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[8px] bg-slate-950 text-white">
          <SaarthiLogo className="h-8 w-9" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
          {activeDomain.application.name}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
          A personal growth workspace that turns your goals into a saved journey,
          focused resources, opportunities, habits, and coaching.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className={cn(buttonVariants({ size: "large" }), "bg-slate-950 text-white")} to="/login">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Login
          </Link>
          <Link className={buttonVariants({ size: "large", variant: "secondary" })} to="/register">
            Register
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
