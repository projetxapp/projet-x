'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useMode } from '../../context/ModeContext'
import { supabase } from '../../lib/supabase'

const MODE_CONFIG = {
  talent: { accent: '#6D28D9', accentLight: '#A78BFA', accentBg: 'rgba(109,40,217,0.1)', gradient: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', label: 'Talent', emoji: '⚡' },
  project: { accent: '#0891B2', accentLight: '#22D3EE', accentBg: 'rgba(8,145,178,0.1)', gradient: 'linear-gradient(135deg,#0891B2,#06B6D4)', label: 'Projet', emoji: '🚀' },
  investor: { accent: '#B45309', accentLight: '#FCD34D', accentBg: 'rgba(180,83,9,0.1)', gradient: 'linear-gradient(135deg,#B45309,#F59E0B)', label: 'Investisseur', emoji: '💎' },
}

export default function UserProfilPage() {
  const params = useParams()
  const profileId = params?.id as string
  const { dark } = useMode()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [talentProfile, setTalentProfile] = useState<any>(null)
  const [projectProfile, setProjectProfile] = useState<any>(null)
  const [investorProfile, setInvestorProfile] = useState<any>(null)
  const [userModes, setUserModes] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('talent')
  const [myUserId, setMyUserId] = useState('')

  const bg = dark ? '#08070F' : '#F4F2FF'
  const card = dark ? '#111019' : '#FFFFFF'
  const cardBorder = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const surface = dark ? '#1A1828' : '#F8F7FF'
  const text = dark ? '#F0EEFF' : '#0D0C18'
  const muted = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
  const hint = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setMyUserId(user.id)

      if (!profileId) return

      const { data: p } = await supabase.from('profiles').select('*').eq('id', profileId).single()
      setProfile(p)

      const { data: modes } = await supabase.from('user_modes').select('mode').eq('user_id', profileId)
      const modeList = modes?.map(m => m.mode) || []
      setUserModes(modeList)
      if (modeList.length > 0) setActiveTab(modeList[0])

      const { data: talent } = await supabase.from('talent_profiles').select('*').eq('user_id', profileId).single()
      setTalentProfile(talent)

      const { data: project } = await supabase.from('project_profiles').select('*').eq('user_id', profileId).single()
      setProjectProfile(project)

      const { data: investor } = await supabase.from('investor_profiles').select('*').eq('user_id', profileId).single()
      setInvestorProfile(investor)

      setLoading(false)
    }
    load()
  }, [profileId])

  async function sendMessage() {
    // Find or create match then go to chat
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id')
      .or(`and(user1_id.eq.${myUserId},user2_id.eq.${profileId}),and(user1_id.eq.${profileId},user2_id.eq.${myUserId})`)
      .single()

    if (!existingMatch) {
      await supabase.from('matches').insert({
        user1_id: myUserId,
        user2_id: profileId,
        mode1: activeTab,
        mode2: activeTab,
      })
    }
    window.location.href = '/chat'
  }

  if (loading) {
    return (
      <div style={{ height: '100%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #6D28D9', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ height: '100%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '40px' }}>😕</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: text }}>Profil introuvable</div>
        <button onClick={() => window.history.back()} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#6D28D9,#0891B2)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: '600' }}>Retour</button>
      </div>
    )
  }

  const cfg = MODE_CONFIG[activeTab as keyof typeof MODE_CONFIG] || MODE_CONFIG.talent
  const displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utilisateur'
  const initial = (profile.first_name || '?')[0].toUpperCase()

  return (
    <div style={{ height: '100%', overflow: 'hidden', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '44px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button onClick={() => window.history.back()}
            style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div style={{ fontSize: '17px', fontWeight: '800', color: text }}>Profil</div>
        </div>

        {/* Avatar + infos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '900', color: 'white', flexShrink: 0, boxShadow: `0 8px 24px ${cfg.accent}40` }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initial}
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: text, letterSpacing: '-0.5px', marginBottom: '3px' }}>{displayName}</div>
            <div style={{ fontSize: '11px', color: muted }}>📍 {profile.city || 'France'}{profile.age ? ` · ${profile.age} ans` : ''}</div>
            <div style={{ display: 'flex', gap: '5px', marginTop: '6px' }}>
              {userModes.map(m => {
                const modeCfg = MODE_CONFIG[m as keyof typeof MODE_CONFIG]
                return (
                  <span key={m} style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: modeCfg.accentBg, color: modeCfg.accentLight, border: `1px solid ${modeCfg.accent}40` }}>
                    {modeCfg.emoji} {modeCfg.label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tabs par mode */}
        {userModes.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
            {userModes.map(m => {
              const modeCfg = MODE_CONFIG[m as keyof typeof MODE_CONFIG]
              const isActive = activeTab === m
              return (
                <button key={m} onClick={() => setActiveTab(m)}
                  style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${isActive ? modeCfg.accent : cardBorder}`, background: isActive ? modeCfg.accentBg : 'transparent', color: isActive ? modeCfg.accentLight : muted, fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {modeCfg.emoji} {modeCfg.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 8px' }}>

        {/* TALENT */}
        {activeTab === 'talent' && talentProfile && (
          <>
            {talentProfile.bio && (
              <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Bio</div>
                <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>{talentProfile.bio}</div>
              </div>
            )}
            {talentProfile.skills?.length > 0 && (
              <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Compétences</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                  {talentProfile.skills.map((s: string, i: number) => (
                    <span key={i} style={{ fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '20px', background: cfg.accentBg, color: cfg.accentLight, border: `1px solid ${cfg.accent}30` }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Disponibilité</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                {talentProfile.hours_per_week && (
                  <span style={{ fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '20px', background: surface, color: muted }}>🕐 {talentProfile.hours_per_week}</span>
                )}
                {talentProfile.collab_modes?.map((m: string) => (
                  <span key={m} style={{ fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '20px', background: cfg.accentBg, color: cfg.accentLight }}>
                    {m === 'Flash' ? '⚡' : m === 'Side' ? '🚀' : '💎'} {m}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* PROJECT */}
        {activeTab === 'project' && projectProfile && (
          <>
            <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: text }}>{projectProfile.project_name || 'Projet sans nom'}</div>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: 'rgba(6,182,212,0.1)', color: '#22D3EE' }}>{projectProfile.stage}</span>
              </div>
              {projectProfile.description && (
                <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6, marginBottom: '10px' }}>{projectProfile.description}</div>
              )}
              {projectProfile.sectors?.length > 0 && (
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' as const }}>
                  {projectProfile.sectors.map((s: string, i: number) => (
                    <span key={i} style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: cfg.accentBg, color: cfg.accentLight }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
            {projectProfile.needs?.length > 0 && (
              <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Ils recherchent</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                  {projectProfile.needs.map((s: string, i: number) => (
                    <span key={i} style={{ fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '20px', background: cfg.accentBg, color: cfg.accentLight }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              {[
                { label: 'Equity', value: projectProfile.equity || '—', color: '#4ADE80' },
                { label: 'Budget', value: projectProfile.budget || '—', color: '#F97316' },
                { label: 'Équipe', value: `${projectProfile.team_size || 1} pers.`, color: cfg.accentLight },
                { label: 'Mode', value: projectProfile.work_mode || 'Remote', color: muted },
              ].map((item, i) => (
                <div key={i} style={{ background: card, borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '12px 14px' }}>
                  <div style={{ fontSize: '9px', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>{item.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* INVESTOR */}
        {activeTab === 'investor' && investorProfile && (
          <>
            {investorProfile.bio && (
              <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Bio</div>
                <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>{investorProfile.bio}</div>
              </div>
            )}
            {investorProfile.thesis && (
              <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Thèse d'investissement</div>
                <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>{investorProfile.thesis}</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={{ background: card, borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '12px 14px' }}>
                <div style={{ fontSize: '9px', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Ticket min</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#4ADE80' }}>{investorProfile.ticket_min ? `${investorProfile.ticket_min}€` : '—'}</div>
              </div>
              <div style={{ background: card, borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '12px 14px' }}>
                <div style={{ fontSize: '9px', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Ticket max</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#4ADE80' }}>{investorProfile.ticket_max ? `${investorProfile.ticket_max}€` : '—'}</div>
              </div>
            </div>
            {investorProfile.sectors?.length > 0 && (
              <div style={{ background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Secteurs</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                  {investorProfile.sectors.map((s: string, i: number) => (
                    <span key={i} style={{ fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '20px', background: cfg.accentBg, color: cfg.accentLight }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ height: 8 }} />
      </div>

      {/* CTA — Envoyer un message */}
      {profileId !== myUserId && (
        <div style={{ padding: '12px 16px 28px', flexShrink: 0 }}>
          <button onClick={sendMessage}
            style={{ width: '100%', padding: '16px', background: cfg.gradient, border: 'none', borderRadius: '16px', color: 'white', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: `0 8px 32px ${cfg.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" /></svg>
            Envoyer un message
          </button>
        </div>
      )}
    </div>
  )
}