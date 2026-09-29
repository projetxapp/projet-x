import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react';
import type { ScrollView, ScrollViewProps } from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';

export type KeyboardScrollHandle = Pick<ScrollView, 'scrollTo'>;
type Props = ScrollViewProps & {
  children: ReactNode;
  contentContainerClassName?: string;
  className?: string;
};

/** ScrollView that keeps the focused input above the keyboard (native). */
export const KeyboardScroll = forwardRef<KeyboardScrollHandle, Props>(function KeyboardScroll(
  { children, ...props },
  ref,
) {
  const inner = useRef<KeyboardAwareScrollViewRef>(null);
  useImperativeHandle(
    ref,
    () => ({
      scrollTo: (...args: Parameters<ScrollView['scrollTo']>) => inner.current?.scrollTo(...args),
    }),
    [],
  );
  return (
    <KeyboardAwareScrollView
      ref={inner}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...props}>
      {children}
    </KeyboardAwareScrollView>
  );
});
