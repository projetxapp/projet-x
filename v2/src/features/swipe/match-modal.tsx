import { useEffect } from 'react';
import { Modal, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Text } from '@/components/ui';
import { BRAND_GRADIENT, MODES } from '@/constants/modes';
import type { DeckCard, Me, Mode } from '@/types/app';

import { cardTitle, targetKind } from './profile-card';

type Props = {
  match: { card: DeckCard; matchId: string } | null;
  me: Me | undefined;
  mode: Mode;
  onMessage: (matchId: string) => void;
  onClose: () => void;
};

const PIECES = 36;
const CONFETTI_COLORS = [
  '#6D28D9',
  '#A78BFA',
  '#0891B2',
  '#22D3EE',
  '#F59E0B',
  '#FCD34D',
  '#4ADE80',
  '#F97316',
];

/** "C'est un Match !" — both avatars, confetti, straight into the conversation. */
export function MatchModal({ match, me, mode, onMessage, onClose }: Props) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const pop = useSharedValue(0);
  const visible = match !== null;

  useEffect(() => {
    if (!visible) return;
    pop.set(0);
    pop.set(withSpring(1, { duration: 600, dampingRatio: 0.55 }));
    progress.set(0);
    if (!reduced) progress.set(withTiming(1, { duration: 2600, easing: Easing.linear }));
  }, [visible, reduced, pop, progress]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: pop.get(),
    transform: [{ scale: interpolate(pop.get(), [0, 1], [0.6, 1]) }],
  }));
  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(pop.get(), [0, 1], [-80, 14]) }, { rotate: '-8deg' }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(pop.get(), [0, 1], [80, -14]) }, { rotate: '8deg' }],
  }));

  if (!match) return null;
  const { card, matchId } = match;
  const kind = targetKind(mode);
  const name =
    kind === 'project' ? cardTitle(card, kind) : card.first_name || cardTitle(card, kind);
  const otherGradient = MODES[kind === 'project' ? 'project' : 'talent'].gradient;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1" style={{ backgroundColor: 'rgba(8,7,15,0.94)' }}>
        {!reduced ? <Confetti progress={progress} /> : null}
        <SafeAreaView className="flex-1 items-center justify-center gap-8 px-8">
          <Animated.View style={titleStyle} className="items-center gap-2">
            <Text
              className="text-center text-[38px] font-black leading-[42px] tracking-tightest text-white"
              accessibilityRole="header">
              C'est un Match !
            </Text>
            <Text className="text-center text-[16px] leading-[23px] text-white/80">
              Toi et {name}, vous vous êtes likés mutuellement. Lance la conversation 🔥
            </Text>
          </Animated.View>
          <View className="flex-row items-center">
            <Animated.View style={leftStyle}>
              <Avatar
                uri={me?.profile.avatar_url}
                firstName={me?.profile.first_name}
                lastName={me?.profile.last_name}
                size={116}
                gradient={MODES[mode].gradient}
                ring="#FFFFFF"
              />
            </Animated.View>
            <Animated.View style={rightStyle}>
              <Avatar
                uri={kind === 'project' ? (card.cover_url ?? card.avatar_url) : card.avatar_url}
                firstName={card.first_name}
                lastName={card.last_name}
                size={116}
                gradient={otherGradient}
                ring="#FFFFFF"
              />
            </Animated.View>
          </View>
          <View className="w-full max-w-[420px] gap-3">
            <Button
              testID="match-send-message"
              title="Envoyer un message"
              gradient={BRAND_GRADIENT}
              onPress={() => onMessage(matchId)}
            />
            <Button title="Continuer à swiper" variant="ghost" onPress={onClose} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Confetti({ progress }: { progress: SharedValue<number> }) {
  const { width, height } = useWindowDimensions();
  return (
    <View style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: PIECES }, (_, i) => (
        <Piece key={i} index={i} progress={progress} width={width} height={height} />
      ))}
    </View>
  );
}

/** Deterministic layout (golden-ratio spread): no randomness anywhere in the app. */
function Piece({
  index,
  progress,
  width,
  height,
}: {
  index: number;
  progress: SharedValue<number>;
  width: number;
  height: number;
}) {
  const spread = (index * 0.618034) % 1;
  const left = spread * width;
  const delay = ((index * 7) % 12) / 30; // 0 → 0.37 of the timeline
  const drift = ((index % 5) - 2) * 18;
  const size = 7 + (index % 4) * 2;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const spin = (index % 2 === 0 ? 1 : -1) * (360 + (index % 3) * 180);

  const style = useAnimatedStyle(() => {
    const t = Math.max(0, Math.min(1, (progress.get() - delay) / (1 - delay)));
    return {
      opacity: t === 0 || t === 1 ? 0 : 1,
      transform: [
        { translateX: left + drift * Math.sin(t * Math.PI * 2) },
        { translateY: -30 + t * (height + 60) },
        { rotate: `${t * spin}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size * 1.6,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
