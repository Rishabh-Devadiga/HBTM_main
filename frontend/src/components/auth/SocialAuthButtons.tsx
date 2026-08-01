import { Apple } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/common/Button";
import { useAuth } from "@/context/AuthContext";

type SocialAuthButtonsProps = {
  onUnavailable: (message: string) => void;
};

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined;

export function SocialAuthButtons({ onUnavailable }: SocialAuthButtonsProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [isLoadingProvider, setIsLoadingProvider] = useState<"google" | "apple" | null>(
    null
  );

  async function finishLogin(completed: boolean) {
    navigate(completed ? "/dashboard" : "/curator/onboarding", { replace: true });
  }

  async function handleGoogle() {
    if (!googleClientId?.trim()) {
      onUnavailable("Google login is not configured yet.");
      return;
    }
    try {
      setIsLoadingProvider("google");
      await loadScript("https://accounts.google.com/gsi/client", "google-identity");
      const codeClient = window.google?.accounts?.oauth2?.initCodeClient({
        client_id: googleClientId,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: (response) => {
          void (async () => {
            if (response.error) {
              onUnavailable(`Google login failed: ${response.error}`);
              setIsLoadingProvider(null);
              return;
            }
            if (!response.code) {
              onUnavailable("Google did not return a login code.");
              setIsLoadingProvider(null);
              return;
            }
            try {
              const completed = await auth.loginWithGoogle({
                code: response.code,
              });
              await finishLogin(completed);
            } catch (error) {
              onUnavailable(
                error instanceof Error ? error.message : "Google login failed."
              );
            } finally {
              setIsLoadingProvider(null);
            }
          })();
        },
      });
      if (!codeClient) {
        onUnavailable("Google login could not be started.");
        setIsLoadingProvider(null);
        return;
      }
      codeClient.requestCode();
    } catch (error) {
      onUnavailable(error instanceof Error ? error.message : "Google login failed.");
      setIsLoadingProvider(null);
    }
  }

  async function handleApple() {
    if (!appleClientId?.trim()) {
      onUnavailable("Apple login is not configured yet.");
      return;
    }
    try {
      setIsLoadingProvider("apple");
      await loadScript(
        "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js",
        "apple-identity"
      );
      window.AppleID?.auth?.init({
        clientId: appleClientId,
        scope: "name email",
        redirectURI: window.location.origin,
        usePopup: true,
      });
      const response = await window.AppleID?.auth?.signIn();
      const idToken = response?.authorization?.id_token;
      if (!idToken) {
        onUnavailable("Apple did not return a login token.");
        return;
      }
      const completed = await auth.loginWithApple({
        idToken,
        name: formatAppleName(response?.user?.name),
      });
      await finishLogin(completed);
    } catch (error) {
      onUnavailable(error instanceof Error ? error.message : "Apple login failed.");
    } finally {
      setIsLoadingProvider(null);
    }
  }

  return (
    <div className="mt-5 grid gap-2">
      <Button
        className="w-full"
        disabled={isLoadingProvider !== null}
        onClick={handleGoogle}
        type="button"
        variant="secondary"
      >
        <span
          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-black text-slate-950"
          aria-hidden="true"
        >
          G
        </span>
        {isLoadingProvider === "google" ? "Connecting Google..." : "Continue with Google"}
      </Button>
      <Button
        className="w-full"
        disabled={isLoadingProvider !== null}
        onClick={handleApple}
        type="button"
        variant="secondary"
      >
        <Apple className="h-4 w-4" aria-hidden="true" />
        {isLoadingProvider === "apple" ? "Connecting Apple..." : "Continue with Apple"}
      </Button>
    </div>
  );
}

function loadScript(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-auth="${id}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.auth = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load the sign-in provider."));
    document.head.appendChild(script);
  });
}

function formatAppleName(name?: { firstName?: string; lastName?: string }) {
  const fullName = [name?.firstName, name?.lastName].filter(Boolean).join(" ").trim();
  return fullName || undefined;
}

declare global {
  interface Window {
    AppleID?: {
      auth?: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization?: {
            id_token?: string;
          };
          user?: {
            name?: {
              firstName?: string;
              lastName?: string;
            };
          };
        }>;
      };
    };
  }
}
