import { describe, it, expect } from 'vitest';
import { resolveDuration } from '../../src/core/resolve/duration';
import { resolveContentTypes } from '../../src/core/resolve/contentTypes';
import { Genre, Subgenre, DurationRule, ContentTypeId } from '../../src/core/types';

describe('Duration Inheritance Resolver', () => {
  const globalRule: DurationRule = { minSec: 300, maxSec: 3600 };

  const makeGenre = (duration: DurationRule | null): Genre => ({
    id: 'g1',
    name: 'Genre 1',
    enabled: true,
    blocked: false,
    duration,
    contentTypes: null,
    ytCategoryIds: [],
    order: 1,
    builtIn: true
  });

  const makeSubgenre = (duration: DurationRule | null): Subgenre => ({
    id: 'sg1',
    genreId: 'g1',
    name: 'Subgenre 1',
    enabled: true,
    blocked: false,
    duration,
    contentTypes: null,
    include: [{ term: 'test', weight: 1 }],
    exclude: [],
    order: 1,
    builtIn: true
  });

  it('inherits global bounds when genre and subgenre rules are null', () => {
    const res = resolveDuration(makeSubgenre(null), makeGenre(null), globalRule);
    expect(res.value).toEqual({ minSec: 300, maxSec: 3600 });
    expect(res.inheritedFrom).toEqual({ minSec: 'global', maxSec: 'global' });
    expect(res.isValid).toBe(true);
  });

  it('resolves per-bound: subgenre overrides maxSec while inheriting minSec from genre', () => {
    const genre = makeGenre({ minSec: 600, maxSec: null });
    const subgenre = makeSubgenre({ minSec: null, maxSec: 1800 });

    const res = resolveDuration(subgenre, genre, globalRule);
    expect(res.value).toEqual({ minSec: 600, maxSec: 1800 });
    expect(res.inheritedFrom).toEqual({ minSec: 'genre', maxSec: 'subgenre' });
    expect(res.isValid).toBe(true);
  });

  it('resolves per-bound: subgenre overrides minSec and inherits maxSec from global when genre is null', () => {
    const genre = makeGenre(null);
    const subgenre = makeSubgenre({ minSec: 900, maxSec: null });

    const res = resolveDuration(subgenre, genre, globalRule);
    expect(res.value).toEqual({ minSec: 900, maxSec: 3600 });
    expect(res.inheritedFrom).toEqual({ minSec: 'subgenre', maxSec: 'global' });
    expect(res.isValid).toBe(true);
  });

  it('subgenre overrides both bounds completely', () => {
    const genre = makeGenre({ minSec: 100, maxSec: 2000 });
    const subgenre = makeSubgenre({ minSec: 120, maxSec: 600 });

    const res = resolveDuration(subgenre, genre, globalRule);
    expect(res.value).toEqual({ minSec: 120, maxSec: 600 });
    expect(res.inheritedFrom).toEqual({ minSec: 'subgenre', maxSec: 'subgenre' });
    expect(res.isValid).toBe(true);
  });

  it('handles unbounded null bounds correctly', () => {
    const unboundGlobal: DurationRule = { minSec: null, maxSec: null };
    const res = resolveDuration(null, null, unboundGlobal);
    expect(res.value).toEqual({ minSec: null, maxSec: null });
    expect(res.inheritedFrom).toEqual({ minSec: 'none', maxSec: 'none' });
    expect(res.isValid).toBe(true);
  });

  it('detects invalid configuration when minSec > maxSec across inherited boundaries', () => {
    const genre = makeGenre({ minSec: 4000, maxSec: null }); // min 4000s
    const subgenre = makeSubgenre({ minSec: null, maxSec: 1000 }); // max 1000s

    const res = resolveDuration(subgenre, genre, globalRule);
    expect(res.value).toEqual({ minSec: 4000, maxSec: 1000 });
    expect(res.isValid).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.error).toMatch(/cannot exceed/i);
  });
});

describe('Content Types Inheritance Resolver', () => {
  const globalTypes: ContentTypeId[] = ['tutorial', 'educational', 'deep_dive'];

  const makeGenre = (contentTypes: ContentTypeId[] | null): Genre => ({
    id: 'g1',
    name: 'Genre 1',
    enabled: true,
    blocked: false,
    duration: null,
    contentTypes,
    ytCategoryIds: [],
    order: 1,
    builtIn: true
  });

  const makeSubgenre = (contentTypes: ContentTypeId[] | null): Subgenre => ({
    id: 'sg1',
    genreId: 'g1',
    name: 'Subgenre 1',
    enabled: true,
    blocked: false,
    duration: null,
    contentTypes,
    include: [{ term: 'test', weight: 1 }],
    exclude: [],
    order: 1,
    builtIn: true
  });

  it('inherits global types when subgenre and genre are null', () => {
    const res = resolveContentTypes(makeSubgenre(null), makeGenre(null), globalTypes);
    expect(res.value).toEqual(globalTypes);
    expect(res.inheritedFrom).toBe('global');
    expect(res.isExplicitEmpty).toBe(false);
  });

  it('genre overrides global when subgenre is null', () => {
    const genre = makeGenre(['review', 'comparison']);
    const res = resolveContentTypes(makeSubgenre(null), genre, globalTypes);
    expect(res.value).toEqual(['review', 'comparison']);
    expect(res.inheritedFrom).toBe('genre');
    expect(res.isExplicitEmpty).toBe(false);
  });

  it('subgenre overrides genre and global', () => {
    const genre = makeGenre(['review', 'comparison']);
    const subgenre = makeSubgenre(['experiment']);
    const res = resolveContentTypes(subgenre, genre, globalTypes);
    expect(res.value).toEqual(['experiment']);
    expect(res.inheritedFrom).toBe('subgenre');
    expect(res.isExplicitEmpty).toBe(false);
  });

  it('supports explicit empty array meaning block all types', () => {
    const subgenre = makeSubgenre([]);
    const res = resolveContentTypes(subgenre, makeGenre(['review']), globalTypes);
    expect(res.value).toEqual([]);
    expect(res.inheritedFrom).toBe('subgenre');
    expect(res.isExplicitEmpty).toBe(true);
  });
});
