"use client";

import type { ComponentType } from "react";
import { createContext, useContext, useLayoutEffect, useRef } from "react";

export type ContextHeaderAction = {
  dataDemoId: string;
  disabled?: boolean;
  icon: ComponentType<{ className?: string }>;
  iconPlacement?: "leading" | "trailing";
  id: string;
  label: string;
  onClick: () => void;
};

export type ContextHeaderActionRegistrar = (action: ContextHeaderAction) => () => void;

export const ContextHeaderActionContext = createContext<ContextHeaderActionRegistrar | null>(null);

export const useContextHeaderAction = (action: ContextHeaderAction | null) => {
  const registerAction = useContext(ContextHeaderActionContext);
  const onClickRef = useRef(action?.onClick);
  onClickRef.current = action?.onClick;
  const dataDemoId = action?.dataDemoId;
  const disabled = action?.disabled;
  const icon = action?.icon;
  const iconPlacement = action?.iconPlacement;
  const id = action?.id;
  const label = action?.label;

  useLayoutEffect(() => {
    if (!dataDemoId || !icon || !id || !label || !registerAction) return undefined;

    return registerAction({
      dataDemoId,
      ...(disabled === undefined ? {} : { disabled }),
      icon,
      ...(iconPlacement ? { iconPlacement } : {}),
      id,
      label,
      onClick: () => onClickRef.current?.(),
    });
  }, [dataDemoId, disabled, icon, iconPlacement, id, label, registerAction]);
};
