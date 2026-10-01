"use client";

import { type FormEvent, useState } from "react";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineCog6Tooth,
  HiOutlineKey,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUiText } from "@/i18n/use-ui-text";
import { cn } from "@/lib/utils";

export function AccountMenu({
  collapsed,
  labelClassName,
  onOpenAdministration,
  triggerClassName,
}: {
  collapsed: boolean;
  labelClassName: string;
  onOpenAdministration?: (() => void) | undefined;
  triggerClassName: string;
}) {
  const auth = useAuth();
  const t = useUiText();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const email = auth.bootstrap?.account.email ?? "";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(false);
    void auth
      .changePassword(currentPassword, password)
      .then(() => {
        setPasswordOpen(false);
        setCurrentPassword("");
        setPassword("");
      })
      .catch(() => setError(true))
      .finally(() => setPending(false));
  };

  return (
    <>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-label={t("Account menu")}
            className={cn("group relative", triggerClassName)}
            data-demo-id="account-menu"
            title={email}
            type="button"
            variant="ghost"
          >
            <HiOutlineUserCircle className="!size-5 shrink-0" />
            <span className={labelClassName}>{email}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align={collapsed ? "start" : "end"} className="w-64 p-2" side="right">
          <p className="truncate px-2 py-2 text-sm font-medium">{email}</p>
          {onOpenAdministration && (
            <Button
              className="w-full justify-start"
              data-demo-id="account-administration"
              onClick={() => {
                setOpen(false);
                onOpenAdministration();
              }}
              variant="ghost"
            >
              <HiOutlineCog6Tooth />
              {t("Administration")}
            </Button>
          )}
          <Button
            className="w-full justify-start"
            onClick={() => {
              setOpen(false);
              setPasswordOpen(true);
            }}
            variant="ghost"
          >
            <HiOutlineKey />
            {t("Change password")}
          </Button>
          <Button
            className="w-full justify-start"
            onClick={() => void auth.logout()}
            variant="ghost"
          >
            <HiOutlineArrowRightOnRectangle />
            {t("Log out")}
          </Button>
        </PopoverContent>
      </Popover>
      <Dialog onOpenChange={setPasswordOpen} open={passwordOpen}>
        <DialogContent>
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{t("Change password")}</DialogTitle>
            </DialogHeader>
            <DialogBody className="grid gap-4" data-demo-id="change-password-body">
              <div className="grid gap-2">
                <Label htmlFor="current-password">{t("Current password")}</Label>
                <Input
                  id="current-password"
                  minLength={15}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                  type="password"
                  value={currentPassword}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account-new-password">{t("New password")}</Label>
                <Input
                  id="account-new-password"
                  minLength={15}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>
              {error && (
                <p className="text-sm font-medium text-destructive" role="alert">
                  {t("The current password is incorrect.")}
                </p>
              )}
            </DialogBody>
            <DialogFooter>
              <Button disabled={pending} type="submit">
                {t("Change password")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
