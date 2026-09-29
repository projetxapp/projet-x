import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { AppHeader } from '@/components/app/app-header';
import { PlacePicker } from '@/components/forms/place-picker';
import { TagSelector } from '@/components/forms/tag-selector';
import {
  Button,
  Chip,
  EmptyState,
  Screen,
  Sheet,
  SkeletonRow,
  Text,
  TextField,
} from '@/components/ui';
import { MODE_ORDER, MODES } from '@/constants/modes';
import { departmentCode } from '@/constants/places';
import { COLLAB_MODES, EXPLORER_QUICK_TAGS, STAGES } from '@/constants/profile-options';
import { ALL_SKILLS, POPULAR_SKILLS, SKILL_CLUSTERS } from '@/constants/skills';
import { useActiveMode } from '@/features/me/api';
import { useDebounced } from '@/hooks/use-debounced';
import { humanError } from '@/lib/errors';
import { useTheme } from '@/providers/theme-provider';
import type { CollabMode, Mode, ProjectStage, SearchFilters, SearchResult } from '@/types/app';

import { useSearch } from './api';
import { ResultCard } from './result-card';

type Draft = {
  place: string | null;
  stage: ProjectStage | null;
  collab: CollabMode[];
  tags: string[];
};
const EMPTY: Draft = { place: null, stage: null, collab: [], tags: [] };

export function ExplorerScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { mode: activeMode } = useActiveMode();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode | null>(null);
  const [applied, setApplied] = useState<Draft>(EMPTY);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [sheet, setSheet] = useState(false);
  const debounced = useDebounced(query.trim(), 300);

  const filters = useMemo<SearchFilters>(() => {
    const f: SearchFilters = {};
    const dept = departmentCode(applied.place);
    if (dept) f.dept = dept;
    if (applied.stage) f.stage = applied.stage;
    if (applied.collab.length) f.collab = applied.collab;
    if (applied.tags.length) f.tags = applied.tags;
    return f;
  }, [applied]);
  const activeFilters = Object.keys(filters).length;

  const search = useSearch(debounced, mode, filters);
  const results = useMemo(() => {
    const seen = new Set<string>();
    return (search.data?.pages.flat() ?? []).filter((r) => {
      const key = `${r.user_id}:${r.mode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [search.data]);

  const open = (r: SearchResult) =>
    router.push({ pathname: '/u/[id]', params: { id: r.user_id, mode: r.mode } });

  return (
    <Screen>
      <AppHeader title="Explorer" />
      <View className="gap-3 px-5 pb-2">
        <View className="flex-row items-center gap-2">
          <TextField
            className="flex-1"
            testID="explorer-search"
            value={query}
            onChangeText={setQuery}
            placeholder="Compétence, projet, école, nom…"
            accessibilityLabel="Rechercher"
            left={<Search size={18} color={palette.hint} />}
            right={
              query ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Effacer"
                  onPress={() => setQuery('')}
                  hitSlop={8}>
                  <X size={18} color={palette.hint} />
                </Pressable>
              ) : undefined
            }
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Filtres${activeFilters ? `, ${activeFilters} actifs` : ''}`}
            onPress={() => {
              setDraft(applied);
              setSheet(true);
            }}
            className={`h-[52px] w-[52px] items-center justify-center rounded-field border ${activeFilters ? 'border-talent bg-talent/15' : 'border-line/10 bg-surface'}`}>
            <SlidersHorizontal
              size={20}
              color={activeFilters ? MODES[activeMode].light : palette.muted}
            />
            {activeFilters ? (
              <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-notif px-1">
                <Text className="text-[11px] font-bold text-white">{activeFilters}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2">
          <Chip
            label="Tous"
            size="sm"
            tone={activeMode}
            selected={mode === null}
            onPress={() => setMode(null)}
          />
          {MODE_ORDER.map((m) => (
            <Chip
              key={m}
              label={m === 'talent' ? 'Talents' : m === 'project' ? 'Projets' : 'Investisseurs'}
              emoji={MODES[m].emoji}
              size="sm"
              tone={m}
              selected={mode === m}
              onPress={() => setMode(mode === m ? null : m)}
            />
          ))}
        </ScrollView>
        {!query ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2">
            {EXPLORER_QUICK_TAGS.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                size="sm"
                tone={activeMode}
                onPress={() => setQuery(tag)}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>

      {search.isPending ? (
        <View className="gap-1 pt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : search.isError ? (
        <EmptyState
          emoji="😵"
          title="Recherche indisponible"
          text={humanError(search.error)}
          actionLabel="Réessayer"
          onAction={() => void search.refetch()}
        />
      ) : (
        <FlashList
          data={results}
          keyExtractor={(r) => `${r.user_id}:${r.mode}`}
          renderItem={({ item }) => <ResultCard result={item} onPress={open} />}
          onEndReached={() => {
            if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          ListHeaderComponent={
            results.length > 0 ? (
              <Text variant="overline" className="px-5 pb-2">
                {debounced || activeFilters ? 'Résultats' : 'Actifs récemment'}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              emoji="🔍"
              title="Aucun profil trouvé"
              text="Essaie un autre mot-clé, un autre mode ou retire des filtres."
              actionLabel={activeFilters || query ? 'Tout réinitialiser' : undefined}
              onAction={() => {
                setQuery('');
                setApplied(EMPTY);
                setMode(null);
              }}
            />
          }
          ListFooterComponent={
            search.isFetchingNextPage ? (
              <ActivityIndicator className="py-4" color={palette.muted} />
            ) : null
          }
        />
      )}

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Filtres">
        <ScrollView
          contentContainerClassName="gap-5 px-5 pb-4 pt-2"
          keyboardShouldPersistTaps="handled">
          <PlacePicker
            value={draft.place}
            onChange={(place) => setDraft((d) => ({ ...d, place }))}
          />
          {mode === null || mode === 'project' ? (
            <View className="gap-2">
              <Text variant="overline">Stade du projet</Text>
              <View className="flex-row flex-wrap gap-2">
                {STAGES.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.label}
                    size="sm"
                    tone="project"
                    selected={draft.stage === s.id}
                    onPress={() =>
                      setDraft((d) => ({ ...d, stage: d.stage === s.id ? null : s.id }))
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}
          {mode !== 'investor' ? (
            <View className="gap-2">
              <Text variant="overline">Mode de collaboration</Text>
              <View className="flex-row flex-wrap gap-2">
                {COLLAB_MODES.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.id}
                    emoji={c.emoji}
                    size="sm"
                    tone={activeMode}
                    selected={draft.collab.includes(c.id)}
                    onPress={() =>
                      setDraft((d) => ({
                        ...d,
                        collab: d.collab.includes(c.id)
                          ? d.collab.filter((x) => x !== c.id)
                          : [...d.collab, c.id],
                      }))
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}
          <TagSelector
            label="Compétences"
            value={draft.tags}
            onChange={(tags) => setDraft((d) => ({ ...d, tags }))}
            catalogue={ALL_SKILLS}
            popular={POPULAR_SKILLS}
            clusters={SKILL_CLUSTERS}
            max={5}
            tone="talent"
            placeholder="Rechercher une compétence"
          />
          <View className="flex-row gap-3 pt-2">
            <Button
              title="Réinitialiser"
              variant="outline"
              className="flex-1"
              onPress={() => setDraft(EMPTY)}
            />
            <Button
              title="Appliquer"
              className="flex-1"
              onPress={() => {
                setApplied(draft);
                setSheet(false);
              }}
            />
          </View>
        </ScrollView>
      </Sheet>
    </Screen>
  );
}
