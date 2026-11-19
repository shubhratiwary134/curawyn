import { DurationRule, Genre, Subgenre } from '../types';

export type BoundSource = 'subgenre' | 'genre' | 'global' | 'none';

export interface ResolvedDuration {
  value: DurationRule;
  inheritedFrom: {
    minSec: BoundSource;
    maxSec: BoundSource;
  };
  isValid: boolean;
  error?: string;
}

export function resolveDuration(
  subgenre: Subgenre | null,
  genre: Genre | null,
  globalRule: DurationRule
): ResolvedDuration {
  let minSec: number | null = null;
  let minSource: BoundSource = 'none';

  let maxSec: number | null = null;
  let maxSource: BoundSource = 'none';

  // 1. Resolve minSec: subgenre -> genre -> global
  if (subgenre && subgenre.duration && subgenre.duration.minSec !== null) {
    minSec = subgenre.duration.minSec;
    minSource = 'subgenre';
  } else if (genre && genre.duration && genre.duration.minSec !== null) {
    minSec = genre.duration.minSec;
    minSource = 'genre';
  } else if (globalRule.minSec !== null) {
    minSec = globalRule.minSec;
    minSource = 'global';
  }

  // 2. Resolve maxSec: subgenre -> genre -> global
  if (subgenre && subgenre.duration && subgenre.duration.maxSec !== null) {
    maxSec = subgenre.duration.maxSec;
    maxSource = 'subgenre';
  } else if (genre && genre.duration && genre.duration.maxSec !== null) {
    maxSec = genre.duration.maxSec;
    maxSource = 'genre';
  } else if (globalRule.maxSec !== null) {
    maxSec = globalRule.maxSec;
    maxSource = 'global';
  }

  let isValid = true;
  let error: string | undefined;

  if (minSec !== null && maxSec !== null && minSec > maxSec) {
    isValid = false;
    error = `Minimum duration (${minSec}s) cannot exceed maximum duration (${maxSec}s)`;
  }

  return {
    value: { minSec, maxSec },
    inheritedFrom: {
      minSec: minSource,
      maxSec: maxSource
    },
    isValid,
    error
  };
}
