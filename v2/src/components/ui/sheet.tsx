import { useEffect, type ReactNode } from 'react';
import { Modal, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/providers/theme-provider';

import { Text } from './text';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Max height as a fraction of the screen. */
  maxHeight?: number;
  accessibilityLabel?: string;
};

const SPRING = { duration: 320, dampingRatio: 0.85 } as const;

/** Bottom sheet: slides up, drag down or tap the backdrop to close. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  maxHeight = 0.88,
  accessibilityLabel,
}: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const translateY = useSharedValue(height);

  useEffect(() => {
    translateY.set(visible ? withSpring(0, SPRING) : withTiming(height, { duration: 200 }));
  }, [visible, height, translateY]);

  const close = () => {
    translateY.set(
      withTiming(height, { duration: 180 }, (finished) => {
        if (finished) scheduleOnRN(onClose);
      }),
    );
  };

  const pan = Gesture.Pan()
    .onChange((event) => {
      translateY.set(Math.max(0, translateY.get() + event.changeY));
    })
    .onEnd((event) => {
      if (translateY.get() > 120 || event.velocityY > 900) {
        translateY.set(
          withTiming(height, { duration: 180 }, (finished) => {
            if (finished) scheduleOnRN(onClose);
          }),
        );
      } else {
        translateY.set(withSpring(0, { ...SPRING, velocity: event.velocityY }));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, translateY.get() / height),
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[{ flex: 1, backgroundColor: palette.overlay }, backdropStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            style={{ flex: 1 }}
            onPress={close}
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel ?? title}
          className="absolute bottom-0 w-full self-center rounded-t-sheet border border-line/10 bg-card"
          style={[
            { maxHeight: height * maxHeight, paddingBottom: Math.max(insets.bottom, 16) },
            Platform.OS === 'web'
              ? { maxWidth: 560, alignSelf: 'center', left: 0, right: 0, marginHorizontal: 'auto' }
              : null,
            sheetStyle,
          ]}>
          <GestureDetector gesture={pan}>
            <View className="items-center pb-2 pt-3">
              <View className="h-1.5 w-11 rounded-full bg-line/20" />
              {title ? (
                <Text variant="subheading" className="mt-3 px-5 text-center">
                  {title}
                </Text>
              ) : null}
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
