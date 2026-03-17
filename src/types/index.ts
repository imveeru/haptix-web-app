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

export type HapticPreset =
  | 'success' | 'warning' | 'error'
  | 'light'   | 'medium'  | 'heavy'
  | 'soft'    | 'rigid'   | 'nudge' | 'buzz';

export interface VibrationPulse {
  duration: number;     // on-time in ms
  delay?: number;       // silence before this pulse in ms
  intensity?: number;   // 0–1
}

export interface NamedVibrationPattern {
  pattern: VibrationPulse[];
  description?: string;
}

export type HapticTrigger =
  | HapticPreset
  | number
  | number[]
  | VibrationPulse[]
  | NamedVibrationPattern;

export interface HapticEvent {
  time: number;             // seconds from video start
  trigger: HapticTrigger;   // passed verbatim to haptics.trigger()
  description?: string;     // authoring label only, unused at runtime
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
  rating: number;           // 0–5, 0 = unset
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
