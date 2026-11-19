import { VideoMeta } from '../core/types';

export interface EnrichedMetadata {
  videoId: string;
  description?: string;
  tags?: string[];
  ytCategoryId?: number;
  durationSec?: number | null;
  isLive?: boolean;
}

export interface MetadataProvider {
  name: string;
  fetchMetadata(videoId: string): Promise<EnrichedMetadata | null>;
}
