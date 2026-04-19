'use client'

import { useState, useRef, useEffect } from 'react'
import { useMode, Mode } from '../context/ModeContext'
import { supabase } from '../lib/supabase'

const ALL_SKILLS = [
  'Ableton Live', 'Acting', 'Adobe XD', 'After Effects', 'Agile', 'Airtable',
  'Animation 2D', 'Animation 3D', 'Back-end', 'Barista', 'Beatmaking', 'Blockchain',
  'Blender', 'Bootstrap', 'Branding', 'Bug Bounty', 'Business Development', 'Business Plan',
  'Canva', 'CapCut', 'Chant', 'Chorégraphie', 'CI/CD', 'Cinema 4D', 'Coaching de vie',
  'Coaching sportif', 'Cold email', 'Color grading', 'Community Management', 'Comptabilité',
  'Copywriting', 'Couture', 'Création de contenu', 'CRO', 'CSS', 'Cuisine', 'Cybersécurité',
  'DaVinci Resolve', 'Danse', 'Data Analysis', 'Data Science', 'Deep Learning', 'DeFi',
  'Design System', 'DevOps', 'Direction artistique', 'Django', 'Docker', 'Drone', 'DJ',
  'E-commerce', 'Email Marketing', 'Excel avancé', 'Expo',
  'Facebook Ads', 'FastAPI', 'Figma', 'Final Cut Pro', 'Firebase', 'Fitness model',
  'FL Studio', 'Flask', 'Flutter', 'Framer', 'Front-end', 'Fundraising',
  'Game Design', 'Gestion de projet', 'Git', 'Go', 'Google Ads', 'Google Analytics',
  'Google Cloud', 'GraphQL', 'Ghostwriting', 'Guitare',
  'HTML', 'Hubspot', 'Hardware', 'Illustration numérique', 'InDesign',
  'Influence Marketing', 'Instagram', 'IoT', 'JavaScript', 'Journalisme', 'Judo',
  'Kotlin', 'Kubernetes', 'LangChain', 'Laravel', 'Leadership', 'Lightroom',
  'LinkedIn', 'LinkedIn Ads', 'Live streaming', 'Logic Pro', 'Logo design',
  'Machine Learning', 'Make', 'Management', 'Mannequin', 'Mannequin e-commerce',
  'Mannequin mode', 'Mannequin photo', 'Marketing', 'Mastering', 'Massage', 'Maya',
  'Méditation', 'Mixage audio', 'Mixologie', 'Mixpanel', 'MongoDB', 'Motion Design', 'MySQL',
  'n8n', 'Nail art', 'NestJS', 'Newsletter', 'NFT', 'NLP', 'Node.js', 'Notion', 'Nutrition',
  'OpenAI API', 'OSINT', 'Packaging', 'Pandas', 'Pentest', 'Personal shopper',
  'Personal training', 'PHP', 'Photographie', 'Photographie mariage', 'Photographie mode',
  'Photographie portrait', 'Photographie produit', 'Photoshop', 'Piano', 'Pilates',
  'Pixel Art', 'PNL', 'Podcast production', 'PostgreSQL', 'Power BI', 'Premiere Pro',
  'Procreate', 'Product Management', 'Product Owner', 'Pro Tools', 'Prompt Engineering',
  'Prospection B2B', 'PWA', 'PyTorch', 'Python', 'QA Testing', 'Rap',
  'React', 'React Native', 'Recrutement', 'Rédaction SEO', 'Rédaction web', 'Redis',
  'REST API', 'Retool', 'Retouche photo', 'RGPD', 'Ruby on Rails', 'Running', 'Rust',
  'Salesforce', 'Sales', 'Sass', 'Scrum', 'SEA', 'SEO', 'Service client', 'SFX makeup',
  'Shopify', 'Smart Contracts', 'Social Media Management', 'Solidity', 'Sound design',
  'Sophrologie', 'Spring Boot', 'SQL', 'Stable Diffusion', 'Stand-up', 'Storyboard',
  'Storytelling', 'Studio photo', 'Supabase', 'Surf', 'Swift', 'SwiftUI',
  'Tableau', 'Tailwind CSS', 'Tatouage', 'TensorFlow', 'Théâtre', 'TikTok', 'TikTok Ads',
  'TikTok production', 'Trading crypto', 'Traduction FR/EN', 'Traduction FR/ES',
  'TypeScript', 'Twitch', 'UI Design', 'Unity', 'Unreal Engine', 'UX Design',
  'UX Research', 'UX Writing', 'Vercel', 'VFX', 'Vidéographie', 'Violon', 'Vue.js', 'VR',
  'Web3', 'Webflow', 'WordPress', 'Yoga', 'YouTube', 'YouTube production', 'ZBrush', 'Zapier',
].sort()

const ALL_SECTORS = [
  'Aérospatial', 'AgriFood', 'Alimentation saine', 'AR/VR', 'B2B', 'B2C',
  'BeautyTech', 'Bien-être & Spa', 'BioTech', 'Blockchain', 'Coaching & Performance',
  'Co-living', 'Communauté & Réseau social', 'Compliance', 'Cosmétiques & Skincare',
  'Covoiturage', 'Creator Economy', 'Crypto', 'D2C', 'Data', 'DeepTech', 'DeFi',
  'E-commerce', 'E-learning', 'EdTech', 'Économie circulaire', 'Énergies renouvelables',
  'ESS', 'Esport', 'FashionTech', 'FinTech', 'FoodTech', 'FoodWaste', 'Formation en ligne',
  'Freelance & Indépendants', 'FutureOfWork', 'GreenTech', 'Hardware & IoT', 'HealthTech',
  'Hôtellerie', 'HRTech', 'IA Générative', 'Impact social', 'Impression 3D',
  'Influence marketing', 'Insertion professionnelle', 'Intelligence Artificielle',
  'Jeux vidéo', 'LegalTech', 'Live shopping', 'Livraison de repas', 'Luxe & Haute couture',
  'Machine Learning', 'Marketplace', 'Marketplace B2B', 'MediaTech', 'MedTech', 'Métavers',
  'Micro-mobilité', 'Mobilité durable', 'Mode durable', 'Mobility', 'Néobanque',
  'Newsletter', 'No-code', 'Paiement & PayTech', 'Podcast', 'Presse en ligne', 'PropTech',
  'Recommerce & Seconde main', 'Recrutement & RH', 'Robotique', 'SaaS', 'Santé mentale',
  'Smart City', 'Smart Home & Domotique', 'SportTech', 'Sports extrêmes',
  'Streaming vidéo', 'Streetwear', 'Talent management', 'Télémédecine',
  'Tourisme durable', 'TravelTech', 'Tutorat & Soutien scolaire',
  'Véhicule électrique', 'Web3', 'WellnessTech',
].sort()

