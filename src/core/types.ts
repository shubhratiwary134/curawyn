export type ContentTypeId =
  | 'tutorial'
  | 'educational'
  | 'deep_dive'
  | 'review'
  | 'comparison'
  | 'news'
  | 'documentary'
  | 'analysis'
  | 'interview_podcast'
  | 'entertainment'
  | 'reaction'
  | 'list'
  | 'vlog_experience'
  | 'motivational'
  | 'experiment'
  | 'other';

export interface DurationRule {
  minSec: number | null;
  maxSec: number | null;
}

export interface Genre {
  id: string;
  name: string;
  enabled: boolean;
  blocked: boolean;
  duration: DurationRule | null;
  contentTypes: ContentTypeId[] | null;
  ytCategoryIds: number[];
  order: number;
  builtIn: boolean;
}

export interface KeywordWeight {
  term: string;
  weight: number;
}

export interface Subgenre {
  id: string;
  genreId: string;
  name: string;
  enabled: boolean;
  blocked: boolean;
  duration: DurationRule | null;
  contentTypes: ContentTypeId[] | null;
  include: KeywordWeight[];
  exclude: string[];
  order: number;
  builtIn: boolean;
}

export interface ChannelRef {
  channelId: string;
  handle?: string;
  name: string;
}

export interface VideoMeta {
  videoId: string;
  title: string;
  channel: ChannelRef | null;
  durationSec: number | null;
  isShort: boolean;
  isLive: boolean;
  isUpcoming: boolean;
  watchedPct: number | null;
  description?: string;
  tags?: string[];
  ytCategoryId?: number;
}

export interface Classification {
  genreId?: string;
  subgenreId?: string;
  contentTypes: ContentTypeId[];
  confidence: number;
  source: 'override' | 'rules' | 'enriched' | 'api' | 'none';
}

export type SurfaceId =
  | 'home'
  | 'watch'
  | 'subscriptions'
  | 'explore'
  | 'channel'
  | 'endscreen'
  | 'search'
  | 'library';

export type SurfaceMode = 'full' | 'blacklistOnly' | 'bypass';

export type ReasonCode =
  | 'blacklist_video'
  | 'blacklist_channel'
  | 'blacklist_genre'
  | 'blacklist_subgenre'
  | 'shorts_blocked'
  | 'live_blocked'
  | 'not_whitelisted'
  | 'genre_disabled'
  | 'duration_limit'
  | 'content_type_disallowed'
  | 'diversity_duplicate'
  | 'diversity_channel_cap'
  | 'diversity_subgenre_window'
  | 'diversity_impression_window'
  | 'diversity_watched'
  | 'unclassified'
  | 'passthrough'
  | 'allowed';

export interface Decision {
  action: 'show' | 'hide';
  reason: ReasonCode;
  detail?: string;
}

export interface Settings {
  schemaVersion: number;
  onboardingDone: boolean;
  enabled: boolean;
  global: {
    duration: DurationRule;
    contentTypes: ContentTypeId[];
    liveStreams: 'allow' | 'block';
  };
  genres: Record<string, Genre>;
  subgenres: Record<string, Subgenre>;
  blacklist: {
    videos: Record<string, { title: string; addedAt: number }>;
    channels: Record<string, ChannelRef & { addedAt: number }>;
    applyInSearch: boolean;
  };
  shorts: {
    blockAll: boolean;
    hideInSearch: boolean;
    directUrlBehavior: 'redirect' | 'block';
  };
  diversity: {
    maxPerChannel: number;
    dedupe: boolean;
    maxImpressions: number;
    windowHours: number;
    subgenreWindow: { w: number; k: number };
    hideWatched: boolean;
    watchedThresholdPct: number;
  };
  unclassified: {
    policy: 'hide' | 'show';
    confidenceThreshold: number;
  };
  overrides: {
    videos: Record<string, { subgenreId: string; contentTypes?: ContentTypeId[] }>;
    channels: Record<string, { subgenreId: string; contentTypes?: ContentTypeId[] }>;
  };
  surfaces: Record<SurfaceId, SurfaceMode>;
  enrichment: {
    watchPageFetch: boolean;
    dataApiKey: string | null;
  };
  debug: boolean;
}
