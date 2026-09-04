export interface FindingDashboardItem {
  id:string;
  title:string;
  severity:'low'|'medium'|'high'|'critical';
  status:string;
}

export function openFindings(items:FindingDashboardItem[]) {
  return items.filter(item=>item.status!=='closed');
}