const POPULAR_SECTORS = ['Creator Economy', 'E-commerce', 'EdTech', 'FinTech', 'FoodTech', 'FutureOfWork', 'GreenTech', 'HealthTech', 'IA Générative', 'PropTech', 'SaaS', 'Web3']

const SKILL_CLUSTERS: Record<string, string[]> = {
  'React': ['React Native', 'Next.js', 'TypeScript', 'JavaScript', 'Vue.js', 'Tailwind CSS'],
  'React Native': ['React', 'Expo', 'TypeScript', 'Flutter', 'Swift', 'Kotlin'],
  'Figma': ['UI Design', 'UX Design', 'Design System', 'Framer', 'Adobe XD'],
  'TikTok': ['Instagram', 'YouTube', 'CapCut', 'Création de contenu', 'Community Management'],
  'Photographie': ['Lightroom', 'Photoshop', 'Studio photo', 'Retouche photo', 'Drone', 'Vidéographie'],
  'Beatmaking': ['Ableton Live', 'FL Studio', 'Mixage audio', 'Mastering', 'Sound design'],
  'SEO': ['SEA', 'Google Ads', 'Copywriting', 'Rédaction web', 'Google Analytics'],
  'Machine Learning': ['Deep Learning', 'Python', 'TensorFlow', 'PyTorch', 'Data Science', 'NLP'],
  'Node.js': ['Back-end', 'PostgreSQL', 'REST API', 'GraphQL', 'Supabase'],
  'Motion Design': ['After Effects', 'Animation 2D', 'Animation 3D', 'Cinema 4D', 'Blender', 'VFX'],
  'Copywriting': ['Rédaction web', 'Rédaction SEO', 'Newsletter', 'Storytelling', 'UX Writing'],
  'Python': ['Machine Learning', 'Data Science', 'FastAPI', 'Django', 'Pandas'],
}

const COLLAB_MODES = [
  { id: 'Flash', emoji: '⚡', label: 'Mission Flash', desc: 'Une tâche précise rémunérée.' },
  { id: 'Side', emoji: '🚀', label: 'Side Project', desc: 'Collaboration temps partiel.' },
  { id: 'Equity', emoji: '💎', label: 'Co-fondateur / Equity', desc: 'Des parts du projet.' },
]

const STATUTS = [
  'Étudiant(e)', 'Lycéen(ne)', 'Alternant(e)', 'Stagiaire', 'Freelance', 'Auto-entrepreneur',
  'Salarié(e)', 'En reconversion', 'Développeur(se)', 'Designer', 'Marketeur(se)',
  'Créateur(rice) de contenu', 'Photographe', 'Vidéaste', 'Musicien(ne)', 'Artiste', 'Mannequin',
  'Chef de projet', 'Product Manager', 'Community Manager', 'Graphiste', 'Rédacteur(rice)',
  'Consultant(e)', 'Coach', 'Entrepreneur(e)', 'Co-fondateur(rice)', 'Fondateur(rice)', 'CEO',
  'Investisseur(se)', 'Business Angel', 'En recherche d\'opportunités',
]

const STAGES = ['Idée', 'Prototype', 'Lancé', 'Croissance', 'Série A+']
const WORK_MODES = [
  { id: 'remote', label: 'Full Remote', emoji: '🌐', desc: 'Tout à distance' },
  { id: 'hybrid', label: 'Hybride', emoji: '🏙', desc: 'Remote + présentiel ponctuel' },
  { id: 'onsite', label: 'Présentiel', emoji: '📍', desc: 'Sur place principalement' },
]
const LINK_TYPES = [
  { id: 'github', label: 'GitHub', icon: '💻', placeholder: 'github.com/monpseudo' },
  { id: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'instagram.com/monpseudo' },
  { id: 'youtube', label: 'YouTube', icon: '▶️', placeholder: 'youtube.com/@machaîne' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: 'tiktok.com/@monpseudo' },
  { id: 'behance', label: 'Behance', icon: '🎨', placeholder: 'behance.net/monpseudo' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', placeholder: 'linkedin.com/in/monpseudo' },
  { id: 'pitch', label: 'Pitch Deck', icon: '📊', placeholder: 'docsend.com/monpitch' },
  { id: 'demo', label: 'Démo / App', icon: '🚀', placeholder: 'monapplication.com' },
  { id: 'site', label: 'Site web', icon: '🌐', placeholder: 'monsite.com' },
  { id: 'autre', label: 'Autre', icon: '🔗', placeholder: 'monlien.com' },
]
const HOURS_OPTIONS = [
  { id: 'flash_only', label: '< 5h/sem', desc: 'Missions ultra-courtes', emoji: '⚡' },
  { id: 'light', label: '5–10h/sem', desc: 'Quelques heures', emoji: '🌙' },
  { id: 'medium', label: '10–20h/sem', desc: 'Engagement modéré', emoji: '🔆' },
  { id: 'heavy', label: '20–35h/sem', desc: 'Quasi temps plein', emoji: '🔥' },
  { id: 'fulltime', label: '35h+/sem', desc: 'Full time', emoji: '💪' },
]

const MODE_CONFIG = {
  talent: {
    accent: '#6D28D9', accentLight: '#A78BFA', accentBg: 'rgba(109,40,217,0.1)',
    gradient: 'linear-gradient(135deg, #6D28D9, #8B5CF6)', glow: 'rgba(109,40,217,0.35)',
    label: 'Talent', emoji: '⚡',
    stats: [{ label: 'Projets rejoints', value: '3' }, { label: 'Missions flash', value: '12' }, { label: 'Score IA', value: '94%' }],
  },
  project: {
    accent: '#0891B2', accentLight: '#22D3EE', accentBg: 'rgba(8,145,178,0.1)',
    gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)', glow: 'rgba(8,145,178,0.35)',
    label: 'Projet', emoji: '🚀',
    stats: [{ label: 'Talents matchés', value: '8' }, { label: 'En discussion', value: '2' }, { label: 'Avancement', value: '40%' }],
  },
  investor: {
    accent: '#B45309', accentLight: '#FCD34D', accentBg: 'rgba(180,83,9,0.1)',
    gradient: 'linear-gradient(135deg, #B45309, #F59E0B)', glow: 'rgba(180,83,9,0.35)',
    label: 'Investisseur', emoji: '💎',
    stats: [{ label: 'Projets suivis', value: '5' }, { label: 'Investi total', value: '35k€' }, { label: 'Exits', value: '0' }],
  },
}

