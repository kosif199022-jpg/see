export interface ValidationResult { valid:boolean; errors:string[] }

export function validateTrialBalance(totalDebit:bigint,totalCredit:bigint):ValidationResult{
 return totalDebit===totalCredit?{valid:true,errors:[]}:{valid:false,errors:['Trial balance is not balanced']};
}
