export function algiersDayRange(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Algiers',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now)
  const value=(type:string)=>Number(parts.find(part=>part.type===type)?.value||0)
  const start=new Date(Date.UTC(value('year'),value('month')-1,value('day'))-60*60*1000)
  const end=new Date(start.getTime()+24*60*60*1000)
  return {start:start.toISOString(),end:end.toISOString()}
}
