'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export type Mode = 'talent' | 'project' | 'investor'

interface Notification {
  id: string
  type: 'match' | 'message'
  title: string
  body: string
  matchId?: string
  createdAt: Date
  read: boolean
}

interface ModeContextType {
  activeMode: Mode
  setActiveMode: (mode: Mode) => void
  userModes: Mode[]
  activateMode: (mode: Mode) => void
  dark: boolean
  setDark: (dark: boolean) => void
  notifications: Notification[]
  unreadNotifCount: number
  markNotifRead: (id: string) => void
  markAllNotifRead: () => void
  addNotif: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
}

const ModeContext = createContext<ModeContextType>({
  activeMode: 'talent',
  setActiveMode: () => {},
  userModes: [],
  activateMode: () => {},
  dark: true,
  setDark: () => {},
  notifications: [],
  unreadNotifCount: 0,
  markNotifRead: () => {},
  markAllNotifRead: () => {},
  addNotif: () => {},
})

export function ModeProvider({ children }: { children: ReactNode }) {
  const [activeMode, setActiveModeState] = useState<Mode>('talent')
  const [userModes, setUserModes] = useState<Mode[]>([])
  const [dark, setDarkState] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userId, setUserId] = useState('')
  const realtimeRef = useRef<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem('px_mode') as Mode
    if (stored && ['talent', 'project', 'investor'].includes(stored)) setActiveModeState(stored)
    const storedModes = localStorage.getItem('px_userModes')
    if (storedModes) { try { setUserModes(JSON.parse(storedModes)) } catch {} }
    const storedDark = localStorage.getItem('px_dark')
    if (storedDark !== null) setDarkState(storedDark === 'true')
  }, [])

  useEffect(() => {
    async function initRealtime() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Realtime sur les nouveaux messages
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current)

      const channel = supabase.channel(`notifs-${user.id}`)
        // Nouveau message reçu
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
        }, async (payload: any) => {
          if (payload.new.sender_id === user.id) return

          // Vérifier que ce match appartient à cet utilisateur
          const { data: match } = await supabase.from('matches').select('*')
            .eq('id', payload.new.match_id)
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .single()
          if (!match) return

          const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id
          const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', otherId).single()
          const name = profile ? `${profile.first_name} ${profile.last_name}` : 'Quelqu\'un'

          addNotif({
            type: 'message',
            title: `💬 ${name}`,
            body: payload.new.content?.slice(0, 60) || 'Nouveau message',
            matchId: payload.new.match_id,
          })
        })
        // Nouveau match
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'matches',
        }, async (payload: any) => {
          const match = payload.new
          if (match.user1_id !== user.id && match.user2_id !== user.id) return

          const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id
          const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', otherId).single()
          const name = profile ? `${profile.first_name} ${profile.last_name}` : 'Quelqu\'un'

          addNotif({
            type: 'match',
            title: '🔥 Nouveau Match !',
            body: `Tu as matché avec ${name}`,
            matchId: match.id,
          })
        })
        .subscribe()

      realtimeRef.current = channel
    }

    initRealtime()
    return () => { if (realtimeRef.current) supabase.removeChannel(realtimeRef.current) }
  }, [])

  function addNotif(n: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    const notif: Notification = {
      ...n,
      id: `${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
      read: false,
    }
    setNotifications(prev => [notif, ...prev].slice(0, 20))

    // Toast visuel — crée un élément DOM temporaire
    const toast = document.createElement('div')
    toast.style.cssText = `
      position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
      background: ${n.type === 'match' ? 'linear-gradient(135deg,#6D28D9,#0891B2)' : '#1A1828'};
      border: 1px solid rgba(109,40,217,0.4);
      color: white; padding: 12px 20px; border-radius: 16px;
      font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 600;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 9999; max-width: 320px; text-align: center;
      animation: slideDown 0.3s ease;
      cursor: pointer;
    `
    toast.innerHTML = `<div style="font-weight:800;margin-bottom:2px">${n.title}</div><div style="opacity:0.8;font-size:12px">${n.body}</div>`
    toast.onclick = () => {
      if (n.matchId) window.location.href = `/chat?match=${n.matchId}`
      document.body.removeChild(toast)
    }

    const style = document.createElement('style')
    style.textContent = `@keyframes slideDown { from { opacity:0; transform: translateX(-50%) translateY(-10px) } to { opacity:1; transform: translateX(-50%) translateY(0) } }`
    document.head.appendChild(style)
    document.body.appendChild(toast)
    setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast) }, 4000)
  }

  function markNotifRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllNotifRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function setActiveMode(mode: Mode) {
    setActiveModeState(mode)
    localStorage.setItem('px_mode', mode)
  }

  function setDark(value: boolean) {
    setDarkState(value)
    localStorage.setItem('px_dark', String(value))
  }

  async function activateMode(mode: Mode) {
    setUserModes(prev => {
      const updated = prev.includes(mode) ? prev : [...prev, mode]
      localStorage.setItem('px_userModes', JSON.stringify(updated))
      return updated
    })
    setActiveMode(mode)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('user_modes').upsert({ user_id: user.id, mode })
      if (mode === 'talent') await supabase.from('talent_profiles').upsert({ user_id: user.id }, { onConflict: 'user_id' })
      if (mode === 'project') await supabase.from('project_profiles').upsert({ user_id: user.id }, { onConflict: 'user_id' })
      if (mode === 'investor') await supabase.from('investor_profiles').upsert({ user_id: user.id }, { onConflict: 'user_id' })
    }
  }

  const unreadNotifCount = notifications.filter(n => !n.read).length

  return (
    <ModeContext.Provider value={{
      activeMode, setActiveMode, userModes, activateMode,
      dark, setDark,
      notifications, unreadNotifCount, markNotifRead, markAllNotifRead, addNotif,
    }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  return useContext(ModeContext)
}