"use client";

import type { Employee } from "@org-tools/types";
import { useState } from "react";
import { HiOutlineUser } from "react-icons/hi2";

import { isSafeAvatarBase64Url } from "@/lib/employee-data";
import { getEmployeeInitials } from "@/lib/employee-utils";
import { cn } from "@/lib/utils";

type EmployeeAvatarProps = {
  className?: string;
  employee: Employee;
};

export function EmployeeAvatar({ className, employee }: EmployeeAvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageUrl = isSafeAvatarBase64Url(employee.avatarBase64Url)
    ? employee.avatarBase64Url
    : null;
  const shouldShowImage = imageUrl && failedImageUrl !== imageUrl;
  const initials = getEmployeeInitials(employee);

  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {shouldShowImage ? (
        // biome-ignore lint/performance/noImgElement: embedded data URLs are local-only and unsupported by next/image in a static export.
        <img
          alt={`Avatar for ${employee.fullName}`}
          className="size-full object-cover"
          decoding="async"
          loading="lazy"
          onError={() => setFailedImageUrl(imageUrl)}
          src={imageUrl}
        />
      ) : (
        <span>{initials || <HiOutlineUser className="size-5" />}</span>
      )}
    </div>
  );
}
