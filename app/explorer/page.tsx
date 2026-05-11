'use client'

import { useState, useEffect, useRef } from 'react'
import { useMode, Mode } from '../context/ModeContext'
import { supabase } from '../lib/supabase'

const MODE_CONFIG = {
  talent: { accent: '#6D28D9', accentLight: '#A78BFA', accentBg: 'rgba(109,40,217,0.1)', gradient: 'linear-gradient(135deg,#6D28D9,#8B5CF6)' },
  project: { accent: '#0891B2', accentLight: '#22D3EE', accentBg: 'rgba(8,145,178,0.1)', gradient: 'linear-gradient(135deg,#0891B2,#06B6D4)' },
  investor: { accent: '#B45309', accentLight: '#FCD34D', accentBg: 'rgba(180,83,9,0.1)', gradient: 'linear-gradient(135deg,#B45309,#F59E0B)' },
}

const QUICK_TAGS = ['React', 'Figma', 'Marketing', 'Finance', 'IA', 'No-code', 'Design', 'Sales', 'Python', 'Vidéo']

export default function ExplorerPage() {
  const { activeMode, dark, setDark, unreadNotifCount } = useMode()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const debounceRef = useRef<any>(null)

  const bg = dark ? '#08070F' : '#F4F2FF'
  const card = dark ? '#111019' : '#FFFFFF'
  const cardBorder = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const surface = dark ? '#1A1828' : '#F8F7FF'
  const text = dark ? '#F0EEFF' : '#0D0C18'
  const muted = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
  const hint = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
  const navBg = dark ? '#111019' : '#FFFFFF'
  const cfg = MODE_CONFIG[activeMode]

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setCurrentUserId(user.id)
    }
    init()
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  async function search(q: string) {
    setLoading(true)
    try {
      const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url, city').neq('id', currentUserId)
      const { data: talents } = await supabase.from('talent_profiles').select('user_id, skills, statut, bio, collab_modes')
      const { data: projects } = await supabase.from('project_profiles').select('user_id, project_name, sectors, stage, description')

      const enriched: any[] = []
      const ql = q.toLowerCase()

      profiles?.forEach(p => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
        const talent = talents?.find(t => t.user_id === p.id)
        const project = projects?.find(pr => pr.user_id === p.id)

        const matchName = fullName.includes(ql)
        const matchSkill = talent?.skills?.some((s: string) => s.toLowerCase().includes(ql))
        const matchProject = project?.project_name?.toLowerCase().includes(ql)
        const matchSector = project?.sectors?.some((s: string) => s.toLowerCase().includes(ql))

        if (matchName || matchSkill || matchProject || matchSector) {
          enriched.push({
            id: p.id, firstName: p.first_name, lastName: p.last_name,
            photo: p.avatar_url || `https://i.pravatar.cc/150?u=${p.id}`,
            city: p.city || '',
            talent, project,
          })
        }
      })

      setResults(enriched.slice(0, 20))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function sendMessage(userId: string) {
    if (!currentUserId) return
    const { data: existing } = await supabase.from('matches').select('id')
      .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUserId})`)
      .single()

    if (existing) {
      window.location.href = `/chat?match=${existing.id}`
      return
    }

    const { data: newMatch } = await supabase.from('matches').insert({
      user1_id: currentUserId, user2_id: userId, mode1: activeMode, mode2: activeMode,
    }).select().single()

    if (newMatch) window.location.href = `/chat?match=${newMatch.id}`
  }

  const navItems = [
    { id: 'home', href: '/home' }, { id: 'chat', href: '/chat' },
    { id: 'swipe', href: '/swipe' }, { id: 'explorer', href: '/explorer', active: true }, { id: 'profil', href: '/profil' },
  ]

  if (selected) {
    return (
      <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden' }}>
        <div style={{ padding: '44px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `1px solid ${cardBorder}`, flexShrink: 0 }}>
          <button onClick={() => setSelected(null)} style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div style={{ fontSize: '16px', fontWeight: '800', color: text }}>Profil</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <img src={selected.photo} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${cfg.accent}` }} />
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: text }}>{selected.firstName} {selected.lastName}</div>
              {selected.city && <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>📍 {selected.city}</div>}
            </div>
          </div>

          {selected.talent && (
            <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#A78BFA', marginBottom: '10px' }}>⚡ Talent</div>
              {selected.talent.statut && <div style={{ fontSize: '13px', color: text, marginBottom: '8px' }}>{selected.talent.statut}</div>}
              {selected.talent.bio && <div style={{ fontSize: '12px', color: muted, lineHeight: 1.6, marginBottom: '10px' }}>{selected.talent.bio}</div>}
              {selected.talent.skills?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                  {selected.talent.skills.map((s: string, i: number) => (
                    <span key={i} style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', background: 'rgba(109,40,217,0.1)', color: '#A78BFA', border: '1px solid rgba(109,40,217,0.2)' }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {selected.project && (
            <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#22D3EE', marginBottom: '10px' }}>🚀 Projet</div>
              {selected.project.project_name && <div style={{ fontSize: '15px', fontWeight: '700', color: text, marginBottom: '4px' }}>{selected.project.project_name}</div>}
              {selected.project.stage && <div style={{ fontSize: '11px', color: muted, marginBottom: '8px' }}>Stade : {selected.project.stage}</div>}
              {selected.project.description && <div style={{ fontSize: '12px', color: muted, lineHeight: 1.6 }}>{selected.project.description}</div>}
            </div>
          )}

          <button onClick={() => sendMessage(selected.id)}
            style={{ width: '100%', padding: '14px', background: cfg.gradient, border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>
            💬 Envoyer un message
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflow: 'hidden', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', transition: 'background 0.3s' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ padding: '44px 20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: text }}>Explorer</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Cloche */}
            <div onClick={() => window.location.href = '/notifications'} style={{ position: 'relative', cursor: 'pointer' }}>
              <button style={{ background: 'none', border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</button>
              {unreadNotifCount > 0 && <div style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, background: '#F97316', borderRadius: '50%', fontSize: '9px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${bg}` }}>{unreadNotifCount}</div>}
            </div>
            <button onClick={() => setDark(!dark)} style={{ background: 'none', border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" stroke={muted} strokeWidth="2" /><path d="M21 21L16.65 16.65" stroke={muted} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Recherche un talent, projet, compétence..."
            style={{ width: '100%', padding: '12px 14px 12px 36px', background: surface, border: `1.5px solid ${query.length > 0 ? cfg.accent : cardBorder}`, borderRadius: '14px', color: text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit', transition: 'border-color 0.2s' }} />
          {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: muted, cursor: 'pointer', fontSize: '16px' }}>×</button>}
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {QUICK_TAGS.map((tag, i) => (
            <button key={i} onClick={() => setQuery(tag)}
              style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${query === tag ? cfg.accent : cardBorder}`, background: query === tag ? cfg.accentBg : 'transparent', color: query === tag ? cfg.accentLight : muted, fontSize: '11px', fontWeight: '600', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${cfg.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!loading && query.length < 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50%', textAlign: 'center', gap: '12px' }}>
            <div style={{ fontSize: '48px' }}>🔭</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: text }}>Cherche qui tu veux</div>
            <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>Tape un nom, une compétence ou un secteur</div>
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50%', textAlign: 'center', gap: '12px' }}>
            <div style={{ fontSize: '40px' }}>😕</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: text }}>Aucun résultat</div>
            <div style={{ fontSize: '13px', color: muted }}>Essaie avec d'autres mots clés</div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.map(r => (
              <div key={r.id} onClick={() => setSelected(r)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.accent + '50')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = cardBorder)}>
                <img src={r.photo} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${cardBorder}`, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: text, marginBottom: '2px' }}>{r.firstName} {r.lastName}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                    {r.talent?.skills?.slice(0, 2).map((s: string, i: number) => (
                      <span key={i} style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '20px', background: 'rgba(109,40,217,0.1)', color: '#A78BFA' }}>{s}</span>
                    ))}
                    {r.project?.project_name && (
                      <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '20px', background: 'rgba(8,145,178,0.1)', color: '#22D3EE' }}>🚀 {r.project.project_name}</span>
                    )}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={muted} strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: navBg, borderTop: `1px solid ${cardBorder}`, paddingBottom: 16, paddingTop: 8, display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexShrink: 0 }}>
        {navItems.map(item => (
          <div key={item.id} onClick={() => window.location.href = item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', flex: 1 }}>
            {item.id === 'swipe' ? (
              <>
                <div style={{ width: 38, height: 38, borderRadius: '50%', border: `2px solid ${cfg.accent}`, background: cfg.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill={cfg.accentLight} /></svg>
                </div>
                <span style={{ fontSize: '8px', fontWeight: '600', textTransform: 'uppercase' as const, color: cfg.accentLight }}>Swipe</span>
              </>
            ) : (
              <>
                <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.id === 'home' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9Z" stroke={muted} strokeWidth="1.5" /></svg>}
                  {item.id === 'chat' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={muted} strokeWidth="1.5" /></svg>}
                  {item.id === 'explorer' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={(item as any).active ? cfg.accentLight : muted} strokeWidth="1.5" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" stroke={(item as any).active ? cfg.accentLight : muted} strokeWidth="1.5" strokeLinejoin="round" /></svg>}
                  {item.id === 'profil' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={muted} strokeWidth="1.5" /><path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" stroke={muted} strokeWidth="1.5" strokeLinecap="round" /></svg>}
                </div>
                <span style={{ fontSize: '8px', fontWeight: '600', textTransform: 'uppercase' as const, color: (item as any).active ? cfg.accentLight : muted, letterSpacing: '0.04em' }}>
                  {item.id === 'home' ? 'Accueil' : item.id === 'chat' ? 'Chat' : item.id === 'explorer' ? 'Explorer' : 'Profil'}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}