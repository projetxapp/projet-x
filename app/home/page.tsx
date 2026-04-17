'use client'

import { useState, useEffect } from 'react'
import { useMode, Mode } from '../context/ModeContext'
import { supabase } from '../lib/supabase'

const RECOMMENDED: Record<string, any[]> = {
  talent: [
    { id: 1, name: 'EcoTrack', sub: 'GreenTech · Croissance', photo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80', score: 96, badge: '🔥 Top match', badgeColor: '#F97316', tags: ['React Native', 'Data viz'] },
    { id: 2, name: 'Flio', sub: 'PropTech · Prototype', photo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80', score: 88, badge: '⚡ Flash dispo', badgeColor: '#A78BFA', tags: ['UX/UI', 'Marketing'] },
    { id: 3, name: 'Foody', sub: 'FoodTech · Lancé', photo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', score: 92, badge: '🟢 Actif', badgeColor: '#4ADE80', tags: ['Growth', 'Social Media'] },
  ],
  project: [
    { id: 1, name: 'Sofia Amrani', sub: 'Dev Full-stack · Paris', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', score: 94, badge: '🔥 Top match', badgeColor: '#F97316', tags: ['React Native', 'TypeScript'], online: true },
    { id: 2, name: 'Jade Kim', sub: 'Growth Marketer · Remote', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', score: 91, badge: '⚡ Dispo maintenant', badgeColor: '#A78BFA', tags: ['SEO', 'n8n'], online: true },
    { id: 3, name: 'Camille Dubois', sub: 'UX Designer · Nantes', photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80', score: 96, badge: '💎 Equity only', badgeColor: '#22D3EE', tags: ['Figma', 'Framer'], online: false },
  ],
  investor: [
    { id: 1, name: 'EcoTrack', sub: 'GreenTech · 18k€ MRR', photo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80', score: 96, badge: '📈 Série A', badgeColor: '#4ADE80', tags: ['Traction forte', 'B2B'], mrr: '18k€' },
    { id: 2, name: 'Foody', sub: 'FoodTech · 12k€ MRR', photo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', score: 92, badge: '🔥 Chaud', badgeColor: '#F97316', tags: ['D2C', 'Récurrent'], mrr: '12k€' },
    { id: 3, name: 'MindFlow', sub: 'HealthTech · Idée', photo: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&q=80', score: 79, badge: '💡 Early stage', badgeColor: '#FCD34D', tags: ['IA', 'B2C'], mrr: null },
  ],
}

const MODE_CONFIG = {
  talent: { accent: '#6D28D9', accentLight: '#A78BFA', accentBg: 'rgba(109,40,217,0.12)', gradient: 'linear-gradient(135deg, #6D28D9, #8B5CF6)', greeting: 'Prêt à rejoindre un projet ? ⚡', swipeLabel: 'Swipe des projets', swipeCount: 12, swipeSub: 'projets qui te correspondent', feedTitle: 'Projets pour toi' },
  project: { accent: '#0891B2', accentLight: '#22D3EE', accentBg: 'rgba(8,145,178,0.12)', gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)', greeting: 'Trouve ton équipe de rêve 🚀', swipeLabel: 'Swipe des talents', swipeCount: 8, swipeSub: 'talents disponibles', feedTitle: 'Talents recommandés' },
  investor: { accent: '#B45309', accentLight: '#FCD34D', accentBg: 'rgba(180,83,9,0.12)', gradient: 'linear-gradient(135deg, #B45309, #F59E0B)', greeting: 'De nouvelles pépites t\'attendent 💎', swipeLabel: 'Swipe des projets', swipeCount: 6, swipeSub: 'projets à fort potentiel', feedTitle: 'Projets sélectionnés' },
}

function ModeSelector({ muted, cardBorder }: { muted: string, cardBorder: string }) {
  const { activeMode, setActiveMode, userModes, activateMode } = useMode()
  const modes = [
    { id: 'talent' as Mode, emoji: '⚡', label: 'Talent' },
    { id: 'project' as Mode, emoji: '🚀', label: 'Projet' },
    { id: 'investor' as Mode, emoji: '💎', label: 'Invest' },
  ]
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {modes.map(m => {
        const isActive = activeMode === m.id
        const has = userModes.includes(m.id)
        const cfg = MODE_CONFIG[m.id]
        return (
          <button key={m.id} onClick={() => has ? setActiveMode(m.id) : activateMode(m.id)}
            style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${isActive ? cfg.accent : cardBorder}`, background: isActive ? cfg.accentBg : 'transparent', color: isActive ? cfg.accentLight : muted, fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
            {m.emoji} {m.label}{!has && <span style={{ color: '#F97316', fontSize: '9px' }}>+</span>}
          </button>
        )
      })}
    </div>
  )
}

export default function HomePage() {
  const { activeMode, userModes, activateMode, dark, setDark } = useMode()
  const [firstName, setFirstName] = useState('')
  const [newMatches, setNewMatches] = useState(0)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setUserId(user.id)
      const name = localStorage.getItem('px_firstName') || ''
      setFirstName(name)
      const { count } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      setNewMatches(count || 0)
    }
    init()
  }, [])

  const bg = dark ? '#08070F' : '#F4F2FF'
  const card = dark ? '#111019' : '#FFFFFF'
  const cardBorder = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const surface = dark ? '#1A1828' : '#F8F7FF'
  const text = dark ? '#F0EEFF' : '#0D0C18'
  const muted = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
  const hint = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
  const navBg = dark ? '#111019' : '#FFFFFF'

  const hasMode = userModes.includes(activeMode)
  const cfg = MODE_CONFIG[activeMode]
  const cards = RECOMMENDED[activeMode] || []

  const navItems = [
    { id: 'home', label: 'Accueil', href: '/home', active: true },
    { id: 'chat', label: 'Chat', href: '/chat' },
    { id: 'swipe', href: '/swipe' },
    { id: 'explorer', label: 'Explorer', href: '/explorer' },
    { id: 'profil', label: 'Profil', href: '/profil' },
  ]

  return (
    <div style={{ height: '100%', overflow: 'hidden', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', transition: 'background 0.3s' }}>
      <div style={{ padding: '44px 20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <div style={{ width: 26, height: 26, borderRadius: '8px', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', boxShadow: `0 4px 12px ${cfg.accent}55` }}>✦</div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: cfg.accentLight }}>Projet X</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: text, letterSpacing: '-0.5px' }}>
              Salut, {firstName || '...'} 👋
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setDark(!dark)} style={{ background: 'none', border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dark ? '☀️' : '🌙'}
            </button>
            <div onClick={() => window.location.href = '/profil'} style={{ position: 'relative', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: 'white', border: `2px solid ${cfg.accent}` }}>
                {firstName ? firstName[0].toUpperCase() : '?'}
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, background: '#4ADE80', borderRadius: '50%', border: `2px solid ${bg}` }} />
            </div>
          </div>
        </div>
        <ModeSelector muted={muted} cardBorder={cardBorder} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 8px' }}>
        {!hasMode ? (
          <div style={{ background: card, border: `1px solid rgba(109,40,217,0.2)`, borderRadius: '20px', padding: '28px 20px', textAlign: 'center', margin: '8px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{activeMode === 'talent' ? '⚡' : activeMode === 'project' ? '🚀' : '💎'}</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: text, marginBottom: '8px' }}>Profil {activeMode === 'talent' ? 'Talent' : activeMode === 'project' ? 'Projet' : 'Investisseur'} non créé</div>
            <div style={{ fontSize: '13px', color: muted, marginBottom: '20px' }}>Active ce profil pour voir les recommandations.</div>
            <button onClick={() => activateMode(activeMode)} style={{ width: '100%', padding: '13px', background: cfg.gradient, border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Créer mon profil</button>
          </div>
        ) : (
          <>
            {newMatches > 0 && (
              <div onClick={() => window.location.href = '/chat'}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, marginBottom: '12px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cfg.accent}10, transparent)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', flexShrink: 0 }}>
                  {['https://i.pravatar.cc/150?img=11', 'https://i.pravatar.cc/150?img=47', 'https://i.pravatar.cc/150?img=32'].slice(0, Math.min(newMatches, 3)).map((src, i) => (
                    <img key={i} src={src} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${bg}`, marginLeft: i > 0 ? '-8px' : '0' }} />
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: text }}>🔥 {newMatches} nouveau{newMatches > 1 ? 'x' : ''} match{newMatches > 1 ? 'es' : ''}</div>
                  <div style={{ fontSize: '11px', color: muted }}>Envoie un message maintenant</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={cfg.accentLight} strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
            )}

            <div onClick={() => window.location.href = '/swipe'}
              style={{ borderRadius: '22px', overflow: 'hidden', marginBottom: '20px', cursor: 'pointer', position: 'relative', background: cfg.gradient, boxShadow: `0 12px 40px ${cfg.accent}40` }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '140px', height: '140px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ padding: '20px 20px 18px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', marginBottom: '4px' }}>{cfg.greeting}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '14px' }}>{cfg.swipeCount} {cfg.swipeSub}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '30px', padding: '10px 18px' }}>
                      <span style={{ fontSize: '18px' }}>♥</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>{cfg.swipeLabel} →</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '56px', opacity: 0.3, flexShrink: 0 }}>
                    {activeMode === 'talent' ? '🚀' : activeMode === 'project' ? '⚡' : '💎'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: text }}>{cfg.feedTitle}</div>
              <div onClick={() => window.location.href = '/explorer'} style={{ fontSize: '12px', color: cfg.accentLight, cursor: 'pointer', fontWeight: '600' }}>Voir tout →</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cards.map((c, i) => (
                <div key={c.id} onClick={() => window.location.href = '/swipe'}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: card, borderRadius: '18px', border: `1px solid ${cardBorder}`, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.accent + '50')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = cardBorder)}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: cfg.gradient, borderRadius: '0 3px 3px 0', opacity: i === 0 ? 1 : 0.4 }} />
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={c.photo} alt="" style={{ width: 52, height: 52, borderRadius: '14px', objectFit: 'cover', border: `1.5px solid ${cardBorder}` }} />
                    {c.online !== undefined && <div style={{ position: 'absolute', bottom: 2, right: 2, width: 11, height: 11, background: c.online ? '#4ADE80' : 'rgba(255,255,255,0.3)', borderRadius: '50%', border: `2px solid ${card}` }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</span>
                      <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', background: c.badgeColor + '20', color: c.badgeColor, flexShrink: 0 }}>{c.badge}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: muted, marginBottom: '5px' }}>{c.sub}{c.mrr ? ` · 📈 ${c.mrr} MRR` : ''}</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {c.tags?.map((t: string, j: number) => (
                        <span key={j} style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: surface, color: muted, border: `1px solid ${hint}` }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: c.score >= 90 ? '#F97316' : cfg.accentLight }}>{c.score}%</div>
                    <div style={{ fontSize: '8px', color: hint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>match</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: '8px' }} />
          </>
        )}
      </div>

      <div style={{ background: navBg, borderTop: `1px solid ${cardBorder}`, paddingBottom: 16, paddingTop: 8, display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexShrink: 0 }}>
        {navItems.map(item => (
          <div key={item.id} onClick={() => window.location.href = item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', flex: 1 }}>
            {item.id === 'swipe' ? (
              <>
                <div style={{ width: 38, height: 38, borderRadius: '50%', border: `2px solid ${cfg.accent}`, background: cfg.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${cfg.accent}40` }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill={cfg.accentLight} /></svg>
                </div>
                <span style={{ fontSize: '8px', fontWeight: '600', textTransform: 'uppercase' as const, color: cfg.accentLight }}>Swipe</span>
              </>
            ) : (
              <>
                <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.id === 'home' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9Z" stroke={item.active ? cfg.accentLight : muted} strokeWidth="1.5" fill={item.active ? cfg.accentBg : 'none'} /></svg>}
                  {item.id === 'chat' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={muted} strokeWidth="1.5" /></svg>}
                  {item.id === 'explorer' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={muted} strokeWidth="1.5" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" stroke={muted} strokeWidth="1.5" strokeLinejoin="round" /></svg>}
                  {item.id === 'profil' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={muted} strokeWidth="1.5" /><path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" stroke={muted} strokeWidth="1.5" strokeLinecap="round" /></svg>}
                </div>
                <span style={{ fontSize: '8px', fontWeight: '600', textTransform: 'uppercase' as const, color: item.active ? cfg.accentLight : muted, letterSpacing: '0.04em' }}>
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