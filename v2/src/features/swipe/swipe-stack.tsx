import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/components/ui';
import { MODES } from '@/constants/modes';
import type { DeckCard, Mode, SwipeDirection } from '@/types/app';

import { ProfileCard } from './profile-card';

export type SwipeStackHandle = { swipe: (direction: SwipeDirection) => void };

type Props = {
  cards: DeckCard[];
  mode: Mode;
  width: number;
  height: number;
  onSwiped: (card: DeckCard, direction: SwipeDirection) => void;
  onOpen: (card: DeckCard) => void;
};

const SPRING = { duration: 380, dampingRatio: 0.8 } as const;
const VISIBLE = 3;

/** The top 3 cards of the queue; only the first one is draggable. */
export const SwipeStack = forwardRef<SwipeStackHandle, Props>(function SwipeStack(
  { cards, mode, width, height, onSwiped, onOpen },
  ref,
) {
  const visible = cards.slice(0, VISIBLE);
  return (
    <View style={{ width, height }}>
      {visible
        .map((card, position) => (
          <SwipeCard
            key={card.user_id}
            ref={position === 0 ? ref : undefined}
            card={card}
            position={position}
            mode={mode}
            width={width}
            height={height}
            onSwiped={onSwiped}
            onOpen={onOpen}
          />
        ))
        .reverse()}
    </View>
  );
});

type CardProps = Omit<Props, 'cards'> & { card: DeckCard; position: number };

const SwipeCard = forwardRef<SwipeStackHandle, CardProps>(function SwipeCard(
  { card, position, mode, width, height, onSwiped, onOpen },
  ref,
) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const depth = useSharedValue(position);
  const threshold = width * 0.28;
  const likeLabel = MODES[mode].likeLabel;

  // Cards move up the stack with a spring (the instance is kept: key = user id).
  useEffect(() => {
    depth.set(withSpring(position, SPRING));
  }, [depth, position]);

  const finish = (direction: SwipeDirection) => onSwiped(card, direction);
  const open = () => onOpen(card);

  const fling = (direction: SwipeDirection) => {
    'worklet';
    const toX = direction === 'like' ? width * 1.5 : direction === 'pass' ? -width * 1.5 : x.get();
    const toY = direction === 'super' ? -height * 1.4 : y.get() + 40;
    x.set(withTiming(toX, { duration: 260 }));
    y.set(
      withTiming(toY, { duration: 260 }, (finished) => {
        if (finished) scheduleOnRN(finish, direction);
      }),
    );
  };

  useImperativeHandle(ref, () => ({ swipe: (direction) => fling(direction) }));

  const pan = Gesture.Pan()
    .enabled(position === 0)
    .onChange((event) => {
      x.set(event.translationX);
      y.set(event.translationY);
    })
    .onEnd((event) => {
      const tx = x.get();
      const ty = y.get();
      if (tx > threshold || (event.velocityX > 900 && tx > 40)) fling('like');
      else if (tx < -threshold || (event.velocityX < -900 && tx < -40)) fling('pass');
      else if (ty < -threshold && Math.abs(tx) < width * 0.3) fling('super');
      else {
        x.set(withSpring(0, SPRING));
        y.set(withSpring(0, SPRING));
      }
    });
  const tap = Gesture.Tap()
    .enabled(position === 0)
    .onEnd(() => {
      scheduleOnRN(open);
    });
  const gesture = Gesture.Race(pan, tap);

  const cardStyle = useAnimatedStyle(() => {
    const d = depth.get();
    return {
      transform: [
        { translateX: x.get() },
        { translateY: y.get() + d * 12 },
        { rotate: `${interpolate(x.get(), [-width, 0, width], [-12, 0, 12])}deg` },
        { scale: 1 - d * 0.05 },
      ],
      opacity: d > VISIBLE - 1.5 ? 0.6 : 1,
    };
  });
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [16, threshold], [0, 1], Extrapolation.CLAMP),
  }));
  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [-16, -threshold], [0, 1], Extrapolation.CLAMP),
  }));
  const superStyle = useAnimatedStyle(() => ({
    opacity:
      Math.abs(x.get()) > width * 0.3
        ? 0
        : interpolate(y.get(), [-16, -threshold], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible={position === 0}
        accessibilityLabel={`Profil ${card.project_name || card.first_name || ''}, ${card.score} % compatible`}
        accessibilityHint="Glisse à droite pour liker, à gauche pour passer, vers le haut pour un super like"
        accessibilityActions={[
          { name: 'like', label: likeLabel.toLowerCase() },
          { name: 'pass', label: 'passer' },
          { name: 'super', label: 'super like' },
          { name: 'activate', label: 'voir le détail' },
        ]}
        onAccessibilityAction={(event) => {
          const name = event.nativeEvent.actionName;
          if (name === 'activate') open();
          else if (name === 'like' || name === 'pass' || name === 'super') fling(name);
        }}
        style={[
          { position: 'absolute', width, height, pointerEvents: position === 0 ? 'auto' : 'none' },
          cardStyle,
        ]}>
        <ProfileCard card={card} mode={mode} />
        <Stamp style={likeStyle} label={likeLabel} color="#4ADE80" side="left" />
        <Stamp style={passStyle} label="PASS" color="#F87171" side="right" />
        <Stamp style={superStyle} label="★ SUPER" color="#38BDF8" side="center" />
      </Animated.View>
    </GestureDetector>
  );
});

function Stamp({
  style,
  label,
  color,
  side,
}: {
  style: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
  label: string;
  color: string;
  side: 'left' | 'right' | 'center';
}) {
  const position =
    side === 'left'
      ? { top: 64, left: 22, transform: [{ rotate: '-14deg' }] }
      : side === 'right'
        ? { top: 64, right: 22, transform: [{ rotate: '14deg' }] }
        : { top: '38%' as const, alignSelf: 'center' as const, transform: [{ rotate: '-6deg' }] };
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          pointerEvents: 'none',
          borderWidth: 4,
          borderColor: color,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 4,
          backgroundColor: 'rgba(8,7,15,0.25)',
        },
        position,
        style,
      ]}>
      <Text className="text-[30px] font-black tracking-wide" style={{ color }}>
        {label}
      </Text>
    </Animated.View>
  );
}
