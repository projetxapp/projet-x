import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

export type KeyboardScrollHandle = Pick<ScrollView, 'scrollTo'>;
type Props = ScrollViewProps & {
  children: ReactNode;
  contentContainerClassName?: string;
  className?: string;
};

export const KeyboardScroll = forwardRef<KeyboardScrollHandle, Props>(function KeyboardScroll(
  { children, ...props },
  ref,
) {
  const inner = useRef<ScrollView>(null);
  useImperativeHandle(
    ref,
    () => ({
      scrollTo: (...args: Parameters<ScrollView['scrollTo']>) => inner.current?.scrollTo(...args),
    }),
    [],
  );
  return (
    <ScrollView
      ref={inner}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...props}>
      {children}
    </ScrollView>
  );
});
