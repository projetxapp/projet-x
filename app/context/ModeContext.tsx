'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Mode = 'talent' | 'project' | 'investor'

interface ModeContextType {
  activeMode: Mode
  setActiveMode: (m: Mode) => void
  userModes: Mode[]
  activateMode: (m: Mode) => void
  dark: boolean
  setDark: (d: boolean) => void
}

const Ctx = createContext<ModeContextType>({} as ModeContextType)

export function ModeProvider({ children }: { children: ReactNode }) {
  const [activeMode, setActiveModeState] = useState<Mode>('talent')
  const [userModes, setUserModes] = useState<Mode[]>(['talent'])
  const [dark, setDarkState] = useState(true)

  useEffect(() => {
    const m = localStorage.getItem('px_mode') as Mode
    const um = localStorage.getItem('px_userModes')
    const d = localStorage.getItem('px_dark')
    if (m) setActiveModeState(m)
    if (um) setUserModes(JSON.parse(um))
    if (d !== null) setDarkState(d === 'true')
  }, [])

  function setActiveMode(m: Mode) {
    setActiveModeState(m)
    localStorage.setItem('px_mode', m)
  }

  function activateMode(m: Mode) {
    const next = userModes.includes(m) ? userModes : [...userModes, m]
    setUserModes(next)
    localStorage.setItem('px_userModes', JSON.stringify(next))
    setActiveMode(m)
  }

  function setDark(d: boolean) {
    setDarkState(d)
    localStorage.setItem('px_dark', String(d))
  }

  return (
    <Ctx.Provider value={{ activeMode, setActiveMode, userModes, activateMode, dark, setDark }}>
      {children}
    </Ctx.Provider>
  )
}

export function useMode() { return useContext(Ctx) }