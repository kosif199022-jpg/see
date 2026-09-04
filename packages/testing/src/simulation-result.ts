export interface SimulationResult { passed:number; failed:number; notes:string[] }

export function createSimulationResult():SimulationResult{
 return {passed:0,failed:0,notes:[]};
}
