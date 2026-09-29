/** Formatting helpers (French). Pure functions — unit tested. */

/** "Bonjour Léa ☀️", "Bonsoir Léa 🌙"… (name optional). */
export function greeting(name?: string | null, date = new Date()): string {
  const h = date.getHours();
  const who = name?.trim() ? ` ${name.trim()}` : '';
  if (h >= 5 && h < 12) return `Bonjour${who} ☀️`;
  if (h >= 12 && h < 18) return `Bon après-midi${who} 👋`;
  if (h >= 18 && h < 23) return `Bonsoir${who} 🌙`;
  return `Encore debout${who ? `,${who}` : ''} ? 🦉`;
}

export function fullName(first?: string | null, last?: string | null): string {
  return (
    [first, last]
      .map((s) => s?.trim())
      .filter(Boolean)
      .join(' ') || 'Profil Projet X'
  );
}

export function initials(first?: string | null, last?: string | null): string {
  const letters = [first, last].map((s) => s?.trim()?.[0]?.toUpperCase()).filter(Boolean);
  return letters.join('') || '✦';
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "à l'instant", "il y a 5 min", "il y a 2 h", "hier", "il y a 3 j", "12/05". */
export function relativeTime(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE) return "à l'instant";
  if (diff < HOUR) return `il y a ${Math.floor(diff / MINUTE)} min`;
  if (diff < DAY && date.getDate() === now.getDate()) return `il y a ${Math.floor(diff / HOUR)} h`;
  const yesterday = new Date(now.getTime() - DAY);
  if (date.toDateString() === yesterday.toDateString()) return 'hier';
  if (diff < 7 * DAY) return `il y a ${Math.max(1, Math.round(diff / DAY))} j`;
  return shortDate(date, now);
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function shortDate(date: Date, now: Date): string {
  const base = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
  return date.getFullYear() === now.getFullYear() ? base : `${base}/${date.getFullYear()}`;
}

/** Conversation list timestamp: "14:32", "Hier", "lun.", "12/05". */
export function chatTime(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (date.toDateString() === now.toDateString())
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const yesterday = new Date(now.getTime() - DAY);
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  if (now.getTime() - date.getTime() < 7 * DAY) {
    return (
      ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'][date.getDay()] ??
      shortDate(date, now)
    );
  }
  return shortDate(date, now);
}

export function timeOfDay(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Day separator in a conversation: "Aujourd'hui", "Hier", "lundi 12 mai". */
export function dayLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (date.toDateString() === now.toDateString()) return "Aujourd'hui";
  const yesterday = new Date(now.getTime() - DAY);
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const months = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];
  const label = `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? label : `${label} ${date.getFullYear()}`;
}

/** "Actif·ve maintenant" / "aujourd'hui" / "cette semaine", else null. */
export function activityLabel(iso: string | null | undefined, now = new Date()): string | null {
  if (!iso) return null;
  const diff = now.getTime() - new Date(iso).getTime();
  if (diff < 10 * MINUTE) return 'En ligne';
  if (diff < DAY) return "Actif·ve aujourd'hui";
  if (diff < 7 * DAY) return 'Actif·ve cette semaine';
  return null;
}

export function formatEuros(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} €`;
}

export function ticketLabel(min: number, max: number): string | null {
  if (!min && !max) return null;
  if (min && max) return `${formatEuros(min)} – ${formatEuros(max)}`;
  if (max) return `jusqu'à ${formatEuros(max)}`;
  return `${formatEuros(min)} et +`;
}

/** Links typed without scheme ("github.com/moi") become openable URLs. */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** "1,2 Mo", "340 Ko". */
export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}
