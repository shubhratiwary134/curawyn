import { describe, it, expect } from 'vitest';
import { migrateSettings } from '../../src/platform/migrations';
import { DEFAULT_SETTINGS, CURRENT_SCHEMA_VERSION } from '../../src/core/defaults';

describe('migrations', () => {
  it('returns default settings when raw data is null, undefined or not an object', () => {
    expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings('invalid')).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings(123)).toEqual(DEFAULT_SETTINGS);
  });

  it('migrates legacy object without schemaVersion to current version', () => {
    const rawLegacy = {
      enabled: false,
      shorts: { blockAll: false }
    };
    const migrated = migrateSettings(rawLegacy);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.enabled).toBe(false);
    expect(migrated.shorts.blockAll).toBe(false);
    // Preserves default for missing properties
    expect(migrated.diversity.maxPerChannel).toBe(2);
  });

  it('safely recovers to default settings when structure has unrecoverable invalid types', () => {
    const corrupted = {
      schemaVersion: 1,
      diversity: {
        maxPerChannel: 'not-a-number' // violates z.number()
      }
    };
    const migrated = migrateSettings(corrupted);
    expect(migrated).toEqual(DEFAULT_SETTINGS);
  });
});
