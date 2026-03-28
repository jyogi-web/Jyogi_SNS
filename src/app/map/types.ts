export type SpotCategory = "グルメ" | "自然" | "観光" | "カフェ" | "その他";
export type ViewMode = "map" | "list";

export interface SpotPost {
  id: string;
  user_id: string;
  username: string;
  user_icon_url?: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  photo_url?: string;
  category: SpotCategory;
  likes: number;
  liked_by: string[];
  created_at: string;
}

export interface NewSpotData {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  photo_url?: string;
  category: SpotCategory;
}

export const CATEGORY_COLORS: Record<SpotCategory, string> = {
  グルメ: "text-orange-400",
  自然: "text-green-400",
  観光: "text-blue-400",
  カフェ: "text-yellow-400",
  その他: "text-gray-400",
};

export const CATEGORY_BG: Record<SpotCategory, string> = {
  グルメ: "bg-orange-500",
  自然: "bg-green-500",
  観光: "bg-blue-500",
  カフェ: "bg-yellow-500",
  その他: "bg-gray-500",
};

export const CATEGORIES: SpotCategory[] = ["グルメ", "自然", "観光", "カフェ", "その他"];
