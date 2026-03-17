export type VideoCategory = 'Music' | 'Sport' | 'Film' | 'Gaming' | 'Other';

export interface VideoMeta {
  id: string;
  youtubeId: string;
  title: string;
  artist?: string;
  duration: number;         // seconds
  thumbnailUrl: string;
  category?: VideoCategory;
}

export interface HapticsMapEntry {
  videoId: string;
  youtubeId: string;
  hapticsFile: string;
}

export interface HapticsMap {
  version: string;
  entries: HapticsMapEntry[];
}

export interface HapticEvent {
  delay?: number;      // ms to wait before firing (from video start for first event, from end of previous for rest)
  duration: number;    // vibration on-time in ms
  intensity: number;   // 0-1
}

export interface HapticPattern {
  videoId: string;
  totalDuration: number;
  events: HapticEvent[];
}

export type Route = 'home' | 'player' | 'feedback';

export interface RouteParams {
  videoId?: string;
}

export interface RouterState {
  route: Route;
  params: RouteParams;
}

export interface FeedbackQuestion {
  id: string;
  label: string;
  rating: number;           // 0-5, 0 = unset
}

export interface FeedbackSubmission {
  timestamp: string;        // ISO 8601
  videoId?: string;
  questions: FeedbackQuestion[];
}

export interface YTPlayerEvent {
  data: number;
  target: YTPlayer;
}

export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

export const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED:      0,
  PLAYING:    1,
  PAUSED:     2,
  BUFFERING:  3,
  CUED:       5,
} as const;

export interface HapticsServiceOptions {
  pattern: HapticPattern;
  onEvent?: (event: HapticEvent) => void;
  onUnsupported?: () => void;
}
