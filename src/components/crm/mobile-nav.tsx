'use client'
import Link from 'next/link'
import { BarChart3, Users, CalendarClock } from 'lucide-react'
export function MobileNav(){ return <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-slate-200 bg-white px-2 py-3 lg:hidden"><Link href="/dashboard" className="grid place-items-center text-xs text-slate-600"><BarChart3 size={20}/><span>Accueil</span></Link><Link href="/clients" className="grid place-items-center text-xs text-slate-600"><Users size={20}/><span>Clients</span></Link><Link href="/callbacks" className="grid place-items-center text-xs text-slate-600"><CalendarClock size={20}/><span>Rappels</span></Link></nav> }
