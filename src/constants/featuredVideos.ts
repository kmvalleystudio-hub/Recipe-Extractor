export interface FeaturedVideo {
  id: string;
  youtubeId: string;
  title: string;
  videoUrl: string;
  duration: string;
}

/** Curated cooking videos for the home carousel — YouTube embeds on web */
export const FEATURED_VIDEOS: FeaturedVideo[] = [
  {
    id: 'scrambled-eggs',
    youtubeId: 'PUPq6wH_ttQ',
    title: 'Perfect Scrambled Eggs',
    videoUrl: 'https://www.youtube.com/watch?v=PUPq6wH_ttQ',
    duration: '4 MIN',
  },
  {
    id: 'garlic-pasta',
    youtubeId: '8TIMUJ7KzwY',
    title: 'Garlic Butter Pasta',
    videoUrl: 'https://www.youtube.com/watch?v=8TIMUJ7KzwY',
    duration: '12 MIN',
  },
  {
    id: 'chicken-stir-fry',
    youtubeId: 'cV3ji20zLa4',
    title: 'Chicken Stir Fry',
    videoUrl: 'https://www.youtube.com/watch?v=cV3ji20zLa4',
    duration: '15 MIN',
  },
  {
    id: 'pancakes',
    youtubeId: 'FLd00Bx4tOk',
    title: 'Fluffy Pancakes',
    videoUrl: 'https://www.youtube.com/watch?v=FLd00Bx4tOk',
    duration: '8 MIN',
  },
];
