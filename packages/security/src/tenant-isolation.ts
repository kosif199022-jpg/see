export type TenantContext = {
  tenantId: string;
  userId: string;
};

export function canAccessTenant(context: TenantContext, resourceTenantId: string) {
  return context.tenantId === resourceTenantId;
}

export function requireTenant(context: TenantContext, resourceTenantId: string) {
  if (!canAccessTenant(context, resourceTenantId)) {
    throw new Error('TENANT_ACCESS_DENIED');
  }
}
