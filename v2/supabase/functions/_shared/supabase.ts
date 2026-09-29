// Minimal REST client for the Supabase APIs (no npm dependency → instant cold start).
import { env } from './http.ts';

const SUPABASE_URL = () => env('SUPABASE_URL').replace(/\/$/, '');
const SERVICE_KEY = () => env('SUPABASE_SERVICE_ROLE_KEY');

function serviceHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SERVICE_KEY(),
    Authorization: `Bearer ${SERVICE_KEY()}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function check(res: Response, what: string): Promise<Response> {
  if (!res.ok) throw new Error(`${what} failed: HTTP ${res.status} ${await res.text()}`);
  return res;
}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL()}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: serviceHeaders(),
    body: JSON.stringify(args),
  });
  await check(res, `rpc ${fn}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export type AuthUser = { id: string; email?: string };

export async function getUserFromJwt(jwt: string): Promise<AuthUser | null> {
  if (!jwt) return null;
  const res = await fetch(`${SUPABASE_URL()}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY(), Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as AuthUser;
}

export async function deleteAuthUser(userId: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL()}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: serviceHeaders(),
  });
  await check(res, 'delete auth user');
}

type StorageEntry = { name: string; id: string | null };

export async function listStorage(bucket: string, prefix: string): Promise<string[]> {
  const files: string[] = [];
  const folders = [prefix];
  while (folders.length > 0) {
    const folder = folders.pop()!;
    for (let offset = 0; ; offset += 100) {
      const res = await fetch(`${SUPABASE_URL()}/storage/v1/object/list/${bucket}`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify({ prefix: folder, limit: 100, offset }),
      });
      await check(res, `list ${bucket}/${folder}`);
      const entries = (await res.json()) as StorageEntry[];
      for (const entry of entries) {
        const path = `${folder}/${entry.name}`;
        if (entry.id === null) folders.push(path);
        else files.push(path);
      }
      if (entries.length < 100) break;
    }
  }
  return files;
}

export async function removeStorage(bucket: string, paths: string[]): Promise<void> {
  for (let i = 0; i < paths.length; i += 100) {
    const res = await fetch(`${SUPABASE_URL()}/storage/v1/object/${bucket}`, {
      method: 'DELETE',
      headers: serviceHeaders(),
      body: JSON.stringify({ prefixes: paths.slice(i, i + 100) }),
    });
    await check(res, `remove from ${bucket}`);
  }
}
