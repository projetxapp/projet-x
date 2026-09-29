import { describe, it, expect } from '@jest/globals';
import { buildSteps, EMPTY_ONBOARDING, onboardingSchema, stepFields, toPayload } from '../schema';

const valid = {
  ...EMPTY_ONBOARDING,
  firstName: 'Léa',
  lastName: 'Martin',
  age: '21',
  email: 'lea@example.com',
  password: 'motdepasse1',
  roles: ['talent' as const],
};

describe('onboarding schema', () => {
  it('accepts a valid signup', () => {
    expect(onboardingSchema('signup').safeParse(valid).success).toBe(true);
  });
  it('requires 16+ years old', () => {
    const r = onboardingSchema('signup').safeParse({ ...valid, age: '15' });
    expect(r.success).toBe(false);
  });
  it('requires email and an 8+ character password only for email signup', () => {
    const bad = { ...valid, email: 'pas-un-email', password: 'court' };
    const signup = onboardingSchema('signup').safeParse(bad);
    expect(signup.success).toBe(false);
    expect(signup.error?.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
    expect(onboardingSchema('complete').safeParse(bad).success).toBe(true);
  });
  it('requires at least one role', () => {
    expect(onboardingSchema('signup').safeParse({ ...valid, roles: [] }).success).toBe(false);
  });
});

describe('onboarding steps', () => {
  it('adds one step per chosen role, in a stable order', () => {
    expect(buildSteps(['investor', 'talent'], 'signup')).toEqual([
      'info',
      'roles',
      'talent',
      'investor',
      'photo',
      'recap',
    ]);
    expect(buildSteps(['project'], 'complete')).toEqual([
      'roles',
      'project',
      'info',
      'photo',
      'recap',
    ]);
  });
  it('validates credentials on the info step only for email signup', () => {
    expect(stepFields('info', 'signup')).toContain('password');
    expect(stepFields('info', 'complete')).not.toContain('password');
  });
});

describe('toPayload', () => {
  it('only sends the sub-profiles of the chosen roles', () => {
    const payload = toPayload({
      ...valid,
      roles: ['talent', 'investor'],
      talentSkills: ['Figma'],
      investorTicket: 'small',
    });
    expect(payload).toMatchObject({ first_name: 'Léa', age: 21, roles: ['talent', 'investor'] });
    expect(payload.talent?.skills).toEqual(['Figma']);
    expect(payload.investor?.ticket).toBe('small');
    expect(payload.project).toBeUndefined();
  });
});
