import { CONTACT_EMAIL } from '@/constants/brand';

export type LegalSection = { title: string; body: string };

/** Taken from v1 (validated by the founder) and updated for v2's features. */
export const LEGAL_UPDATED_AT = '29 septembre 2026';

export const CGU: LegalSection[] = [
  {
    title: '1. Présentation',
    body: `Projet X est une plateforme de mise en relation entre talents, porteurs de projets et investisseurs. L'application est éditée par Hippolyte Devismes, domicilié en France. Contact : ${CONTACT_EMAIL}`,
  },
  {
    title: '2. Accès et inscription',
    body: "L'accès à Projet X nécessite la création d'un compte. Vous devez avoir au moins 16 ans pour vous inscrire. Vous êtes responsable de la confidentialité de vos identifiants de connexion. L'utilisation de Projet X est gratuite.",
  },
  {
    title: '3. Matchs, mises en relation et missions',
    body: "Une conversation s'ouvre uniquement en cas d'intérêt mutuel : deux likes réciproques (match) ou une demande de mise en relation acceptée. Le score de compatibilité est calculé à partir des informations de vos profils (compétences, besoins, secteurs, disponibilité, localisation) ; il est indicatif. Les missions proposées dans l'app engagent uniquement les utilisateurs concernés.",
  },
  {
    title: '4. Contenu et comportement',
    body: "Vous vous engagez à ne pas publier de contenu illicite, trompeur ou offensant, ni à harceler d'autres utilisateurs. Les photos de profil doivent vous représenter personnellement. Chaque utilisateur peut signaler ou bloquer un autre utilisateur ; les signalements sont examinés par l'équipe de modération, qui peut suspendre ou supprimer un compte ne respectant pas ces règles.",
  },
  {
    title: '5. Propriété intellectuelle',
    body: "Le design, le code et les fonctionnalités de Projet X sont la propriété exclusive de l'éditeur. Le contenu que vous publiez reste votre propriété, mais vous accordez à Projet X une licence d'affichage au sein de la plateforme.",
  },
  {
    title: '6. Limitation de responsabilité',
    body: "Projet X est une plateforme de mise en relation. Nous ne garantissons pas la réalisation des collaborations initiées via l'app. Nous ne sommes pas responsables du contenu publié par les utilisateurs.",
  },
  {
    title: '7. Suppression de compte',
    body: 'Vous pouvez supprimer votre compte à tout moment depuis Profil → Paramètres → Supprimer mon compte. La suppression est immédiate et définitive : profil, matchs, messages, photos et fichiers sont effacés.',
  },
  {
    title: '8. Modifications',
    body: `Projet X se réserve le droit de modifier les présentes CGU. Vous serez informé des changements importants par email. Dernière mise à jour : ${LEGAL_UPDATED_AT}.`,
  },
];

export const PRIVACY: LegalSection[] = [
  {
    title: '1. Responsable du traitement',
    body: `Hippolyte Devismes, éditeur de Projet X. Contact : ${CONTACT_EMAIL}`,
  },
  {
    title: '2. Données collectées',
    body: 'Compte : email, mot de passe (chiffré). Profil : prénom, nom, âge, département, école, photo, informations de vos profils Talent / Projet / Investisseur, liens. Usage : likes, matchs, messages et pièces jointes, missions, signalements et blocages, date de dernière activité. Appareil : jeton de notification push si vous les activez.',
  },
  {
    title: '3. Finalités',
    body: 'Vos données servent uniquement au fonctionnement de la plateforme : affichage de votre profil, calcul du score de compatibilité, messagerie, notifications, sécurité et modération. Elles ne sont jamais vendues à des tiers et ne servent à aucune publicité.',
  },
  {
    title: '4. Visibilité',
    body: "Votre profil (hors email) est visible par les autres utilisateurs, et votre page de profil public peut être partagée par lien. Vos messages et pièces jointes ne sont accessibles qu'aux deux membres de la conversation (fichiers privés, liens temporaires).",
  },
  {
    title: '5. Vos droits (RGPD)',
    body: `Vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression. Directement dans l'app : Paramètres → Exporter mes données (fichier JSON) et Paramètres → Supprimer mon compte. Pour toute autre demande : ${CONTACT_EMAIL}. Vous pouvez aussi saisir la CNIL (cnil.fr).`,
  },
  {
    title: '6. Durée de conservation',
    body: 'Vos données sont conservées tant que votre compte est actif. Elles sont effacées immédiatement lors de la suppression du compte.',
  },
  {
    title: '7. Hébergement et sous-traitants',
    body: 'Base de données, fichiers et authentification : Supabase (Union européenne, Irlande). Site web : Vercel. Emails transactionnels : Resend. Notifications push : Expo (Expo Push Service), Apple et Google. Ces prestataires sont conformes au RGPD.',
  },
  {
    title: '8. Cookies et stockage local',
    body: "Projet X utilise uniquement le stockage technique nécessaire au fonctionnement (session de connexion, préférences comme le thème). Aucun cookie publicitaire ni traceur tiers n'est utilisé.",
  },
];
