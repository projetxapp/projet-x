import type { CollabMode, HoursPerWeek, LinkType, ProjectStage, WorkMode } from '@/types/app';

export const STATUTS: readonly string[] = [
  'Étudiant(e)',
  'Lycéen(ne)',
  'Alternant(e)',
  'Stagiaire',
  'Freelance',
  'Auto-entrepreneur',
  'Salarié(e)',
  'En reconversion',
  'Développeur(se)',
  'Designer',
  'Marketeur(se)',
  'Créateur(rice) de contenu',
  'Photographe',
  'Vidéaste',
  'Musicien(ne)',
  'Artiste',
  'Mannequin',
  'Chef de projet',
  'Product Manager',
  'Community Manager',
  'Graphiste',
  'Rédacteur(rice)',
  'Consultant(e)',
  'Coach',
  'Entrepreneur(e)',
  'Co-fondateur(rice)',
  'Fondateur(rice)',
  'CEO',
  'Investisseur(se)',
  'Business Angel',
  "En recherche d'opportunités",
];

export const DEFAULT_STATUT = {
  talent: 'Étudiant(e)',
  project: 'Fondateur(rice)',
  investor: 'Business Angel',
} as const;

export const HOURS: readonly { id: HoursPerWeek; emoji: string; label: string; desc: string }[] = [
  { id: 'flash', emoji: '⚡', label: '< 5h / semaine', desc: 'Missions courtes uniquement' },
  { id: 'light', emoji: '🌙', label: '5 – 10h / semaine', desc: 'Quelques heures en parallèle' },
  { id: 'medium', emoji: '🔆', label: '10 – 20h / semaine', desc: 'Engagement sérieux' },
  { id: 'heavy', emoji: '🔥', label: '20 – 35h / semaine', desc: 'Quasi temps plein' },
  { id: 'full', emoji: '💪', label: '35h+ / semaine', desc: 'Full time disponible' },
];

export const STAGES: readonly { id: ProjectStage; label: string; desc: string; color: string }[] = [
  { id: 'Idée', label: 'Idée', desc: 'Concept en cours de validation', color: '#F97316' },
  {
    id: 'Prototype',
    label: 'Prototype',
    desc: 'Premier MVP ou démo fonctionnelle',
    color: '#8B5CF6',
  },
  {
    id: 'Lancé',
    label: 'Lancé',
    desc: 'Produit live avec premiers utilisateurs',
    color: '#4ADE80',
  },
  { id: 'Croissance', label: 'Croissance', desc: 'Traction prouvée, on scale', color: '#06B6D4' },
  { id: 'Série A+', label: 'Série A+', desc: 'Levée institutionnelle réalisée', color: '#22D3EE' },
];

export const TICKETS: readonly {
  id: 'micro' | 'small' | 'medium' | 'large';
  label: string;
  desc: string;
  emoji: string;
  min: number;
  max: number;
}[] = [
  {
    id: 'micro',
    label: '< 5 000 €',
    desc: 'Love money · Pré-seed',
    emoji: '🌱',
    min: 0,
    max: 5000,
  },
  {
    id: 'small',
    label: '5 000 – 20 000 €',
    desc: 'Business Angel débutant',
    emoji: '💰',
    min: 5000,
    max: 20000,
  },
  {
    id: 'medium',
    label: '20 000 – 100 000 €',
    desc: 'Business Angel confirmé',
    emoji: '💎',
    min: 20000,
    max: 100000,
  },
  {
    id: 'large',
    label: '100 000 € +',
    desc: 'Lead investor · VC',
    emoji: '🏦',
    min: 100000,
    max: 0,
  },
];

export const COLLAB_MODES: readonly {
  id: CollabMode;
  emoji: string;
  label: string;
  desc: string;
}[] = [
  { id: 'Flash', emoji: '⚡', label: 'Mission Flash', desc: 'Une tâche précise, rémunérée.' },
  { id: 'Side', emoji: '🚀', label: 'Side Project', desc: 'Collaboration à temps partiel.' },
  { id: 'Equity', emoji: '💎', label: 'Co-fondateur / Equity', desc: 'Des parts du projet.' },
];

export const WORK_MODES: readonly { id: WorkMode; label: string; emoji: string; desc: string }[] = [
  { id: 'remote', label: 'Full Remote', emoji: '🌐', desc: 'Tout à distance' },
  { id: 'hybrid', label: 'Hybride', emoji: '🏙', desc: 'Remote + présentiel ponctuel' },
  { id: 'onsite', label: 'Présentiel', emoji: '📍', desc: 'Sur place principalement' },
];

export const LINK_TYPES: readonly {
  id: LinkType;
  label: string;
  icon: string;
  placeholder: string;
}[] = [
  { id: 'github', label: 'GitHub', icon: '💻', placeholder: 'github.com/monpseudo' },
  { id: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'instagram.com/monpseudo' },
  { id: 'youtube', label: 'YouTube', icon: '▶️', placeholder: 'youtube.com/@machaine' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: 'tiktok.com/@monpseudo' },
  { id: 'behance', label: 'Behance', icon: '🎨', placeholder: 'behance.net/monpseudo' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', placeholder: 'linkedin.com/in/monpseudo' },
  { id: 'pitch', label: 'Pitch Deck', icon: '📊', placeholder: 'docsend.com/monpitch' },
  { id: 'demo', label: 'Démo / App', icon: '🚀', placeholder: 'monapplication.com' },
  { id: 'site', label: 'Site web', icon: '🌐', placeholder: 'monsite.com' },
  { id: 'autre', label: 'Autre', icon: '🔗', placeholder: 'monlien.com' },
];

export const SCHOOLS_SUGGESTIONS: readonly string[] = [
  'ESSCA',
  'ESSEC',
  'HEC Paris',
  'ESCP',
  'EDHEC',
  'emlyon',
  'NEOMA',
  'SKEMA',
  'KEDGE',
  'Audencia',
  'IÉSEG',
  'ISG',
  'PSB',
  'INSEEC',
  'Grenoble EM',
  'TBS',
  'Sciences Po',
  'Epitech',
  '42',
  'Polytechnique',
];

export const EXPLORER_QUICK_TAGS: readonly string[] = [
  'React',
  'Figma',
  'Marketing',
  'FinTech',
  'IA Générative',
  'No-code',
  'Design',
  'Sales',
  'Python',
  'Vidéo',
];

export const FIRST_MESSAGE_SUGGESTIONS: readonly string[] = [
  "Salut ! Ton profil m'intéresse vraiment 🔥",
  'Tu serais dispo pour un call cette semaine ?',
  "J'aimerais en savoir plus sur ton projet !",
];
