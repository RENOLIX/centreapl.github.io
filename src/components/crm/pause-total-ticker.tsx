'use client'
import { useEffect, useState } from 'react'
const format=(total:number)=>`${String(Math.floor(total/3600)).padStart(2,'0')}:${String(Math.floor(total%3600/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
export function PauseTotalTicker({initialSeconds,running}:{initialSeconds:number;running:boolean}){const [seconds,setSeconds]=useState(initialSeconds);useEffect(()=>{setSeconds(initialSeconds)},[initialSeconds]);useEffect(()=>{if(!running)return;const timer=window.setInterval(()=>setSeconds(value=>value+1),1000);return()=>clearInterval(timer)},[running]);return <>{format(seconds)}</>}