function calcCompletion(mode: string, data: any): number {
  if (mode === 'talent') {
    let s = 0
    if (data.bio?.trim()) s += 20
    if (data.skills?.length > 0) s += 25
    if (data.hours) s += 20
    if (data.modes?.length > 0) s += 20
    if (data.links?.length > 0) s += 15
    return s
  }
  if (mode === 'project') {
    let s = 0
    if (data.name?.trim()) s += 20
    if (data.bio?.trim()) s += 15
    if (data.desc?.trim()) s += 20
    if (data.stage) s += 15
    if (data.sectors?.length > 0) s += 15
    if (data.needs?.length > 0) s += 15
    return s
  }
  if (mode === 'investor') {
    let s = 0
    if (data.bio?.trim()) s += 20
    if (data.thesis?.trim()) s += 25
    if (data.sectors?.length > 0) s += 20
    if (data.stages?.length > 0) s += 20
    if (data.ticketMin) s += 15
    return s
  }
  return 0
}

// ── TOUS LES SOUS-COMPOSANTS SONT EN DEHORS DE ProfilPage ──
// C'est la clé : si un composant est défini DANS ProfilPage,
// React le recrée à chaque render → perd le focus

function Section({ title, children, card, cardBorder, hint }: {
  title: string
  children: React.ReactNode
  card: string
  cardBorder: string
  hint: string
}) {
  return (
    <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: '18px', padding: '16px', marginBottom: '10px' }}>
      <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: hint, marginBottom: '12px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function SearchSelector({ all, selected, onAdd, onRemove, placeholder, popular, max = 10, accent, accentLight, card, cardBorder, surface, text, muted, hint }: any) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const safe = selected || []
  const full = safe.length >= max

  const suggestions = query.length >= 1 ? [
    ...all.filter((s: string) => s.toLowerCase().startsWith(query.toLowerCase()) && !safe.includes(s)),
    ...all.filter((s: string) => !s.toLowerCase().startsWith(query.toLowerCase()) && s.toLowerCase().includes(query.toLowerCase()) && !safe.includes(s)),
  ].slice(0, 7) : []

  const relatedSkills = safe.length > 0
    ? [...new Set(safe.flatMap((s: string) => SKILL_CLUSTERS[s] || []).filter((s: string) => !safe.includes(s)))].slice(0, 5) as string[]
    : []

  function handleAdd(s: string) { if (full) return; onAdd(s); setQuery(''); setOpen(false) }
  function handleCustom() { const t = query.trim(); if (!t || safe.includes(t)) return; handleAdd(t) }

  return (
    <div>
      {safe.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '10px' }}>
          {safe.map((s: string, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: accent + '18', border: `1px solid ${accent}40`, color: accentLight, fontSize: '11px', fontWeight: '600' }}>
              {s}
              <button onClick={() => onRemove(s)} style={{ background: 'none', border: 'none', color: accentLight, cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1, opacity: 0.7 }}>×</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: muted }}>Jusqu'à {max}</span>
        <span style={{ fontSize: '11px', fontWeight: '700', color: full ? '#4ADE80' : muted }}>{safe.length}/{max}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8" stroke={focused ? accentLight : muted} strokeWidth="2" />
          <path d="M21 21L16.65 16.65" stroke={focused ? accentLight : muted} strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setFocused(true); setOpen(true) }}
          onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 150) }}
          onKeyDown={e => {
            if (e.key === 'Enter') { if (suggestions.length > 0) handleAdd(suggestions[0]); else if (query.trim()) handleCustom() }
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder={full ? 'Maximum atteint ✓' : placeholder}
          disabled={full}
          style={{ width: '100%', padding: '10px 14px 10px 32px', background: surface, border: `1.5px solid ${focused ? accent : cardBorder}`, borderRadius: '12px', color: text, fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const, opacity: full ? 0.6 : 1, fontFamily: 'inherit', transition: 'border-color 0.2s' }}
        />
        {open && query.length >= 1 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: card, border: `1px solid ${cardBorder}`, borderRadius: '12px', marginTop: '4px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
            {suggestions.length > 0 ? (
              <>
                {suggestions.map((s: string, i: number) => {
                  const idx = s.toLowerCase().indexOf(query.toLowerCase())
                  return (
                    <div key={i} onMouseDown={() => handleAdd(s)}
                      style={{ padding: '10px 13px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? `1px solid ${cardBorder}` : 'none', fontSize: '12px', color: text, display: 'flex', alignItems: 'center', gap: '8px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = accent + '15')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span style={{ color: muted, fontSize: '10px' }}>+</span>
                      <span>{s.substring(0, idx)}<strong style={{ color: accentLight }}>{s.substring(idx, idx + query.length)}</strong>{s.substring(idx + query.length)}</span>
                    </div>
                  )
                })}
                {!all.some((s: string) => s.toLowerCase() === query.toLowerCase()) && (
                  <div onMouseDown={handleCustom}
                    style={{ padding: '10px 13px', cursor: 'pointer', fontSize: '11px', color: accentLight, background: accent + '08', borderTop: `1px solid ${cardBorder}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = accent + '18')}
                    onMouseLeave={e => (e.currentTarget.style.background = accent + '08')}>
                    + Ajouter "<strong>{query}</strong>"
                  </div>
                )}
              </>
            ) : (
              <div onMouseDown={handleCustom} style={{ padding: '10px 13px', cursor: 'pointer', fontSize: '11px', color: accentLight }}>
                + Ajouter "<strong>{query}</strong>"
              </div>
            )}
          </div>
        )}
      </div>
      {query.length === 0 && relatedSkills.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '9px', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '7px' }}>💡 Dans le même style</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '5px' }}>
            {relatedSkills.map((s: string, i: number) => (
              <button key={i} onClick={() => handleAdd(s)}
                style={{ padding: '4px 10px', borderRadius: '20px', border: `1px solid ${accent}40`, background: accent + '10', color: accentLight, fontSize: '10px', cursor: 'pointer' }}>
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {query.length === 0 && safe.length === 0 && popular && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '9px', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '7px' }}>Populaires</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '5px' }}>
            {popular.map((s: string, i: number) => (
              <button key={i} onClick={() => handleAdd(s)}
                style={{ padding: '4px 10px', borderRadius: '20px', border: `1px solid ${cardBorder}`, background: surface, color: muted, fontSize: '10px', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accentLight }}
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

function LinksManager({ links, setLinks, editing, accent, accentLight, card, cardBorder, surface, text, muted, hint }: any) {
  const [showAdd, setShowAdd] = useState(false)
  const [newType, setNewType] = useState('site')
  const [newUrl, setNewUrl] = useState('')

  function addLink() {
    if (!newUrl.trim()) return
    const lt = LINK_TYPES.find(l => l.id === newType)
    setLinks([...links, { type: newType, label: lt?.label || 'Lien', url: newUrl.trim(), icon: lt?.icon || '🔗' }])
    setNewUrl(''); setShowAdd(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: hint }}>Liens & démos</div>
        {editing && <button onClick={() => setShowAdd(!showAdd)} style={{ background: accent + '15', border: `1px solid ${accent}30`, borderRadius: '8px', padding: '3px 9px', fontSize: '10px', color: accentLight, cursor: 'pointer', fontWeight: '600' }}>+ Ajouter</button>}
      </div>
      {links.map((l: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', background: surface, borderRadius: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>{l.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: text }}>{l.label}</div>
            <div style={{ fontSize: '10px', color: accentLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{l.url}</div>
          </div>
          {editing
            ? <button onClick={() => setLinks(links.filter((_: any, j: number) => j !== i))} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: '14px', opacity: 0.7 }}>×</button>
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={accentLight} strokeWidth="2" strokeLinecap="round" /></svg>}
        </div>
      ))}
      {links.length === 0 && !showAdd && <div style={{ textAlign: 'center', padding: '12px', color: muted, fontSize: '11px' }}>Aucun lien ajouté</div>}
      {showAdd && (
        <div style={{ background: surface, borderRadius: '12px', padding: '12px', marginTop: '8px', border: `1px solid ${cardBorder}` }}>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' as const, marginBottom: '10px' }}>
            {LINK_TYPES.map(lt => (
              <button key={lt.id} onClick={() => setNewType(lt.id)}
                style={{ padding: '3px 8px', borderRadius: '20px', border: `1px solid ${newType === lt.id ? accent : cardBorder}`, background: newType === lt.id ? accent + '18' : 'transparent', color: newType === lt.id ? accentLight : muted, fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>
                {lt.icon} {lt.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
              placeholder={LINK_TYPES.find(l => l.id === newType)?.placeholder || 'monlien.com'}
              onKeyDown={e => e.key === 'Enter' && addLink()}
              style={{ flex: 1, padding: '8px 12px', background: card, border: `1px solid ${cardBorder}`, borderRadius: '10px', color: text, fontSize: '12px', outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={addLink} style={{ padding: '8px 14px', background: accent, border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ModeSelector({ muted, cardBorder }: { muted: string; cardBorder: string }) {
  const { activeMode, setActiveMode, userModes, activateMode } = useMode()
  const modes: Mode[] = ['talent', 'project', 'investor']
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {modes.map(m => {
        const isActive = activeMode === m
        const has = userModes.includes(m)
        const cfg = MODE_CONFIG[m]
        return (
          <button key={m} onClick={() => has ? setActiveMode(m) : activateMode(m)}
            style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${isActive ? cfg.accent : cardBorder}`, background: isActive ? cfg.accentBg : 'transparent', color: isActive ? cfg.accentLight : muted, fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
            {cfg.emoji} {cfg.label}{!has && <span style={{ color: '#F97316', fontSize: '9px' }}>+</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── PAGE PRINCIPALE ──
export default function ProfilPage() {
  const { activeMode, userModes, activateMode, dark, setDark } = useMode()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [userId, setUserId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [displayAge, setDisplayAge] = useState('')
  const [displayCity, setDisplayCity] = useState('')
  const [editCity, setEditCity] = useState('')
  const [displayInitial, setDisplayInitial] = useState('?')
  const [avatarUrl, setAvatarUrl] = useState('')

  const [talentStatut, setTalentStatut] = useState('Étudiant(e)')
  const [talentStatutOpen, setTalentStatutOpen] = useState(false)
  const [talentBio, setTalentBio] = useState('')
  const [talentSkills, setTalentSkills] = useState<string[]>([])
  const [talentModes, setTalentModes] = useState<string[]>([])
  const [talentHours, setTalentHours] = useState('')
  const [talentLinks, setTalentLinks] = useState<any[]>([])

  const [projectName, setProjectName] = useState('')
  const [projectStatut, setProjectStatut] = useState('Fondateur(rice)')
  const [projectStatutOpen, setProjectStatutOpen] = useState(false)
  const [projectBio, setProjectBio] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [projectStage, setProjectStage] = useState('Idée')
  const [projectSectors, setProjectSectors] = useState<string[]>([])
  const [projectWorkMode, setProjectWorkMode] = useState('remote')
  const [projectNeeds, setProjectNeeds] = useState<string[]>([])
  const [projectCollabModes, setProjectCollabModes] = useState<string[]>([])
  const [projectEquity, setProjectEquity] = useState('')
  const [projectBudget, setProjectBudget] = useState('')
  const [projectTeamSize, setProjectTeamSize] = useState('1')
  const [projectLinks, setProjectLinks] = useState<any[]>([])

  const [investorStatut, setInvestorStatut] = useState('Business Angel')
  const [investorStatutOpen, setInvestorStatutOpen] = useState(false)
  const [investorBio, setInvestorBio] = useState('')
  const [investorThesis, setInvestorThesis] = useState('')
  const [investorSectors, setInvestorSectors] = useState<string[]>([])
  const [investorTicketMin, setInvestorTicketMin] = useState('')
  const [investorTicketMax, setInvestorTicketMax] = useState('')
  const [investorStages, setInvestorStages] = useState<string[]>([])
  const [investorPortfolio, setInvestorPortfolio] = useState<any[]>([])
  const [investorLinks, setInvestorLinks] = useState<any[]>([])

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

  const completionData = {
    talent: { bio: talentBio, skills: talentSkills, hours: talentHours, modes: talentModes, links: talentLinks },
    project: { name: projectName, bio: projectBio, desc: projectDesc, stage: projectStage, sectors: projectSectors, needs: projectNeeds },
    investor: { bio: investorBio, thesis: investorThesis, sectors: investorSectors, stages: investorStages, ticketMin: investorTicketMin },
  }
  const completion = hasMode ? calcCompletion(activeMode, completionData[activeMode]) : 0

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/'; return }
        setUserId(user.id)
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (p) {
          setDisplayName(`${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Mon profil')
          setDisplayAge(p.age ? `${p.age} ans` : '')
          setDisplayCity(p.city || '')
          setEditCity(p.city || '')
          setDisplayInitial((p.first_name || '?')[0].toUpperCase())
          setAvatarUrl(p.avatar_url || '')
        }
        const { data: t } = await supabase.from('talent_profiles').select('*').eq('user_id', user.id).single()
        if (t) {
          setTalentBio(t.bio || '')
          setTalentSkills(t.skills || [])
          setTalentHours(t.hours_per_week || '')
          setTalentModes(t.collab_modes || [])
          setTalentLinks(t.links || [])
          setTalentStatut(t.statut || 'Étudiant(e)')
        }
        const { data: proj } = await supabase.from('project_profiles').select('*').eq('user_id', user.id).single()
        if (proj) {
          setProjectName(proj.project_name || '')
          setProjectBio(proj.founder_bio || '')
          setProjectDesc(proj.description || '')
          setProjectStage(proj.stage || 'Idée')
          setProjectSectors(proj.sectors || [])
          setProjectWorkMode(proj.work_mode || 'remote')
          setProjectNeeds(proj.needs || [])
          setProjectCollabModes(proj.collab_modes || [])
          setProjectEquity(proj.equity || '')
          setProjectBudget(proj.budget || '')
          setProjectTeamSize(proj.team_size?.toString() || '1')
          setProjectLinks(proj.links || [])
          setProjectStatut(proj.statut || 'Fondateur(rice)')
        }
        const { data: inv } = await supabase.from('investor_profiles').select('*').eq('user_id', user.id).single()
        if (inv) {
          setInvestorBio(inv.bio || '')
          setInvestorThesis(inv.thesis || '')
          setInvestorTicketMin(inv.ticket_min?.toString() || '')
          setInvestorTicketMax(inv.ticket_max?.toString() || '')
          setInvestorSectors(inv.sectors || [])
          setInvestorStages(inv.preferred_stages || [])
          setInvestorPortfolio(inv.portfolio || [])
          setInvestorLinks(inv.links || [])
          setInvestorStatut(inv.statut || 'Business Angel')
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await supabase.from('profiles').update({ city: editCity }).eq('id', userId)
      setDisplayCity(editCity)
      if (activeMode === 'talent') {
        await supabase.from('talent_profiles').upsert({
          user_id: userId, bio: talentBio, skills: talentSkills,
          hours_per_week: talentHours, collab_modes: talentModes,
          links: talentLinks, statut: talentStatut, updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      }
      if (activeMode === 'project') {
        await supabase.from('project_profiles').upsert({
          user_id: userId, project_name: projectName, founder_bio: projectBio,
          description: projectDesc, stage: projectStage, sectors: projectSectors,
          work_mode: projectWorkMode, needs: projectNeeds, collab_modes: projectCollabModes,
          equity: projectEquity, budget: projectBudget,
          team_size: parseInt(projectTeamSize) || 1,
          links: projectLinks, statut: projectStatut, updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      }
      if (activeMode === 'investor') {
        await supabase.from('investor_profiles').upsert({
          user_id: userId, bio: investorBio, thesis: investorThesis,
          ticket_min: parseInt(investorTicketMin) || 0,
          ticket_max: parseInt(investorTicketMax) || 0,
          sectors: investorSectors, preferred_stages: investorStages,
          portfolio: investorPortfolio, links: investorLinks,
          statut: investorStatut, updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      }
      setEditing(false)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId)
        setAvatarUrl(data.publicUrl)
      }
    } catch (e) { console.error(e) }
    setUploadingAvatar(false)
  }

  const currentStatut = activeMode === 'talent' ? talentStatut : activeMode === 'project' ? projectStatut : investorStatut
  const currentStatutOpen = activeMode === 'talent' ? talentStatutOpen : activeMode === 'project' ? projectStatutOpen : investorStatutOpen
  const setCurrentStatutOpen = activeMode === 'talent' ? setTalentStatutOpen : activeMode === 'project' ? setProjectStatutOpen : setInvestorStatutOpen
  const setCurrentStatut = activeMode === 'talent' ? setTalentStatut : activeMode === 'project' ? setProjectStatut : setInvestorStatut

  const navItems = [
    { id: 'home', href: '/home' }, { id: 'chat', href: '/chat' },
    { id: 'swipe', href: '/swipe' }, { id: 'explorer', href: '/explorer' },
    { id: 'profil', href: '/profil', active: true },
  ]

  if (loading) return (
    <div style={{ height: '100%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${cfg.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ height: '100%', overflow: 'hidden', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', transition: 'background 0.3s' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ padding: '44px 20px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontSize: '22px', fontWeight: '900', color: text, letterSpacing: '-0.5px' }}>Mon profil</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => editing ? handleSave() : setEditing(true)}
              style={{ padding: '7px 14px', background: editing ? cfg.accentBg : surface, border: `1.5px solid ${editing ? cfg.accent : cardBorder}`, borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: editing ? cfg.accentLight : muted, transition: 'all 0.2s' }}>
              {saving ? '⏳' : editing ? '✓ Sauver' : '✏️ Éditer'}
            </button>
            <button onClick={() => setDark(!dark)} style={{ background: 'none', border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        <ModeSelector muted={muted} cardBorder={cardBorder} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 8px' }}>

        {/* Avatar card */}
        <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: '20px', padding: '18px', marginBottom: '10px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: cfg.gradient }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900', color: 'white', boxShadow: `0 8px 24px ${cfg.glow}`, overflow: 'hidden' }}>
                {uploadingAvatar
                  ? <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  : avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayInitial}
              </div>
              {editing && (
                <label style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: cfg.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>
                  📷<input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                </label>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '17px', fontWeight: '800', color: text, marginBottom: '4px' }}>{displayName}</div>
              {/* Statut */}
              <div style={{ marginBottom: '4px', position: 'relative' }}>
                {!editing ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', background: cfg.accentBg, fontSize: '11px', fontWeight: '600', color: cfg.accentLight }}>
                    {cfg.emoji} {currentStatut}
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div onClick={() => setCurrentStatutOpen(!currentStatutOpen)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: cfg.accentBg, border: `1px solid ${cfg.accent}50`, cursor: 'pointer', fontSize: '11px', fontWeight: '600', color: cfg.accentLight }}>
                      {currentStatut}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke={cfg.accentLight} strokeWidth="2" strokeLinecap="round" /></svg>
                    </div>
                    {currentStatutOpen && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, background: card, border: `1px solid ${cardBorder}`, borderRadius: '12px', marginTop: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden', maxHeight: '160px', overflowY: 'auto', minWidth: '190px' }}>
                        {STATUTS.map((s, i) => (
                          <div key={i} onMouseDown={() => { setCurrentStatut(s); setCurrentStatutOpen(false) }}
                            style={{ padding: '9px 14px', cursor: 'pointer', fontSize: '12px', color: s === currentStatut ? cfg.accentLight : text, background: s === currentStatut ? cfg.accentBg : 'transparent', fontWeight: s === currentStatut ? '600' : '400' }}
                            onMouseEnter={e => (e.currentTarget.style.background = cfg.accentBg)}
                            onMouseLeave={e => (e.currentTarget.style.background = s === currentStatut ? cfg.accentBg : 'transparent')}>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Ville */}
              {editing ? (
                <input
                  value={editCity}
                  onChange={e => setEditCity(e.target.value)}
                  placeholder="Ta ville..."
                  style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: '8px', padding: '4px 10px', color: text, fontSize: '11px', outline: 'none', fontFamily: 'inherit', width: '140px' }}
                />
              ) : (
                <div style={{ fontSize: '11px', color: muted }}>
                  {displayCity ? `📍 ${displayCity}` : '📍 Ajoute ta ville'}{displayAge ? ` · ${displayAge}` : ''}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
            {cfg.stats.map((s, i) => (
              <div key={i} style={{ background: surface, borderRadius: '12px', padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '17px', fontWeight: '900', color: cfg.accentLight, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '8px', color: muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '3px', lineHeight: 1.2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Completion */}
          {hasMode && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: muted }}>Complétude du profil</div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: completion >= 80 ? '#4ADE80' : completion >= 50 ? cfg.accentLight : '#F97316' }}>{completion}%</div>
              </div>
              <div style={{ height: 6, background: surface, borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${completion}%`, height: '100%', background: completion >= 80 ? 'linear-gradient(90deg,#4ADE80,#22D3EE)' : cfg.gradient, borderRadius: '6px', transition: 'width 0.5s ease' }} />
              </div>
              {completion < 100 && (
                <div style={{ fontSize: '10px', color: hint, marginTop: '5px' }}>
                  {completion < 40 && '💡 Complète ton profil pour booster ton score de matching'}
                  {completion >= 40 && completion < 70 && '🔥 Bon début ! Encore quelques infos pour maximiser tes matches'}
                  {completion >= 70 && completion < 100 && '⭐ Profil presque complet — tu es bien positionné(e)'}
                </div>
              )}
            </div>
          )}
        </div>

        {!hasMode ? (
          <div style={{ background: card, border: `1px solid ${cfg.accent}30`, borderRadius: '18px', padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{cfg.emoji}</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: text, marginBottom: '8px' }}>Profil {cfg.label} non créé</div>
            <div style={{ fontSize: '13px', color: muted, marginBottom: '20px' }}>Active ce profil pour accéder à toutes les fonctionnalités.</div>
            <button onClick={() => activateMode(activeMode)} style={{ width: '100%', padding: '13px', background: cfg.gradient, border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              Créer mon profil {cfg.label}
            </button>
          </div>
        ) : (
          <>
            {/* ══ TALENT ══ */}
            {activeMode === 'talent' && (
              <>
                <Section title="Ma bio" card={card} cardBorder={cardBorder} hint={hint}>
                  {editing
                    ? <textarea
                        value={talentBio}
                        onChange={e => setTalentBio(e.target.value)}
                        placeholder="Décris-toi en quelques phrases..."
                        style={{ width: '100%', background: surface, border: `1px solid ${cardBorder}`, borderRadius: '10px', padding: '10px', color: text, fontSize: '12px', outline: 'none', resize: 'none', minHeight: '80px', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
                      />
                    : <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>{talentBio || <span style={{ color: hint, fontStyle: 'italic' }}>Non renseigné</span>}</div>}
                </Section>

                <Section title="Mes compétences" card={card} cardBorder={cardBorder} hint={hint}>
                  <SearchSelector
                    all={ALL_SKILLS} selected={talentSkills}
                    onAdd={(s: string) => setTalentSkills(p => [...p, s])}
                    onRemove={(s: string) => setTalentSkills(p => p.filter(x => x !== s))}
                    placeholder="Tape une lettre pour chercher..."
                    popular={['Beatmaking', 'Coaching sportif', 'Copywriting', 'Danse', 'Figma', 'Mannequin', 'Motion Design', 'Photographie', 'React Native', 'SEO', 'TikTok', 'YouTube production']}
                    max={15} accent={cfg.accent} accentLight={cfg.accentLight}
                    card={card} cardBorder={cardBorder} surface={surface} text={text} muted={muted} hint={hint}
                  />
                </Section>

                <Section title="Liens & démos" card={card} cardBorder={cardBorder} hint={hint}>
                  <LinksManager links={talentLinks} setLinks={setTalentLinks} editing={editing}
                    accent={cfg.accent} accentLight={cfg.accentLight} card={card} cardBorder={cardBorder} surface={surface} text={text} muted={muted} hint={hint} />
                </Section>

                <Section title="Ma disponibilité" card={card} cardBorder={cardBorder} hint={hint}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {HOURS_OPTIONS.map(opt => {
                      const active = talentHours === opt.id
                      return (
                        <div key={opt.id} onClick={() => setTalentHours(opt.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 12px', borderRadius: '12px', border: `1.5px solid ${active ? cfg.accent : cardBorder}`, background: active ? cfg.accentBg : surface, cursor: 'pointer', transition: 'all 0.15s' }}>
                          <span style={{ fontSize: '18px', flexShrink: 0 }}>{opt.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: active ? cfg.accentLight : text }}>{opt.label}</div>
                            <div style={{ fontSize: '10px', color: muted }}>{opt.desc}</div>
                          </div>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${active ? cfg.accent : 'rgba(255,255,255,0.2)'}`, background: active ? cfg.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {active && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Section>

                <Section title="Je suis disponible pour" card={card} cardBorder={cardBorder} hint={hint}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {COLLAB_MODES.map(m => {
                      const active = talentModes.includes(m.id)
                      return (
                        <div key={m.id} onClick={() => setTalentModes(p => p.includes(m.id) ? p.filter(x => x !== m.id) : [...p, m.id])}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px', borderRadius: '12px', border: `1.5px solid ${active ? cfg.accent : cardBorder}`, background: active ? cfg.accentBg : surface, cursor: 'pointer', transition: 'all 0.15s' }}>
                          <span style={{ fontSize: '18px' }}>{m.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: active ? cfg.accentLight : text }}>{m.label}</div>
                            <div style={{ fontSize: '10px', color: muted }}>{m.desc}</div>
                          </div>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${active ? cfg.accent : 'rgba(255,255,255,0.2)'}`, background: active ? cfg.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {active && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Section>
              </>
            )}

            {/* ══ PROJET ══ */}
            {activeMode === 'project' && (
              <>
                <Section title="Nom du projet" card={card} cardBorder={cardBorder} hint={hint}>
                  {editing
                    ? <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Le nom de ton projet"
                        style={{ width: '100%', padding: '9px 12px', background: surface, border: `1px solid ${cardBorder}`, borderRadius: '10px', color: text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
                    : <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>{projectName || <span style={{ color: hint, fontStyle: 'italic' }}>Non renseigné</span>}</div>}
                </Section>

                <Section title="Bio fondateur" card={card} cardBorder={cardBorder} hint={hint}>
                  {editing
                    ? <textarea value={projectBio} onChange={e => setProjectBio(e.target.value)} placeholder="Qui es-tu ? Pourquoi ce projet ?"
                        style={{ width: '100%', background: surface, border: `1px solid ${cardBorder}`, borderRadius: '10px', padding: '10px', color: text, fontSize: '12px', outline: 'none', resize: 'none', minHeight: '80px', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
                    : <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>{projectBio || <span style={{ color: hint, fontStyle: 'italic' }}>Non renseigné</span>}</div>}
                </Section>

                <Section title="Le projet" card={card} cardBorder={cardBorder} hint={hint}>
                  {editing
                    ? <textarea value={projectDesc} onChange={e => setProjectDesc(e.target.value)} placeholder="Le problème, la solution, la cible..."
                        style={{ width: '100%', background: surface, border: `1px solid ${cardBorder}`, borderRadius: '10px', padding: '10px', color: text, fontSize: '12px', outline: 'none', resize: 'none', minHeight: '80px', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
                    : <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>{projectDesc || <span style={{ color: hint, fontStyle: 'italic' }}>Non renseigné</span>}</div>}
                </Section>

                <Section title="Stade & Mode de travail" card={card} cardBorder={cardBorder} hint={hint}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '14px' }}>
                    {STAGES.map(s => (
                      <button key={s} onClick={() => editing && setProjectStage(s)}
                        style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${projectStage === s ? cfg.accent : cardBorder}`, background: projectStage === s ? cfg.accentBg : 'transparent', color: projectStage === s ? cfg.accentLight : muted, fontSize: '11px', fontWeight: projectStage === s ? '700' : '400', cursor: editing ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {WORK_MODES.map(m => (
                      <div key={m.id} onClick={() => editing && setProjectWorkMode(m.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '11px', border: `1px solid ${projectWorkMode === m.id ? cfg.accent : cardBorder}`, background: projectWorkMode === m.id ? cfg.accentBg : surface, cursor: editing ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                        <span>{m.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: projectWorkMode === m.id ? cfg.accentLight : text }}>{m.label}</span>
                          <span style={{ fontSize: '11px', color: muted, marginLeft: '6px' }}>{m.desc}</span>
                        </div>
                        {projectWorkMode === m.id && <div style={{ width: 16, height: 16, borderRadius: '50%', background: cfg.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>}
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Secteurs" card={card} cardBorder={cardBorder} hint={hint}>
                  <SearchSelector all={ALL_SECTORS} selected={projectSectors}
                    onAdd={(s: string) => setProjectSectors(p => [...p, s])}
                    onRemove={(s: string) => setProjectSectors(p => p.filter(x => x !== s))}
                    placeholder="GreenTech, SaaS, EdTech..."
                    popular={POPULAR_SECTORS.slice(0, 6)}
                    max={8} accent={cfg.accent} accentLight={cfg.accentLight}
                    card={card} cardBorder={cardBorder} surface={surface} text={text} muted={muted} hint={hint} />
                </Section>

                <Section title="Compétences recherchées" card={card} cardBorder={cardBorder} hint={hint}>
                  <SearchSelector all={ALL_SKILLS} selected={projectNeeds}
                    onAdd={(s: string) => setProjectNeeds(p => [...p, s])}
                    onRemove={(s: string) => setProjectNeeds(p => p.filter(x => x !== s))}
                    placeholder="Design, Back-end, Marketing..."
                    popular={['Back-end', 'Copywriting', 'Figma', 'Growth Hacking', 'Marketing', 'React', 'SEO', 'UI Design']}
                    max={10} accent={cfg.accent} accentLight={cfg.accentLight}
                    card={card} cardBorder={cardBorder} surface={surface} text={text} muted={muted} hint={hint} />
                </Section>

                <Section title="Rémunération" card={card} cardBorder={cardBorder} hint={hint}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: hint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Budget / mois</div>
                      {editing
                        ? <input value={projectBudget} onChange={e => setProjectBudget(e.target.value)} placeholder="500€/mois"
                            style={{ width: '100%', padding: '8px 10px', background: surface, border: `1px solid ${cardBorder}`, borderRadius: '10px', color: text, fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
                        : <div style={{ fontSize: '14px', fontWeight: '800', color: '#F97316' }}>{projectBudget || '—'}</div>}
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: hint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Equity</div>
                      {editing
                        ? <input value={projectEquity} onChange={e => setProjectEquity(e.target.value)} placeholder="1–5%"
                            style={{ width: '100%', padding: '8px 10px', background: surface, border: `1px solid ${cardBorder}`, borderRadius: '10px', color: text, fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
                        : <div style={{ fontSize: '14px', fontWeight: '800', color: '#4ADE80' }}>{projectEquity || '—'}</div>}
                    </div>
                  </div>
                </Section>

                <Section title="Types de collaboration" card={card} cardBorder={cardBorder} hint={hint}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {COLLAB_MODES.map(m => {
                      const active = projectCollabModes.includes(m.id)
                      return (
                        <div key={m.id} onClick={() => editing && setProjectCollabModes(p => p.includes(m.id) ? p.filter(x => x !== m.id) : [...p, m.id])}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px', borderRadius: '12px', border: `1.5px solid ${active ? cfg.accent : cardBorder}`, background: active ? cfg.accentBg : surface, cursor: editing ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                          <span style={{ fontSize: '18px' }}>{m.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: active ? cfg.accentLight : text }}>{m.label}</div>
                            <div style={{ fontSize: '10px', color: muted }}>{m.desc}</div>
                          </div>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${active ? cfg.accent : 'rgba(255,255,255,0.2)'}`, background: active ? cfg.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {active && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Section>

                <Section title="Liens" card={card} cardBorder={cardBorder} hint={hint}>
                  <LinksManager links={projectLinks} setLinks={setProjectLinks} editing={editing}
                    accent={cfg.accent} accentLight={cfg.accentLight} card={card} cardBorder={cardBorder} surface={surface} text={text} muted={muted} hint={hint} />
                </Section>
              </>
            )}

            {/* ══ INVESTISSEUR ══ */}
            {activeMode === 'investor' && (
              <>
                <Section title="Ma bio" card={card} cardBorder={cardBorder} hint={hint}>
                  {editing
                    ? <textarea value={investorBio} onChange={e => setInvestorBio(e.target.value)} placeholder="Ton parcours, tes valeurs..."
                        style={{ width: '100%', background: surface, border: `1px solid ${cardBorder}`, borderRadius: '10px', padding: '10px', color: text, fontSize: '12px', outline: 'none', resize: 'none', minHeight: '80px', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
                    : <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>{investorBio || <span style={{ color: hint, fontStyle: 'italic' }}>Non renseigné</span>}</div>}
                </Section>

                <Section title="Ma thèse d'investissement" card={card} cardBorder={cardBorder} hint={hint}>
                  {editing
                    ? <textarea value={investorThesis} onChange={e => setInvestorThesis(e.target.value)} placeholder="Quel type de projets ?"
                        style={{ width: '100%', background: surface, border: `1px solid ${cardBorder}`, borderRadius: '10px', padding: '10px', color: text, fontSize: '12px', outline: 'none', resize: 'none', minHeight: '80px', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
                    : <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>{investorThesis || <span style={{ color: hint, fontStyle: 'italic' }}>Non renseigné</span>}</div>}
                </Section>

                <Section title="Ticket d'investissement (€)" card={card} cardBorder={cardBorder} hint={hint}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: hint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Minimum</div>
                      {editing
                        ? <input value={investorTicketMin} onChange={e => setInvestorTicketMin(e.target.value)} placeholder="1 000"
                            style={{ width: '100%', padding: '8px 10px', background: surface, border: `1px solid ${cardBorder}`, borderRadius: '10px', color: text, fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
                        : <div style={{ fontSize: '16px', fontWeight: '800', color: '#4ADE80' }}>{investorTicketMin ? `${investorTicketMin}€` : '—'}</div>}
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: hint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Maximum</div>
                      {editing
                        ? <input value={investorTicketMax} onChange={e => setInvestorTicketMax(e.target.value)} placeholder="50 000"
                            style={{ width: '100%', padding: '8px 10px', background: surface, border: `1px solid ${cardBorder}`, borderRadius: '10px', color: text, fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
                        : <div style={{ fontSize: '16px', fontWeight: '800', color: '#4ADE80' }}>{investorTicketMax ? `${investorTicketMax}€` : '—'}</div>}
                    </div>
                  </div>
                </Section>

                <Section title="Secteurs d'investissement" card={card} cardBorder={cardBorder} hint={hint}>
                  <SearchSelector all={ALL_SECTORS} selected={investorSectors}
                    onAdd={(s: string) => setInvestorSectors(p => [...p, s])}
                    onRemove={(s: string) => setInvestorSectors(p => p.filter(x => x !== s))}
                    placeholder="GreenTech, FinTech..."
                    popular={POPULAR_SECTORS.slice(0, 6)}
                    max={8} accent={cfg.accent} accentLight={cfg.accentLight}
                    card={card} cardBorder={cardBorder} surface={surface} text={text} muted={muted} hint={hint} />
                </Section>

                <Section title="Stades préférés" card={card} cardBorder={cardBorder} hint={hint}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                    {STAGES.map(s => {
                      const active = investorStages.includes(s)
                      return (
                        <button key={s} onClick={() => editing && setInvestorStages(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
                          style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${active ? cfg.accent : cardBorder}`, background: active ? cfg.accentBg : 'transparent', color: active ? cfg.accentLight : muted, fontSize: '11px', fontWeight: active ? '700' : '400', cursor: editing ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                          {active ? '✓ ' : ''}{s}
                        </button>
                      )
                    })}
                  </div>
                </Section>

                <Section title="Portfolio" card={card} cardBorder={cardBorder} hint={hint}>
                  {editing && (
                    <button onClick={() => setInvestorPortfolio(p => [...p, { name: 'Nouveau projet', stage: 'Idée', amount: '0€' }])}
                      style={{ background: cfg.accentBg, border: `1px solid ${cfg.accent}30`, borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: cfg.accentLight, cursor: 'pointer', fontWeight: '600', marginBottom: '10px' }}>
                      + Ajouter
                    </button>
                  )}
                  {investorPortfolio.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: surface, borderRadius: '11px', marginBottom: '6px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: 'white', flexShrink: 0 }}>{p.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        {editing
                          ? <input value={p.name} onChange={e => setInvestorPortfolio(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                              style={{ background: 'transparent', border: 'none', color: text, fontSize: '12px', fontWeight: '600', outline: 'none', width: '100%', padding: 0, fontFamily: 'inherit' }} />
                          : <div style={{ fontSize: '12px', fontWeight: '600', color: text }}>{p.name}</div>}
                        <div style={{ display: 'flex', gap: '5px', marginTop: '3px' }}>
                          <span style={{ fontSize: '9px', fontWeight: '600', padding: '1px 7px', borderRadius: '20px', background: 'rgba(6,182,212,0.1)', color: '#22D3EE' }}>{p.stage}</span>
                          <span style={{ fontSize: '9px', fontWeight: '600', padding: '1px 7px', borderRadius: '20px', background: 'rgba(74,222,128,0.1)', color: '#4ADE80' }}>{p.amount}</span>
                        </div>
                      </div>
                      {editing && <button onClick={() => setInvestorPortfolio(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: '14px', opacity: 0.7 }}>×</button>}
                    </div>
                  ))}
                  {investorPortfolio.length === 0 && <div style={{ textAlign: 'center', padding: '12px', color: muted, fontSize: '11px' }}>Aucun investissement pour l'instant</div>}
                </Section>

                <Section title="Liens" card={card} cardBorder={cardBorder} hint={hint}>
                  <LinksManager links={investorLinks} setLinks={setInvestorLinks} editing={editing}
                    accent={cfg.accent} accentLight={cfg.accentLight} card={card} cardBorder={cardBorder} surface={surface} text={text} muted={muted} hint={hint} />
                </Section>
              </>
            )}

            <button onClick={async () => { await supabase.auth.signOut(); localStorage.clear(); window.location.href = '/' }}
              style={{ width: '100%', padding: '13px', background: 'transparent', border: `1px solid rgba(248,113,113,0.25)`, borderRadius: '14px', color: '#F87171', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '16px' }}>
              Se déconnecter
            </button>
          </>
        )}
      </div>

      {/* Bottom nav */}
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
                  {item.id === 'home' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9Z" stroke={muted} strokeWidth="1.5" /></svg>}
                  {item.id === 'chat' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={muted} strokeWidth="1.5" /></svg>}
                  {item.id === 'explorer' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={muted} strokeWidth="1.5" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" stroke={muted} strokeWidth="1.5" strokeLinejoin="round" /></svg>}
                  {item.id === 'profil' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={(item as any).active ? cfg.accentLight : muted} strokeWidth="1.5" /><path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" stroke={(item as any).active ? cfg.accentLight : muted} strokeWidth="1.5" strokeLinecap="round" /></svg>}
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