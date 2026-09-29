/**
 * Human, French error messages. Server exceptions raise a stable key as `message`
 * (e.g. `rate_limited`) and often a French `hint` meant for the user.
 */
type ErrorLike = {
  message?: unknown;
  code?: unknown;
  hint?: unknown;
  status?: unknown;
  name?: unknown;
};

const BY_KEY: Record<string, string> = {
  rate_limited: 'Doucement ! Tu vas un peu vite, réessaie dans un instant.',
  not_authenticated: 'Ta session a expiré, reconnecte-toi.',
  forbidden: "Tu n'as pas accès à ce contenu.",
  blocked: "Impossible d'interagir avec cette personne.",
  mode_not_active: 'Active ce mode dans ton profil avant de continuer.',
  invalid_mode: 'Ce mode est inconnu.',
  invalid_target: "Ce profil n'est plus disponible.",
  cannot_swipe_self: 'Tu ne peux pas te swiper toi-même 😄',
  cannot_undo_match: 'Ce swipe a déjà créé un match : impossible de revenir en arrière.',
  undo_expired: "Tu ne peux annuler qu'un swipe récent.",
  empty_message: "Écris quelque chose avant d'envoyer 🙂",
  message_too_long: 'Ton message est trop long (4 000 caractères max).',
  invalid_attachment: "Cette pièce jointe n'a pas pu être envoyée.",
  match_not_found: "Cette conversation n'existe plus.",
  not_a_member: "Cette conversation n'est pas accessible.",
  invalid_transition: 'Cette mission a déjà été mise à jour.',
  invalid_title: "Donne un titre d'au moins 3 caractères.",
  user_not_found: "Ce profil n'existe plus.",
  request_not_found: "Cette demande n'existe plus.",
  invalid_reason: 'Choisis une raison.',
  invalid_token: "La notification n'a pas pu être activée.",
};

const AUTH_PATTERNS: [RegExp, string][] = [
  [/invalid login credentials/i, 'Email ou mot de passe incorrect.'],
  [
    /email not confirmed/i,
    'Confirme ton email avant de te connecter (pense à vérifier tes spams).',
  ],
  [
    /already (been )?registered|user_already_exists/i,
    'Un compte existe déjà avec cet email. Connecte-toi !',
  ],
  [
    /password should be at least|weak_password/i,
    'Ton mot de passe doit faire au moins 8 caractères, avec des lettres et des chiffres.',
  ],
  [
    /same_password|should be different from the old/i,
    "Choisis un mot de passe différent de l'ancien.",
  ],
  [
    /rate limit|over_email_send_rate_limit|too many requests/i,
    'Trop de tentatives. Réessaie dans quelques minutes.',
  ],
  [/email_address_invalid|unable to validate email|invalid email/i, 'Adresse email invalide.'],
  [
    /otp_expired|expired|invalid.*(link|token)|token has expired/i,
    'Ce lien a expiré ou a déjà été utilisé. Demande-en un nouveau.',
  ],
  [
    /failed to fetch|network request failed|networkerror|load failed/i,
    'Pas de connexion internet. Vérifie ton réseau et réessaie.',
  ],
  [/jwt expired|refresh token/i, 'Ta session a expiré, reconnecte-toi.'],
  [/payload too large|exceeded the maximum allowed size/i, 'Fichier trop lourd (20 Mo max).'],
  [/mime type|invalid_mime_type/i, "Ce type de fichier n'est pas accepté."],
];

function asErrorLike(error: unknown): ErrorLike {
  return typeof error === 'object' && error !== null
    ? (error as ErrorLike)
    : { message: String(error) };
}

export function humanError(
  error: unknown,
  fallback = 'Oups, quelque chose a coincé. Réessaie dans un instant.',
): string {
  if (!error) return fallback;
  const e = asErrorLike(error);
  const message = typeof e.message === 'string' ? e.message : '';
  const hint = typeof e.hint === 'string' ? e.hint : '';
  const code = typeof e.code === 'string' ? e.code : '';

  // Our own exceptions (stable key in `message`) may carry a French hint written for the user.
  if (BY_KEY[message])
    return hint && !/^(grant|perhaps|try|check)\b/i.test(hint) ? hint : BY_KEY[message];
  if (BY_KEY[code]) return BY_KEY[code];
  for (const [pattern, text] of AUTH_PATTERNS) {
    if (pattern.test(message) || pattern.test(code)) return text;
  }
  if (code === '42501') return "Tu n'as pas les droits pour faire ça.";
  return fallback;
}

export function isAuthError(error: unknown): boolean {
  const e = asErrorLike(error);
  const message = typeof e.message === 'string' ? e.message : '';
  return (
    e.status === 401 ||
    e.code === '28000' ||
    message === 'not_authenticated' ||
    /jwt expired/i.test(message)
  );
}
