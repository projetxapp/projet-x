import { Link, type Href } from 'expo-router';
import { forwardRef, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type View as ViewType } from 'react-native';

import { BRAND_GRADIENT } from '@/constants/modes';
import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/providers/theme-provider';

import { Gradient } from './gradient';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'lg' | 'md' | 'sm';

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  /** Navigates like a link (rendered as <a href> on web, works before hydration). */
  href?: Href;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  /** Gradient for the primary variant (defaults to the brand gradient). */
  gradient?: readonly [string, string];
  haptic?: boolean;
  className?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

// `outer` sizes the pressable, `inner` the filled surface (padding lives inside only).
const SIZES: Record<Size, { outer: string; inner: string; text: string }> = {
  lg: {
    outer: 'min-h-[54px] rounded-btn',
    inner: 'min-h-[54px] px-6 rounded-btn',
    text: 'text-[16px]',
  },
  md: {
    outer: 'min-h-[46px] rounded-field',
    inner: 'min-h-[46px] px-5 rounded-field',
    text: 'text-[15px]',
  },
  sm: {
    outer: 'min-h-[36px] rounded-xl',
    inner: 'min-h-[36px] px-3.5 rounded-xl',
    text: 'text-[13px]',
  },
};

export const Button = forwardRef<ViewType, ButtonProps>(function Button(
  {
    title,
    onPress,
    href,
    variant = 'primary',
    size = 'lg',
    loading = false,
    disabled = false,
    icon,
    iconRight,
    gradient = BRAND_GRADIENT,
    haptic = true,
    className,
    accessibilityLabel,
    accessibilityHint,
    testID,
  },
  ref,
) {
  const { palette } = useTheme();
  const inactive = disabled || loading;
  const sizes = SIZES[size];
  const textColor =
    variant === 'primary' || variant === 'danger'
      ? 'text-white'
      : variant === 'secondary'
        ? 'text-text'
        : 'text-muted';

  const content = (
    <View className="flex-row items-center justify-center gap-2">
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : palette.muted}
        />
      ) : (
        icon
      )}
      <Text className={cn('font-extrabold', sizes.text, textColor)} numberOfLines={1}>
        {title}
      </Text>
      {!loading && iconRight}
    </View>
  );

  const pressable = (
    <Pressable
      ref={ref}
      testID={testID}
      accessibilityRole={href ? 'link' : 'button'}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPressIn={href && haptic ? () => haptics.light() : undefined}
      onPress={
        href
          ? undefined
          : () => {
              if (haptic) haptics.light();
              onPress?.();
            }
      }
      className={cn(
        'overflow-hidden active:scale-[0.97]',
        sizes.outer,
        inactive && 'opacity-50',
        className,
      )}
      // Static style: <Link asChild> merges style objects, not style functions.
      style={
        variant === 'primary' && !inactive
          ? { boxShadow: `0px 8px 24px ${gradient[0]}55` }
          : undefined
      }>
      {variant === 'primary' ? (
        <Gradient
          colors={gradient}
          direction="horizontal"
          className={cn('flex-1 items-center justify-center', sizes.inner)}>
          {content}
        </Gradient>
      ) : (
        <View
          className={cn(
            'flex-1 items-center justify-center',
            sizes.inner,
            variant === 'secondary' && 'bg-surface',
            variant === 'outline' && 'border-[1.5px] border-line/15',
            variant === 'danger' && 'bg-danger',
          )}>
          {content}
        </View>
      )}
    </Pressable>
  );

  if (!href || inactive) return pressable;
  return (
    <Link href={href} asChild>
      {pressable}
    </Link>
  );
});

type IconButtonProps = {
  icon: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  className?: string;
  disabled?: boolean;
  testID?: string;
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 40,
  className,
  disabled,
  testID,
}: IconButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
      className={cn(
        'items-center justify-center rounded-full border border-line/10 bg-surface',
        disabled && 'opacity-40',
        className,
      )}
      style={({ pressed }) => ({
        width: size,
        height: size,
        transform: [{ scale: pressed ? 0.92 : 1 }],
      })}>
      {icon}
    </Pressable>
  );
}
