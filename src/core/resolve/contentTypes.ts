import { ContentTypeId, Genre, Subgenre } from '../types';

export type ContentTypesSource = 'subgenre' | 'genre' | 'global';

export interface ResolvedContentTypes {
  value: ContentTypeId[];
  inheritedFrom: ContentTypesSource;
  isExplicitEmpty: boolean;
}

export function resolveContentTypes(
  subgenre: Subgenre | null,
  genre: Genre | null,
  globalTypes: ContentTypeId[]
): ResolvedContentTypes {
  // Most specific non-null set wins: subgenre -> genre -> global
  if (subgenre && subgenre.contentTypes !== null) {
    return {
      value: subgenre.contentTypes,
      inheritedFrom: 'subgenre',
      isExplicitEmpty: subgenre.contentTypes.length === 0
    };
  }

  if (genre && genre.contentTypes !== null) {
    return {
      value: genre.contentTypes,
      inheritedFrom: 'genre',
      isExplicitEmpty: genre.contentTypes.length === 0
    };
  }

  return {
    value: globalTypes,
    inheritedFrom: 'global',
    isExplicitEmpty: globalTypes.length === 0
  };
}
