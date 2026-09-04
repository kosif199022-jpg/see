export type ReviewState='DRAFT'|'PREPARED'|'REVIEW'|'APPROVED'|'LOCKED';
export interface WorkpaperReview { id:string; state:ReviewState; reviewer?:string; notes:string[]; }
export function createWorkpaperReview(id:string):WorkpaperReview{return {id,state:'DRAFT',notes:[]};}
