import { Settings } from '../core/types';
import { DEFAULT_SETTINGS, CURRENT_SCHEMA_VERSION } from '../core/defaults';
import { SettingsSchema } from '../core/schema';

export type MigrationFn = (oldData: Record<string, unknown>) => Record<string, unknown>;

export const migrations: Record<number, MigrationFn> = {
  // Example migration from version 0 to 1
  1: (oldData: Record<string, unknown>) => {
    return {
      ...oldData,
      schemaVersion: 1
    };
  }
};

export function migrateSettings(raw: unknown): Settings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  let data = { ...(raw as Record<string, unknown>) };
  let currentVer = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0;

  while (currentVer < CURRENT_SCHEMA_VERSION) {
    const nextVer = currentVer + 1;
    const migrator = migrations[nextVer];
    if (migrator) {
      try {
        data = migrator(data);
        currentVer = nextVer;
      } catch (e) {
        console.error(`[YFC] Migration to version ${nextVer} failed:`, e);
        return { ...DEFAULT_SETTINGS };
      }
    } else {
      currentVer = nextVer;
    }
  }

  // Merge with defaults to ensure missing nested keys are populated
  const merged: Settings = {
    ...DEFAULT_SETTINGS,
    ...data,
    global: {
      ...DEFAULT_SETTINGS.global,
      ...((data.global as Settings['global']) || {})
    },
    blacklist: {
      ...DEFAULT_SETTINGS.blacklist,
      ...((data.blacklist as Settings['blacklist']) || {})
    },
    shorts: {
      ...DEFAULT_SETTINGS.shorts,
      ...((data.shorts as Settings['shorts']) || {})
    },
    diversity: {
      ...DEFAULT_SETTINGS.diversity,
      ...((data.diversity as Settings['diversity']) || {})
    },
    unclassified: {
      ...DEFAULT_SETTINGS.unclassified,
      ...((data.unclassified as Settings['unclassified']) || {})
    },
    overrides: {
      ...DEFAULT_SETTINGS.overrides,
      ...((data.overrides as Settings['overrides']) || {})
    },
    surfaces: {
      ...DEFAULT_SETTINGS.surfaces,
      ...((data.surfaces as Settings['surfaces']) || {})
    },
    enrichment: {
      ...DEFAULT_SETTINGS.enrichment,
      ...((data.enrichment as Settings['enrichment']) || {})
    },
    genres: (data.genres as Settings['genres']) || {},
    subgenres: (data.subgenres as Settings['subgenres']) || {}
  };

  const parsed = SettingsSchema.safeParse(merged);
  if (parsed.success) {
    return parsed.data as Settings;
  } else {
    console.warn('[YFC] Settings schema validation failed, falling back to defaults:', parsed.error);
    return { ...DEFAULT_SETTINGS };
  }
}
