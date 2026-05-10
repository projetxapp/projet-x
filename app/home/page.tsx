'use client'

import { useState, useEffect } from 'react'
import { useMode, Mode } from '../context/ModeContext'
import { supabase } from '../lib/supabase'
import { getMatchScore } from '../lib/matching'

const MODE_CONFIG = {
  talent: {
    accent: '#6D28D9', accentLight: '#A78BFA', accentBg: 'rgba(109,40,217,0.12)',
    gradient: 'linear-gradient(135deg, #6D28D9, #8B5CF6)',
    swipeLabel: 'Swipe des projets', swipeSub: 'projets qui te correspondent',
    feedTitle: 'Tes derniers matches', emptySwipe: 'Prêt à rejoindre un projet ? ⚡',
  },
  project: {
    accent: '#0891B2', accentLight: '#22D3EE', accentBg: 'rgba(8,145,178,0.12)',
    gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)',
    swipeLabel: 'Swipe des talents', swipeSub: 'talents disponibles',
    feedTitle: 'Tes derniers matches', emptySwipe: 'Trouve ton équipe de rêve 🚀',
  },
  investor: {
    accent: '#B45309', accentLight: '#FCD34D', accentBg: 'rgba(180,83,9,0.12)',
    gradient: 'linear-gradient(135deg, #B45309, #F59E0B)',
    swipeLabel: 'Swipe des projets', swipeSub: 'projets à fort potentiel',
    feedTitle: 'Tes derniers matches', emptySwipe: 'De nouvelles pépites t\'attendent 💎',
  },
}

