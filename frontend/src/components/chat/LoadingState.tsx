import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { activeDomain } from "@/domain";

export function LoadingState() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const attempt = Math.min(3, Math.floor(elapsedSeconds / 20) + 1);
  const isRetryWindow = attempt > 1;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setElapsedSeconds((currentValue) => currentValue + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 text-slate-700">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-slate-950">
            {isRetryWindow
              ? `Retrying AI generation... Attempt ${attempt} of 3`
              : activeDomain.pages.chat.generatingLabel}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {isRetryWindow
              ? "The AI service may be temporarily busy. We are keeping your request active."
              : activeDomain.pages.chat.loadingDescription}
          </p>
        </div>
      </div>
    </section>
  );
}
