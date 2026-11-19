import { Decision, Classification, Settings } from '../../types';

export function evaluateWhitelistStep(
  classification: Classification | null,
  settings: Settings
): Decision | null {
  // If no classification or confidence is below threshold -> apply unclassified policy
  const threshold = settings.unclassified.confidenceThreshold;
  if (!classification || classification.confidence < threshold || !classification.genreId) {
    if (settings.unclassified.policy === 'hide') {
      return {
        action: 'hide',
        reason: 'unclassified',
        detail: `Confidence (${classification ? classification.confidence : 0}) below threshold ${threshold}`
      };
    }
    // If policy is 'show', allow unclassified video to pass whitelist
    return null;
  }

  const genre = settings.genres[classification.genreId];
  if (!genre) {
    return {
      action: 'hide',
      reason: 'not_whitelisted',
      detail: `Genre ${classification.genreId} not found`
    };
  }

  // If genre itself is disabled -> hide
  if (!genre.enabled) {
    return {
      action: 'hide',
      reason: 'genre_disabled',
      detail: `Parent genre "${genre.name}" is disabled`
    };
  }

  // If subgenre is present
  if (classification.subgenreId) {
    const subgenre = settings.subgenres[classification.subgenreId];
    if (subgenre) {
      if (!subgenre.enabled) {
        return {
          action: 'hide',
          reason: 'not_whitelisted',
          detail: `Subgenre "${subgenre.name}" is disabled`
        };
      }
    }
  }

  // Whitelist checks passed
  return null;
}
