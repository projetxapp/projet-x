import { describe, it, expect } from '@jest/globals';
import type { Me } from '@/types/app';

import { profileCompletion } from '../completion';

const base = { profile: { avatar_url: null }, modes: ['talent'] } as unknown as Me;

describe('profileCompletion', () => {
  it('is computed from real fields, with what is missing', () => {
    const me = {
      ...base,
      talent: { bio: '', skills: ['Figma'], hours_per_week: 'medium', collab_modes: [], links: [] },
    } as unknown as Me;
    const c = profileCompletion(me, 'talent');
    expect(c.percent).toBe(40); // skills 25 + hours 15
    expect(c.missing.map((m) => m.label)).toContain('Écris ta bio');
  });
  it('reaches 100 % when everything is filled', () => {
    const me = {
      profile: { avatar_url: 'https://x/a.webp' },
      talent: {
        bio: 'Bio',
        skills: ['Figma'],
        hours_per_week: 'light',
        collab_modes: ['Flash'],
        links: [{ url: 'x' }],
      },
    } as unknown as Me;
    expect(profileCompletion(me, 'talent')).toEqual({ percent: 100, missing: [] });
  });
  it('returns 0 for a mode without sub-profile', () => {
    expect(profileCompletion({ ...base, project: null } as unknown as Me, 'project').percent).toBe(
      0,
    );
  });
});
