import { Platform, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';

export type TextVariant =
  'display' | 'title' | 'heading' | 'subheading' | 'body' | 'label' | 'caption' | 'overline';

const VARIANTS: Record<TextVariant, string> = {
  display: 'text-[34px] leading-[38px] font-black tracking-tighter text-text',
  title: 'text-[26px] leading-[31px] font-black tracking-tight text-text',
  heading: 'text-[20px] leading-[25px] font-extrabold tracking-tight text-text',
  subheading: 'text-[16px] leading-[21px] font-bold text-text',
  body: 'text-[15px] leading-[22px] text-text',
  label: 'text-[13px] leading-[18px] font-semibold text-muted',
  caption: 'text-[12px] leading-[17px] text-muted',
  overline: 'text-[11px] leading-[14px] font-bold uppercase tracking-[1px] text-hint',
};

const HEADING_VARIANTS = new Set<TextVariant>(['display', 'title', 'heading']);

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  className?: string;
  /** Heading level for headers (web: <h2>, <h3>…; defaults to <h1>). */
  level?: 2 | 3 | 4;
};

export function Text({
  variant = 'body',
  className,
  accessibilityRole,
  level,
  ...props
}: TextProps) {
  const heading =
    level != null && Platform.OS === 'web' ? ({ 'aria-level': level } as object) : null;
  return (
    <RNText
      {...heading}
      accessibilityRole={
        accessibilityRole ?? (HEADING_VARIANTS.has(variant) || level != null ? 'header' : undefined)
      }
      maxFontSizeMultiplier={1.6}
      className={cn(VARIANTS[variant], className)}
      {...props}
    />
  );
}
