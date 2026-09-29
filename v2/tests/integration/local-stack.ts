// Reads the local Supabase stack credentials (`supabase status`), for integration tests.
import { execSync } from 'node:child_process';

export type LocalStack = {
  apiUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  dbUrl: string;
  mailpitUrl: string;
};

export function localStack(): LocalStack {
  const raw = execSync('npx supabase status -o json', {
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString();
  const status = JSON.parse(raw.slice(raw.indexOf('{'))) as Record<string, string>;
  return {
    apiUrl: status.API_URL!,
    anonKey: status.ANON_KEY!,
    serviceRoleKey: status.SERVICE_ROLE_KEY!,
    dbUrl: status.DB_URL!,
    mailpitUrl: status.MAILPIT_URL ?? status.INBUCKET_URL ?? 'http://127.0.0.1:54324',
  };
}
