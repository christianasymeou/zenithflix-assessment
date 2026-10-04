export interface ContentItem {
  id: number;
  title: string;
  year: number;
  genre: string[];
  /** Out of 10 */
  rating: number;
  thumbnail: string;
  video_url: string;
  /** Runtime in minutes */
  duration: number;
  description: string;
  cast: string[];
  /** Percentage watched, 0–100 */
  watchProgress: number;
}

export interface ApiResponse {
  categories: {
    trending: ContentItem[];
  };
}
