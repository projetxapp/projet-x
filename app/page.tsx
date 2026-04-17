'use client'

import { useState, useMemo, useRef } from 'react'
import { supabase } from './lib/supabase'

const ROLES = [
  {
    id: 'talent', emoji: '⚡', title: 'Talent',
    desc: 'Propose tes compétences et rejoins des projets qui t\'enflamment',
    gradient: 'linear-gradient(135deg, #6D28D9, #8B5CF6)',
    glow: 'rgba(109,40,217,0.35)', bg: 'rgba(109,40,217,0.08)',
    border: 'rgba(109,40,217,0.35)', color: '#A78BFA',
  },
  {
    id: 'project', emoji: '🚀', title: 'Porteur de projet',
    desc: 'Trouve les talents et les investisseurs qui vont faire décoller ton idée',
    gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)',
    glow: 'rgba(8,145,178,0.35)', bg: 'rgba(8,145,178,0.08)',
    border: 'rgba(8,145,178,0.35)', color: '#22D3EE',
  },
  {
    id: 'investor', emoji: '💎', title: 'Investisseur',
    desc: 'Accède aux pépites de demain avant tout le monde et fais fructifier ton capital',
    gradient: 'linear-gradient(135deg, #B45309, #F59E0B)',
    glow: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.35)', color: '#FCD34D',
  },
]

