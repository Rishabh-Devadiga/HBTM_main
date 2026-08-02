import { Camera, KeyRound, Mail, Save, UserRound } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/common/Button";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser } from "@/types/auth";

export function ProfilePage() {
  const auth = useAuth();
  const user = auth.user;

  if (!user) {
    return null;
  }

  return <ProfileForm auth={auth} key={user.id} user={user} />;
}

function ProfileForm({
  auth,
  user,
}: {
  auth: ReturnType<typeof useAuth>;
  user: AuthUser;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busySection, setBusySection] = useState<string | null>(null);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSection("profile", async () => {
      await auth.updateProfile({ name, username });
      setMessage("Profile details updated.");
    });
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSection("email", async () => {
      await auth.updateProfile({ email });
      setMessage("Email updated.");
    });
  }

  async function submitAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSection("photo", async () => {
      await auth.updateProfile({ avatarUrl });
      setMessage("Photo updated.");
    });
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSection("password", async () => {
      await auth.updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password updated.");
    });
  }

  async function saveSection(section: string, action: () => Promise<void>) {
    setError(null);
    setMessage(null);
    setBusySection(section);
    try {
      await action();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update profile."
      );
    } finally {
      setBusySection(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[8px] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <AvatarPreview name={user?.name ?? "User"} url={user?.avatarUrl} />
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Profile</h1>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              Manage your login identity, account email, password, and profile photo.
            </p>
            {message ? (
              <p className="mt-3 text-sm font-semibold text-emerald-700">{message}</p>
            ) : null}
            {error ? (
              <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <ProfilePanel
          busy={busySection === "photo"}
          icon={Camera}
          onSubmit={submitAvatar}
          submitLabel="Save photo"
          title="Profile photo"
        >
          <label className="block text-sm font-semibold text-slate-700">
            Photo URL
            <input
              className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 px-4 text-sm"
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://..."
              type="url"
              value={avatarUrl}
            />
          </label>
        </ProfilePanel>

        <ProfilePanel
          busy={busySection === "profile"}
          icon={UserRound}
          onSubmit={submitProfile}
          submitLabel="Save profile"
          title="Username"
        >
          <label className="block text-sm font-semibold text-slate-700">
            Display name
            <input
              className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 px-4 text-sm"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Username
            <input
              className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 px-4 text-sm"
              onChange={(event) => setUsername(event.target.value)}
              pattern={"[A-Za-z0-9_.\\-]+"}
              required
              value={username}
            />
          </label>
        </ProfilePanel>

        <ProfilePanel
          busy={busySection === "email"}
          icon={Mail}
          onSubmit={submitEmail}
          submitLabel="Save email"
          title="Email"
        >
          <label className="block text-sm font-semibold text-slate-700">
            Email address
            <input
              className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 px-4 text-sm"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
        </ProfilePanel>

        <ProfilePanel
          busy={busySection === "password"}
          icon={KeyRound}
          onSubmit={submitPassword}
          submitLabel="Change password"
          title="Password"
        >
          <label className="block text-sm font-semibold text-slate-700">
            Current password
            <input
              className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 px-4 text-sm"
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              type="password"
              value={currentPassword}
            />
          </label>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            New password
            <input
              className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 px-4 text-sm"
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
          </label>
        </ProfilePanel>
      </div>
    </div>
  );
}

function AvatarPreview({ name, url }: { name: string; url?: string | null }) {
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-slate-950 text-2xl font-semibold text-white">
      {url ? (
        <img alt="" className="h-full w-full object-cover" src={url} />
      ) : (
        name.trim().charAt(0).toUpperCase() || "U"
      )}
    </div>
  );
}

function ProfilePanel({
  busy,
  children,
  icon: Icon,
  onSubmit,
  submitLabel,
  title,
}: {
  busy: boolean;
  children: ReactNode;
  icon: typeof UserRound;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  title: string;
}) {
  return (
    <form className="metric-card p-5" onSubmit={onSubmit}>
      <div className="mb-5 flex items-center gap-3">
        <span className="glass-control flex h-10 w-10 items-center justify-center rounded-[8px] text-slate-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
      <Button className="mt-5 w-full" disabled={busy} type="submit">
        <Save className="h-4 w-4" aria-hidden="true" />
        {busy ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
