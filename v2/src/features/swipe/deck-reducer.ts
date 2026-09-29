import type { DeckCard } from '@/types/app';

/** Cards per server page (get_swipe_deck). */
export const BATCH = 20;

export type DeckState = {
  /** Server page the queue was built from (identity changes on reset). */
  source: DeckCard[] | undefined;
  cards: DeckCard[];
  seen: ReadonlySet<string>;
  exhausted: boolean;
  /** Bumped on every reset so late refills from a previous mode/filter are ignored. */
  generation: number;
};

export type DeckAction =
  | { type: 'reset'; data: DeckCard[] }
  | { type: 'append'; next: DeckCard[]; generation: number }
  | { type: 'pop' }
  | { type: 'push-back'; card: DeckCard };

export const EMPTY_DECK: DeckState = {
  source: undefined,
  cards: [],
  seen: new Set(),
  exhausted: false,
  generation: 0,
};

export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case 'reset':
      return {
        source: action.data,
        cards: action.data,
        seen: new Set(action.data.map((c) => c.user_id)),
        exhausted: action.data.length < BATCH,
        generation: state.generation + 1,
      };
    case 'append': {
      if (action.generation !== state.generation) return state;
      const fresh = action.next.filter((c) => !state.seen.has(c.user_id));
      return {
        ...state,
        cards: fresh.length > 0 ? [...state.cards, ...fresh] : state.cards,
        seen:
          fresh.length > 0 ? new Set([...state.seen, ...fresh.map((c) => c.user_id)]) : state.seen,
        exhausted: state.exhausted || action.next.length < BATCH || fresh.length === 0,
      };
    }
    case 'pop':
      return { ...state, cards: state.cards.slice(1) };
    case 'push-back':
      return {
        ...state,
        cards: [action.card, ...state.cards.filter((c) => c.user_id !== action.card.user_id)],
      };
  }
}
