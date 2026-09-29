import { Link } from 'expo-router';
import { Apple, Play } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Button, Gradient, Logo, Text } from '@/components/ui';
import { CONTACT_EMAIL } from '@/constants/brand';
import { MODE_ORDER, MODES } from '@/constants/modes';

import { SwipePreview } from './swipe-preview';

const PROFILES = {
  talent: {
    title: 'Talents',
    text: 'Décroche des missions rémunérées, rejoins des side projects ou deviens co-fondateur·rice avec de l’equity.',
    bullets: [
      'Missions Flash payées',
      'Projets qui matchent tes compétences',
      'Portfolio mis en avant',
    ],
  },
  project: {
    title: 'Porteurs de projet',
    text: 'Trouve les talents qui font avancer ton projet — dev, design, marketing, vidéo — et tes premiers investisseurs.',
    bullets: [
      'Talents triés par compatibilité',
      'Propose des missions dans le chat',
      'Visibilité auprès des investisseurs',
    ],
  },
  investor: {
    title: 'Investisseurs',
    text: 'Repère tôt les petits projets à fort potentiel, filtrés selon ta thèse, tes secteurs et ton ticket.',
    bullets: [
      'Deal flow étudiant exclusif',
      'Score selon ta thèse',
      'Contact direct avec les fondateurs',
    ],
  },
} as const;

const STEPS = [
  {
    emoji: '✍️',
    title: 'Crée ton profil',
    text: 'Talent, projet, investisseur — ou les trois. 2 minutes, gratuit.',
  },
  {
    emoji: '🔥',
    title: 'Swipe',
    text: 'Des profils classés par un vrai score de compatibilité, avec les raisons du match.',
  },
  {
    emoji: '🤝',
    title: 'Matche & collabore',
    text: 'Discute en temps réel, propose une mission, lance ton projet.',
  },
];

/**
 * Marketing page (web only). It must work without JavaScript: the exported HTML is
 * served as-is (see scripts/static-landing.mjs), so layout is responsive CSS (`lg:`),
 * navigation is plain links and the demo animation is CSS.
 */
