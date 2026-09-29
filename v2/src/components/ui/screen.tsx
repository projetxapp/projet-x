import type { ReactNode } from 'react';
import { Platform, ScrollView, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  className?: string;
  contentClassName?: string;
  scrollProps?: ScrollViewProps;
  /** Full-bleed layouts (landing) skip the centered column on large web screens. */
  wide?: boolean;
};

/**
 * Screen container: safe areas, themed background and, on large web screens, a centered
 * mobile-width column (the app is designed phone-first).
 */
export function Screen({
  children,
  scroll = false,
  edges = ['top'],
  className,
  contentClassName,
  scrollProps,
  wide = false,
}: Props) {
  const column = cn('w-full flex-1 self-center', !wide && Platform.OS === 'web' && 'max-w-[560px]');
  return (
    <SafeAreaView edges={edges} className={cn('flex-1 bg-bg', className)}>
      {scroll ? (
        <ScrollView
          className={column}
          contentContainerClassName={cn('pb-10', contentClassName)}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollProps}>
          {children}
        </ScrollView>
      ) : (
        <View className={cn(column, contentClassName)}>{children}</View>
      )}
    </SafeAreaView>
  );
}
