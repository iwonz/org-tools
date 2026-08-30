"use client";

import { Button } from "@/components/ui/button";
import { useUiText } from "@/i18n/use-ui-text";

export function RootDatabaseUnavailable() {
  const t = useUiText();
  return (
    <main className="flex h-dvh items-center justify-center bg-shell p-6 text-foreground">
      <section className="w-full max-w-md rounded-xl bg-card p-6">
        <h1 className="text-lg font-semibold">{t("Database unavailable")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("Org Tools could not open the local SQLite database.")}
        </p>
        <Button className="mt-5" onClick={() => window.location.reload()} type="button">
          {t("Retry")}
        </Button>
      </section>
    </main>
  );
}
