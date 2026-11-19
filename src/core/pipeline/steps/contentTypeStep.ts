import { Decision, Classification, Settings } from '../../types';
import { resolveContentTypes } from '../../resolve/contentTypes';

export function evaluateContentTypeStep(
  classification: Classification | null,
  settings: Settings
): Decision | null {
  const subgenre = classification?.subgenreId
    ? settings.subgenres[classification.subgenreId] || null
    : null;
  const genre = classification?.genreId ? settings.genres[classification.genreId] || null : null;

  const resolved = resolveContentTypes(subgenre, genre, settings.global.contentTypes);
  const allowedSet = new Set(resolved.value);

  // If explicit empty set -> no types allowed
  if (resolved.isExplicitEmpty) {
    return {
      action: 'hide',
      reason: 'content_type_disallowed',
      detail: 'No content types are allowed for this node'
    };
  }

  const videoTypes = classification?.contentTypes || ['other'];

  // Check if any of video's content types are in allowedSet
  const passes = videoTypes.some((t) => allowedSet.has(t));
  if (!passes) {
    return {
      action: 'hide',
      reason: 'content_type_disallowed',
      detail: `None of video content types [${videoTypes.join(', ')}] are allowed`
    };
  }

  return null;
}
