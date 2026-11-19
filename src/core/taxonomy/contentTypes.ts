import { ContentTypeId } from '../types';

export interface ContentTypeInfo {
  id: ContentTypeId;
  label: string;
  description: string;
}

export const CONTENT_TYPE_REGISTRY: Record<ContentTypeId, ContentTypeInfo> = {
  tutorial: {
    id: 'tutorial',
    label: 'Tutorial & Guide',
    description: 'Step-by-step instructions, how-to walkthroughs, and setup guides.'
  },
  educational: {
    id: 'educational',
    label: 'Educational',
    description: 'Conceptual explanations, academic lectures, and knowledge building.'
  },
  deep_dive: {
    id: 'deep_dive',
    label: 'Deep Dive',
    description: 'In-depth analysis, comprehensive breakdowns, and exhaustive studies.'
  },
  review: {
    id: 'review',
    label: 'Review',
    description: 'Evaluations, impressions, and long-term ownership tests.'
  },
  comparison: {
    id: 'comparison',
    label: 'Comparison',
    description: 'Head-to-head showdowns, versus videos, and benchmarking comparisons.'
  },
  news: {
    id: 'news',
    label: 'News & Current Affairs',
    description: 'Current events, updates, releases, and announcements.'
  },
  documentary: {
    id: 'documentary',
    label: 'Documentary',
    description: 'Investigative stories, history, retrospectives, and storytelling.'
  },
  analysis: {
    id: 'analysis',
    label: 'Analysis & Breakdown',
    description: 'Critical examination of trends, design choices, data, or incidents.'
  },
  interview_podcast: {
    id: 'interview_podcast',
    label: 'Interview & Podcast',
    description: 'Conversations, long-form podcast episodes, fireside chats, and Q&As.'
  },
  entertainment: {
    id: 'entertainment',
    label: 'Entertainment',
    description: 'Skits, comedic gaming, casual fun, and light viewing.'
  },
  reaction: {
    id: 'reaction',
    label: 'Reaction',
    description: 'Creators reacting to or reviewing external media and performances.'
  },
  list: {
    id: 'list',
    label: 'List & Compilation',
    description: 'Top 10s, best-ofs, ranked roundups, and highlights.'
  },
  vlog_experience: {
    id: 'vlog_experience',
    label: 'Vlog & Experience',
    description: 'Personal day-in-the-life, travel diaries, and behind-the-scenes.'
  },
  motivational: {
    id: 'motivational',
    label: 'Motivational',
    description: 'Inspiration, mindset speeches, productivity philosophy, and encouragement.'
  },
  experiment: {
    id: 'experiment',
    label: 'Experiment & Demonstration',
    description: 'Practical experiments, myth-busting, demonstrations, and trial-by-fire tests.'
  },
  other: {
    id: 'other',
    label: 'Other / Unclassified',
    description: 'Videos without a clear identifiable content structure or style.'
  }
};
