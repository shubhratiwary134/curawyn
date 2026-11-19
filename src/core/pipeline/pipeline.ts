import {
  Decision,
  VideoMeta,
  Classification,
  Settings,
  SurfaceId,
  SurfaceMode
} from '../types';
import { evaluateBlacklistStep } from './steps/blacklistStep';
import { evaluateShortsStep } from './steps/shortsStep';
import { evaluateLiveStep } from './steps/liveStep';
import { evaluateWhitelistStep } from './steps/whitelistStep';
import { evaluateDurationStep } from './steps/durationStep';
import { evaluateContentTypeStep } from './steps/contentTypeStep';
import { evaluateDiversityStep } from './diversity/diversityStep';
import { DiversitySessionState } from './diversity/diversitySession';

export async function evaluatePipeline(
  meta: VideoMeta,
  classification: Classification | null,
  settings: Settings,
  surfaceId: SurfaceId,
  surfaceMode: SurfaceMode,
  diversitySession?: DiversitySessionState,
  getImpressionCount?: (videoId: string, windowHours: number) => Promise<number>,
  isSeen?: (videoId: string) => Promise<boolean> | boolean
): Promise<Decision> {
  // 0. Passthrough mode checks
  if (!settings.enabled || !settings.onboardingDone) {
    return { action: 'show', reason: 'passthrough' };
  }

  // If surface is bypass (e.g. search, history)
  if (surfaceMode === 'bypass') {
    // Single exception: if blacklist.applyInSearch is ON and on search surface
    if (surfaceId === 'search' && settings.blacklist.applyInSearch) {
      const blDec = evaluateBlacklistStep(meta, classification, settings);
      if (blDec) return blDec;
    }
    return { action: 'show', reason: 'allowed' };
  }

  // STEP 1: Blacklist (wins over everything)
  const blacklistDecision = evaluateBlacklistStep(meta, classification, settings);
  if (blacklistDecision) {
    return blacklistDecision;
  }

  // If surface mode is blacklistOnly (e.g. channel pages, playlists), stop here
  if (surfaceMode === 'blacklistOnly') {
    return { action: 'show', reason: 'allowed' };
  }

  // STEP 2: Shorts blocker
  const shortsDecision = evaluateShortsStep(meta, settings, surfaceId);
  if (shortsDecision) {
    return shortsDecision;
  }

  // STEP 3: Live & Premiere policy
  const liveDecision = evaluateLiveStep(meta, settings);
  if (liveDecision) {
    return liveDecision;
  }

  // STEP 4: Genre & Subgenre Whitelist
  const whitelistDecision = evaluateWhitelistStep(classification, settings);
  if (whitelistDecision) {
    return whitelistDecision;
  }

  // STEP 5: Duration limit (resolved subgenre -> genre -> global)
  const durationDecision = evaluateDurationStep(meta, classification, settings);
  if (durationDecision) {
    return durationDecision;
  }

  // STEP 6: Content types (resolved subgenre -> genre -> global)
  const contentTypeDecision = evaluateContentTypeStep(classification, settings);
  if (contentTypeDecision) {
    return contentTypeDecision;
  }

  // STEP 7: Diversity engine (stateful, last)
  if (diversitySession) {
    const diversityDecision = await evaluateDiversityStep(
      meta,
      classification,
      settings,
      diversitySession,
      getImpressionCount,
      isSeen
    );
    if (diversityDecision) {
      return diversityDecision;
    }
  }

  // All filter steps passed
  return { action: 'show', reason: 'allowed' };
}
