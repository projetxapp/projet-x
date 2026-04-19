'use client'

import { useState, useEffect } from 'react'
import { useMode, Mode } from '../context/ModeContext'
import { supabase } from '../lib/supabase'

const MODE_CONFIG = {
  talent: {
    accent: '#6D28D9', accentLight: '#A78BFA', accentBg: 'rgba(109,40,217,0.1)',
    gradient: 'linear-gradient(135deg, #6D28D9, #8B5CF6)',
    title: 'Explorer', sub: 'Recherche par nom, compétences ou secteur',
    ctaLabel: '♥ Je suis intéressé(e)',
  },
  project: {
    accent: '#0891B2', accentLight: '#22D3EE', accentBg: 'rgba(8,145,178,0.1)',
    gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)',
    title: 'Explorer', sub: 'Recherche des talents par compétence ou nom',
    ctaLabel: '♥ Proposer ma candidature',
  },
  investor: {
    accent: '#B45309', accentLight: '#FCD34D', accentBg: 'rgba(180,83,9,0.1)',
    gradient: 'linear-gradient(135deg, #B45309, #F59E0B)',
    title: 'Explorer', sub: 'Recherche des projets par secteur ou fondateur',
    ctaLabel: '💎 Demander le pitch deck',
  },
}

const STAGES = ['Idée', 'Prototype', 'Lancé', 'Croissance']
const COLLAB_MODES = ['Flash', 'Side', 'Equity']
const STAGE_COLORS: Record<string, string> = {
  'Idée': '#F97316', 'Prototype': '#8B5CF6', 'Lancé': '#4ADE80', 'Croissance': '#06B6D4'
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

export default function ExplorerPage() {
  const { activeMode, userModes, activateMode, dark, setDark } = useMode()
  const [userId, setUserId] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterStage, setFilterStage] = useState<string[]>([])
  const [filterMode, setFilterMode] = useState<string[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [sendingMsg, setSendingMsg] = useState(false)

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
  const isProjectMode = activeMode === 'project'

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setUserId(user.id)
    }
    init()
  }, [])

  // Charger seulement quand on tape
  useEffect(() => {
    if (!userId) return
    if (search.trim().length < 2 && filterStage.length === 0 && filterMode.length === 0) {
      setItems([])
      return
    }
    const timeout = setTimeout(() => loadItems(), 300)
    return () => clearTimeout(timeout)
  }, [search, filterStage, filterMode, activeMode, userId])

  async function loadItems() {
    if (!userId) return
    setLoading(true)
    try {
      if (isProjectMode) {
        const { data: talentData } = await supabase.from('talent_profiles').select('*').neq('user_id', userId)
        const { data: profileData } = await supabase.from('profiles').select('id, first_name, last_name, age, city, avatar_url').neq('id', userId)

        const merged = (talentData || []).map((t, i) => {
          const p = profileData?.find(pr => pr.id === t.user_id)
          return {
            id: t.id, user_id: t.user_id, isProject: false,
            firstName: p?.first_name || 'Utilisateur', lastName: p?.last_name || '',
            photo: p?.avatar_url || `https://i.pravatar.cc/150?u=${t.user_id}`,
            poste: t.statut || 'Talent', city: p?.city || '', age: p?.age || null,
            score: Math.floor(Math.random() * 20) + 78,
            bio: t.bio || '', skills: t.skills || [], modes: t.collab_modes || [],
            hours: t.hours_per_week || '',
          }
        })
        setItems(merged)
      } else {
        const { data: projectData } = await supabase.from('project_profiles').select('*').neq('user_id', userId)
        const { data: profileData } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url').neq('id', userId)

        const merged = (projectData || []).map((p, i) => {
          const profile = profileData?.find(pr => pr.id === p.user_id)
          return {
            id: p.id, user_id: p.user_id, isProject: true,
            name: p.project_name || 'Projet sans nom',
            founder: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Fondateur',
            founderPhoto: profile?.avatar_url || `https://i.pravatar.cc/100?u=${p.user_id}`,
            photo: `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80`,
            stage: p.stage || 'Idée', stageColor: STAGE_COLORS[p.stage] || '#A78BFA',
            sector: p.sectors?.[0] || 'Tech',
            desc: p.description || p.founder_bio || '',
            needs: p.needs || [], equity: p.equity || '', budget: p.budget || null,
            score: Math.floor(Math.random() * 20) + 78,
            modes: p.collab_modes || [], workMode: p.work_mode || 'Remote',
            team: p.team_size || 1,
          }
        })
        setItems(merged)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const filtered = items.filter((item: any) => {
    const q = search.toLowerCase()
    const matchSearch = q.length < 2 || (
      item.isProject
        ? `${item.name || ''} ${item.sector || ''} ${item.founder || ''} ${(item.needs || []).join(' ')}`.toLowerCase().includes(q)
        : `${item.firstName || ''} ${item.lastName || ''} ${item.poste || ''} ${(item.skills || []).join(' ')}`.toLowerCase().includes(q)
    )
    const matchStage = filterStage.length === 0 || (item.isProject && filterStage.includes(item.stage))
    const matchMode = filterMode.length === 0 || item.modes?.some((m: string) => filterMode.includes(m))
    return matchSearch && matchStage && matchMode
  })

  async function handleContact(item: any) {
    if (!userId || !item.user_id || sendingMsg) return
    setSendingMsg(true)
    try {
      // Chercher un match existant
      const { data: existing } = await supabase
        .from('matches').select('id')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${item.user_id}),and(user1_id.eq.${item.user_id},user2_id.eq.${userId})`)
        .single()

      let matchId = existing?.id

      if (!matchId) {
        // Créer le match
        const { data: newMatch } = await supabase.from('matches').insert({
          user1_id: userId,
          user2_id: item.user_id,
          mode1: activeMode,
          mode2: activeMode,
        }).select().single()
        matchId = newMatch?.id
      }

      window.location.href = matchId ? `/chat?match=${matchId}` : '/chat'
    } catch (e) {
      console.error(e)
      window.location.href = '/chat'
    }
    setSendingMsg(false)
  }

  const navItems = [
    { id: 'home', href: '/home' }, { id: 'chat', href: '/chat' },
    { id: 'swipe', href: '/swipe' }, { id: 'explorer', href: '/explorer', active: true },
    { id: 'profil', href: '/profil' },
  ]

  // ── DETAIL VIEW ──
  if (selected) {
    return (
      <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, position: 'relative' }}>
          <img src={selected.photo} alt="" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))' }} />
          <button onClick={() => setSelected(null)}
            style={{ position: 'absolute', top: 44, left: 16, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div style={{ position: 'absolute', top: 44, right: 16, background: selected.score >= 90 ? 'rgba(249,115,22,0.9)' : 'rgba(109,40,217,0.9)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '6px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', color: 'white' }}>{selected.score}%</div>
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Match IA</div>
          </div>
          <div style={{ position: 'absolute', bottom: 14, left: 16, right: 80 }}>
            {selected.isProject ? (
              <>
                <div style={{ fontSize: '22px', fontWeight: '900', color: 'white' }}>{selected.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <img src={selected.founderPhoto} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.5)' }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>par {selected.founder}</span>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: (selected.stageColor || '#A78BFA') + 'cc', color: 'white' }}>{selected.stage}</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '22px', fontWeight: '900', color: 'white' }}>{selected.firstName} {selected.lastName}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>{selected.poste}{selected.city ? ` · ${selected.city}` : ''}</div>
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Tags */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '14px' }}>
            {selected.isProject && (
              <>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: 'rgba(6,182,212,0.1)', color: '#22D3EE', border: '1px solid rgba(6,182,212,0.2)' }}>{selected.sector}</span>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: surface, color: muted, border: `1px solid ${cardBorder}` }}>🌐 {selected.workMode}</span>
              </>
            )}
          </div>

          {/* Description */}
          {(selected.desc || selected.bio) && (
            <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                {selected.isProject ? 'À propos du projet' : 'Bio'}
              </div>
              <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>
                {selected.isProject ? selected.desc : selected.bio}
              </div>
            </div>
          )}

          {/* Skills / Needs */}
          {(selected.isProject ? selected.needs : selected.skills)?.length > 0 && (
            <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
                {selected.isProject ? 'Ils recherchent' : 'Compétences'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                {(selected.isProject ? selected.needs : selected.skills).map((s: string, i: number) => (
                  <span key={i} style={{ fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '20px', background: cfg.accentBg, color: cfg.accentLight, border: `1px solid ${cfg.accent}30` }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Financials projet */}
          {selected.isProject && (selected.equity || selected.budget || selected.team) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              {[
                { label: 'Equity', value: selected.equity || '—', color: '#4ADE80' },
                { label: 'Budget/mois', value: selected.budget || '—', color: '#F97316' },
                { label: 'Équipe', value: `${selected.team} pers.`, color: cfg.accentLight },
                { label: 'Mode', value: selected.workMode, color: muted },
              ].map((item, i) => (
                <div key={i} style={{ background: card, borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '12px 14px' }}>
                  <div style={{ fontSize: '9px', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>{item.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Dispo talent */}
          {!selected.isProject && (selected.hours || selected.modes?.length > 0) && (
            <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Disponibilité</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                {selected.hours && <span style={{ fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '20px', background: surface, color: muted }}>🕐 {selected.hours}</span>}
                {selected.modes?.map((m: string) => (
                  <span key={m} style={{ fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '20px', background: cfg.accentBg, color: cfg.accentLight }}>
                    {m === 'Flash' ? '⚡' : m === 'Side' ? '🚀' : '💎'} {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ height: 8 }} />
        </div>

        {/* CTA */}
        <div style={{ padding: '12px 16px 24px', flexShrink: 0 }}>
          <button
            onClick={() => handleContact(selected)}
            disabled={sendingMsg}
            style={{ width: '100%', padding: '16px', background: sendingMsg ? surface : cfg.gradient, border: 'none', borderRadius: '16px', color: sendingMsg ? muted : 'white', fontSize: '15px', fontWeight: '800', cursor: sendingMsg ? 'default' : 'pointer', boxShadow: sendingMsg ? 'none' : `0 8px 32px ${cfg.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" /></svg>
            {sendingMsg ? 'Ouverture...' : 'Envoyer un message'}
          </button>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ──
  return (
    <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden', transition: 'background 0.3s' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ padding: '44px 20px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: text, letterSpacing: '-0.5px', marginBottom: '2px' }}>{cfg.title}</div>
            <div style={{ fontSize: '12px', color: muted }}>{cfg.sub}</div>
          </div>
          <button onClick={() => setDark(!dark)} style={{ background: 'none', border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
        <ModeSelector muted={muted} cardBorder={cardBorder} />
      </div>

      {/* Search + filters */}
      <div style={{ padding: '8px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" stroke={muted} strokeWidth="2" />
              <path d="M21 21L16.65 16.65" stroke={muted} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isProjectMode ? 'Nom, compétence...' : 'Nom, secteur, projet...'}
              style={{ width: '100%', padding: '11px 14px 11px 36px', background: card, border: `1.5px solid ${cardBorder}`, borderRadius: '14px', color: text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
              onFocus={e => (e.currentTarget.style.borderColor = cfg.accent)}
              onBlur={e => (e.currentTarget.style.borderColor = cardBorder)}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            style={{ padding: '11px 14px', background: showFilters ? cfg.accentBg : card, border: `1.5px solid ${showFilters ? cfg.accent : cardBorder}`, borderRadius: '14px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: showFilters ? cfg.accentLight : muted, display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, transition: 'all 0.15s' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 3H2l8 9.46V19l4 2V12.46L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {(filterStage.length + filterMode.length) > 0 && (
              <span style={{ background: cfg.accent, color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {filterStage.length + filterMode.length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px', marginBottom: '10px' }}>
            {!isProjectMode && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Stade</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                  {STAGES.map(s => {
                    const active = filterStage.includes(s)
                    return (
                      <button key={s} onClick={() => setFilterStage(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
                        style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${active ? cfg.accent : cardBorder}`, background: active ? cfg.accentBg : 'transparent', color: active ? cfg.accentLight : muted, fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}>
                        {active ? '✓ ' : ''}{s}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Mode de collaboration</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {COLLAB_MODES.map(m => {
                  const active = filterMode.includes(m)
                  const icons: Record<string, string> = { Flash: '⚡', Side: '🚀', Equity: '💎' }
                  return (
                    <button key={m} onClick={() => setFilterMode(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m])}
                      style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${active ? cfg.accent : cardBorder}`, background: active ? cfg.accentBg : 'transparent', color: active ? cfg.accentLight : muted, fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}>
                      {icons[m]} {m}
                    </button>
                  )
                })}
              </div>
            </div>
            {(filterStage.length + filterMode.length) > 0 && (
              <button onClick={() => { setFilterStage([]); setFilterMode([]) }}
                style={{ marginTop: '10px', background: 'none', border: 'none', color: '#F87171', fontSize: '11px', cursor: 'pointer', fontWeight: '600', padding: 0 }}>
                × Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 8px' }}>
        {!hasMode ? (
          <div style={{ background: card, borderRadius: '20px', border: `1px solid rgba(109,40,217,0.2)`, padding: '28px 20px', textAlign: 'center', margin: '8px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{activeMode === 'talent' ? '⚡' : activeMode === 'project' ? '🚀' : '💎'}</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: text, marginBottom: '8px' }}>Profil non créé</div>
            <div style={{ fontSize: '13px', color: muted, marginBottom: '18px' }}>Active ce profil pour explorer.</div>
            <button onClick={() => activateMode(activeMode)} style={{ width: '100%', padding: '13px', background: cfg.gradient, border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              Créer mon profil
            </button>
          </div>

        ) : search.trim().length < 2 && filterStage.length === 0 && filterMode.length === 0 ? (
          // État par défaut — invite à chercher
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: text, marginBottom: '8px' }}>Recherche un profil</div>
            <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6, marginBottom: '24px' }}>
              {isProjectMode
                ? 'Tape un prénom, une compétence ou un statut pour trouver des talents.'
                : 'Tape un nom de projet, un secteur ou un fondateur.'}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, justifyContent: 'center' }}>
              {(isProjectMode
                ? ['Figma', 'React', 'Marketing', 'TikTok', 'Beatmaking']
                : ['GreenTech', 'SaaS', 'FinTech', 'EdTech', 'HealthTech']
              ).map(tag => (
                <button key={tag} onClick={() => setSearch(tag)}
                  style={{ padding: '8px 16px', background: cfg.accentBg, border: `1px solid ${cfg.accent}30`, borderRadius: '20px', color: cfg.accentLight, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

        ) : loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${cfg.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>😕</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: text, marginBottom: '8px' }}>Aucun résultat</div>
            <div style={{ fontSize: '12px', color: muted }}>Essaie un autre mot-clé</div>
          </div>

        ) : (
          <>
            <div style={{ fontSize: '11px', color: hint, marginBottom: '10px', paddingLeft: '2px' }}>
              {filtered.length} résultat{filtered.length > 1 ? 's' : ''} pour "{search}"
            </div>
            {filtered.map((item: any) => (
              <div key={item.id} onClick={() => setSelected(item)}
                style={{ marginBottom: '10px', borderRadius: '20px', overflow: 'hidden', border: `1.5px solid ${cardBorder}`, background: card, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.accent + '60')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = cardBorder)}>
                <div style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={item.isProject ? item.founderPhoto : item.photo}
                        alt=""
                        style={{ width: 54, height: 54, borderRadius: item.isProject ? '14px' : '50%', objectFit: 'cover', border: `1.5px solid ${cardBorder}` }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {item.isProject ? item.name : `${item.firstName} ${item.lastName}`}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: item.score >= 90 ? '#F97316' : cfg.accentLight, flexShrink: 0 }}>{item.score}%</div>
                      </div>
                      {item.isProject ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', color: muted }}>{item.founder}</span>
                          <span style={{ fontSize: '10px', fontWeight: '600', padding: '1px 7px', borderRadius: '20px', background: (item.stageColor || '#A78BFA') + '25', color: item.stageColor || '#A78BFA' }}>{item.stage}</span>
                          <span style={{ fontSize: '10px', color: muted }}>· {item.sector}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: muted, marginBottom: '6px' }}>
                          {item.poste}{item.city ? ` · ${item.city}` : ''}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' as const }}>
                        {(item.isProject ? item.needs : item.skills)?.slice(0, 3).map((t: string, j: number) => (
                          <span key={j} style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: surface, color: muted, border: `1px solid ${hint}` }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ height: 8 }} />
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ background: navBg, borderTop: `1px solid ${cardBorder}`, paddingBottom: 16, paddingTop: 8, display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexShrink: 0 }}>
        {navItems.map(item => (
          <div key={item.id} onClick={() => window.location.href = item.href}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', flex: 1 }}>
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