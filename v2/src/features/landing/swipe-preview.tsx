import { View } from 'react-native';

import { Gradient, Text } from '@/components/ui';
import { MODES } from '@/constants/modes';

const CARDS = [
  {
    name: 'EcoTrack',
    sub: 'GreenTech · Prototype',
    emoji: '🌱',
    mode: 'project' as const,
    score: 92,
    tags: ['React Native', 'Figma'],
    reason: '2 compétences recherchées',
  },
  {
    name: 'Léa, 21',
    sub: 'Designer UI/UX · ESSCA',
    emoji: '🎨',
    mode: 'talent' as const,
    score: 88,
    tags: ['Figma', 'Branding'],
    reason: 'Même département (49)',
  },
];

function PreviewCard({ card }: { card: (typeof CARDS)[number] }) {
  const cfg = MODES[card.mode];
  return (
    <View className="flex-1 overflow-hidden rounded-[26px] border border-line/10 bg-card">
      <Gradient
        colors={cfg.gradient}
        style={{ height: '55%', alignItems: 'center', justifyContent: 'center' }}>
        <Text className="text-[64px]">{card.emoji}</Text>
        <View className="absolute right-3 top-3 rounded-full bg-black/35 px-3 py-1.5">
          <Text className="text-[13px] font-black text-white">{card.score}%</Text>
        </View>
      </Gradient>
      <View className="flex-1 gap-2 p-4">
        <Text className="text-[20px] font-black tracking-tight text-text">{card.name}</Text>
        <Text variant="caption">{card.sub}</Text>
        <View className="flex-row flex-wrap gap-1.5">
          {card.tags.map((t) => (
            <View
              key={t}
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: `${cfg.color}26` }}>
              <Text className="text-[11px] font-semibold" style={{ color: cfg.light }}>
                {t}
              </Text>
            </View>
          ))}
        </View>
        <Text className="text-[12px] font-semibold text-success">✓ {card.reason}</Text>
      </View>
    </View>
  );
}

/**
 * Looping swipe demo for the landing page. Pure CSS animation (`px-swipe-*` keyframes in
 * +html.tsx) so it runs on the JavaScript-free landing and respects "reduce motion".
 */
export function SwipePreview() {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Démo : on swipe à droite pour rejoindre un projet"
      style={{ width: 280, height: 420 }}>
      <View
        className="px-swipe-back"
        style={{
          position: 'absolute',
          inset: 0,
          transform: [{ scale: 0.94 }, { translateY: 14 }],
        }}>
        <PreviewCard card={CARDS[1]!} />
      </View>
      <View className="px-swipe-top" style={{ position: 'absolute', inset: 0 }}>
        <PreviewCard card={CARDS[0]!} />
        <View
          className="px-swipe-stamp"
          style={{
            position: 'absolute',
            top: 28,
            left: 18,
            opacity: 0,
            transform: [{ rotate: '-14deg' }],
            borderWidth: 3,
            borderColor: '#4ADE80',
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}>
          <Text className="text-[22px] font-black tracking-wide text-success">REJOINDRE</Text>
        </View>
      </View>
    </View>
  );
}