function ModeSelector({ muted, cardBorder }: { muted: string; cardBorder: string }) {
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
  const { activeMode, userModes, activateMode, dark, setDark, unreadNotifCount } = useMode()
  const [firstName, setFirstName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [matches, setMatches] = useState<any[]>([])
  const [totalMatches, setTotalMatches] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [profileCompletion, setProfileCompletion] = useState(0)

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

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }

      setFirstName(localStorage.getItem('px_firstName') || '')

      const { data: profileData } = await supabase.from('profiles').select('first_name, avatar_url').eq('id', user.id).single()
      if (profileData) {
        setFirstName(profileData.first_name || '')
        setAvatarUrl(profileData.avatar_url || '')
      }

      const { count: total } = await supabase
        .from('matches').select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      setTotalMatches(total || 0)

      const { data: matchData } = await supabase
        .from('matches').select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(3)

      if (matchData && matchData.length > 0) {
        let totalUnread = 0

        const enriched = await Promise.all(matchData.map(async (match: any) => {
          const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id
          const matchMode = match.mode1 || activeMode

          const [profileRes, lastMsgRes, unreadRes, score] = await Promise.all([
            supabase.from('profiles').select('id, first_name, last_name, avatar_url').eq('id', otherId).single(),
            supabase.from('messages').select('content, created_at, sender_id').eq('match_id', match.id).order('created_at', { ascending: false }).limit(1),
            supabase.from('messages').select('*', { count: 'exact', head: true }).eq('match_id', match.id).neq('sender_id', user.id).eq('seen', false),
            getMatchScore(user.id, otherId, matchMode),
          ])

          const profile = profileRes.data
          const lastMsg = lastMsgRes.data?.[0]
          const lastMsgIsMe = lastMsg?.sender_id === user.id
          totalUnread += unreadRes.count || 0

          let subtitle = ''
          let tags: string[] = []
          const { data: talentP } = await supabase.from('talent_profiles').select('statut, skills').eq('user_id', otherId).single()
          if (talentP) {
            subtitle = talentP.statut || ''
            tags = talentP.skills?.slice(0, 3) || []
          } else {
            const { data: projectP } = await supabase.from('project_profiles').select('project_name, stage, sectors').eq('user_id', otherId).single()
            if (projectP) {
              subtitle = `${projectP.project_name || 'Projet'} · ${projectP.stage || ''}`
              tags = projectP.sectors?.slice(0, 2) || []
            }
          }

          return {
            matchId: match.id,
            userId: otherId,
            firstName: profile?.first_name || 'Utilisateur',
            lastName: profile?.last_name || '',
            photo: profile?.avatar_url || `https://i.pravatar.cc/150?u=${otherId}`,
            subtitle, tags,
            lastMsg: lastMsg?.content || '',
            lastMsgIsMe,
            unread: unreadRes.count || 0,
            score,
          }
        }))

        setMatches(enriched)
        setUnreadCount(totalUnread)
      }

      const { data: talentProf } = await supabase.from('talent_profiles').select('bio, skills').eq('user_id', user.id).single()
      if (talentProf) {
        let comp = 0
        if (talentProf.bio?.trim()) comp += 50
        if (talentProf.skills?.length > 0) comp += 50
        setProfileCompletion(comp)
      }

      setLoadingMatches(false)
    }
    init()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Salut' : 'Bonsoir'

  const navItems = [
    { id: 'home', href: '/home', active: true },
    { id: 'chat', href: '/chat' },
    { id: 'swipe', href: '/swipe' },
    { id: 'explorer', href: '/explorer' },
    { id: 'profil', href: '/profil' },
  ]

  return (
    <div style={{ height: '100%', overflow: 'hidden', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', transition: 'background 0.3s' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ padding: '44px 20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <div style={{ width: 26, height: 26, borderRadius: '8px', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✦</div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: cfg.accentLight }}>Projet X</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: text, letterSpacing: '-0.5px' }}>
              {greeting}, {firstName || '...'} 👋
            </div>
          </div>

          {/* Actions header */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Cloche notifications */}
            <div onClick={() => window.location.href = '/notifications'}
              style={{ position: 'relative', cursor: 'pointer' }}>
              <button style={{ background: 'none', border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🔔
              </button>
              {unreadNotifCount > 0 && (
                <div style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, background: '#F97316', borderRadius: '50%', fontSize: '9px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${bg}` }}>
                  {unreadNotifCount}
                </div>
              )}
            </div>

            {/* Dark mode */}
            <button onClick={() => setDark(!dark)}
              style={{ background: 'none', border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dark ? '☀️' : '🌙'}
            </button>

            {/* Avatar */}
            <div onClick={() => window.location.href = '/profil'} style={{ position: 'relative', cursor: 'pointer' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${cfg.accent}` }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: 'white', border: `2px solid ${cfg.accent}` }}>
                  {firstName ? firstName[0].toUpperCase() : '?'}
                </div>
              )}
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
            <div style={{ fontSize: '16px', fontWeight: '800', color: text, marginBottom: '8px' }}>Profil non créé</div>
            <div style={{ fontSize: '13px', color: muted, marginBottom: '20px' }}>Active ce profil pour voir les recommandations.</div>
            <button onClick={() => activateMode(activeMode)}
              style={{ width: '100%', padding: '13px', background: cfg.gradient, border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              Créer mon profil
            </button>
          </div>
        ) : (
          <>
            {/* Barre complétion */}
            {profileCompletion < 100 && (
              <div onClick={() => window.location.href = '/profil'}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: card, borderRadius: '16px', border: `1px solid ${cfg.accent}30`, marginBottom: '12px', cursor: 'pointer' }}>
                <div style={{ fontSize: '24px' }}>📝</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: text, marginBottom: '4px' }}>Complete ton profil pour matcher mieux</div>
                  <div style={{ height: 5, background: surface, borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${profileCompletion}%`, height: '100%', background: cfg.gradient, borderRadius: '5px', transition: 'width 0.5s' }} />
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: cfg.accentLight }}>{profileCompletion}%</div>
              </div>
            )}

            {/* CTA Swipe */}
            <div onClick={() => window.location.href = '/swipe'}
              style={{ borderRadius: '22px', overflow: 'hidden', marginBottom: '16px', cursor: 'pointer', position: 'relative', background: cfg.gradient, boxShadow: `0 12px 40px ${cfg.accent}40` }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '140px', height: '140px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ padding: '20px 20px 18px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', marginBottom: '4px' }}>{cfg.emptySwipe}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '14px' }}>Swipe pour découvrir des {cfg.swipeSub}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '30px', padding: '10px 18px' }}>
                      <span style={{ fontSize: '18px' }}>♥</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>{cfg.swipeLabel} →</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '52px', opacity: 0.3 }}>
                    {activeMode === 'talent' ? '🚀' : activeMode === 'project' ? '⚡' : '💎'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section matches */}
            {loadingMatches ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${cfg.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : matches.length === 0 ? (
              <div style={{ background: card, borderRadius: '20px', border: `1px solid ${cardBorder}`, padding: '28px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>💫</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: text, marginBottom: '8px' }}>Pas encore de matches</div>
                <div style={{ fontSize: '13px', color: muted, marginBottom: '20px', lineHeight: 1.5 }}>Swipe des profils pour commencer à matcher.</div>
                <button onClick={() => window.location.href = '/swipe'}
                  style={{ padding: '12px 24px', background: cfg.gradient, border: 'none', borderRadius: '14px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Commencer à swiper →
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: text }}>{cfg.feedTitle}</div>
                    {unreadCount > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: '#F97316', color: 'white' }}>
                        {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {totalMatches > 3 && (
                    <div onClick={() => window.location.href = '/chat'}
                      style={{ fontSize: '12px', color: cfg.accentLight, cursor: 'pointer', fontWeight: '600' }}>
                      Voir les {totalMatches} →
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {matches.map(m => (
                    <div key={m.matchId} onClick={() => window.location.href = `/chat?match=${m.matchId}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: card, borderRadius: '18px', border: `1px solid ${m.unread > 0 ? cfg.accent + '40' : cardBorder}`, cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.accent + '60')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = m.unread > 0 ? cfg.accent + '40' : cardBorder)}>
                      {m.unread > 0 && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: cfg.gradient }} />}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={m.photo} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${m.unread > 0 ? cfg.accent : cardBorder}` }} />
                        {m.unread > 0 && (
                          <div style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, background: '#F97316', borderRadius: '50%', fontSize: '9px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${bg}` }}>
                            {m.unread}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <div style={{ fontSize: '14px', fontWeight: m.unread > 0 ? '800' : '600', color: text }}>
                            {m.firstName} {m.lastName}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: m.score >= 80 ? '#4ADE80' : cfg.accentLight, flexShrink: 0, background: m.score >= 80 ? 'rgba(74,222,128,0.1)' : cfg.accentBg, padding: '2px 8px', borderRadius: '20px' }}>
                            {m.score}%
                          </div>
                        </div>
                        {m.subtitle && <div style={{ fontSize: '11px', color: muted, marginBottom: '4px' }}>{m.subtitle}</div>}
                        {m.lastMsg ? (
                          <div style={{ fontSize: '11px', color: m.unread > 0 ? text : muted, fontWeight: m.unread > 0 ? '600' : '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                            {m.lastMsgIsMe ? <span style={{ color: muted }}>Toi : </span> : null}{m.lastMsg}
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: cfg.accentLight, fontStyle: 'italic', fontWeight: '500' }}>
                            🔥 Nouveau match — dis bonjour !
                          </div>
                        )}
                        {m.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                            {m.tags.map((t: string, j: number) => (
                              <span key={j} style={{ fontSize: '9px', fontWeight: '600', padding: '2px 7px', borderRadius: '20px', background: surface, color: muted, border: `1px solid ${hint}` }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div onClick={() => window.location.href = '/explorer'}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: card, borderRadius: '18px', border: `1px solid ${cardBorder}`, cursor: 'pointer', marginTop: '12px' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.accent + '50')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = cardBorder)}>
                  <div style={{ width: 44, height: 44, borderRadius: '12px', background: cfg.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🔭</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: text, marginBottom: '2px' }}>Explorer tous les profils</div>
                    <div style={{ fontSize: '11px', color: muted }}>Recherche par nom, compétences, secteur...</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={cfg.accentLight} strokeWidth="2" strokeLinecap="round" /></svg>
                </div>
              </>
            )}
            <div style={{ height: '8px' }} />
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ background: navBg, borderTop: `1px solid ${cardBorder}`, paddingBottom: 16, paddingTop: 8, display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexShrink: 0 }}>
        {navItems.map(item => (
          <div key={item.id} onClick={() => window.location.href = item.href}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', flex: 1, position: 'relative' }}>
            {item.id === 'swipe' ? (
              <>
                <div style={{ width: 38, height: 38, borderRadius: '50%', border: `2px solid ${cfg.accent}`, background: cfg.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${cfg.accent}40` }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill={cfg.accentLight} /></svg>
                </div>
                <span style={{ fontSize: '8px', fontWeight: '600', textTransform: 'uppercase' as const, color: cfg.accentLight }}>Swipe</span>
              </>
            ) : (
              <>
                {item.id === 'chat' && unreadCount > 0 && (
                  <div style={{ position: 'absolute', top: 0, right: '18%', width: 15, height: 15, background: '#F97316', borderRadius: '50%', fontSize: '8px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${navBg}` }}>
                    {unreadCount}
                  </div>
                )}
                <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.id === 'home' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9Z" stroke={(item as any).active ? cfg.accentLight : muted} strokeWidth="1.5" fill={(item as any).active ? cfg.accentBg : 'none'} /></svg>}
                  {item.id === 'chat' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={muted} strokeWidth="1.5" /></svg>}
                  {item.id === 'explorer' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={muted} strokeWidth="1.5" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" stroke={muted} strokeWidth="1.5" strokeLinejoin="round" /></svg>}
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