const ALL_SKILLS = [
  'React', 'React Native', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'TypeScript',
  'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'Sass',
  'Node.js', 'Express.js', 'NestJS', 'PHP', 'Laravel', 'WordPress', 'Shopify', 'Webflow', 'Framer', 'Bubble',
  'Ruby on Rails', 'Django', 'FastAPI', 'Flask', 'Spring Boot', 'Go', 'Rust',
  'GraphQL', 'REST API', 'Flutter', 'Dart', 'Swift', 'SwiftUI', 'Kotlin', 'Expo', 'PWA',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Firebase', 'Supabase', 'Redis',
  'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Azure', 'Vercel', 'Git', 'CI/CD',
  'Machine Learning', 'Deep Learning', 'NLP', 'TensorFlow', 'PyTorch', 'OpenAI API',
  'Prompt Engineering', 'Stable Diffusion', 'Midjourney', 'Agents IA', 'LangChain',
  'Data Science', 'Data Analysis', 'Power BI', 'Tableau', 'SQL', 'Pandas', 'Excel avancé',
  'n8n', 'Make', 'Zapier', 'Airtable', 'Notion', 'Retool', 'FlutterFlow', 'Adalo',
  'Cybersécurité', 'Pentest', 'Bug Bounty', 'OSINT',
  'Figma', 'Adobe XD', 'UI Design', 'UX Design', 'UX Research', 'Design System', 'Prototypage',
  'Photoshop', 'Illustrator', 'InDesign', 'Branding', 'Logo design', 'Direction artistique',
  'Canva', 'Affinity Designer', 'Packaging',
  'After Effects', 'Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve',
  'Motion Design', 'Animation 2D', 'Animation 3D', 'CapCut', 'VFX', 'Color grading',
  'Blender', 'Cinema 4D', 'Maya', 'ZBrush', 'SketchUp', 'AutoCAD', 'Impression 3D',
  'AR', 'VR', 'Procreate', 'Illustration numérique', 'Pixel Art',
  'Photographie', 'Retouche photo', 'Lightroom', 'Photographie portrait', 'Photographie produit',
  'Photographie mode', 'Photographie mariage', 'Drone', 'Studio photo',
  'Vidéographie', 'Montage vidéo', 'Réalisation', 'Storyboard', 'Scénarisation',
  'Podcast production', 'YouTube production', 'TikTok production', 'Live streaming',
  'Clip musical', 'Court métrage', 'Documentaire', 'UGC vidéo',
  'Production musicale', 'Beatmaking', 'Composition', 'Arrangement',
  'Ableton Live', 'FL Studio', 'Logic Pro', 'Pro Tools', 'Mixage audio', 'Mastering', 'Sound design',
  'Guitare', 'Basse', 'Piano', 'Batterie', 'Violon', 'Saxophone', 'Chant', 'Rap', 'DJ',
  'Copywriting', 'Rédaction web', 'Rédaction SEO', 'UX Writing', 'Storytelling',
  'Journalisme', 'Newsletter', 'Ghostwriting', 'Traduction FR/EN', 'Traduction FR/ES',
  'SEO', 'SEA', 'Google Ads', 'Facebook Ads', 'TikTok Ads', 'LinkedIn Ads',
  'Email Marketing', 'Hubspot', 'Salesforce', 'Growth Hacking', 'A/B Testing', 'CRO',
  'Affiliate Marketing', 'Influence Marketing', 'Google Analytics', 'Mixpanel',
  'TikTok', 'Instagram', 'YouTube', 'LinkedIn', 'Twitter/X', 'Twitch', 'Discord',
  'Community Management', 'Social Media Management', 'Création de contenu', 'UGC',
  'Mannequin', 'Mannequin photo', 'Mannequin défilé', 'Mannequin vidéo', 'Mannequin e-commerce',
  'Fitness model', 'Stylisme', 'Personal shopper',
  'Maquillage', 'Maquillage artistique', 'Maquillage mariage', 'SFX makeup',
  'Coiffure', 'Nail art', 'Manucure', 'Tatouage', 'Piercing',
  'Couture', 'Création de vêtements', 'Patronage', 'Broderie', 'Tricot', 'Macramé',
  'Coaching sportif', 'Personal training', 'Nutrition', 'Yoga', 'Pilates', 'Méditation',
  'Sophrologie', 'Massage', 'Coaching de vie', 'PNL',
  'Football', 'Basketball', 'Tennis', 'Natation', 'Boxe', 'MMA', 'Judo', 'Escalade',
  'CrossFit', 'Musculation', 'Cyclisme', 'Running', 'Surf', 'Skateboard', 'Snowboard',
  'Danse', 'Hip-hop', 'Contemporaine', 'Classique', 'Salsa', 'Bachata', 'Breakdance', 'Chorégraphie',
  'Théâtre', 'Acting', 'Comédie', 'Improvisation', 'Stand-up', 'MC', 'Conférencier',
  'Business Development', 'Sales', 'Commercial', 'Prospection B2B', 'Cold email', 'Négociation',
  'Gestion de projet', 'Agile', 'Scrum', 'Product Management', 'Product Owner', 'OKR',
  'Business Plan', 'Pitch deck', 'Fundraising', 'Finance startup', 'Comptabilité', 'RGPD',
  'Leadership', 'Management', 'Recrutement',
  'E-commerce', 'Dropshipping', 'Amazon FBA', 'Etsy', 'Vinted',
  'Blockchain', 'Solidity', 'Smart Contracts', 'NFT', 'DeFi', 'Web3', 'Trading crypto',
  'Unity', 'Unreal Engine', 'Game Design', 'QA Testing', 'Streaming gaming',
  'Organisation événementiel', 'Wedding planner', 'Event manager',
  'Cuisine', 'Pâtisserie', 'Barista', 'Mixologie',
  'Tutorat', 'Cours particuliers', 'Maths', 'Physique', 'Anglais', 'Espagnol',
  'Assistanat virtuel', 'Service client', 'Toilettage animal', 'Pet sitting',
]

const POPULAR_SKILLS = [
  'React Native', 'Figma', 'TikTok', 'Photographie', 'Montage vidéo',
  'Copywriting', 'Beatmaking', 'Mannequin', 'Danse', 'Motion Design',
  'SEO', 'Growth Hacking', 'Illustration numérique', 'Couture',
]

const HOURS = [
  { id: 'flash', emoji: '⚡', label: '< 5h / semaine', desc: 'Missions courtes uniquement' },
  { id: 'light', emoji: '🌙', label: '5 – 10h / semaine', desc: 'Quelques heures en parallèle' },
  { id: 'medium', emoji: '🔆', label: '10 – 20h / semaine', desc: 'Engagement sérieux' },
  { id: 'heavy', emoji: '🔥', label: '20 – 35h / semaine', desc: 'Quasi temps plein' },
  { id: 'full', emoji: '💪', label: '35h+ / semaine', desc: 'Full time disponible' },
]

const PROJECT_STAGES = [
  { id: 'idea', label: 'Idée', desc: 'Concept en cours de validation', color: '#F97316' },
  { id: 'proto', label: 'Prototype', desc: 'Premier MVP ou démo fonctionnelle', color: '#8B5CF6' },
  { id: 'live', label: 'Lancé', desc: 'Produit live avec premiers utilisateurs', color: '#4ADE80' },
  { id: 'growth', label: 'Croissance', desc: 'Traction prouvée, on scale', color: '#06B6D4' },
]

