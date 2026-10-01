import type { AuthorizedEmployee, EmployeeFieldId, OrganizationEmployee } from "@org-tools/types";

import type { AuthorizedTemplateValuesByEmployeeId } from "@/lib/custom-employee-fields";

export const hydrateAuthorizedEmployee = (employee: AuthorizedEmployee): OrganizationEmployee => ({
  avatarBase64Url: employee.avatarBase64Url ?? null,
  birthday: employee.birthday ?? null,
  createdAt: employee.createdAt,
  customFieldValues: employee.customFieldValues ?? {},
  email: employee.email ?? null,
  firstName: employee.firstName ?? "",
  gender: employee.gender ?? "unspecified",
  id: employee.id,
  lastName: employee.lastName ?? "",
  phone: employee.phone ?? null,
  profileUrl: employee.profileUrl ?? null,
  tags: employee.tags ?? [],
  updatedAt: employee.updatedAt,
  username: employee.username ?? null,
});

export const createAuthorizedTemplateValuesByEmployeeId = (
  employees: readonly AuthorizedEmployee[],
): AuthorizedTemplateValuesByEmployeeId =>
  new Map<string, Partial<Record<EmployeeFieldId, string>>>(
    employees.flatMap((employee) =>
      employee.resolvedTemplateValues
        ? [[employee.id, employee.resolvedTemplateValues] as const]
        : [],
    ),
  );
