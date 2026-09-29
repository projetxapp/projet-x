import { describe, it, expect } from '@jest/globals';
import { departmentCode, placeLabel } from '../places';

describe('places (mirror of private.department_code in SQL)', () => {
  it('extracts department codes', () => {
    expect(departmentCode('75 - Paris')).toBe('75');
    expect(departmentCode('2A - Corse-du-Sud')).toBe('2A');
    expect(departmentCode('974 - La Réunion')).toBe('974');
    expect(departmentCode('🌐 Remote / Full télétravail')).toBe('REMOTE');
    expect(departmentCode('🌍 International')).toBe('INTL');
    expect(departmentCode('Paris')).toBe('75');
    expect(departmentCode('')).toBeNull();
    expect(departmentCode(null)).toBeNull();
  });
  it('builds short labels', () => {
    expect(placeLabel('49 - Maine-et-Loire')).toBe('Maine-et-Loire (49)');
    expect(placeLabel('🌐 Remote / Full télétravail')).toBe('Remote');
    expect(placeLabel(undefined)).toBeNull();
  });
});
