import { LogIn } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/common/Button";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { SaarthiLogo } from "@/components/common/SaarthiLogo";
import { useAuth } from "@/context/AuthContext";
import { activeDomain } from "@/domain";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const completed = await auth.login({ email, password });
      navigate(completed ? "/dashboard" : "/curator/onboarding", { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to log in."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <form className="glass-panel w-full max-w-md rounded-[8px] p-6" onSubmit={handleSubmit}>
        <AuthBrand />
        <h1 className="mt-6 text-2xl font-semibold text-slate-950">Login</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Continue to your {activeDomain.application.workspaceName}.
        </p>
        <SocialAuthButtons onUnavailable={setError} />
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase text-slate-400">or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <label className="mt-6 block text-sm font-semibold text-slate-700">
          Email
          <input
            className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 px-4 text-sm"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Password
          <input
            className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 px-4 text-sm"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
        <Button className="mt-6 w-full" disabled={isSubmitting} type="submit">
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>
        <p className="mt-4 text-center text-sm font-medium text-slate-500">
          No account?{" "}
          <Link className="font-semibold text-slate-950" to="/register">
            Register
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="workspace-shell flex min-h-screen items-center justify-center bg-[#bdbdbd] px-4 py-8">
      {children}
    </main>
  );
}

export function AuthBrand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-slate-950 text-white">
        <SaarthiLogo className="h-6 w-7" />
      </span>
      <div>
        <p className="text-lg font-semibold text-slate-950">
          {activeDomain.application.name}
        </p>
        <p className="text-xs font-medium text-slate-500">
          {activeDomain.application.workspaceName}
        </p>
      </div>
    </div>
  );
}
