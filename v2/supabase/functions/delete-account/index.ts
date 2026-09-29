// GDPR account deletion: removes the user's files from every bucket, then deletes the
// auth user — every table cascades from profiles (reports keep an anonymised trace).
import { corsHeaders, json } from '../_shared/http.ts';
import { deleteAuthUser, getUserFromJwt, listStorage, removeStorage } from '../_shared/supabase.ts';

const BUCKETS = ['avatars', 'project-covers', 'chat-attachments'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const user = await getUserFromJwt(jwt);
  if (!user) return json({ error: 'not_authenticated' }, 401);

  try {
    for (const bucket of BUCKETS) {
      await removeStorage(bucket, await listStorage(bucket, user.id));
    }
    await deleteAuthUser(user.id);
  } catch (error) {
    console.error(error);
    return json({ error: 'deletion_failed' }, 500);
  }
  return json({ deleted: true });
});
