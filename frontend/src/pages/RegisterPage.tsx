import { UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/common/Button";
import { useAuth } from "@/context/AuthContext";
import { AuthBrand, AuthShell } from "@/pages/LoginPage";

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await auth.register({ name, email, password });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to register."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <form className="glass-panel w-full max-w-md rounded-[8px] p-6" onSubmit={handleSubmit}>
        <AuthBrand />
        <h1 className="mt-6 text-2xl font-semibold text-slate-950">Register</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Create your account. You will log in after registration.
        </p>
        <label className="mt-6 block text-sm font-semibold text-slate-700">
          Name
          <input
            className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 px-4 text-sm"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
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
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
        <Button className="mt-6 w-full" disabled={isSubmitting} type="submit">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? "Creating account..." : "Register"}
        </Button>
        <p className="mt-4 text-center text-sm font-medium text-slate-500">
          Already registered?{" "}
          <Link className="font-semibold text-slate-950" to="/login">
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
