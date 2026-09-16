'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
const format=(total:number)=>`${String(Math.floor(total/3600)).padStart(2,'0')}:${String(Math.floor(total%3600/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
type Pause={id:string;pause_type:string;started_at:string}
export function PauseTotalTicker({completedSeconds,startedAt}:{completedSeconds:number;startedAt:string|null}){
  const [completed,setCompleted]=useState(completedSeconds);const [open,setOpen]=useState<Pause|null>(startedAt?{id:'initial',pause_type:'',started_at:startedAt}:null);const [offset,setOffset]=useState(0);const [now,setNow]=useState(Date.now());const syncing=useRef(false)
  const sync=useCallback(async()=>{if(syncing.current||document.visibilityState!=='visible')return;syncing.current=true;try{const response=await fetch('/api/pauses',{cache:'no-store'});if(!response.ok)return;const data=await response.json() as {serverNow:string;open:Pause|null;completedSeconds:number};setCompleted(data.completedSeconds);setOpen(data.open);const nextOffset=new Date(data.serverNow).getTime()-Date.now();setOffset(nextOffset);setNow(Date.now()+nextOffset)}finally{syncing.current=false}},[])
  useEffect(()=>{setCompleted(completedSeconds);setOpen(startedAt?{id:'initial',pause_type:'',started_at:startedAt}:null)},[completedSeconds,startedAt])
  useEffect(()=>{void sync();const poll=window.setInterval(()=>void sync(),1000);return()=>window.clearInterval(poll)},[sync])
  useEffect(()=>{let timer:number;const tick=()=>{const adjusted=Date.now()+offset;setNow(adjusted);timer=window.setTimeout(tick,1000-(adjusted%1000)+5)};tick();return()=>window.clearTimeout(timer)},[offset])
  const seconds=completed+(open?Math.max(0,Math.floor((now-new Date(open.started_at).getTime())/1000)):0)
  return <>{format(seconds)}</>
}
