import { View } from 'react-native';

import { Button } from './button';
import { Text } from './text';

type Props = {
  emoji: string;
  title: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
  gradient?: readonly [string, string];
};

/** Illustrated empty state with a call to action. */
export function EmptyState({ emoji, title, text, actionLabel, onAction, gradient }: Props) {
  return (
    <View className="items-center justify-center gap-3 px-8 py-12">
      <View className="mb-1 h-[88px] w-[88px] items-center justify-center rounded-[28px] bg-surface">
        <Text className="text-[44px]" accessibilityElementsHidden>
          {emoji}
        </Text>
      </View>
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      {text ? (
        <Text variant="body" className="text-center text-muted">
          {text}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          size="md"
          gradient={gradient}
          className="mt-3 self-stretch"
        />
      ) : null}
    </View>
  );
}
