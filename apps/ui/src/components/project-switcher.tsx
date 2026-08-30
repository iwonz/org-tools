"use client";

import { type FormEvent, useState } from "react";
import {
  HiMiniCheck,
  HiOutlineCircleStack,
  HiOutlineLink,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";
import { useProjectWorkspace } from "@/components/project-workspace-controller";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUiText } from "@/i18n/use-ui-text";
import { PROJECT_NAME_MAX_LENGTH } from "@/lib/project-workspace";
import { cn } from "@/lib/utils";

type ProjectDialogMode = "create" | "rename" | null;

const projectNameKey = (name: string) => name.trim().normalize("NFKC").toLocaleLowerCase("en-US");

export function ProjectSwitcher({
  labelClassName,
  triggerClassName,
}: {
  labelClassName: string;
  triggerClassName: string;
}) {
  const t = useUiText();
  const workspace = useProjectWorkspace();
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<ProjectDialogMode>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const openDialog = (mode: Exclude<ProjectDialogMode, null>) => {
    setDialogMode(mode);
    setName(mode === "rename" ? workspace.project.name : "");
    setFormError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = name.trim().normalize("NFC");
    if (!normalized) {
      setFormError(t("Project name is required."));
      return;
    }
    const duplicate = workspace.projects.some(
      (project) =>
        project.id !== (dialogMode === "rename" ? workspace.project.id : null) &&
        projectNameKey(project.name) === projectNameKey(normalized),
    );
    if (duplicate) {
      setFormError(t("A project with this name already exists."));
      return;
    }
    try {
      if (dialogMode === "create") await workspace.createProject(normalized);
      if (dialogMode === "rename") await workspace.renameProject(normalized);
      setDialogMode(null);
      setOpen(false);
    } catch {
      setFormError(t("An unexpected error occurred."));
    }
  };

  return (
    <>
      <Popover
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) void workspace.refreshProjects();
        }}
        open={open}
      >
        <PopoverTrigger asChild>
          <Button
            aria-label={t("Switch project")}
            className={cn("group relative", triggerClassName)}
            data-demo-id="project-switcher"
            title={t("Switch project")}
            type="button"
            variant="ghost"
          >
            <HiOutlineCircleStack className="!size-5 shrink-0" />
            <span className={labelClassName} data-sidebar-label="">
              {workspace.project.name}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[19rem] overflow-hidden bg-popover p-0"
          data-demo-id="project-switcher-popover"
          side="right"
          sideOffset={10}
        >
          <div className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {t("Projects")}
          </div>
          <div className="max-h-64 overflow-y-auto px-2 pb-2">
            {workspace.projects.map((project) => {
              const selected = project.id === workspace.project.id;
              return (
                <button
                  className={cn(
                    "flex h-10 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-left text-sm transition-colors hover:bg-accent active:bg-accent-strong/70",
                    selected && "bg-accent font-semibold",
                  )}
                  data-demo-id={`project-option-${project.id}`}
                  key={project.id}
                  onClick={() => {
                    setOpen(false);
                    workspace.switchProject(project.id);
                  }}
                  type="button"
                >
                  <HiMiniCheck
                    className={cn("size-4 shrink-0", selected ? "opacity-100" : "opacity-0")}
                  />
                  <span className="min-w-0 flex-1 truncate">{project.name}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-4 gap-1 bg-muted/45 p-2">
            <Button
              aria-label={t("Create project")}
              onClick={() => openDialog("create")}
              size="icon"
              title={t("Create project")}
              type="button"
              variant="ghost"
            >
              <HiOutlinePlus />
            </Button>
            <Button
              aria-label={t("Rename project")}
              onClick={() => openDialog("rename")}
              size="icon"
              title={t("Rename project")}
              type="button"
              variant="ghost"
            >
              <HiOutlinePencilSquare />
            </Button>
            <Button
              aria-label={t("Copy project link")}
              onClick={() => void workspace.copyProjectLink()}
              size="icon"
              title={t("Copy project link")}
              type="button"
              variant="ghost"
            >
              <HiOutlineLink />
            </Button>
            <Button
              aria-label={t("Delete project")}
              onClick={() => setDeleteOpen(true)}
              size="icon"
              title={t("Delete project")}
              type="button"
              variant="ghost"
            >
              <HiOutlineTrash />
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDialogMode(null);
        }}
        open={dialogMode !== null}
      >
        <DialogContent className="max-w-sm" data-demo-id={`${dialogMode}-project-dialog`}>
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>
                {t(dialogMode === "rename" ? "Rename project" : "Create project")}
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <label className="grid gap-2 text-sm font-medium" htmlFor="project-name">
                {t("Project name")}
                <Input
                  autoFocus
                  id="project-name"
                  maxLength={PROJECT_NAME_MAX_LENGTH}
                  onChange={(event) => {
                    setName(event.currentTarget.value);
                    setFormError(null);
                  }}
                  value={name}
                />
              </label>
              {formError && (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
            </DialogBody>
            <DialogFooter>
              <Button onClick={() => setDialogMode(null)} type="button" variant="secondary">
                {t("Cancel")}
              </Button>
              <Button type="submit">
                {t(dialogMode === "rename" ? "Rename project" : "Create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogContent data-demo-id="delete-project-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete project?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Deleting this project cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void workspace.deleteProject()}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
