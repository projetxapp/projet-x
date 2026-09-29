import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useReducer, useRef } from 'react';

import { supabase, unwrap } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type {
  CollabMode,
  DeckCard,
  MatchDetails,
  Mode,
  SwipeDirection,
  SwipeResult,
} from '@/types/app';

import { BATCH, deckReducer, EMPTY_DECK } from './deck-reducer';

const REFILL_AT = 5;

async function fetchDeck(
  userId: string,
  mode: Mode,
  offset: number,
  filter: CollabMode[],
): Promise<DeckCard[]> {
  const data = unwrap(
    await supabase.rpc('get_swipe_deck', {
      p_user_id: userId,
      p_mode: mode,
      p_limit: BATCH,
      p_offset: offset,
      ...(filter.length > 0 ? { p_collab_modes: filter } : {}),
    }),
  );
  return (data ?? []) as unknown as DeckCard[];
}

/**
 * Swipe queue: 1 network call per batch of 20 scored cards, refilled when 5 are left.
 * Cards already shown are deduplicated; the next page starts after the unswiped cards
 * still in the queue (the server excludes swiped profiles).
 */
export function useDeck(mode: Mode, filter: CollabMode[], enabled: boolean) {
  const { user } = useAuth();
  const userId = user?.id;
  const [state, dispatch] = useReducer(deckReducer, EMPTY_DECK);
  const fetching = useRef(false);
  const filterKey = filter.join(',');

  const initial = useQuery({
    queryKey: ['deck', userId, mode, filterKey],
    queryFn: () =>
      fetchDeck(userId!, mode, 0, filterKey ? (filterKey.split(',') as CollabMode[]) : []),
    enabled: enabled && Boolean(userId),
    staleTime: 0,
    gcTime: 0,
  });

  // New server page (mode/filter change or refetch) → rebuild the queue during render.
  if (initial.data && initial.data !== state.source) {
    dispatch({ type: 'reset', data: initial.data });
  }

  const remaining = state.cards.length;
  const { exhausted, generation } = state;
  const ready = state.source !== undefined;

  useEffect(() => {
    if (!ready || !userId || exhausted || remaining > REFILL_AT || fetching.current) return;
    fetching.current = true;
    const collab = filterKey ? (filterKey.split(',') as CollabMode[]) : [];
    fetchDeck(userId, mode, remaining, collab)
      .then((next) => {
        fetching.current = false;
        dispatch({ type: 'append', next, generation });
      })
      .catch(() => {
        // Retried on the next swipe.
        fetching.current = false;
      });
  }, [ready, userId, exhausted, remaining, mode, filterKey, generation]);

  const pop = useCallback(() => dispatch({ type: 'pop' }), []);
  const pushBack = useCallback((card: DeckCard) => dispatch({ type: 'push-back', card }), []);

  return {
    cards: state.cards,
    isLoading: initial.isLoading || (initial.isSuccess && !ready),
    isError: initial.isError,
    error: initial.error,
    refetch: initial.refetch,
    isEmpty: ready && !initial.isFetching && state.cards.length === 0,
    pop,
    pushBack,
  };
}

export function useSwipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      target: string;
      mode: Mode;
      direction: SwipeDirection;
    }): Promise<SwipeResult> =>
      unwrap(
        await supabase.rpc('swipe', {
          p_target: vars.target,
          p_mode: vars.mode,
          p_direction: vars.direction,
        }),
      ) as unknown as SwipeResult,
    onSuccess: (result) => {
      if (result.matched) {
        void queryClient.invalidateQueries({ queryKey: ['conversations'] });
        void queryClient.invalidateQueries({ queryKey: ['home-stats'] });
      }
    },
  });
}

export function useUndoSwipe() {
  return useMutation({
    mutationFn: async (mode: Mode) =>
      unwrap(await supabase.rpc('undo_last_swipe', { p_mode: mode })) as string | null,
  });
}

export function useMatchDetails(targetId: string | undefined, mode: Mode | undefined) {
  return useQuery({
    queryKey: ['match-details', targetId, mode],
    enabled: Boolean(targetId && mode),
    queryFn: async () => {
      const rows = unwrap(
        await supabase.rpc('get_match_details', { p_target_id: targetId!, p_mode: mode! }),
      );
      return ((rows ?? [])[0] ?? null) as MatchDetails | null;
    },
    staleTime: 5 * 60_000,
  });
}
