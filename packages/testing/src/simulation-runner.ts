export type SimulationStatus='ready'|'running'|'completed';

export function startSimulation(){
 return {status:'running' as SimulationStatus};
}
