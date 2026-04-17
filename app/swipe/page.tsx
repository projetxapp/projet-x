'use client'

import { useState, useRef, useEffect } from 'react'
import { useMode, Mode } from '../context/ModeContext'
import { supabase } from '../lib/supabase'
import { getMatchScore } from '../lib/matching'

const DEMO_TALENTS = [
  { id: 'demo-1', user_id: 'demo-1', firstName: 'Sofia', lastName: 'Amrani', age: 24, city: 'Paris', poste: 'Développeuse Full-stack', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80', score: 94, online: true, bio: 'Apps mobiles rapides et belles. Passionnée par les projets à impact social.', skills: ['React Native', 'TypeScript', 'Supabase'], modes: ['Flash', 'Side', 'Equity'] },
  { id: 'demo-2', user_id: 'demo-2', firstName: 'Jade', lastName: 'Kim', age: 22, city: 'Remote', poste: 'Growth Marketer', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80', score: 91, online: true, bio: 'Growth hacker IA. J\'automatise l\'acquisition avec n8n.', skills: ['SEO/SEA', 'n8n', 'Copywriting'], modes: ['Flash', 'Side'] },
  { id: 'demo-3', user_id: 'demo-3', firstName: 'Camille', lastName: 'Dubois', age: 23, city: 'Nantes', poste: 'UX/UI Designer', photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', score: 96, online: false, bio: 'Designer produit obsédée par l\'UX. Ex-freelance SNCF.', skills: ['Figma', 'Framer', 'Design System'], modes: ['Flash', 'Side', 'Equity'] },
  { id: 'demo-4', user_id: 'demo-4', firstName: 'Maxime', lastName: 'Renard', age: 29, city: 'Bordeaux', poste: 'Backend Engineer', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', score: 89, online: false, bio: 'Expert Python/FastAPI. Architecture propre, BDD optimisées.', skills: ['Python', 'FastAPI', 'PostgreSQL'], modes: ['Side', 'Equity'] },
]

const DEMO_PROJECTS = [
  { id: 'demo-5', user_id: 'demo-5', name: 'EcoTrack', founder: 'Lucas Bernard', founderPhoto: 'https://i.pravatar.cc/150?img=11', photo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80', stage: 'Croissance', stageColor: '#06B6D4', sector: 'GreenTech', desc: 'SaaS B2B tracking carbone pour PME. 120 clients actifs. Série A en cours.', needs: ['Python', 'Figma', 'Data viz'], equity: '0.5–2%', budget: null, score: 96, modes: ['Side', 'Equity'], workMode: 'Remote', mrr: '18k€', team: 4 },
  { id: 'demo-6', user_id: 'demo-6', name: 'Flio', founder: 'Marie Leconte', founderPhoto: 'https://i.pravatar.cc/150?img=44', photo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80', stage: 'Prototype', stageColor: '#8B5CF6', sector: 'PropTech', desc: 'Super app logement B2C. Centralise loyer, charges, voisinage.', needs: ['React Native', 'UX/UI', 'Marketing'], equity: '1–5%', budget: '500€/mois', score: 88, modes: ['Flash', 'Side', 'Equity'], workMode: 'Hybride', mrr: null, team: 2 },
  { id: 'demo-7', user_id: 'demo-7', name: 'Foody', founder: 'Inès Rousseau', founderPhoto: 'https://i.pravatar.cc/150?img=25', photo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80', stage: 'Lancé', stageColor: '#4ADE80', sector: 'FoodTech', desc: 'Box repas locaux en circuits courts. 800 abonnés IDF, rentable.', needs: ['Growth', 'Logistique', 'Social Media'], equity: '0–2%', budget: '800€/mois', score: 92, modes: ['Flash', 'Side', 'Equity'], workMode: 'Paris', mrr: '12k€', team: 3 },
  { id: 'demo-8', user_id: 'demo-8', name: 'MindFlow', founder: 'Théo Garnier', founderPhoto: 'https://i.pravatar.cc/150?img=15', photo: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600&q=80', stage: 'Idée', stageColor: '#F97316', sector: 'HealthTech', desc: 'Chatbot thérapeutique IA pour jeunes en souffrance psychologique.', needs: ['NLP/IA', 'Fullstack'], equity: '3–8%', budget: null, score: 79, modes: ['Equity'], workMode: 'Remote', mrr: null, team: 1 },
]

const MODE_CONFIG = {
  talent: { accent: '#6D28D9', accentLight: '#A78BFA', accentBg: 'rgba(109,40,217,0.15)', gradient: 'linear-gradient(135deg,#6D28D9,#8B5CF6)' },
  project: { accent: '#0891B2', accentLight: '#22D3EE', accentBg: 'rgba(8,145,178,0.15)', gradient: 'linear-gradient(135deg,#0891B2,#06B6D4)' },
  investor: { accent: '#B45309', accentLight: '#FCD34D', accentBg: 'rgba(180,83,9,0.15)', gradient: 'linear-gradient(135deg,#B45309,#F59E0B)' },
}

const STAGE_COLORS: Record<string, string> = {
  'Idée': '#F97316', 'Prototype': '#8B5CF6', 'Lancé': '#4ADE80', 'Croissance': '#06B6D4', 'Série A+': '#22D3EE'
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

export default function SwipePage() {
  const { activeMode, userModes, dark, setDark } = useMode()
  const [userId, setUserId] = useState('')
  const [cards, setCards] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showMatch, setShowMatch] = useState(false)
  const [matchName, setMatchName] = useState('')
  const [loadingCards, setLoadingCards] = useState(true)
  const startX = useRef(0)
  const startY = useRef(0)

  const bg = dark ? '#0D0C18' : '#F4F2FF'
  const cardBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const surface = dark ? '#1E1D32' : '#F8F7FF'
  const text = dark ? '#F0EEFF' : '#0D0C18'
  const muted = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)'
  const navBg = dark ? '#16152A' : '#FFFFFF'

  const isProjectMode = activeMode === 'project'
  const isInvestorMode = activeMode === 'investor'
  const isTalentMode = activeMode === 'talent'
  const cfg = MODE_CONFIG[activeMode]
  const hasMode = userModes.includes(activeMode)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setUserId(user.id)
      await loadProfiles(user.id)
    }
    init()
  }, [activeMode])

  async function loadProfiles(uid: string) {
    setLoadingCards(true)
    try {
      const { data: swipedData } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', uid)
        .eq('swiper_mode', activeMode)
      const swipedIds = swipedData?.map(s => s.swiped_id) || []

      let merged: any[] = []

      if (isProjectMode) {
        const { data: talentData } = await supabase.from('talent_profiles').select('*').neq('user_id', uid)
        const { data: profileData } = await supabase.from('profiles').select('id, first_name, last_name, age, city, avatar_url').neq('id', uid)

        merged = (talentData || [])
          .filter(t => !swipedIds.includes(t.user_id))
          .map(t => {
            const p = profileData?.find(pr => pr.id === t.user_id)
            return {
              id: t.id, user_id: t.user_id,
              firstName: p?.first_name || 'Utilisateur',
              lastName: p?.last_name || '',
              age: p?.age || 22, city: p?.city || 'France',
              poste: t.statut || 'Talent',
              photo: p?.avatar_url || `https://i.pravatar.cc/300?u=${t.user_id}`,
              score: 75, online: Math.random() > 0.5,
              bio: t.bio || 'Profil en cours de création...',
              skills: t.skills || [], modes: t.collab_modes || [],
            }
          })
      } else {
        const { data: projectData } = await supabase.from('project_profiles').select('*').neq('user_id', uid)
        const { data: profileData } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url').neq('id', uid)

        merged = (projectData || [])
          .filter(p => !swipedIds.includes(p.user_id))
          .map(p => {
            const profile = profileData?.find(pr => pr.id === p.user_id)
            return {
              id: p.id, user_id: p.user_id,
              name: p.project_name || 'Projet sans nom',
              founder: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Fondateur',
              founderPhoto: profile?.avatar_url || `https://i.pravatar.cc/100?u=${p.user_id}`,
              photo: `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80`,
              stage: p.stage || 'Idée',
              stageColor: STAGE_COLORS[p.stage] || '#A78BFA',
              sector: p.sectors?.[0] || 'Tech',
              desc: p.description || p.founder_bio || 'Description en cours...',
              needs: p.needs || [], equity: p.equity || '',
              budget: p.budget || null, score: 75,
              modes: p.collab_modes || [],
              workMode: p.work_mode || 'Remote',
              mrr: null, team: p.team_size || 1,
            }
          })
      }

      // ── Calcul des vrais scores IA ──
      if (merged.length > 0) {
        const scored = await Promise.all(
          merged.map(async (p: any) => {
            const score = await getMatchScore(uid, p.user_id, activeMode)
            return { ...p, score }
          })
        )
        const sorted = scored.sort((a: any, b: any) => b.score - a.score)
        setCards(sorted)
      } else {
        setCards(isProjectMode ? DEMO_TALENTS : DEMO_PROJECTS)
      }
    } catch (e) {
      console.error(e)
      setCards(isProjectMode ? DEMO_TALENTS : DEMO_PROJECTS)
    }
    setLoadingCards(false)
  }

  async function saveSwipe(direction: 'like' | 'pass' | 'super') {
    if (!userId || !profile || profile.id.startsWith('demo-')) return
    try {
      await supabase.from('swipes').upsert({
        swiper_id: userId, swiped_id: profile.user_id,
        swiper_mode: activeMode, direction,
      }, { onConflict: 'swiper_id,swiped_id,swiper_mode' })

      if (direction === 'like' || direction === 'super') {
        const { data: mutual } = await supabase
          .from('swipes').select('*')
          .eq('swiper_id', profile.user_id).eq('swiped_id', userId)
          .in('direction', ['like', 'super']).single()

        if (mutual) {
          await supabase.from('matches').insert({
            user1_id: userId, user2_id: profile.user_id,
            mode1: activeMode, mode2: mutual.swiper_mode,
          })
          const name = isProjectMode ? `${profile.firstName} ${profile.lastName}` : profile.name
          setMatchName(name)
          setTimeout(() => setShowMatch(true), 380)
        }
      }
    } catch (e) { console.error(e) }
  }

  function onMouseDown(e: React.MouseEvent) { setIsDragging(true); startX.current = e.clientX; startY.current = e.clientY }
  function onMouseMove(e: React.MouseEvent) { if (!isDragging) return; setDragX(e.clientX - startX.current); setDragY(e.clientY - startY.current) }
  function onMouseUp() { if (!isDragging) return; setIsDragging(false); if (dragX > 100) triggerLike(); else if (dragX < -100) triggerPass(); else { setDragX(0); setDragY(0) } }
  function onTouchStart(e: React.TouchEvent) { setIsDragging(true); startX.current = e.touches[0].clientX; startY.current = e.touches[0].clientY }
  function onTouchMove(e: React.TouchEvent) { if (!isDragging) return; setDragX(e.touches[0].clientX - startX.current); setDragY(e.touches[0].clientY - startY.current) }
  function onTouchEnd() { if (!isDragging) return; setIsDragging(false); if (dragX > 80) triggerLike(); else if (dragX < -80) triggerPass(); else { setDragX(0); setDragY(0) } }

  function triggerPass() {
    saveSwipe('pass')
    setDragX(-700)
    setTimeout(() => { setCurrentIndex(i => i + 1); setDragX(0); setDragY(0) }, 320)
  }
  function triggerLike() {
    saveSwipe('like')
    setDragX(700)
    setTimeout(() => { setCurrentIndex(i => i + 1); setDragX(0); setDragY(0) }, 320)
  }
  function triggerSuper() {
    saveSwipe('super')
    setDragX(700)
    setTimeout(() => { setCurrentIndex(i => i + 1); setDragX(0); setDragY(0) }, 320)
  }

  const safeIndex = cards.length > 0 ? currentIndex % cards.length : 0
  const profile: any = cards[safeIndex]
  const nextProfile: any = cards.length > 1 ? cards[(safeIndex + 1) % cards.length] : null

  const rot = dragX * 0.04
  const likeOp = Math.min(Math.max(dragX / 80, 0), 1)
  const passOp = Math.min(Math.max(-dragX / 80, 0), 1)
  const likeLabel = isProjectMode ? 'RECRUTER' : isTalentMode ? 'REJOINDRE' : 'INVESTIR'

  const navItems = [
    { id: 'home', href: '/home' },
    { id: 'chat', href: '/chat' },
    { id: 'swipe', href: '/swipe', active: true },
    { id: 'explorer', href: '/explorer' },
    { id: 'profil', href: '/profil' },
  ]

  return (
    <div style={{ height: '100%', overflow: 'hidden', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', transition: 'background 0.3s' }}>

      {/* Header */}
      <div style={{ padding: '36px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 28, height: 28, borderRadius: '8px', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>✦</div>
          <span style={{ fontSize: '17px', fontWeight: '900', color: text, letterSpacing: '-0.5px' }}>Projet X</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ModeSelector muted={muted} cardBorder={cardBorder} />
          <button onClick={() => setDark(!dark)} style={{ background: 'none', border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {!hasMode ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'rgba(109,40,217,0.08)', border: '1px solid rgba(109,40,217,0.2)', borderRadius: '24px', padding: '32px 24px', textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>{activeMode === 'talent' ? '⚡' : activeMode === 'project' ? '🚀' : '💎'}</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: text, marginBottom: '8px' }}>Profil non créé</div>
            <div style={{ fontSize: '13px', color: muted, marginBottom: '24px' }}>Active ce profil pour swiper.</div>
            <button onClick={() => window.location.href = '/profil'} style={{ width: '100%', padding: '14px', background: cfg.gradient, border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              Créer mon profil
            </button>
          </div>
        </div>
      ) : loadingCards ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${cfg.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '13px', color: muted }}>Calcul des meilleurs matchs...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : cards.length === 0 || currentIndex >= cards.length ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', flexDirection: 'column', textAlign: 'center', gap: '16px' }}>
          <div style={{ fontSize: '52px' }}>✨</div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: text }}>Tu as tout vu !</div>
          <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>Reviens plus tard pour de nouveaux profils.</div>
          <button onClick={() => { setCurrentIndex(0); loadProfiles(userId) }} style={{ padding: '12px 24px', background: cfg.gradient, border: 'none', borderRadius: '14px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Recommencer
          </button>
        </div>
      ) : (
        <>
          {/* Zone carte */}
          <div style={{ flex: 1, position: 'relative', padding: '0 12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {nextProfile && (
              <div style={{ position: 'absolute', width: 'calc(100% - 40px)', height: 'calc(100% - 20px)', borderRadius: '28px', overflow: 'hidden', transform: 'scale(0.93) translateY(12px)', zIndex: 1 }}>
                <img src={nextProfile.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }} />
              </div>
            )}

            <div
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
              style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '28px', overflow: 'hidden', zIndex: 10, transform: `translateX(${dragX}px) translateY(${dragY * 0.1}px) rotate(${rot}deg)`, transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25,1,0.5,1)', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.7)' : '0 24px 60px rgba(109,40,217,0.2)' }}>

              <img src={profile.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 65%, transparent 100%)', pointerEvents: 'none' }} />

              <div style={{ position: 'absolute', top: 28, left: 20, opacity: likeOp, transform: 'rotate(-12deg)', border: '3px solid #4ADE80', borderRadius: '10px', padding: '6px 14px', fontSize: '16px', fontWeight: '900', color: '#4ADE80', background: 'rgba(0,0,0,0.3)' }}>{likeLabel}</div>
              <div style={{ position: 'absolute', top: 28, right: 20, opacity: passOp, transform: 'rotate(12deg)', border: '3px solid #F87171', borderRadius: '10px', padding: '6px 14px', fontSize: '16px', fontWeight: '900', color: '#F87171', background: 'rgba(0,0,0,0.3)' }}>PASS</div>

              {/* Score badge */}
              <div style={{ position: 'absolute', top: 20, right: 20, background: profile.score >= 90 ? 'rgba(249,115,22,0.9)' : 'rgba(109,40,217,0.9)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '900', color: 'white', lineHeight: 1 }}>{profile.score}%</div>
                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Match IA</div>
              </div>

              {/* Infos bas */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px 20px', pointerEvents: 'none' }}>
                {isProjectMode ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <div style={{ fontSize: '26px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>{profile.firstName} {profile.lastName}</div>
                      {profile.online && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ADE80', border: '2px solid white', flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: '10px' }}>{profile.poste} · {profile.city}{profile.age ? `, ${profile.age} ans` : ''}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', marginBottom: '4px' }}>{profile.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <img src={profile.founderPhoto} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.5)' }} />
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>par {profile.founder}</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: (profile.stageColor || '#A78BFA') + 'cc', color: 'white' }}>{profile.stage}</span>
                    </div>
                  </>
                )}

                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {isProjectMode ? profile.bio : profile.desc}
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '10px' }}>
                  {(isProjectMode ? profile.skills : profile.needs)?.slice(0, 4).map((s: string, i: number) => (
                    <span key={i} style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>{s}</span>
                  ))}
                  {!isProjectMode && profile.equity && (
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: 'rgba(74,222,128,0.25)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}>💎 {profile.equity}</span>
                  )}
                  {!isProjectMode && profile.mrr && (
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: 'rgba(6,182,212,0.25)', color: '#22D3EE', border: '1px solid rgba(6,182,212,0.3)' }}>📈 {profile.mrr}</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginRight: '2px' }}>Dispo en</span>
                  {['Flash', 'Side', 'Equity'].map(m => {
                    const available = profile.modes?.includes(m)
                    return (
                      <span key={m} style={{ fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '20px', background: available ? 'rgba(109,40,217,0.4)' : 'rgba(255,255,255,0.08)', color: available ? '#A78BFA' : 'rgba(255,255,255,0.25)', border: `1px solid ${available ? 'rgba(109,40,217,0.5)' : 'rgba(255,255,255,0.1)'}` }}>
                        {m === 'Flash' ? '⚡' : m === 'Side' ? '🚀' : '💎'} {m}
                      </span>
                    )
                  })}
                </div>

                {isInvestorMode && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                    {[
                      { label: 'Equity', value: profile.equity || 'N/A', color: '#4ADE80' },
                      { label: 'Traction', value: profile.mrr || '—', color: '#22D3EE' },
                      { label: 'Équipe', value: `${profile.team || 1} pers.`, color: '#A78BFA' },
                      { label: 'Mode', value: profile.workMode || 'Remote', color: 'white' },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{item.label}</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ padding: '12px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexShrink: 0, background: bg }}>
            <button onClick={triggerPass}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              style={{ width: 52, height: 52, borderRadius: '50%', background: dark ? 'rgba(248,113,113,0.1)' : 'rgba(248,113,113,0.08)', border: `2px solid rgba(248,113,113,0.3)`, fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F87171', transition: 'transform 0.15s' }}>
              ✕
            </button>
            <button
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              style={{ width: 40, height: 40, borderRadius: '50%', background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1.5px solid ${cardBorder}`, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted, transition: 'transform 0.15s' }}>
              ℹ️
            </button>
            <button onClick={triggerLike}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              style={{ width: 66, height: 66, borderRadius: '50%', background: 'linear-gradient(135deg,#6D28D9,#0891B2)', border: 'none', fontSize: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(109,40,217,0.5)', transition: 'transform 0.15s' }}>
              {isInvestorMode ? '💎' : '♥'}
            </button>
            <button onClick={triggerSuper}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              style={{ width: 40, height: 40, borderRadius: '50%', background: dark ? 'rgba(34,211,238,0.08)' : 'rgba(34,211,238,0.06)', border: `1.5px solid rgba(34,211,238,0.3)`, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22D3EE', transition: 'transform 0.15s' }}>
              ★
            </button>
            <button
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              style={{ width: 52, height: 52, borderRadius: '50%', background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1.5px solid ${cardBorder}`, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted, transition: 'transform 0.15s' }}>
              ↩
            </button>
          </div>
        </>
      )}

      {/* Bottom nav */}
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
                  {item.id === 'explorer' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={muted} strokeWidth="1.5" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" stroke={muted} strokeWidth="1.5" strokeLinejoin="round" /></svg>}
                  {item.id === 'profil' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={muted} strokeWidth="1.5" /><path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" stroke={muted} strokeWidth="1.5" strokeLinecap="round" /></svg>}
                </div>
                <span style={{ fontSize: '8px', fontWeight: '600', textTransform: 'uppercase' as const, color: muted, letterSpacing: '0.04em' }}>
                  {item.id === 'home' ? 'Accueil' : item.id === 'chat' ? 'Chat' : item.id === 'explorer' ? 'Explorer' : 'Profil'}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Match popup */}
      {showMatch && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div style={{ background: 'linear-gradient(135deg,#6D28D9,#0891B2)', borderRadius: '28px', padding: '40px 28px', textAlign: 'center', width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '52px', marginBottom: '14px' }}>{isInvestorMode ? '💎' : '🔥'}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', marginBottom: '10px' }}>
              {isInvestorMode ? 'Intérêt mutuel !' : 'C\'est un Match !'}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', marginBottom: '6px' }}>{matchName} et toi avez swipé mutuellement.</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '30px' }}>Le chat est maintenant ouvert 💬</div>
            <button onClick={() => { setShowMatch(false); window.location.href = '/chat' }}
              style={{ width: '100%', padding: '16px', background: 'white', border: 'none', borderRadius: '16px', color: '#6D28D9', fontSize: '15px', fontWeight: '800', cursor: 'pointer', marginBottom: '12px' }}>
              Envoyer un message →
            </button>
            <button onClick={() => setShowMatch(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>
              Continuer à swiper
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}