const TICKETS = [
  { id: 'micro', label: '< 5 000€', desc: 'Love money · Pré-seed', emoji: '🌱' },
  { id: 'small', label: '5 000 – 20 000€', desc: 'Business Angel débutant', emoji: '💰' },
  { id: 'medium', label: '20 000 – 100 000€', desc: 'Business Angel confirmé', emoji: '💎' },
  { id: 'large', label: '100 000€+', desc: 'Lead investor · VC', emoji: '🏦' },
]

type PageMode = 'welcome' | 'signup' | 'login'
type StepType = 'info' | 'roles' | 'talent' | 'project' | 'investor' | 'recap'

function buildSteps(roles: string[]): StepType[] {
  const steps: StepType[] = ['info', 'roles']
  if (roles.includes('talent')) steps.push('talent')
  if (roles.includes('project')) steps.push('project')
  if (roles.includes('investor')) steps.push('investor')
  steps.push('recap')
  return steps
}

function Checkbox({ active, color = '#6D28D9', glow = 'rgba(109,40,217,0.4)' }: {
  active: boolean, color?: string, glow?: string
}) {
  return (
    <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${active ? color : 'rgba(255,255,255,0.2)'}`, background: active ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', boxShadow: active ? `0 4px 12px ${glow}` : 'none' }}>
      {active && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </div>
  )
}

function SkillsSelector({ selected, onAdd, onRemove }: {
  selected: string[], onAdd: (s: string) => void, onRemove: (s: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cardBorder = 'rgba(255,255,255,0.07)'
  const surface = '#1A1828'
  const card = '#111019'
  const text = '#F0EEFF'
  const muted = 'rgba(255,255,255,0.4)'
  const hint = 'rgba(255,255,255,0.15)'
  const max = 5
  const full = selected.length >= max
  const suggestions = query.length >= 1
    ? ALL_SKILLS.filter(s => s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s)).slice(0, 7)
    : []

  function handleAdd(s: string) {
    if (full) return
    onAdd(s); setQuery(''); setOpen(false)
  }
  function handleCustom() {
    const t = query.trim()
    if (!t || selected.includes(t)) return
    handleAdd(t)
  }

  return (
    <div>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '10px' }}>
          {selected.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.3)', color: '#A78BFA', fontSize: '12px', fontWeight: '600' }}>
              {s}
              <button onClick={() => onRemove(s)} style={{ background: 'none', border: 'none', color: '#A78BFA', cursor: 'pointer', padding: 0, fontSize: '15px', lineHeight: 1, opacity: 0.7 }}>×</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', color: muted }}>Jusqu'à 5 compétences</div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: full ? '#4ADE80' : muted }}>{selected.length}/{max}</div>
      </div>
      <div style={{ position: 'relative' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}>
          <circle cx="11" cy="11" r="8" stroke={focused ? '#A78BFA' : muted} strokeWidth="2" />
          <path d="M21 21L16.65 16.65" stroke={focused ? '#A78BFA' : muted} strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input ref={inputRef} value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setFocused(true); setOpen(true) }}
          onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 150) }}
          onKeyDown={e => {
            if (e.key === 'Enter') { if (suggestions.length > 0) handleAdd(suggestions[0]); else if (query.trim()) handleCustom() }
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder={full ? 'Maximum atteint ✓' : 'Recherche... (guitare, React, mannequinat, danse...)'}
          disabled={full}
          style={{ width: '100%', padding: '12px 14px 12px 36px', background: surface, border: `1.5px solid ${focused ? '#6D28D9' : cardBorder}`, borderRadius: '14px', color: text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, opacity: full ? 0.6 : 1, fontFamily: 'inherit', transition: 'border-color 0.2s' }}
        />
        {open && query.length >= 1 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: card, border: `1px solid ${cardBorder}`, borderRadius: '14px', marginTop: '4px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', overflow: 'hidden', maxHeight: '220px', overflowY: 'auto' }}>
            {suggestions.length > 0 ? (
              <>
                {suggestions.map((s, i) => {
                  const idx = s.toLowerCase().indexOf(query.toLowerCase())
                  return (
                    <div key={i} onMouseDown={() => handleAdd(s)}
                      style={{ padding: '11px 14px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? `1px solid ${cardBorder}` : 'none', fontSize: '13px', color: text, display: 'flex', alignItems: 'center', gap: '10px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(109,40,217,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span style={{ color: muted, fontSize: '11px' }}>+</span>
                      <span>{s.substring(0, idx)}<strong style={{ color: '#A78BFA' }}>{s.substring(idx, idx + query.length)}</strong>{s.substring(idx + query.length)}</span>
                    </div>
                  )
                })}
                {!ALL_SKILLS.some(s => s.toLowerCase() === query.toLowerCase()) && (
                  <div onMouseDown={handleCustom}
                    style={{ padding: '11px 14px', cursor: 'pointer', fontSize: '12px', color: '#A78BFA', background: 'rgba(109,40,217,0.06)', borderTop: `1px solid ${cardBorder}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(109,40,217,0.14)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(109,40,217,0.06)')}>
                    + Ajouter "<strong>{query}</strong>"
                  </div>
                )}
              </>
            ) : (
              <div onMouseDown={handleCustom} style={{ padding: '11px 14px', cursor: 'pointer', fontSize: '12px', color: '#A78BFA' }}>
                + Ajouter "<strong>{query}</strong>"
              </div>
            )}
          </div>
        )}
      </div>
      {query.length === 0 && selected.length === 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '10px', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Populaires</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
            {POPULAR_SKILLS.map((s, i) => (
              <button key={i} onClick={() => handleAdd(s)}
                style={{ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${cardBorder}`, background: surface, color: muted, fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6D28D9'; e.currentTarget.style.color = '#A78BFA' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.color = muted }}>
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  const [pageMode, setPageMode] = useState<PageMode>('welcome')
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedHours, setSelectedHours] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectStage, setProjectStage] = useState('')
  const [investorTicket, setInvestorTicket] = useState('')

  const bg = '#08070F'
  const cardBorder = 'rgba(255,255,255,0.07)'
  const surface = '#1A1828'
  const text = '#F0EEFF'
  const muted = 'rgba(255,255,255,0.4)'
  const hint = 'rgba(255,255,255,0.15)'

  const steps = useMemo(() => buildSteps(selectedRoles), [selectedRoles])
  const totalSteps = steps.length
  const currentStepType = steps[step] || 'info'

  const hasTalent = selectedRoles.includes('talent')
  const hasProject = selectedRoles.includes('project')
  const hasInvestor = selectedRoles.includes('investor')
  const primaryRole = ROLES.find(r => selectedRoles[0] === r.id) || ROLES[0]

  function toggleRole(id: string) {
    setSelectedRoles(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id])
  }

  function canNext(): boolean {
    if (currentStepType === 'info') return !!(firstName.trim() && lastName.trim() && age && email && password.length >= 8)
    if (currentStepType === 'roles') return selectedRoles.length > 0
    return true
  }

  function next() {
    if (!canNext()) return
    if (step < totalSteps - 1) setStep(s => s + 1)
    else finish()
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
    else setPageMode('welcome')
  }

  // ── INSCRIPTION RÉELLE SUPABASE ──
  async function finish() {
    setLoading(true)
    setError('')
    try {
      // 1. Créer le compte auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName }
        }
      })
      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error('Erreur lors de la création du compte')

      // 2. Mettre à jour le profil avec age
      await supabase.from('profiles').update({
        age: parseInt(age),
        active_mode: selectedRoles[0] || 'talent',
      }).eq('id', userId)

      // 3. Insérer les modes choisis
      for (const role of selectedRoles) {
        await supabase.from('user_modes').insert({ user_id: userId, mode: role })
      }

      // 4. Créer les profils selon les rôles
      if (hasTalent) {
        await supabase.from('talent_profiles').insert({
          user_id: userId,
          skills: selectedSkills,
          hours_per_week: selectedHours,
        })
      }
      if (hasProject) {
        await supabase.from('project_profiles').insert({
          user_id: userId,
          project_name: projectName,
          stage: PROJECT_STAGES.find(s => s.id === projectStage)?.label || 'Idée',
        })
      }
      if (hasInvestor) {
        await supabase.from('investor_profiles').insert({
          user_id: userId,
        })
      }

      // 5. Sauvegarder en localStorage pour l'UI
      localStorage.setItem('px_userModes', JSON.stringify(selectedRoles))
      localStorage.setItem('px_mode', selectedRoles[0] || 'talent')
      localStorage.setItem('px_firstName', firstName)
      localStorage.setItem('px_userId', userId)

      window.location.href = '/home'
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  // ── CONNEXION RÉELLE SUPABASE ──
  async function login() {
    setLoading(true)
    setError('')
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })
      if (loginError) throw loginError

      const userId = data.user?.id
      if (!userId) throw new Error('Erreur de connexion')

      // Récupérer le profil et les modes
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
      const { data: modes } = await supabase.from('user_modes').select('mode').eq('user_id', userId)

      const userModes = modes?.map(m => m.mode) || []
      const activeMode = profile?.active_mode || userModes[0] || 'talent'

      localStorage.setItem('px_userModes', JSON.stringify(userModes))
      localStorage.setItem('px_mode', activeMode)
      localStorage.setItem('px_firstName', profile?.first_name || '')
      localStorage.setItem('px_userId', userId)

      window.location.href = '/home'
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe incorrect')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', background: surface,
    border: `1.5px solid ${cardBorder}`, borderRadius: '14px',
    color: text, fontSize: '15px', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit',
  }

  const stepTitles: Record<StepType, { title: string; sub: string; accent?: string }> = {
    info: { title: 'Créer mon compte', sub: 'On commence par les bases' },
    roles: { title: 'Qui es-tu ?', sub: 'Choisis un ou plusieurs profils' },
    talent: { title: '⚡ Ton profil Talent', sub: 'Pour trouver les projets qui te correspondent', accent: '#A78BFA' },
    project: { title: '🚀 Ton profil Projet', sub: 'Pour attirer les bons talents et investisseurs', accent: '#22D3EE' },
    investor: { title: '💎 Ton profil Investisseur', sub: 'Pour matcher avec les projets qui t\'intéressent', accent: '#FCD34D' },
    recap: { title: 'C\'est parti !', sub: 'Ton profil est prêt 🎉' },
  }

  const current = stepTitles[currentStepType]

  function ctaLabel() {
    if (loading) return '⏳ Chargement...'
    if (currentStepType === 'recap') return 'Découvrir l\'app 🚀'
    if (currentStepType === 'roles' && selectedRoles.length > 0) {
      const nextStep = steps[step + 1]
      if (nextStep === 'talent') return 'Configurer mon profil Talent →'
      if (nextStep === 'project') return 'Configurer mon profil Projet →'
      if (nextStep === 'investor') return 'Configurer mon profil Investisseur →'
      if (nextStep === 'recap') return 'Voir le récap →'
    }
    return 'Continuer →'
  }

  // ── WELCOME ──
  if (pageMode === 'welcome') {
    return (
      <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(109,40,217,0.13) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 28px', position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '36px', textAlign: 'center' }}>
            <div style={{ width: 76, height: 76, borderRadius: '24px', background: 'linear-gradient(135deg,#6D28D9,#0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', margin: '0 auto 18px', boxShadow: '0 20px 60px rgba(109,40,217,0.4)' }}>✦</div>
            <div style={{ fontSize: '34px', fontWeight: '900', color: text, letterSpacing: '-1px', marginBottom: '6px' }}>Projet X</div>
            <div style={{ fontSize: '14px', color: muted }}>Le Tinder de l'entrepreneuriat</div>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '36px' }}>
            {[
              { emoji: '⚡', title: 'Tu as un talent ?', text: 'Rejoins des projets ambitieux, gagne de l\'argent et construis ton réseau.' },
              { emoji: '🚀', title: 'Tu as un projet ?', text: 'Trouve les talents qu\'il te faut et décroche tes premiers investisseurs.' },
              { emoji: '💎', title: 'Tu veux investir ?', text: 'Découvre les pépites de demain avant tout le monde et fais fructifier ton capital.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px', background: surface, borderRadius: '16px', border: `1px solid ${cardBorder}` }}>
                <span style={{ fontSize: '22px', flexShrink: 0, marginTop: '1px' }}>{item.emoji}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: text, marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: muted, lineHeight: 1.4 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => { setPageMode('signup'); setStep(0) }}
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg,#6D28D9,#0891B2)', border: 'none', borderRadius: '16px', color: 'white', fontSize: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 32px rgba(109,40,217,0.4)' }}>
              Créer mon profil gratuitement
            </button>
            <button onClick={() => setPageMode('login')}
              style={{ width: '100%', padding: '15px', background: 'transparent', border: `1.5px solid ${cardBorder}`, borderRadius: '16px', color: muted, fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              J'ai déjà un compte
            </button>
          </div>
          <div style={{ marginTop: '20px', fontSize: '11px', color: hint, textAlign: 'center', lineHeight: 1.6 }}>
            En continuant tu acceptes nos <span style={{ color: '#A78BFA', cursor: 'pointer' }}>CGU</span> et notre <span style={{ color: '#A78BFA', cursor: 'pointer' }}>politique de confidentialité</span>
          </div>
        </div>
      </div>
    )
  }

  // ── LOGIN ──
  if (pageMode === 'login') {
    return (
      <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden' }}>
        <div style={{ padding: '48px 28px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button onClick={() => { setPageMode('welcome'); setError('') }} style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: text }}>Bon retour 👋</div>
            <div style={{ fontSize: '12px', color: muted }}>Connecte-toi à ton compte</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 24px' }}>
          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '12px', fontSize: '13px', color: '#F87171', marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</div>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="ton@email.com" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#6D28D9')}
                onBlur={e => (e.currentTarget.style.borderColor = cardBorder)} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mot de passe</div>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && login()}
                onFocus={e => (e.currentTarget.style.borderColor = '#6D28D9')}
                onBlur={e => (e.currentTarget.style.borderColor = cardBorder)} />
            </div>
          </div>
          <button onClick={login} disabled={loading}
            style={{ width: '100%', padding: '16px', background: loading ? surface : 'linear-gradient(135deg,#6D28D9,#0891B2)', border: 'none', borderRadius: '16px', color: loading ? muted : 'white', fontSize: '16px', fontWeight: '800', cursor: loading ? 'default' : 'pointer', marginBottom: '20px' }}>
            {loading ? '⏳ Connexion...' : 'Se connecter →'}
          </button>
          <div style={{ textAlign: 'center', fontSize: '12px', color: muted }}>
            Pas encore de compte ?{' '}
            <span onClick={() => { setPageMode('signup'); setError('') }} style={{ color: '#A78BFA', cursor: 'pointer', fontWeight: '600' }}>Créer mon profil</span>
          </div>
        </div>
      </div>
    )
  }

  // ── SIGNUP ──
  return (
    <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden' }}>
      <div style={{ padding: '40px 24px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={back} style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {steps.map((s, i) => {
              const roleInfo = ROLES.find(r => r.id === s)
              const isActive = i === step
              const isDone = i < step
              return (
                <div key={i} style={{ flex: isActive ? 2.5 : 1, height: 4, borderRadius: '4px', background: isDone ? 'linear-gradient(90deg,#6D28D9,#0891B2)' : isActive ? (roleInfo ? roleInfo.gradient : 'linear-gradient(90deg,#6D28D9,#0891B2)') : surface, transition: 'all 0.4s ease' }} />
              )
            })}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: muted, flexShrink: 0 }}>{step + 1}/{totalSteps}</div>
        </div>
        <div style={{ fontSize: '22px', fontWeight: '900', color: current.accent || text, marginBottom: '4px', letterSpacing: '-0.5px' }}>{current.title}</div>
        <div style={{ fontSize: '13px', color: muted, lineHeight: 1.4 }}>{current.sub}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 16px' }}>

        {/* Erreur globale */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '12px', fontSize: '13px', color: '#F87171', marginBottom: '14px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* INFO */}
        {currentStepType === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prénom</div>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Thomas" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6D28D9')}
                  onBlur={e => (e.currentTarget.style.borderColor = cardBorder)} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nom</div>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Mercier" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6D28D9')}
                  onBlur={e => (e.currentTarget.style.borderColor = cardBorder)} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Âge</div>
              <input type="number" min="16" max="99" value={age} onChange={e => setAge(e.target.value)} placeholder="22"
                style={{ ...inputStyle, width: '120px' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#6D28D9')}
                onBlur={e => (e.currentTarget.style.borderColor = cardBorder)} />
              <div style={{ fontSize: '11px', color: hint, marginTop: '6px' }}>Minimum 16 ans</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#6D28D9')}
                onBlur={e => (e.currentTarget.style.borderColor = cardBorder)} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mot de passe</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8 caractères minimum" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#6D28D9')}
                onBlur={e => (e.currentTarget.style.borderColor = cardBorder)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <div style={{ flex: 1, height: 1, background: cardBorder }} />
              <span style={{ fontSize: '11px', color: hint }}>ou</span>
              <div style={{ flex: 1, height: 1, background: cardBorder }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[{ icon: '🍎', label: 'Apple' }, { icon: '🔵', label: 'Google' }].map(s => (
                <button key={s.label} style={{ flex: 1, padding: '13px', background: surface, border: `1.5px solid ${cardBorder}`, borderRadius: '14px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: text, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{s.icon}</span> {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ROLES */}
        {currentStepType === 'roles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(109,40,217,0.08)', borderRadius: '12px', border: '1px solid rgba(109,40,217,0.15)', marginBottom: '4px' }}>
              <span style={{ fontSize: '16px' }}>💡</span>
              <span style={{ fontSize: '12px', color: '#A78BFA', lineHeight: 1.4 }}>
                Tu peux choisir <strong>plusieurs profils</strong> — par exemple être Talent <em>et</em> Porteur de projet
              </span>
            </div>
            {ROLES.map(role => {
              const active = selectedRoles.includes(role.id)
              return (
                <div key={role.id} onClick={() => toggleRole(role.id)}
                  style={{ padding: '16px 18px', borderRadius: '20px', border: `2px solid ${active ? role.border : cardBorder}`, background: active ? role.bg : surface, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
                  {active && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 15% 50%, ${role.glow.replace('0.35', '0.06')}, transparent 65%)`, pointerEvents: 'none' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
                    <div style={{ width: 46, height: 46, borderRadius: '13px', background: active ? role.gradient : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, transition: 'all 0.2s', boxShadow: active ? `0 8px 24px ${role.glow}` : 'none' }}>
                      {role.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: active ? role.color : text, marginBottom: '2px', transition: 'color 0.2s' }}>{role.title}</div>
                      <div style={{ fontSize: '12px', color: active ? 'rgba(255,255,255,0.65)' : muted }}>{role.desc}</div>
                    </div>
                    <Checkbox active={active} color={role.color} glow={role.glow} />
                  </div>
                </div>
              )
            })}
            {selectedRoles.length >= 2 && (
              <div style={{ padding: '10px 14px', background: 'rgba(74,222,128,0.06)', borderRadius: '12px', border: '1px solid rgba(74,222,128,0.15)', fontSize: '12px', color: '#4ADE80', textAlign: 'center' }}>
                ✓ {selectedRoles.length} profils — on configurera chacun séparément
              </div>
            )}
          </div>
        )}

        {/* TALENT */}
        {currentStepType === 'talent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: text, marginBottom: '12px' }}>Tes compétences principales</div>
              <SkillsSelector selected={selectedSkills} onAdd={s => setSelectedSkills(p => [...p, s])} onRemove={s => setSelectedSkills(p => p.filter(x => x !== s))} />
            </div>
            <div style={{ height: 1, background: cardBorder }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: text, marginBottom: '12px' }}>Ta disponibilité hebdomadaire</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {HOURS.map(opt => {
                  const active = selectedHours === opt.id
                  return (
                    <div key={opt.id} onClick={() => setSelectedHours(opt.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', border: `1.5px solid ${active ? 'rgba(109,40,217,0.4)' : cardBorder}`, background: active ? 'rgba(109,40,217,0.1)' : surface, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <span style={{ fontSize: '20px', flexShrink: 0 }}>{opt.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: active ? '#A78BFA' : text }}>{opt.label}</div>
                        <div style={{ fontSize: '11px', color: muted }}>{opt.desc}</div>
                      </div>
                      <Checkbox active={active} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* PROJECT */}
        {currentStepType === 'project' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: text, marginBottom: '12px' }}>Le nom de ton projet</div>
              <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Ex: EcoTrack, Flio, MindFlow..." style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#0891B2')}
                onBlur={e => (e.currentTarget.style.borderColor = cardBorder)} />
            </div>
            <div style={{ height: 1, background: cardBorder }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: text, marginBottom: '12px' }}>Stade d'avancement</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PROJECT_STAGES.map(s => {
                  const active = projectStage === s.id
                  return (
                    <div key={s.id} onClick={() => setProjectStage(s.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', border: `1.5px solid ${active ? s.color + '55' : cardBorder}`, background: active ? s.color + '12' : surface, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: active ? `0 0 14px ${s.color}` : 'none' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: active ? s.color : text }}>{s.label}</div>
                        <div style={{ fontSize: '11px', color: muted }}>{s.desc}</div>
                      </div>
                      <Checkbox active={active} color={s.color} glow={s.color + '55'} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* INVESTOR */}
        {currentStepType === 'investor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ padding: '14px 16px', background: 'rgba(245,158,11,0.06)', borderRadius: '14px', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div style={{ fontSize: '13px', color: '#FCD34D', lineHeight: 1.5 }}>
                💡 Ton ticket d'investissement rassure les fondateurs et te met en avant auprès des projets qui te correspondent.
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: text, marginBottom: '12px' }}>Ton ticket d'investissement</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {TICKETS.map(t => {
                  const active = investorTicket === t.id
                  return (
                    <div key={t.id} onClick={() => setInvestorTicket(t.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', border: `1.5px solid ${active ? 'rgba(245,158,11,0.4)' : cardBorder}`, background: active ? 'rgba(245,158,11,0.08)' : surface, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <span style={{ fontSize: '22px', flexShrink: 0 }}>{t.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: active ? '#FCD34D' : text }}>{t.label}</div>
                        <div style={{ fontSize: '11px', color: muted }}>{t.desc}</div>
                      </div>
                      <Checkbox active={active} color="#F59E0B" glow="rgba(245,158,11,0.4)" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* RECAP */}
        {currentStepType === 'recap' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '8px' }}>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <div style={{ width: 84, height: 84, borderRadius: '50%', background: primaryRole.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', boxShadow: `0 16px 48px ${primaryRole.glow}`, margin: '0 auto' }}>
                {firstName ? firstName[0].toUpperCase() : '?'}
              </div>
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%', background: '#4ADE80', border: '3px solid #08070F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: text, marginBottom: '6px', letterSpacing: '-0.5px' }}>Prêt, {firstName || 'toi'} ! 🎉</div>
            <div style={{ fontSize: '13px', color: muted, marginBottom: '24px', lineHeight: 1.6 }}>Ton profil va être créé. Dernière étape !</div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <div style={{ background: surface, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Récapitulatif</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px' }}>👤</span>
                    <span style={{ fontSize: '13px', color: text, fontWeight: '600' }}>{firstName} {lastName}, {age} ans</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                    {selectedRoles.map(r => {
                      const role = ROLES.find(x => x.id === r)!
                      return (
                        <span key={r} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: role.bg, color: role.color, fontWeight: '700', border: `1px solid ${role.border}` }}>
                          {role.emoji} {role.title}
                        </span>
                      )
                    })}
                  </div>
                  {selectedSkills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '5px' }}>
                      {selectedSkills.map(s => (
                        <span key={s} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(109,40,217,0.15)', color: '#A78BFA', fontWeight: '600' }}>{s}</span>
                      ))}
                    </div>
                  )}
                  {projectName && <div style={{ fontSize: '13px', color: '#22D3EE', fontWeight: '700' }}>🚀 {projectName}</div>}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: hint, lineHeight: 1.6, marginTop: '14px' }}>
              Tu pourras compléter ton profil à tout moment ✦
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: '12px 24px 28px', flexShrink: 0 }}>
        <button onClick={next} disabled={!canNext() || loading}
          style={{ width: '100%', padding: '16px', background: canNext() && !loading ? 'linear-gradient(135deg,#6D28D9,#0891B2)' : surface, border: canNext() && !loading ? 'none' : `1.5px solid ${cardBorder}`, borderRadius: '16px', color: canNext() && !loading ? 'white' : hint, fontSize: '15px', fontWeight: '800', cursor: canNext() && !loading ? 'pointer' : 'default', transition: 'all 0.2s', boxShadow: canNext() && !loading ? '0 8px 32px rgba(109,40,217,0.35)' : 'none' }}>
          {ctaLabel()}
        </button>
      </div>
    </div>
  )
}