export function LandingScreen() {
  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="items-center">
      <View className="w-full max-w-[1120px] flex-row items-center justify-between px-5 py-5">
        <Logo />
        <View className="flex-row items-center gap-2">
          <Link href="/login" className="px-3 py-2 text-[14px] font-semibold text-muted">
            Se connecter
          </Link>
          <View className="hidden lg:flex">
            <Button title="Créer mon profil" size="sm" href="/signup" />
          </View>
        </View>
      </View>

      <View className="w-full max-w-[1120px] items-center gap-12 px-5 pb-16 pt-6 lg:flex-row">
        <View className="w-full gap-5 lg:w-auto lg:flex-1">
          <View className="self-start rounded-full border border-talent/30 bg-talent/10 px-3 py-1.5">
            <Text className="text-[12px] font-bold text-talent-fg">
              ✦ 100 % gratuit · Né à l'ESSCA
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            className="text-[42px] font-black leading-[46px] tracking-tightest text-text lg:text-[60px] lg:leading-[64px]">
            Le Tinder de{'\n'}l'entrepreneuriat.
          </Text>
          <Text className="text-[17px] leading-[26px] text-muted lg:text-[19px] lg:leading-[29px]">
            Talents, porteurs de projet et investisseurs se trouvent en un swipe. Un vrai score de
            compatibilité, un chat en temps réel, des missions payées. Ton prochain projet commence
            ici.
          </Text>
          <View className="gap-3 lg:flex-row">
            <Button
              testID="landing-cta"
              title="Créer mon profil gratuitement"
              href="/signup"
              className="lg:min-w-[300px]"
            />
            <Button title="J'ai déjà un compte" variant="outline" href="/login" />
          </View>
          <View className="flex-row gap-2.5">
            <StoreBadge label="App Store" sub="Bientôt sur" icon="apple" />
            <StoreBadge label="Google Play" sub="Bientôt sur" icon="play" />
          </View>
        </View>
        <View className="items-center">
          <SwipePreview />
        </View>
      </View>

      <View className="w-full max-w-[1120px] gap-6 px-5 pb-16">
        <Text variant="overline" className="text-center">
          Pour qui ?
        </Text>
        <Text level={2} className="text-center text-[32px] font-black tracking-tight text-text">
          Trois profils, un seul objectif : faire décoller des projets.
        </Text>
        <View className="gap-4 lg:flex-row">
          {MODE_ORDER.map((mode) => {
            const cfg = MODES[mode];
            const p = PROFILES[mode];
            return (
              <View
                key={mode}
                className="gap-3 rounded-card border p-6 lg:flex-1"
                style={{ borderColor: `${cfg.color}55`, backgroundColor: `${cfg.color}10` }}>
                <Gradient
                  colors={cfg.gradient}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text className="text-[24px]">{cfg.emoji}</Text>
                </Gradient>
                <Text level={3} className={`text-[22px] font-black ${cfg.cls.text}`}>
                  {p.title}
                </Text>
                <Text variant="body" className="text-muted">
                  {p.text}
                </Text>
                <View className="gap-1.5">
                  {p.bullets.map((b) => (
                    <Text key={b} className="text-[14px] text-text">
                      ✓ {b}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className="w-full max-w-[1120px] gap-6 px-5 pb-16">
        <Text
          level={2}
          className="text-center text-[13px] font-bold uppercase tracking-[1.5px] text-hint">
          Comment ça marche
        </Text>
        <View className="gap-4 lg:flex-row">
          {STEPS.map((step, i) => (
            <View
              key={step.title}
              className="gap-2 rounded-card border border-line/10 bg-card p-6 lg:flex-1">
              <Text className="text-[13px] font-black text-talent-fg">0{i + 1}</Text>
              <Text className="text-[30px]">{step.emoji}</Text>
              <Text variant="heading" level={3}>
                {step.title}
              </Text>
              <Text variant="body" className="text-muted">
                {step.text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="w-full max-w-[1120px] px-5 pb-16">
        <Gradient className="items-center gap-4 rounded-sheet p-7 lg:p-12">
          <Text level={2} className="text-center text-[30px] font-black tracking-tight text-white">
            Prêt·e à matcher ?
          </Text>
          <Text className="max-w-[520px] text-center text-[16px] leading-[24px] text-white/90">
            Crée ton profil en 2 minutes et découvre les talents, projets et investisseurs faits
            pour toi.
          </Text>
          <Link
            href="/signup"
            className="rounded-btn bg-white px-7 py-4 text-[16px] font-extrabold text-[#5B21B6] active:scale-[0.97]">
            Créer mon profil gratuitement →
          </Link>
        </Gradient>
      </View>

      <View className="w-full border-t border-line/10">
        <View className="w-full max-w-[1120px] gap-4 self-center px-5 py-8 lg:flex-row lg:items-center lg:justify-between">
          <Logo size={24} />
          <View className="flex-row flex-wrap gap-5">
            <Link href="/cgu" className="text-[13px] text-muted">
              CGU
            </Link>
            <Link href="/confidentialite" className="text-[13px] text-muted">
              Confidentialité
            </Link>
            <Link href={`mailto:${CONTACT_EMAIL}`} className="text-[13px] text-muted">
              Contact
            </Link>
          </View>
          <Text variant="caption">
            © {new Date().getFullYear()} Projet X · Made with ❤️ in France
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function StoreBadge({ label, sub, icon }: { label: string; sub: string; icon: 'apple' | 'play' }) {
  const Icon = icon === 'apple' ? Apple : Play;
  return (
    <View
      accessibilityLabel={`${sub} ${label}`}
      className="flex-row items-center gap-2 rounded-xl border border-line/15 bg-surface px-3.5 py-2 text-text">
      {/* currentColor follows the CSS theme even before (or without) hydration. */}
      <Icon size={18} color="currentColor" />
      <View>
        <Text className="text-[10px] uppercase text-muted">{sub}</Text>
        <Text className="text-[14px] font-bold text-text">{label}</Text>
      </View>
    </View>
  );
}
