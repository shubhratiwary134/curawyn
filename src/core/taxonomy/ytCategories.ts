export interface YtCategoryMapping {
  id: number;
  name: string;
}

export const YT_CATEGORIES: Record<number, YtCategoryMapping> = {
  1: { id: 1, name: 'Film & Animation' },
  2: { id: 2, name: 'Autos & Vehicles' },
  10: { id: 10, name: 'Music' },
  15: { id: 15, name: 'Pets & Animals' },
  17: { id: 17, name: 'Sports' },
  19: { id: 19, name: 'Travel & Events' },
  20: { id: 20, name: 'Gaming' },
  22: { id: 22, name: 'People & Blogs' },
  23: { id: 23, name: 'Comedy' },
  24: { id: 24, name: 'Entertainment' },
  25: { id: 25, name: 'News & Politics' },
  26: { id: 26, name: 'Howto & Style' },
  27: { id: 27, name: 'Education' },
  28: { id: 28, name: 'Science & Technology' }
};
