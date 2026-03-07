export interface Video {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  available: boolean;
  category?: string;
  tags?: string[];
}

export const VIDEO_CATALOG: Video[] = [
  {
    id: 'meet-clara',
    title: 'Meet Clara',
    description: 'Meet Clara, your AI assistant ready to help you',
    youtubeId: 'VC01cLzxjo4',
    available: true,
    category: 'introduction',
    tags: ['ai', 'assistant', 'introduction']
  },
  {
    id: 'overview',
    title: 'LifeLink Sync Overview',
    description: 'Complete overview of LifeLink Sync features and capabilities',
    youtubeId: '2LBrvRXiYwg',
    available: true,
    category: 'overview',
    tags: ['overview', 'features', 'capabilities']
  },
  {
    id: 'family',
    title: 'LifeLink Sync Family Protection',
    description: 'How LifeLink Sync protects your entire family',
    youtubeId: 'A5xiJUS0aq0',
    available: true,
    category: 'family',
    tags: ['family', 'protection', 'safety']
  },
  {
    id: 'all-ages',
    title: 'LifeLink Sync - For All Ages',
    description: 'Protection solutions for every age group',
    youtubeId: 'G016_sqtg48',
    available: true,
    category: 'demographics',
    tags: ['ages', 'demographics', 'protection']
  },
  {
    id: 'spain',
    title: 'LifeLink Sync - Call Centre Spain',
    description: 'Our Spanish call center operations and services',
    youtubeId: 'zOgSKzktc7g',
    available: true,
    category: 'regional',
    tags: ['spain', 'call-center', 'regional']
  }
];

export const getVideoById = (id: string): Video | undefined => {
  return VIDEO_CATALOG.find(video => video.id === id);
};

export const getVideosByCategory = (category: string): Video[] => {
  return VIDEO_CATALOG.filter(video => video.category === category);
};

export const getAvailableVideos = (): Video[] => {
  return VIDEO_CATALOG.filter(video => video.available);
};