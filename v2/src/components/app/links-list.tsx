import * as WebBrowser from 'expo-web-browser';
import { ExternalLink } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { LINK_TYPES } from '@/constants/profile-options';
import { normalizeUrl } from '@/lib/format';
import { useTheme } from '@/providers/theme-provider';
import type { ProfileLink } from '@/types/app';

/** Portfolio / GitHub / pitch deck… links, opened in the in-app browser. */
export function LinksList({ links }: { links: ProfileLink[] | null | undefined }) {
  const { palette } = useTheme();
  const valid = (links ?? []).filter((l) => l.url?.trim());
  if (valid.length === 0) return null;
  return (
    <View className="gap-2">
      {valid.map((link, i) => {
        const type = LINK_TYPES.find((t) => t.id === link.type);
        const url = normalizeUrl(link.url);
        return (
          <Pressable
            key={`${link.url}-${i}`}
            accessibilityRole="link"
            accessibilityLabel={`${link.label || type?.label || 'Lien'} : ${url}`}
            onPress={() => void WebBrowser.openBrowserAsync(url)}
            className="flex-row items-center gap-3 rounded-field border border-line/10 bg-surface px-3.5 py-3 active:opacity-70">
            <Text className="text-[18px]">{link.icon || type?.icon || '🔗'}</Text>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-text" numberOfLines={1}>
                {link.label || type?.label || 'Lien'}
              </Text>
              <Text variant="caption" numberOfLines={1}>
                {url.replace(/^https?:\/\//, '')}
              </Text>
            </View>
            <ExternalLink size={16} color={palette.hint} />
          </Pressable>
        );
      })}
    </View>
  );
}
