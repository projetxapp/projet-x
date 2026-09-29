import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, Info, RotateCcw, Star, X } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, View, type LayoutChangeEvent } from 'react-native';

import { AppHeader } from '@/components/app/app-header';
import { Chip, EmptyState, Screen, Sheet, Skeleton, useToast } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { COLLAB_MODES } from '@/constants/profile-options';
import { useActiveMode, useMe } from '@/features/me/api';
import { humanError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { imageUrl } from '@/lib/images';
import { useTheme } from '@/providers/theme-provider';
import type { CollabMode, DeckCard, Me, Mode, SwipeDirection } from '@/types/app';

import { useDeck, useSwipe, useUndoSwipe } from './api';
import { CardDetails } from './card-details';
import { MatchModal } from './match-modal';
import { targetKind } from './profile-card';
import { SwipeStack, type SwipeStackHandle } from './swipe-stack';

const HISTORY = 20;

function myTags(me: Me | undefined, mode: Mode): string[] {
  if (!me) return [];
  if (mode === 'talent') return me.talent?.skills ?? [];
  if (mode === 'project') return me.project?.needs ?? [];
  return me.investor?.sectors ?? [];
}

export function SwipeScreen() {
  const router = useRouter();
  const toast = useToast();
  const { palette } = useTheme();
  const { data: me } = useMe();
  const { mode, hasMode } = useActiveMode();
  const [filter, setFilter] = useState<CollabMode[]>([]);
  const deck = useDeck(mode, filter, hasMode);
  const swipe = useSwipe();
  const undo = useUndoSwipe();
  const stack = useRef<SwipeStackHandle>(null);
  const history = useRef<DeckCard[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [details, setDetails] = useState<DeckCard | null>(null);
  const [match, setMatch] = useState<{ card: DeckCard; matchId: string } | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const cfg = MODES[mode];
  const kind = targetKind(mode);
  const top = deck.cards[0];

  // Preload the next cards' images (expo-image disk cache).
  const upcoming = deck.cards
    .slice(0, 4)
    .map((c) => imageUrl(kind === 'project' ? (c.cover_url ?? c.avatar_url) : c.avatar_url, 600))
    .filter((u): u is string => Boolean(u))
    .join('|');
  useEffect(() => {
    if (upcoming) void Image.prefetch(upcoming.split('|'), 'memory-disk');
  }, [upcoming]);

  // Reset local history when the deck changes (mode / filters).
  const deckKey = `${mode}:${filter.join(',')}`;
  const [historyKey, setHistoryKey] = useState(deckKey);
  if (historyKey !== deckKey) {
    setHistoryKey(deckKey);
    setCanUndo(false);
  }
  useEffect(() => {
    history.current = [];
  }, [deckKey]);

  const onSwiped = (card: DeckCard, direction: SwipeDirection) => {
    deck.pop();
    history.current = [...history.current.slice(-(HISTORY - 1)), card];
    setCanUndo(true);
    if (direction === 'pass') haptics.light();
    else haptics.medium();
    swipe.mutate(
      { target: card.user_id, mode, direction },
      {
        onSuccess: (result) => {
          if (result.matched && result.match_id) {
            haptics.success();
            setMatch({ card, matchId: result.match_id });
          }
        },
        onError: (error) => {
          toast.show({ title: humanError(error), tone: 'error' });
          history.current = history.current.filter((c) => c.user_id !== card.user_id);
          deck.pushBack(card);
        },
      },
    );
  };

  const onUndo = () => {
    if (history.current.length === 0 || undo.isPending) return;
    haptics.selection();
    undo.mutate(mode, {
      onSuccess: (targetId) => {
        if (!targetId) {
          toast.show({ title: 'Rien à annuler' });
          return;
        }
        const card = history.current.find((c) => c.user_id === targetId);
        history.current = history.current.filter((c) => c.user_id !== targetId);
        setCanUndo(history.current.length > 0);
        if (card) deck.pushBack(card);
        else void deck.refetch();
      },
      onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
    });
  };

  const act = (direction: SwipeDirection) => {
    if (!top) return;
    setDetails(null);
    stack.current?.swipe(direction);
  };

  // Keyboard shortcuts on the web: ← pass, → like, ↑ super, ⌫ undo.
  const actRef = useRef({ act, onUndo });
  useEffect(() => {
    actRef.current = { act, onUndo };
  });
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (event.key === 'ArrowRight') actRef.current.act('like');
      else if (event.key === 'ArrowLeft') actRef.current.act('pass');
      else if (event.key === 'ArrowUp') actRef.current.act('super');
      else if (event.key === 'Backspace') actRef.current.onUndo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width: Math.min(width - 32, 460), height: Math.max(320, height - 16) });
  };

  const toggleFilter = (id: CollabMode) =>
    setFilter((current) =>
      current.includes(id) ? current.filter((f) => f !== id) : [...current, id],
    );

  return (
    <Screen>
      <AppHeader />
      {mode !== 'investor' ? (
        <View
          className="flex-row gap-2 px-5 pb-2"
          accessibilityRole="radiogroup"
          accessibilityLabel="Filtrer par mode de collaboration">
          {COLLAB_MODES.map((c) => (
            <Chip
              key={c.id}
              label={c.id}
              emoji={c.emoji}
              size="sm"
              tone={mode}
              selected={filter.includes(c.id)}
              onPress={() => toggleFilter(c.id)}
              accessibilityLabel={`Filtre ${c.label}`}
            />
          ))}
        </View>
      ) : null}

      <View className="flex-1 items-center justify-center" onLayout={onLayout}>
        {!size ? null : deck.isLoading ? (
          <Skeleton width={size.width} height={size.height} radius={28} />
        ) : deck.isError ? (
          <EmptyState
            emoji="😵"
            title="Impossible de charger les profils"
            text={humanError(deck.error)}
            actionLabel="Réessayer"
            onAction={() => void deck.refetch()}
            gradient={cfg.gradient}
          />
        ) : deck.isEmpty ? (
          <EmptyState
            emoji="🎉"
            title="Tu as fait le tour !"
            text={
              filter.length > 0
                ? `Plus aucun profil avec ces filtres. Élargis ta recherche pour voir d'autres ${cfg.deckNoun}.`
                : `De nouveaux ${cfg.deckNoun} arrivent chaque jour. En attendant, complète ton profil ou explore la communauté.`
            }
            actionLabel={filter.length > 0 ? 'Retirer les filtres' : 'Explorer la communauté'}
            onAction={() => (filter.length > 0 ? setFilter([]) : router.push('/explorer'))}
            gradient={cfg.gradient}
          />
        ) : (
          <SwipeStack
            ref={stack}
            cards={deck.cards}
            mode={mode}
            width={size.width}
            height={size.height}
            onSwiped={onSwiped}
            onOpen={setDetails}
          />
        )}
      </View>

      <View className="flex-row items-center justify-center gap-4 pb-3 pt-2">
        <RoundButton
          label="Annuler le dernier swipe"
          size={46}
          disabled={!canUndo || undo.isPending}
          onPress={onUndo}>
          <RotateCcw size={20} color="#FCD34D" />
        </RoundButton>
        <RoundButton
          testID="swipe-pass"
          label="Passer"
          size={62}
          disabled={!top}
          onPress={() => act('pass')}>
          <X size={30} color="#F87171" strokeWidth={3} />
        </RoundButton>
        <RoundButton
          label="Voir le détail"
          size={46}
          disabled={!top}
          onPress={() => top && setDetails(top)}>
          <Info size={20} color={palette.muted} />
        </RoundButton>
        <RoundButton
          testID="swipe-like"
          label={cfg.likeLabel.toLowerCase()}
          size={62}
          disabled={!top}
          onPress={() => act('like')}>
          <Heart size={28} color="#4ADE80" fill="#4ADE80" />
        </RoundButton>
        <RoundButton label="Super like" size={50} disabled={!top} onPress={() => act('super')}>
          <Star size={22} color="#38BDF8" fill="#38BDF8" />
        </RoundButton>
      </View>

      <Sheet visible={details !== null} onClose={() => setDetails(null)} title="Détail du profil">
        {details ? (
          <>
            <CardDetails card={details} mode={mode} myTags={myTags(me, mode)} />
            <View className="flex-row gap-3 px-5 pt-2">
              <RoundButton label="Passer" size={56} onPress={() => act('pass')}>
                <X size={26} color="#F87171" strokeWidth={3} />
              </RoundButton>
              <Pressable
                accessibilityRole="button"
                onPress={() => act('like')}
                className="h-14 flex-1 items-center justify-center rounded-btn active:scale-[0.97]"
                style={{ backgroundColor: cfg.color }}>
                <Heart size={22} color="#FFFFFF" fill="#FFFFFF" />
              </Pressable>
            </View>
          </>
        ) : null}
      </Sheet>

      <MatchModal
        match={match}
        me={me}
        mode={mode}
        onClose={() => setMatch(null)}
        onMessage={(matchId) => {
          setMatch(null);
          router.push({ pathname: '/chat/[id]', params: { id: matchId } });
        }}
      />
    </Screen>
  );
}

function RoundButton({
  children,
  label,
  size,
  disabled,
  onPress,
  testID,
}: {
  children: ReactNode;
  label: string;
  size: number;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      className={`items-center justify-center rounded-full border border-line/10 bg-card active:scale-90 ${disabled ? 'opacity-40' : ''}`}
      style={{ width: size, height: size, boxShadow: '0px 6px 18px rgba(0,0,0,0.25)' }}>
      {children}
    </Pressable>
  );
}
