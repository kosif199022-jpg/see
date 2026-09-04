export type Tenant = {
  id:string;
  name:string;
  active:boolean;
};

export function canAccessTenant(userTenant:string, resourceTenant:string){
  return userTenant === resourceTenant;
}
