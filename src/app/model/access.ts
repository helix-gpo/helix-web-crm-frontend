export type EntityType = 'TENANT' | 'PROJECT' | 'MILESTONE' | 'INVOICE' | 'PARTNER' | 'TESTIMONIAL';

export type PermissionAction = 'READ' | 'WRITE' | 'DELETE';

export interface PermissionEntry {
  entity: EntityType;
  action: PermissionAction;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  unrestricted: boolean;
  permissions: PermissionEntry[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  unrestricted?: boolean;
  permissions: PermissionEntry[];
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
  unrestricted?: boolean;
  permissions: PermissionEntry[];
}

export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  active: boolean;
  assignedProjectIds: string[];
}

export interface CreateEmployeeRequest {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

export interface UpdateEmployeeRoleRequest {
  roleId: string;
}
