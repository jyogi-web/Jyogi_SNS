import { PostType } from "@/types/post";

export type HomeFeedUserMapType = Record<
  string,
  {
    iconUrl?: string;
    displayName?: string;
    setID?: string;
    username?: string;
  }
>;

export type HomeFeedCache = {
  userId: string | null;
  posts: PostType[];
  stampList: string[];
  userMap: HomeFeedUserMapType;
  fetchedAt: number;
};

export const HOME_FEED_CACHE_TTL_MS = 2 * 60 * 1000;

let homeFeedCache: HomeFeedCache | null = null;

export const getHomeFeedCache = (): HomeFeedCache | null => homeFeedCache;

export const setHomeFeedCache = (cache: HomeFeedCache | null): void => {
  homeFeedCache = cache;
};
