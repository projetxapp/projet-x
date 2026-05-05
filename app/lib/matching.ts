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
    console.error('Score error:', e)
    return 50
  }
}