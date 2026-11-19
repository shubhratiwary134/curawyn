import { describe, it, expect } from 'vitest';
import { getSeedTaxonomy } from '../../src/core/taxonomy/seedGenres';
import {
  createGenre,
  updateGenre,
  deleteGenre,
  createSubgenre,
  updateSubgenre,
  deleteSubgenre,
  reparentSubgenre,
  validateTaxonomyIntegrity,
  resetToSeedTaxonomy
} from '../../src/core/taxonomy/taxonomyOps';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';

describe('Seed Taxonomy Integrity', () => {
  const seed = getSeedTaxonomy();
  const genreList = Object.values(seed.genres);
  const subgenreList = Object.values(seed.subgenres);

  it('contains at least 12 genres (has 17)', () => {
    expect(genreList.length).toBeGreaterThanOrEqual(12);
  });

  it('each genre has between 4 and 8 subgenres', () => {
    for (const genre of genreList) {
      const subs = subgenreList.filter((s) => s.genreId === genre.id);
      expect(subs.length).toBeGreaterThanOrEqual(4);
      expect(subs.length).toBeLessThanOrEqual(8);
    }
  });

  it('every subgenre has a valid genreId and at least 5 weighted include terms', () => {
    const genreIds = new Set(genreList.map((g) => g.id));
    for (const sub of subgenreList) {
      expect(genreIds.has(sub.genreId)).toBe(true);
      expect(sub.include.length).toBeGreaterThanOrEqual(5);
      for (const kw of sub.include) {
        expect(kw.term.trim().length).toBeGreaterThan(0);
        expect(kw.weight).toBeGreaterThan(0);
      }
    }
  });

  it('passes validateTaxonomyIntegrity', () => {
    const integrity = validateTaxonomyIntegrity({
      ...DEFAULT_SETTINGS,
      genres: seed.genres,
      subgenres: seed.subgenres
    });
    expect(integrity.valid).toBe(true);
    expect(integrity.errors).toEqual([]);
  });
});

describe('Taxonomy Operations', () => {
  it('cascades delete from genre to all its subgenres', () => {
    let settings = { ...DEFAULT_SETTINGS };
    const genreIdToDelete = 'tech';
    const subgenresBefore = Object.values(settings.subgenres).filter(
      (s) => s.genreId === genreIdToDelete
    );
    expect(subgenresBefore.length).toBeGreaterThan(0);

    settings = deleteGenre(settings, genreIdToDelete);
    expect(settings.genres[genreIdToDelete]).toBeUndefined();

    const subgenresAfter = Object.values(settings.subgenres).filter(
      (s) => s.genreId === genreIdToDelete
    );
    expect(subgenresAfter.length).toBe(0);

    const integrity = validateTaxonomyIntegrity(settings);
    expect(integrity.valid).toBe(true);
  });

  it('prevents creating duplicate genre names', () => {
    expect(() =>
      createGenre(DEFAULT_SETTINGS, {
        id: 'tech_dup',
        name: 'Technology',
        enabled: true,
        blocked: false,
        duration: null,
        contentTypes: null,
        ytCategoryIds: [28],
        builtIn: false
      })
    ).toThrow(/already exists/i);
  });

  it('creates and updates a custom genre and subgenre', () => {
    let settings = createGenre(DEFAULT_SETTINGS, {
      id: 'custom_cat',
      name: 'Custom Category',
      enabled: true,
      blocked: false,
      duration: null,
      contentTypes: null,
      ytCategoryIds: [],
      builtIn: false
    });
    expect(settings.genres['custom_cat']).toBeDefined();

    settings = createSubgenre(settings, {
      id: 'custom_sub',
      genreId: 'custom_cat',
      name: 'Custom Subgenre',
      enabled: true,
      blocked: false,
      duration: null,
      contentTypes: null,
      include: [{ term: 'custom test', weight: 3 }],
      exclude: [],
      builtIn: false
    });
    expect(settings.subgenres['custom_sub']).toBeDefined();

    settings = updateGenre(settings, 'custom_cat', { enabled: false });
    expect(settings.genres['custom_cat'].enabled).toBe(false);

    settings = updateSubgenre(settings, 'custom_sub', { blocked: true });
    expect(settings.subgenres['custom_sub'].blocked).toBe(true);
  });

  it('re-parents a subgenre safely to another existing genre', () => {
    let settings = { ...DEFAULT_SETTINGS };
    const subId = 'prog_web'; // starts under 'programming'
    expect(settings.subgenres[subId].genreId).toBe('programming');

    settings = reparentSubgenre(settings, subId, 'tech');
    expect(settings.subgenres[subId].genreId).toBe('tech');

    const integrity = validateTaxonomyIntegrity(settings);
    expect(integrity.valid).toBe(true);
  });

  it('deletes single subgenre without affecting siblings or parent', () => {
    let settings = { ...DEFAULT_SETTINGS };
    const subId = 'prog_web';
    settings = deleteSubgenre(settings, subId);
    expect(settings.subgenres[subId]).toBeUndefined();
    expect(settings.genres['programming']).toBeDefined();
  });

  it('resets to seed taxonomy cleanly', () => {
    let settings = deleteGenre(DEFAULT_SETTINGS, 'programming');
    expect(settings.genres['programming']).toBeUndefined();

    settings = resetToSeedTaxonomy(settings);
    expect(settings.genres['programming']).toBeDefined();
    expect(settings.subgenres['prog_web']).toBeDefined();
  });
});
