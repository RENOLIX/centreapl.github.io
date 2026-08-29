'use client'
import Link from 'next/link'
import { BarChart3, Bell, CalendarClock, PlayCircle, ShoppingCart, Users } from 'lucide-react'
import type { MenuBadges } from './sidebar'
type Role='admin'|'supervisor'|'agent'
const Item=({href,label,Icon,count=0,dot=false}:{href:string;label:string;Icon:typeof Bell;count?:number;dot?:boolean})=><Link href={href} className="relative grid place-items-center text-[10px] text-slate-300"><Icon size={19}/>{count>0&&(dot?<span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500"/>:<span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-[8px] font-black text-white">{count>9?'9+':count}</span>)}<span>{label}</span></Link>
export function MobileNav({role,badges}:{role:Role;badges:MenuBadges}){return <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-white/10 bg-[#25292d] px-2 py-2.5 text-white lg:hidden"><Item href="/dashboard" label="Dashboard" Icon={BarChart3}/>{role==='agent'?<Item href="/work" label="Poste" Icon={PlayCircle} count={badges.work} dot/>:<Item href="/agents" label="Agents" Icon={Users}/>}<Item href="/sales" label="Ventes" Icon={ShoppingCart}/>{role==='agent'?<Item href="/callbacks" label="Rappels" Icon={CalendarClock} count={badges.callbacks}/>:<Item href="/notifications" label="Notifs" Icon={Bell} count={badges.notifications}/>}</nav>}
