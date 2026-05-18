import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cache 5 minutes pour éviter les appels répétés à chaque changement de page
const CACHE_DURATION = 5 * 60 * 1000

function getCache(key: string) {
  try {
    const raw = localStorage.getItem(`px_cache_${key}`)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_DURATION) {
      localStorage.removeItem(`px_cache_${key}`)
      return null
    }
    return data
  } catch { return null }
}

function setCache(key: string, data: any) {
  try {
    localStorage.setItem(`px_cache_${key}`, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

export function clearCache(userId: string) {
  try {
    ['profile', 'talent', 'project', 'investor', 'modes'].forEach(k => {
      localStorage.removeItem(`px_cache_${userId}_${k}`)
    })
  } catch {}
}

export async function getCachedProfile(userId: string) {
  const cached = getCache(`${userId}_profile`)
  if (cached) return cached
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (data) setCache(`${userId}_profile`, data)
  return data
}

export async function getCachedModes(userId: string) {
  const cached = getCache(`${userId}_modes`)
  if (cached) return cached
  const { data } = await supabase.from('user_modes').select('mode').eq('user_id', userId)
  if (data) setCache(`${userId}_modes`, data)
  return data
}

export async function getCachedTalent(userId: string) {
  const cached = getCache(`${userId}_talent`)
  if (cached) return cached
  const { data } = await supabase.from('talent_profiles').select('*').eq('user_id', userId).single()
  if (data) setCache(`${userId}_talent`, data)
  return data
}

export async function getCachedProject(userId: string) {
  const cached = getCache(`${userId}_project`)
  if (cached) return cached
  const { data } = await supabase.from('project_profiles').select('*').eq('user_id', userId).single()
  if (data) setCache(`${userId}_project`, data)
  return data
}

export async function getCachedInvestor(userId: string) {
  const cached = getCache(`${userId}_investor`)
  if (cached) return cached
  const { data } = await supabase.from('investor_profiles').select('*').eq('user_id', userId).single()
  if (data) setCache(`${userId}_investor`, data)
  return data
}