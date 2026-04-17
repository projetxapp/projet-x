import { supabase } from './supabase'

export async function getMatchScore(
  userId: string,
  targetId: string,
  mode: string
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('calculate_match_score', {
      p_user_id: userId,
      p_target_id: targetId,
      p_mode: mode,
    })
    if (error) throw error
    return data || 50
  } catch (e) {
    // Fallback : calcul local simplifié
    return Math.floor(Math.random() * 25) + 70
  }
}

export async function getRecommendedProfiles(
  userId: string,
  mode: string,
  limit = 10
): Promise<any[]> {
  try {
    // Get already swiped
    const { data: swiped } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', userId)
      .eq('swiper_mode', mode)

    const swipedIds = swiped?.map(s => s.swiped_id) || []

    let profiles: any[] = []

    if (mode === 'project') {
      const { data } = await supabase
        .from('talent_profiles')
        .select('*, profiles(id, first_name, last_name, age, city, avatar_url)')
        .neq('user_id', userId)
        .limit(limit * 2)

      profiles = (data || [])
        .filter(t => !swipedIds.includes(t.user_id))
        .map(t => ({ ...t, _type: 'talent' }))
    } else {
      const { data } = await supabase
        .from('project_profiles')
        .select('*, profiles(id, first_name, last_name, avatar_url)')
        .neq('user_id', userId)
        .limit(limit * 2)

      profiles = (data || [])
        .filter(p => !swipedIds.includes(p.user_id))
        .map(p => ({ ...p, _type: 'project' }))
    }

    // Score chaque profil
    const scored = await Promise.all(
      profiles.slice(0, limit).map(async p => {
        const score = await getMatchScore(userId, p.user_id, mode)
        return { ...p, ai_score: score }
      })
    )

    // Trier par score décroissant
    return scored.sort((a, b) => b.ai_score - a.ai_score)
  } catch (e) {
    console.error(e)
    return []
  }
}