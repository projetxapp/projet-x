'use client'

export default function CGUPage() {
  const bg = '#08070F'
  const card = '#111019'
  const cardBorder = 'rgba(255,255,255,0.07)'
  const text = '#F0EEFF'
  const muted = 'rgba(255,255,255,0.5)'
  const accent = '#A78BFA'

  return (
    <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden' }}>
      <div style={{ padding: '44px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, borderBottom: `1px solid ${cardBorder}` }}>
        <button onClick={() => window.history.back()}
          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div style={{ fontSize: '18px', fontWeight: '800', color: text }}>CGU & Confidentialité</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {[
          {
            title: '1. Présentation',
            content: `Projet X est une plateforme de mise en relation entre talents, porteurs de projets et investisseurs. L'application est éditée par Hippolyte Devismes, domicilié en France. Contact : hello.projetx@gmail.com`
          },
          {
            title: '2. Accès et inscription',
            content: `L'accès à Projet X nécessite la création d'un compte. Vous devez avoir au moins 16 ans pour vous inscrire. Vous êtes responsable de la confidentialité de vos identifiants de connexion.`
          },
          {
            title: '3. Données personnelles (RGPD)',
            content: `Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Les données collectées (nom, email, compétences, localisation) sont utilisées uniquement pour le fonctionnement de la plateforme. Elles ne sont jamais vendues à des tiers. Pour exercer vos droits, contactez : hello.projetx@gmail.com`
          },
          {
            title: '4. Contenu et comportement',
            content: `Vous vous engagez à ne pas publier de contenu illicite, trompeur ou offensant. Projet X se réserve le droit de supprimer tout compte ne respectant pas ces règles. Les photos de profil doivent vous représenter personnellement.`
          },
          {
            title: '5. Propriété intellectuelle',
            content: `Le design, le code et les fonctionnalités de Projet X sont la propriété exclusive de l'éditeur. Le contenu que vous publiez reste votre propriété, mais vous accordez à Projet X une licence d'affichage au sein de la plateforme.`
          },
          {
            title: '6. Limitation de responsabilité',
            content: `Projet X est une plateforme de mise en relation. Nous ne garantissons pas la réalisation des collaborations initiées via l'app. Nous ne sommes pas responsables du contenu publié par les utilisateurs.`
          },
          {
            title: '7. Suppression de compte',
            content: `Vous pouvez supprimer votre compte à tout moment depuis Profil → Paramètres → Supprimer mon compte. La suppression entraîne l'effacement définitif de toutes vos données dans un délai de 30 jours.`
          },
          {
            title: '8. Cookies',
            content: `Projet X utilise uniquement des cookies techniques nécessaires au fonctionnement de l'application (authentification, préférences). Aucun cookie publicitaire n'est utilisé.`
          },
          {
            title: '9. Hébergement',
            content: `L'application est hébergée sur Vercel (San Francisco, CA, USA) et Supabase (West EU, Ireland). Ces prestataires sont conformes au RGPD.`
          },
          {
            title: '10. Modifications',
            content: `Projet X se réserve le droit de modifier les présentes CGU. Vous serez informé des changements importants par email. La date de dernière mise à jour est le 5 Mai 2026.`
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: '20px', background: card, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: accent, marginBottom: '8px' }}>{section.title}</div>
            <div style={{ fontSize: '13px', color: muted, lineHeight: 1.7 }}>{section.content}</div>
          </div>
        ))}

        <div style={{ background: 'rgba(109,40,217,0.08)', border: '1px solid rgba(109,40,217,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: muted }}>Contact : <span style={{ color: accent }}>hello.projetx@gmail.com</span></div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '6px' }}>Dernière mise à jour : 5 Mai 2026</div>
        </div>
      </div>
    </div>
  )
}