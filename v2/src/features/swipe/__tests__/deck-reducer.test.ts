import { describe, it, expect } from '@jest/globals';
import type { DeckCard } from '@/types/app';

import { BATCH, deckReducer, EMPTY_DECK } from '../deck-reducer';

const card = (id: string, score = 50): DeckCard =>
  ({ user_id: id, score, reasons: [] }) as unknown as DeckCard;
const page = (prefix: string, n: number) =>
  Array.from({ length: n }, (_, i) => card(`${prefix}${i}`));

describe('deckReducer (swipe queue)', () => {
  it('resets from a server page and flags short pages as exhausted', () => {
    const full = deckReducer(EMPTY_DECK, { type: 'reset', data: page('a', BATCH) });
    expect(full.cards).toHaveLength(BATCH);
    expect(full.exhausted).toBe(false);
    expect(full.generation).toBe(1);
    const short = deckReducer(EMPTY_DECK, { type: 'reset', data: page('a', 3) });
    expect(short.exhausted).toBe(true);
  });

  it('pops the top card and pushes a card back on top without duplicates', () => {
    let s = deckReducer(EMPTY_DECK, { type: 'reset', data: [card('a'), card('b'), card('c')] });
    s = deckReducer(s, { type: 'pop' });
    expect(s.cards.map((c) => c.user_id)).toEqual(['b', 'c']);
    s = deckReducer(s, { type: 'push-back', card: card('a') });
    s = deckReducer(s, { type: 'push-back', card: card('a') });
    expect(s.cards.map((c) => c.user_id)).toEqual(['a', 'b', 'c']);
  });

  it('appends only unseen cards (no duplicates across refills)', () => {
    let s = deckReducer(EMPTY_DECK, { type: 'reset', data: page('a', BATCH) });
    s = deckReducer(s, {
      type: 'append',
      generation: s.generation,
      next: [card('a1'), card('b1'), card('b2')],
    });
    expect(s.cards.filter((c) => c.user_id === 'a1')).toHaveLength(1);
    expect(s.cards.slice(-2).map((c) => c.user_id)).toEqual(['b1', 'b2']);
    expect(s.exhausted).toBe(true); // short page
  });

  it('ignores late refills from a previous mode / filter', () => {
    let s = deckReducer(EMPTY_DECK, { type: 'reset', data: page('a', BATCH) });
    const stale = s.generation;
    s = deckReducer(s, { type: 'reset', data: page('x', BATCH) });
    const after = deckReducer(s, { type: 'append', generation: stale, next: page('late', BATCH) });
    expect(after).toBe(s);
  });

  it('stops refilling when a page brings nothing new', () => {
    let s = deckReducer(EMPTY_DECK, { type: 'reset', data: page('a', BATCH) });
    s = deckReducer(s, { type: 'append', generation: s.generation, next: page('a', BATCH) });
    expect(s.exhausted).toBe(true);
  });
});
