import { Settings, Genre, Subgenre } from '../types';
import { getSeedTaxonomy } from './seedGenres';

export function createGenre(
  settings: Settings,
  genreData: Omit<Genre, 'order'> & { order?: number }
): Settings {
  const existingNames = Object.values(settings.genres).map((g) => g.name.toLowerCase().trim());
  if (existingNames.includes(genreData.name.toLowerCase().trim())) {
    throw new Error(`Genre name "${genreData.name}" already exists`);
  }

  const nextOrder =
    genreData.order ??
    Object.values(settings.genres).reduce((max, g) => Math.max(max, g.order), 0) + 1;

  const newGenre: Genre = {
    ...genreData,
    order: nextOrder
  };

  return {
    ...settings,
    genres: {
      ...settings.genres,
      [newGenre.id]: newGenre
    }
  };
}

export function updateGenre(
  settings: Settings,
  genreId: string,
  patch: Partial<Omit<Genre, 'id'>>
): Settings {
  const target = settings.genres[genreId];
  if (!target) {
    throw new Error(`Genre with id "${genreId}" not found`);
  }

  if (patch.name && patch.name.toLowerCase().trim() !== target.name.toLowerCase().trim()) {
    const existingNames = Object.values(settings.genres)
      .filter((g) => g.id !== genreId)
      .map((g) => g.name.toLowerCase().trim());
    if (existingNames.includes(patch.name.toLowerCase().trim())) {
      throw new Error(`Genre name "${patch.name}" already exists`);
    }
  }

  return {
    ...settings,
    genres: {
      ...settings.genres,
      [genreId]: {
        ...target,
        ...patch
      }
    }
  };
}

export function deleteGenre(settings: Settings, genreId: string): Settings {
  if (!settings.genres[genreId]) {
    return settings;
  }

  const newGenres = { ...settings.genres };
  delete newGenres[genreId];

  // Cascade delete subgenres belonging to this genre
  const newSubgenres = { ...settings.subgenres };
  for (const [subId, sub] of Object.entries(settings.subgenres)) {
    if (sub.genreId === genreId) {
      delete newSubgenres[subId];
    }
  }

  return {
    ...settings,
    genres: newGenres,
    subgenres: newSubgenres
  };
}

export function createSubgenre(
  settings: Settings,
  subgenreData: Omit<Subgenre, 'order'> & { order?: number }
): Settings {
  if (!settings.genres[subgenreData.genreId]) {
    throw new Error(`Parent genre with id "${subgenreData.genreId}" not found`);
  }

  const siblings = Object.values(settings.subgenres).filter(
    (sg) => sg.genreId === subgenreData.genreId
  );
  const siblingNames = siblings.map((s) => s.name.toLowerCase().trim());
  if (siblingNames.includes(subgenreData.name.toLowerCase().trim())) {
    throw new Error(
      `Subgenre name "${subgenreData.name}" already exists under parent genre`
    );
  }

  const nextOrder =
    subgenreData.order ??
    siblings.reduce((max, s) => Math.max(max, s.order), 0) + 1;

  const newSubgenre: Subgenre = {
    ...subgenreData,
    order: nextOrder
  };

  return {
    ...settings,
    subgenres: {
      ...settings.subgenres,
      [newSubgenre.id]: newSubgenre
    }
  };
}

export function updateSubgenre(
  settings: Settings,
  subgenreId: string,
  patch: Partial<Omit<Subgenre, 'id'>>
): Settings {
  const target = settings.subgenres[subgenreId];
  if (!target) {
    throw new Error(`Subgenre with id "${subgenreId}" not found`);
  }

  const effectiveGenreId = patch.genreId ?? target.genreId;
  if (!settings.genres[effectiveGenreId]) {
    throw new Error(`Target genre "${effectiveGenreId}" does not exist`);
  }

  if (patch.name && patch.name.toLowerCase().trim() !== target.name.toLowerCase().trim()) {
    const siblings = Object.values(settings.subgenres).filter(
      (sg) => sg.genreId === effectiveGenreId && sg.id !== subgenreId
    );
    if (siblings.some((s) => s.name.toLowerCase().trim() === patch.name!.toLowerCase().trim())) {
      throw new Error(`Subgenre name "${patch.name}" already exists under parent genre`);
    }
  }

  return {
    ...settings,
    subgenres: {
      ...settings.subgenres,
      [subgenreId]: {
        ...target,
        ...patch
      }
    }
  };
}

export function deleteSubgenre(settings: Settings, subgenreId: string): Settings {
  if (!settings.subgenres[subgenreId]) {
    return settings;
  }

  const newSubgenres = { ...settings.subgenres };
  delete newSubgenres[subgenreId];

  return {
    ...settings,
    subgenres: newSubgenres
  };
}

export function reparentSubgenre(
  settings: Settings,
  subgenreId: string,
  newGenreId: string
): Settings {
  const target = settings.subgenres[subgenreId];
  if (!target) {
    throw new Error(`Subgenre with id "${subgenreId}" not found`);
  }
  if (!settings.genres[newGenreId]) {
    throw new Error(`Target genre with id "${newGenreId}" not found`);
  }

  return updateSubgenre(settings, subgenreId, { genreId: newGenreId });
}

export function reorderGenres(settings: Settings, orderedIds: string[]): Settings {
  const updatedGenres = { ...settings.genres };
  orderedIds.forEach((id, index) => {
    if (updatedGenres[id]) {
      updatedGenres[id] = {
        ...updatedGenres[id],
        order: index + 1
      };
    }
  });

  return {
    ...settings,
    genres: updatedGenres
  };
}

export function reorderSubgenres(
  settings: Settings,
  _genreId: string,
  orderedIds: string[]
): Settings {
  const updatedSubgenres = { ...settings.subgenres };
  orderedIds.forEach((id, index) => {
    if (updatedSubgenres[id]) {
      updatedSubgenres[id] = {
        ...updatedSubgenres[id],
        order: index + 1
      };
    }
  });

  return {
    ...settings,
    subgenres: updatedSubgenres
  };
}

export function validateTaxonomyIntegrity(settings: Settings): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const genreIds = new Set(Object.keys(settings.genres));

  // Check unique genre names
  const genreNames = new Set<string>();
  for (const [id, genre] of Object.entries(settings.genres)) {
    const normalized = genre.name.toLowerCase().trim();
    if (genreNames.has(normalized)) {
      errors.push(`Duplicate genre name "${genre.name}" on id "${id}"`);
    }
    genreNames.add(normalized);
  }

  // Check subgenres
  const subgenreNamesByGenre: Record<string, Set<string>> = {};
  for (const [subId, sub] of Object.entries(settings.subgenres)) {
    if (!genreIds.has(sub.genreId)) {
      errors.push(`Orphan subgenre "${sub.name}" (id: ${subId}) references missing genreId "${sub.genreId}"`);
    } else {
      if (!subgenreNamesByGenre[sub.genreId]) {
        subgenreNamesByGenre[sub.genreId] = new Set();
      }
      const norm = sub.name.toLowerCase().trim();
      if (subgenreNamesByGenre[sub.genreId].has(norm)) {
        errors.push(`Duplicate subgenre name "${sub.name}" in genre "${sub.genreId}"`);
      }
      subgenreNamesByGenre[sub.genreId].add(norm);
    }

    if (sub.include.length === 0) {
      errors.push(`Subgenre "${sub.name}" has no include keywords`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function resetToSeedTaxonomy(settings: Settings): Settings {
  const seed = getSeedTaxonomy();
  return {
    ...settings,
    genres: seed.genres,
    subgenres: seed.subgenres
  };
}
