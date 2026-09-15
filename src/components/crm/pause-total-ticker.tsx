'use client'
import { useEffect, useState } from 'react'
const format=(total:number)=>`${String(Math.floor(total/3600)).padStart(2,'0')}:${String(Math.floor(total%3600/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
export function PauseTotalTicker({completedSeconds,startedAt}:{completedSeconds:number;startedAt:string|null}){const total=()=>completedSeconds+(startedAt?Math.max(0,Math.floor((Date.now()-new Date(startedAt).getTime())/1000)):0);const [seconds,setSeconds]=useState(total);useEffect(()=>{setSeconds(total());const timer=window.setInterval(()=>setSeconds(total()),1000);return()=>clearInterval(timer)},[completedSeconds,startedAt]);return <>{format(seconds)}</>}
