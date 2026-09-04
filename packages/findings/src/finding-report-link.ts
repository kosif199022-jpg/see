export interface FindingReportLink {
  findingId:string;
  reportId:string;
}

export function linkFindingToReport(findingId:string, reportId:string):FindingReportLink{
 return {findingId,reportId};
}
