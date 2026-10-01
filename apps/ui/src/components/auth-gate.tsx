"use client";

import { type FormEvent, useState } from "react";
import { HiOutlineArrowPath, HiOutlineLockClosed } from "react-icons/hi2";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUiText } from "@/i18n/use-ui-text";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const t = useUiText();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [pending, setPending] = useState(false);

  if (auth.mode === "loading") {
    return (
      <main
        aria-busy="true"
        className="flex h-dvh items-center justify-center bg-shell"
        data-demo-id="state-loading"
      >
        <span aria-label={t("Loading")} role="status">
          <HiOutlineArrowPath
            aria-hidden="true"
            className="size-8 animate-spin text-signal motion-reduce:animate-none"
            data-demo-id="state-loading-indicator"
          />
        </span>
      </main>
    );
  }
  if (
    auth.mode === "authenticated" &&
    auth.bootstrap &&
    !auth.bootstrap.account.mustChangePassword
  ) {
    return children;
  }

  if (auth.mode === "authenticated" && auth.bootstrap?.account.mustChangePassword) {
    const change = (event: FormEvent) => {
      event.preventDefault();
      setPending(true);
      void auth.changePassword(password, nextPassword).finally(() => setPending(false));
    };
    return (
      <main className="flex min-h-dvh items-center justify-center bg-shell p-6 text-foreground">
        <form
          className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm"
          data-demo-id="forced-password-form"
          onSubmit={change}
        >
          <HiOutlineLockClosed className="mb-5 size-9 text-signal" />
          <h1 className="text-xl font-semibold">{t("Change temporary password")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Choose a new password before continuing.")}
          </p>
          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="temporary-password">{t("Temporary password")}</Label>
              <Input
                autoComplete="current-password"
                id="temporary-password"
                minLength={15}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">{t("New password")}</Label>
              <Input
                autoComplete="new-password"
                id="new-password"
                minLength={15}
                onChange={(event) => setNextPassword(event.target.value)}
                required
                type="password"
                value={nextPassword}
              />
            </div>
          </div>
          {auth.error && (
            <p className="mt-4 text-sm font-medium text-destructive" role="alert">
              {t("The current password is incorrect.")}
            </p>
          )}
          <Button className="mt-6 w-full" disabled={pending} type="submit">
            {t("Change password")}
          </Button>
        </form>
      </main>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    const operation =
      auth.mode === "setup"
        ? auth.setup({ email, password, setupToken })
        : auth.login({ email, password });
    void operation.finally(() => setPending(false));
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-shell p-6 text-foreground">
      <form
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm"
        data-demo-id={auth.mode === "setup" ? "setup-form" : "login-form"}
        onSubmit={submit}
      >
        <div className="flex flex-col items-center text-center" data-demo-id="auth-heading">
          <HiOutlineLockClosed className="mb-5 size-9 text-signal" />
          <h1 className="text-xl font-semibold">
            {t(auth.mode === "setup" ? "Set up Org Tools" : "Sign in")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              auth.mode === "setup"
                ? "Create the first Super Administrator account."
                : "Use your organization account to continue.",
            )}
          </p>
        </div>
        <div className="mt-6 grid gap-4">
          {auth.mode === "setup" && (
            <div className="grid gap-2">
              <Label htmlFor="setup-token">{t("Setup token")}</Label>
              <Input
                autoComplete="off"
                id="setup-token"
                onChange={(event) => setSetupToken(event.target.value)}
                required
                type="password"
                value={setupToken}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="account-email">{t("Email")}</Label>
            <Input
              autoComplete="username"
              id="account-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="account-password">{t("Password")}</Label>
            <Input
              autoComplete={auth.mode === "setup" ? "new-password" : "current-password"}
              id="account-password"
              minLength={15}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
        </div>
        {auth.error && (
          <p className="mt-4 text-sm font-medium text-destructive" role="alert">
            {t(
              auth.error === "invalid_credentials"
                ? "The email or password is incorrect."
                : auth.error === "rate_limited"
                  ? "Too many attempts. Try again later."
                  : auth.error === "invalid_setup_token"
                    ? "The setup token is incorrect."
                    : "The server is unavailable.",
            )}
          </p>
        )}
        <Button className="mt-6 w-full" disabled={pending} type="submit">
          {t(auth.mode === "setup" ? "Create Super Administrator" : "Sign in")}
        </Button>
      </form>
    </main>
  );
}
