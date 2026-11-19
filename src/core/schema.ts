import { z } from 'zod';

export const ContentTypeIdSchema = z.enum([
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
]);

export const DurationRuleSchema = z.object({
  minSec: z.number().nullable(),
  maxSec: z.number().nullable()
});

export const GenreSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  blocked: z.boolean(),
  duration: DurationRuleSchema.nullable(),
  contentTypes: z.array(ContentTypeIdSchema).nullable(),
  ytCategoryIds: z.array(z.number()),
  order: z.number(),
  builtIn: z.boolean()
});

export const KeywordWeightSchema = z.object({
  term: z.string(),
  weight: z.number()
});

export const SubgenreSchema = z.object({
  id: z.string(),
  genreId: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  blocked: z.boolean(),
  duration: DurationRuleSchema.nullable(),
  contentTypes: z.array(ContentTypeIdSchema).nullable(),
  include: z.array(KeywordWeightSchema),
  exclude: z.array(z.string()),
  order: z.number(),
  builtIn: z.boolean()
});

export const ChannelRefSchema = z.object({
  channelId: z.string(),
  handle: z.string().optional(),
  name: z.string()
});

export const SurfaceIdSchema = z.enum([
  'home',
  'watch',
  'subscriptions',
  'explore',
  'channel',
  'endscreen',
  'search',
  'library'
]);

export const SurfaceModeSchema = z.enum(['full', 'blacklistOnly', 'bypass']);

export const SettingsSchema = z.object({
  schemaVersion: z.number(),
  onboardingDone: z.boolean(),
  enabled: z.boolean(),
  global: z.object({
    duration: DurationRuleSchema,
    contentTypes: z.array(ContentTypeIdSchema),
    liveStreams: z.enum(['allow', 'block'])
  }),
  genres: z.record(GenreSchema),
  subgenres: z.record(SubgenreSchema),
  blacklist: z.object({
    videos: z.record(
      z.object({
        title: z.string(),
        addedAt: z.number()
      })
    ),
    channels: z.record(
      ChannelRefSchema.extend({
        addedAt: z.number()
      })
    ),
    applyInSearch: z.boolean()
  }),
  shorts: z.object({
    blockAll: z.boolean(),
    hideInSearch: z.boolean(),
    directUrlBehavior: z.enum(['redirect', 'block'])
  }),
  diversity: z.object({
    maxPerChannel: z.number().min(1),
    dedupe: z.boolean(),
    maxImpressions: z.number().min(1),
    windowHours: z.number().min(1),
    subgenreWindow: z.object({
      w: z.number().min(1),
      k: z.number().min(1)
    }),
    hideWatched: z.boolean(),
    watchedThresholdPct: z.number().min(0).max(100)
  }),
  unclassified: z.object({
    policy: z.enum(['hide', 'show']),
    confidenceThreshold: z.number().min(0).max(1)
  }),
  overrides: z.object({
    videos: z.record(
      z.object({
        subgenreId: z.string(),
        contentTypes: z.array(ContentTypeIdSchema).optional()
      })
    ),
    channels: z.record(
      z.object({
        subgenreId: z.string(),
        contentTypes: z.array(ContentTypeIdSchema).optional()
      })
    )
  }),
  surfaces: z.record(SurfaceIdSchema, SurfaceModeSchema),
  enrichment: z.object({
    watchPageFetch: z.boolean(),
    dataApiKey: z.string().nullable()
  }),
  debug: z.boolean()
});

export type ValidatedSettings = z.infer<typeof SettingsSchema>;
