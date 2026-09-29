import { describe, it, expect } from '@jest/globals';
import { humanError, isAuthError } from '../errors';

describe('humanError', () => {
  it('maps our SQL exception keys to French', () => {
    expect(humanError({ message: 'blocked', code: 'P0001' })).toBe(
      "Impossible d'interagir avec cette personne.",
    );
    expect(humanError({ message: 'not_a_member' })).toBe(
      "Cette conversation n'est pas accessible.",
    );
  });
  it('prefers the French hint written for the user', () => {
    expect(
      humanError({
        message: 'rate_limited',
        hint: 'Doucement ! Tu swipes trop vite, reviens dans un moment.',
      }),
    ).toBe('Doucement ! Tu swipes trop vite, reviens dans un moment.');
  });
  it('ignores technical Postgres hints', () => {
    expect(
      humanError({ message: 'rate_limited', hint: 'Perhaps you meant to reference the column' }),
    ).toBe('Doucement ! Tu vas un peu vite, réessaie dans un instant.');
  });
  it('translates Supabase Auth errors', () => {
    expect(humanError({ message: 'Invalid login credentials' })).toBe(
      'Email ou mot de passe incorrect.',
    );
    expect(humanError({ message: 'Email not confirmed' })).toMatch(/Confirme ton email/);
    expect(humanError({ message: 'User already registered' })).toMatch(/Un compte existe déjà/);
    expect(humanError(new TypeError('Failed to fetch'))).toMatch(/Pas de connexion internet/);
  });
  it('never leaks unknown technical messages', () => {
    expect(humanError({ message: 'relation "x" does not exist', code: '42P01' })).toBe(
      'Oups, quelque chose a coincé. Réessaie dans un instant.',
    );
    expect(humanError(null, 'Fallback')).toBe('Fallback');
    expect(humanError({ code: '42501', message: 'permission denied for table swipes' })).toBe(
      "Tu n'as pas les droits pour faire ça.",
    );
  });
});

describe('isAuthError', () => {
  it('detects expired sessions', () => {
    expect(isAuthError({ status: 401 })).toBe(true);
    expect(isAuthError({ message: 'JWT expired' })).toBe(true);
    expect(isAuthError({ message: 'not_authenticated' })).toBe(true);
    expect(isAuthError({ message: 'blocked' })).toBe(false);
  });
});
