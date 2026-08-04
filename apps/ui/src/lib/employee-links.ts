import { isSafeProfileUrl } from "@/lib/employee-data";

export const createEmployeeProfileUrl = (profileUrl: string | null) =>
  isSafeProfileUrl(profileUrl) ? profileUrl : null;

export const createMailtoUrl = (email: string | null) =>
  email ? `mailto:${encodeURIComponent(email)}` : null;
