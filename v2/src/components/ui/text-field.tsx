import { Eye, EyeOff } from 'lucide-react-native';
import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import { useTheme } from '@/providers/theme-provider';

import { Text } from './text';

export type TextFieldProps = TextInputProps & {
  label?: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  left?: ReactNode;
  right?: ReactNode;
  /** Accent color of the focus ring (defaults to the brand violet). */
  accent?: string;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
};

/**
 * Declared at module scope (never inside a parent component): v1 re-created its inputs on
 * every render, which dropped the keyboard focus after each keystroke.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    optional,
    error,
    hint,
    left,
    right,
    accent = '#6D28D9',
    className,
    inputClassName,
    secureTextEntry,
    multiline,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const { palette } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View className={cn('gap-2', className)}>
      {label ? (
        <View className="flex-row items-center gap-1.5">
          <Text variant="overline">{label}</Text>
          {optional ? <Text className="text-[11px] text-hint">(optionnel)</Text> : null}
        </View>
      ) : null}
      <View
        className={cn(
          'flex-row items-center rounded-field border-[1.5px] bg-surface px-3.5',
          error ? 'border-danger' : focused ? '' : 'border-line/10',
          multiline ? 'min-h-[110px] items-start py-3' : 'min-h-[52px]',
        )}
        style={focused && !error ? { borderColor: accent } : undefined}>
        {left ? <View className="mr-2.5">{left}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={palette.hint}
          selectionColor={accent}
          secureTextEntry={hidden}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={props.accessibilityLabel ?? label}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className={cn(
            'flex-1 text-[16px] text-text',
            multiline ? 'min-h-[86px]' : 'py-3',
            inputClassName,
          )}
          style={{ outlineStyle: 'none' } as object}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
            hitSlop={10}
            onPress={() => setHidden((h) => !h)}>
            {hidden ? (
              <Eye size={20} color={palette.muted} />
            ) : (
              <EyeOff size={20} color={palette.muted} />
            )}
          </Pressable>
        ) : (
          right
        )}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-[12px] font-semibold text-danger-fg">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption">{hint}</Text>
      ) : null}
    </View>
  );
});
