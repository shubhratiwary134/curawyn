import { Settings, ContentTypeId } from './types';
import { getSeedTaxonomy } from './taxonomy/seedGenres';

export const CURRENT_SCHEMA_VERSION = 1;

export const ALL_CONTENT_TYPES: ContentTypeId[] = [
  'tutorial',
  'educational',
  'deep_dive',
  'review',
  'comparison',
  'news',
  'documentary',
  'analysis',
  'interview_podcast',
  'entertainment',
  'reaction',
  'list',
  'vlog_experience',
  'motivational',
  'experiment',
  'other'
];

const seed = getSeedTaxonomy();

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  onboardingDone: false,
  enabled: true,
  global: {
    duration: {
      minSec: 300, // 5 min
      maxSec: 3600 // 60 min
    },
    contentTypes: [...ALL_CONTENT_TYPES],
    liveStreams: 'allow'
  },
  genres: seed.genres,
  subgenres: seed.subgenres,
  blacklist: {
    videos: {},
    channels: {},
    applyInSearch: false
  },
  shorts: {
    blockAll: true,
    hideInSearch: false,
    directUrlBehavior: 'redirect'
  },
  diversity: {
    maxPerChannel: 2,
    dedupe: true,
    maxImpressions: 2,
    windowHours: 24,
    subgenreWindow: { w: 12, k: 4 },
    hideWatched: true,
    watchedThresholdPct: 20
  },
  unclassified: {
    policy: 'hide',
    confidenceThreshold: 0.5
  },
  overrides: {
    videos: {},
    channels: {}
  },
  surfaces: {
    home: 'full',
    watch: 'full',
    subscriptions: 'full',
    explore: 'full',
    channel: 'blacklistOnly',
    endscreen: 'full',
    search: 'bypass',
    library: 'bypass'
  },
  enrichment: {
    watchPageFetch: true,
    dataApiKey: null
  },
  debug: false
};
