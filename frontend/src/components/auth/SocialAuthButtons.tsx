import { Apple } from "lucide-react";

import { Button } from "@/components/common/Button";

type SocialAuthButtonsProps = {
  onUnavailable: (message: string) => void;
};

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined;

export function SocialAuthButtons({ onUnavailable }: SocialAuthButtonsProps) {
  function handleGoogle() {
    if (!googleClientId?.trim()) {
      onUnavailable("Google login is not configured yet.");
      return;
    }
    onUnavailable("Google login needs a backend token exchange before it can be enabled.");
  }

  function handleApple() {
    if (!appleClientId?.trim()) {
      onUnavailable("Apple login is not configured yet.");
      return;
    }
    onUnavailable("Apple login needs a backend token exchange before it can be enabled.");
  }

  return (
    <div className="mt-5 grid gap-2">
      <Button className="w-full" onClick={handleGoogle} type="button" variant="secondary">
        <span
          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-black text-slate-950"
          aria-hidden="true"
        >
          G
        </span>
        Continue with Google
      </Button>
      <Button className="w-full" onClick={handleApple} type="button" variant="secondary">
        <Apple className="h-4 w-4" aria-hidden="true" />
        Continue with Apple
      </Button>
    </div>
  );
}
