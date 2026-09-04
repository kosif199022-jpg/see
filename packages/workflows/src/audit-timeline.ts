export interface TimelineEvent {
  stage:string;
  timestamp:string;
  actor:string;
}

export function addTimelineEvent(events:TimelineEvent[], event:TimelineEvent){
  return [...events,event];
}
