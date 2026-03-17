# Haptix PWA — Requirements Document

> **Version:** 1.0.0  
> **Status:** Implementation-Ready  
> **Stack:** HTML · CSS · TypeScript · PWA · YouTube IFrame API · web-haptics (npm)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Structure](#2-project-structure)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Data Models & JSON Schemas](#4-data-models--json-schemas)
5. [TypeScript Interface Definitions](#5-typescript-interface-definitions)
6. [Routing Architecture](#6-routing-architecture)
7. [Page & Component Specifications](#7-page--component-specifications)
   - [7.1 Home Page](#71-home-page)
   - [7.2 Player Page](#72-player-page)
   - [7.3 Feedback Page](#73-feedback-page)
8. [PWA Requirements](#8-pwa-requirements)
9. [Design System](#9-design-system)
10. [Responsive Behavior](#10-responsive-behavior)
11. [Accessibility](#11-accessibility)
12. [Integration Notes](#12-integration-notes)

---

## 1. Project Overview

**Haptix** is a mobile-first Progressive Web App that delivers a curated library of YouTube videos enhanced with synchronized haptic feedback. The UI adheres strictly to Apple's Human Interface Guidelines — clean typography, generous whitespace, rounded components, and no emoji.

### Core User Flows

```
Home (video grid)
  └── tap card → Player Page (video + haptics)

Nav bar (persistent)
  └── tap feedback tab → Feedback Page (5-star survey)
```

### Design Philosophy

- Follows Apple HIG: SF Pro-equivalent typography, 8-pt grid, iOS-native feel
- No emoji anywhere — SF Symbols–style SVG icons only
- Optimized for 375px–430px mobile viewports (iPhone SE → iPhone Pro Max)
- Dark and light mode support via `prefers-color-scheme`

---

## 2. Project Structure

```
Haptix/
├── public/
│   ├── index.html                  # Single HTML entry point
│   ├── manifest.json               # PWA manifest
│   ├── service-worker.js           # Compiled SW (output)
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── apple-touch-icon.png    # 180×180
│
├── src/
│   ├── main.ts                     # App bootstrap & router init
│   ├── router.ts                   # Hash-based SPA router
│   │
│   ├── data/
│   │   ├── videos.json             # Video metadata array
│   │   └── haptics-map.json        # videoId → haptics file mapping
│   │
│   ├── haptics/
│   │   ├── video-001.json          # Per-video haptic pattern file
│   │   ├── video-002.json
│   │   └── ...
│   │
│   ├── types/
│   │   └── index.ts                # All TypeScript interfaces
│   │
│   ├── services/
│   │   ├── youtube.ts              # YT IFrame API wrapper
│   │   ├── haptics.ts              # Haptics API client
│   │   └── feedback.ts             # Mock form submission
│   │
│   ├── pages/
│   │   ├── home.ts                 # Home page controller
│   │   ├── player.ts               # Player page controller
│   │   └── feedback.ts             # Feedback page controller
│   │
│   ├── components/
│   │   ├── nav-bar.ts              # Bottom navigation bar
│   │   ├── video-card.ts           # Home page card component
│   │   ├── star-rating.ts          # 5-star input component
│   │   └── toast.ts                # Toast notification
│   │
│   ├── styles/
│   │   ├── tokens.css              # Design tokens (CSS variables)
│   │   ├── base.css                # Reset + global base styles
│   │   ├── components.css          # Reusable component styles
│   │   └── pages/
│   │       ├── home.css
│   │       ├── player.css
│   │       └── feedback.css
│   │
│   └── sw/
│       └── service-worker.ts       # Service worker source
│
├── tsconfig.json
├── package.json
└── requirements.md                 # This file
```

---

## 3. Tech Stack & Dependencies

### Core

| Concern | Technology |
|---|---|
| Language | TypeScript 5.x |
| Markup | HTML5 (single `index.html`) |
| Styling | Vanilla CSS (CSS custom properties) |
| Build | Vite 5.x (or esbuild standalone) |
| PWA | Web App Manifest + Service Worker API |
| Video | YouTube IFrame Player API (`https://www.youtube.com/iframe_api`) |
| Haptics | `web-haptics` npm package — wraps the browser Vibration API locally, zero network calls |

### No external UI frameworks. No React. No Vue.

### Dependencies

```json
{
  "dependencies": {
    "web-haptics": "^0.0.6"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vite-plugin-pwa": "^0.19.0"
  }
}
```

`web-haptics` is a zero-dependency MIT package bundled at build time via Vite. It has no peer dependencies and ships its own TypeScript types. It wraps the browser's native Vibration API — all haptic execution is entirely on-device with no network calls.

### Runtime Script Tags (loaded dynamically, no npm)

```html
<!-- YouTube IFrame API — loaded on demand in player.ts only -->
<script src="https://www.youtube.com/iframe_api" async defer></script>
```

---

## 4. Data Models & JSON Schemas

### 4.1 `videos.json` — Video Metadata

**Location:** `src/data/videos.json`  
**Purpose:** Master list of all videos shown on the Home page.

```json
[
  {
    "id": "video-001",
    "youtubeId": "dQw4w9WgXcQ",
    "title": "Never Gonna Give You Up",
    "artist": "Rick Astley",
    "duration": 213,
    "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
  }
]
```

#### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["id", "youtubeId", "title", "duration", "thumbnailUrl"],
    "properties": {
      "id":           { "type": "string", "pattern": "^video-[0-9]{3,}$" },
      "youtubeId":    { "type": "string", "description": "11-char YouTube video ID" },
      "title":        { "type": "string", "maxLength": 100 },
      "artist":       { "type": "string" },
      "duration":     { "type": "integer", "description": "Duration in seconds" },
      "thumbnailUrl": { "type": "string", "format": "uri" }
    }
  }
}
```

---

### 4.2 `haptics-map.json` — Video-to-Haptics Mapping

**Location:** `src/data/haptics-map.json`  
**Purpose:** Links each internal video `id` to its local haptic pattern file. No remote endpoints — all playback is on-device.

```json
{
  "version": "1.0",
  "entries": [
    {
      "videoId": "video-001",
      "youtubeId": "dQw4w9WgXcQ",
      "hapticsFile": "/haptics/video-001.json"
    }
  ]
}
```

#### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "entries"],
  "properties": {
    "version": { "type": "string" },
    "entries": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["videoId", "youtubeId", "hapticsFile"],
        "properties": {
          "videoId":     { "type": "string" },
          "youtubeId":   { "type": "string" },
          "hapticsFile": { "type": "string", "description": "Relative path to the haptic pattern JSON file in /haptics/" }
        },
        "additionalProperties": false
      }
    }
  }
}
```

---

### 4.3 Haptic Pattern File Schema

**Location:** `src/haptics/{video-id}.json`  
**Purpose:** Time-coded haptic cue sequence for a single video. Each event maps a timestamp to a `web-haptics` `trigger()` call. All values in the `trigger` field are native `web-haptics` API arguments — no custom wrappers.

#### Named Preset Cues

`web-haptics` exposes two categories of string presets passed directly to `trigger()`:

| Category | Preset values |
|---|---|
| **Notification** (outcomes) | `"success"`, `"warning"`, `"error"` |
| **Impact** (physical feel) | `"light"`, `"medium"`, `"heavy"`, `"soft"`, `"rigid"`, `"nudge"`, `"buzz"` |

#### Custom Pattern Cues

In addition to presets, `trigger()` accepts:

| Argument form | Type | Example | Use case |
|---|---|---|---|
| Single duration | `number` | `trigger(200)` | One-shot vibration of N ms |
| Duration array | `number[]` | `trigger([100, 50, 100])` | Alternating on/off pattern |
| Vibration objects | `Vibration[]` | `trigger([{ duration: 80, intensity: 0.8 }, { delay: 50, duration: 100 }])` | Per-pulse control with intensity |
| Named pattern object | `{ pattern, description }` | `trigger({ pattern: [{duration:50},{delay:50,duration:50}], description: "double-tap" })` | Labeled reusable pattern |

#### Example File

```json
{
  "videoId": "video-001",
  "totalDuration": 213,
  "events": [
    {
      "time": 0.5,
      "trigger": "medium",
      "description": "Beat drop — standard impact"
    },
    {
      "time": 3.2,
      "trigger": "success",
      "description": "Chorus hits"
    },
    {
      "time": 7.0,
      "trigger": [100, 50, 100],
      "description": "Rhythmic double pulse"
    },
    {
      "time": 12.4,
      "trigger": [
        { "duration": 80, "intensity": 0.9 },
        { "delay": 40, "duration": 120, "intensity": 0.6 }
      ],
      "description": "Layered bass hit with tail"
    }
  ]
}
```

#### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["videoId", "totalDuration", "events"],
  "properties": {
    "videoId":       { "type": "string" },
    "totalDuration": { "type": "number", "description": "Video duration in seconds" },
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["time", "trigger"],
        "properties": {
          "time": {
            "type": "number",
            "description": "Seconds from video start at which to fire trigger()"
          },
          "description": {
            "type": "string",
            "description": "Human-readable label for authoring; ignored at runtime"
          },
          "trigger": {
            "description": "Argument passed verbatim to haptics.trigger(). Accepts any form supported by web-haptics.",
            "oneOf": [
              {
                "type": "string",
                "enum": ["success", "warning", "error", "light", "medium", "heavy", "soft", "rigid", "nudge", "buzz"],
                "description": "Named preset — maps to a built-in web-haptics pattern"
              },
              {
                "type": "number",
                "description": "Single vibration duration in milliseconds"
              },
              {
                "type": "array",
                "items": { "type": "number" },
                "description": "Alternating on/off durations array (ms)"
              },
              {
                "type": "array",
                "description": "Array of Vibration objects with per-pulse control",
                "items": {
                  "type": "object",
                  "properties": {
                    "duration":  { "type": "number", "description": "Vibration on-time in ms" },
                    "delay":     { "type": "number", "description": "Silence before this pulse in ms" },
                    "intensity": { "type": "number", "minimum": 0, "maximum": 1, "description": "Relative vibration strength" }
                  },
                  "required": ["duration"]
                }
              },
              {
                "type": "object",
                "description": "Named pattern object with description",
                "required": ["pattern"],
                "properties": {
                  "pattern": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "duration":  { "type": "number" },
                        "delay":     { "type": "number" },
                        "intensity": { "type": "number", "minimum": 0, "maximum": 1 }
                      },
                      "required": ["duration"]
                    }
                  },
                  "description": { "type": "string" }
                }
              }
            ]
          }
        }
      }
    }
  }
}
```

---

## 5. TypeScript Interface Definitions

**Location:** `src/types/index.ts`

```typescript
// ─── Video Metadata ───────────────────────────────────────────────

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

// ─── Haptics Map ──────────────────────────────────────────────────

export interface HapticsMapEntry {
  videoId: string;
  youtubeId: string;
  hapticsFile: string;      // relative path e.g. "/haptics/video-001.json"
}

export interface HapticsMap {
  version: string;
  entries: HapticsMapEntry[];
}

// ─── Haptic Pattern ───────────────────────────────────────────────
// All types mirror the web-haptics trigger() overload signatures.
// At runtime, event.trigger is passed verbatim to haptics.trigger().

export type HapticPreset =
  | 'success' | 'warning' | 'error'           // Notification
  | 'light'   | 'medium'  | 'heavy'            // Impact
  | 'soft'    | 'rigid'   | 'nudge' | 'buzz';  // Extra presets

export interface VibrationPulse {
  duration: number;     // on-time in ms
  delay?: number;       // silence before this pulse in ms
  intensity?: number;   // 0–1
}

export interface NamedVibrationPattern {
  pattern: VibrationPulse[];
  description?: string;
}

// Union of all forms accepted by WebHaptics.trigger()
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

// ─── Router ───────────────────────────────────────────────────────

export type Route = 'home' | 'player' | 'feedback';

export interface RouteParams {
  videoId?: string;
}

export interface RouterState {
  route: Route;
  params: RouteParams;
}

// ─── Feedback Form ────────────────────────────────────────────────

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

// ─── YouTube IFrame API ───────────────────────────────────────────

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

// ─── Haptics Service ──────────────────────────────────────────────
// Wraps the web-haptics WebHaptics class. No network calls.
// All execution is on-device via the browser Vibration API.

export interface HapticsServiceOptions {
  pattern: HapticPattern;
  onEvent?: (event: HapticEvent) => void;
  onUnsupported?: () => void;   // fired if WebHaptics.isSupported === false
}
```

---

## 6. Routing Architecture

### Strategy: Hash-based SPA routing

**Rationale:** No server-side routing required; works natively as a PWA served from static hosting. iOS Safari compatible.

### URL Patterns

| Route | Hash | Description |
|---|---|---|
| Home | `#/` or `#` | Default / video grid |
| Player | `#/player/:videoId` | Video player for a specific video |
| Feedback | `#/feedback` | Star-rating survey |

### Router Implementation (`src/router.ts`)

```typescript
// Responsibilities:
// 1. Listen to hashchange and popstate events
// 2. Parse the hash to extract route and params
// 3. Unmount current page controller, mount next one
// 4. Update active state in NavBar

class Router {
  navigate(route: Route, params?: RouteParams): void;
  getCurrentState(): RouterState;
  onRouteChange(callback: (state: RouterState) => void): void;
}
```

### Navigation Flow

1. User taps a video card on Home → `router.navigate('player', { videoId: 'video-001' })`
2. Hash becomes `#/player/video-001`
3. Player page controller mounts, receives `videoId` from `router.getCurrentState().params`
4. On back (browser back / nav bar) → hash reverts → router calls `player.unmount()`, then `home.mount()`

### Page Lifecycle Interface

Every page controller must implement:

```typescript
interface PageController {
  mount(container: HTMLElement, params: RouteParams): void;
  unmount(): void;
}
```

---

## 7. Page & Component Specifications

---

### 7.1 Home Page

**File:** `src/pages/home.ts`  
**Route:** `#/`

#### Layout

```
┌────────────────────────────┐
│  [Nav bar — top]           │  ← App title "Haptix" + optional search icon
├────────────────────────────┤
│  [Scrollable video grid]   │  ← 1-column list on mobile
│  ┌──────────────────────┐  │
│  │  [Thumbnail]         │  │  ← 16:9 aspect ratio, rounded-xl corners
│  │  Title               │  │
│  │  Artist · Duration   │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │  ...                 │  │
│  └──────────────────────┘  │
├────────────────────────────┤
│  [Bottom Nav Bar]          │
└────────────────────────────┘
```

#### VideoCard Component

**File:** `src/components/video-card.ts`

| Element | Specification |
|---|---|
| Root | `<article role="button" tabindex="0">` |
| Thumbnail | `<img>` with `loading="lazy"`, `aspect-ratio: 16/9`, `border-radius: var(--radius-xl)` |
| Title | `font: var(--font-body-emphasized)`, 2-line clamp (`-webkit-line-clamp: 2`) |
| Subtitle | `Artist · MM:SS` formatted duration, `font: var(--font-caption)`, `color: var(--color-secondary-label)` |
| Shadow | `box-shadow: var(--shadow-card)` |
| Press state | `transform: scale(0.97)` on `pointerdown`, `transition: transform 120ms ease-out` |
| Tap action | Calls `router.navigate('player', { videoId })` |

#### Keyboard Interaction

- `Enter` or `Space` on focused card triggers navigation (same as tap)

---

### 7.2 Player Page

**File:** `src/pages/player.ts`  
**Route:** `#/player/:videoId`

#### Layout

```
┌────────────────────────────┐
│  [Back button]  [Title]    │  ← Navigation header
├────────────────────────────┤
│                            │
│  ┌──────────────────────┐  │
│  │                      │  │
│  │   YouTube IFrame     │  │  ← 16:9, full viewport width
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  [Haptics status badge]    │  ← "Haptics Active" / "Haptics Off"
│                            │
│  [Minimal controls row]    │  ← Play/Pause · Seek bar · Time · Fullscreen
│                            │
├────────────────────────────┤
│  [Bottom Nav Bar]          │
└────────────────────────────┘
```

#### YouTube IFrame Integration

**Service file:** `src/services/youtube.ts`

- Load `https://www.youtube.com/iframe_api` dynamically via script injection only when Player page mounts (lazy load).
- Wrap `YT.Player` constructor in a Promise that resolves on `onReady`.
- IFrame parameters:

```typescript
const playerVars: YT.PlayerVars = {
  autoplay: 1,
  controls: 0,        // hide native controls; use custom controls
  modestbranding: 1,
  rel: 0,
  playsinline: 1,     // CRITICAL for iOS Safari inline playback
  fs: 0,              // disable native fullscreen button; handle manually
  iv_load_policy: 3,  // hide annotations
  cc_load_policy: 0,
};
```

- Subscribe to `onStateChange` events to synchronize haptics and update custom controls.
- On page unmount: call `player.destroy()` and remove the injected `<script>` tag.

#### Custom Playback Controls

| Control | Element | Behavior |
|---|---|---|
| Play/Pause | `<button aria-label="Play">` SVG icon | Toggles `player.playVideo()` / `player.pauseVideo()` |
| Seek bar | `<input type="range">` | `input` event calls `player.seekTo()`, `timeupdate` loop updates value |
| Current time | `<time>` element | Updated on a 250ms `requestAnimationFrame` loop while playing |
| Fullscreen | `<button aria-label="Fullscreen">` SVG icon | See Fullscreen spec below |

#### Fullscreen Behavior (iOS Safari Compatible)

> iOS Safari does not support the Fullscreen API for arbitrary elements. The correct approach is:

1. **Request fullscreen on the `<iframe>` element itself**, which triggers native iOS fullscreen via `webkitEnterFullscreen` on the video element inside the iframe (this is handled natively by Safari when `playsinline` is omitted or overridden for fullscreen).
2. **Implementation approach:**
   - Detect iOS: `navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')`
   - On iOS: call `iframeEl.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'requestFullscreen' }), '*')` — this triggers YouTube's own fullscreen handling inside the iframe.
   - On non-iOS: use `document.documentElement.requestFullscreen()` on the player container `<div>`.
3. Listen to `document.fullscreenchange` / `webkitfullscreenchange` to toggle fullscreen icon state.
4. The player container should use CSS:
   ```css
   .player-container:fullscreen { ... }
   .player-container:-webkit-full-screen { ... }
   ```

#### Haptics Integration

**Service file:** `src/services/haptics.ts`  
**Package:** `web-haptics` (npm) — zero network calls, all on-device via browser Vibration API.

**Import:**

```typescript
import { WebHaptics } from 'web-haptics';
```

**Availability check:**

```typescript
// WebHaptics.isSupported is a static boolean
// true  → device supports the Vibration API (most Android; not iOS Safari)
// false → silently no-op; do not show error to user
if (!WebHaptics.isSupported) {
  // update badge to "Haptics Unavailable" state and return early
}
```

**Integration flow:**

```
Player mounts
  → load HapticsMap from haptics-map.json
  → find entry for current videoId
  → fetch haptic pattern file from /haptics/{id}.json
  → new WebHaptics() → store instance
  → on YT player state PLAYING: start sync loop
  → on YT player state PAUSED/ENDED: pause/stop sync loop
  → on page unmount: clear sync loop timer
```

**Sync mechanism:**

```typescript
import { WebHaptics } from 'web-haptics';

class HapticsService {
  private haptics = new WebHaptics();
  private timerId: number | null = null;
  private events: HapticEvent[];
  private eventIndex: number = 0;

  start(getCurrentTime: () => number): void {
    // Poll getCurrentTime() every 100ms.
    // For each event whose `time` falls within [currentTime - 0.05, currentTime + 0.05]:
    //   call this.haptics.trigger(event.trigger)
    //   advance eventIndex to avoid re-firing the same event
  }

  pause(): void { /* clearInterval, preserve eventIndex */ }

  stop(): void  { /* clearInterval, reset eventIndex to 0 */ }

  seek(time: number): void {
    // Reset eventIndex to the first event whose time >= seeked time
    this.eventIndex = this.events.findIndex(e => e.time >= time);
    if (this.eventIndex === -1) this.eventIndex = this.events.length;
  }
}
```

**Using `trigger()` — all valid call forms:**

```typescript
// Named preset (most common for music/video cues)
haptics.trigger('medium');      // standard beat
haptics.trigger('heavy');       // bass drop
haptics.trigger('success');     // positive moment

// Single duration (ms)
haptics.trigger(200);

// Alternating on/off durations (ms)
haptics.trigger([100, 50, 100]);

// Vibration objects with per-pulse intensity
haptics.trigger([
  { duration: 80, intensity: 0.9 },
  { delay: 40, duration: 120, intensity: 0.6 }
]);

// Named pattern object
haptics.trigger({
  pattern: [{ duration: 50 }, { delay: 50, duration: 50 }],
  description: 'double-tap'
});
```

**UI feedback for haptics availability:**

- `WebHaptics.isSupported === true` and playing → badge: "Haptics Active" (blue tint)
- `WebHaptics.isSupported === true` and paused → badge: "Haptics Paused" (gray)
- `WebHaptics.isSupported === false` → badge hidden entirely; no error shown to user

---

### 7.3 Feedback Page

**File:** `src/pages/feedback.ts`  
**Route:** `#/feedback`

#### Layout

```
┌────────────────────────────┐
│  [Header: "Feedback"]      │
├────────────────────────────┤
│  [Grouped form sections]   │
│                            │
│  Question 1                │
│  ★ ★ ★ ★ ☆               │
│  ────────────────          │
│  Question 2                │
│  ★ ☆ ☆ ☆ ☆               │
│  ...                       │
│                            │
│  [Submit Button]           │
│                            │
├────────────────────────────┤
│  [Bottom Nav Bar]          │
└────────────────────────────┘
```

#### Questions (Static, Hardcoded in `feedback.ts`)

| # | Question Label |
|---|---|
| 1 | Overall enjoyment of the experience |
| 2 | Video content quality |
| 3 | Haptic feedback relevance |
| 4 | Haptic feedback intensity |
| 5 | Haptic feedback timing accuracy |
| 6 | App responsiveness and performance |
| 7 | Visual design and aesthetics |
| 8 | Ease of navigation |
| 9 | Audio-haptic synchronization |
| 10 | Likelihood to recommend Haptix |

#### StarRating Component

**File:** `src/components/star-rating.ts`

```typescript
// Renders 5 tappable/clickable stars
// Props: questionId, currentRating (0–5), onChange callback
// Each star is an <button> with role="radio" semantics in a radiogroup
```

| Element | Spec |
|---|---|
| Container | `role="radiogroup" aria-label="{question label}"` |
| Star button | `role="radio" aria-checked="true/false" aria-label="N stars"` |
| Icon: filled | Custom SVG star, `fill: var(--color-accent)` |
| Icon: empty | Custom SVG star outline, `fill: none; stroke: var(--color-tertiary-label)` |
| Tap animation | Star scales to 1.3 then returns on selection (`transition: transform 150ms spring`) |
| Half-star | Not supported. Integer ratings only. |

#### Submit Behavior (Mock)

```typescript
async function handleSubmit(submission: FeedbackSubmission): Promise<void> {
  // 1. Validate all 10 questions have rating > 0; show inline error if not
  // 2. Disable submit button, show loading spinner
  // 3. await delay(1200) — simulate network
  // 4. Log submission to console: console.log('Feedback submitted', submission)
  // 5. Show success Toast: "Thanks for your feedback!"
  // 6. Reset all ratings to 0
}
```

No real network call. No backend. No data persisted.

---

## 8. PWA Requirements

### `manifest.json`

**Location:** `public/manifest.json`

```json
{
  "name": "Haptix",
  "short_name": "Haptix",
  "description": "YouTube videos with synchronized haptic feedback",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["entertainment", "multimedia"],
  "lang": "en"
}
```

### iOS-Specific Meta Tags (in `<head>`)

```html
<!-- PWA / display -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Haptix">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">

<!-- Viewport -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

<!-- Theme -->
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#F2F2F7" media="(prefers-color-scheme: light)">
```

### Service Worker Strategy

**File:** `src/sw/service-worker.ts`

| Asset Type | Strategy | Rationale |
|---|---|---|
| App shell (HTML, CSS, TS bundles, icons) | Cache-first (precache on install) | Must work fully offline |
| `videos.json`, `haptics-map.json` | Stale-while-revalidate | Low-churn data; freshness desirable |
| Haptic pattern files (`/haptics/*.json`) | Cache-first with expiry (7 days) | Immutable per video; lazy-cache on first access |
| YouTube thumbnails | Cache-first (lazy) | Avoid re-downloading; expire after 30 days |
| YouTube IFrame API script | Network-first with cache fallback | Must be fresh; fallback if offline |

> **Note:** `web-haptics` is a bundled npm package — it produces no network requests at runtime. There are no haptics-related entries to handle in the service worker.

```typescript
// Precache list (populated by Vite PWA plugin at build time)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  // + all emitted CSS/JS bundle hashes from Vite manifest
];

const CACHE_NAME = 'Haptix-v1';
```

**Install event:** Precache all shell assets.  
**Activate event:** Delete stale caches (all caches not matching `CACHE_NAME`).  
**Fetch event:** Apply strategy per URL pattern using `if/else` matching.

---

## 9. Design System

### 9.1 Color Palette (CSS Variables)

Defined in `src/styles/tokens.css`. Follows iOS system color semantics.

```css
:root {
  /* Backgrounds */
  --color-bg-primary:           #FFFFFF;
  --color-bg-secondary:         #F2F2F7;
  --color-bg-tertiary:          #FFFFFF;
  --color-bg-elevated:          #FFFFFF;

  /* Labels */
  --color-primary-label:        rgba(0, 0, 0, 1.00);
  --color-secondary-label:      rgba(60, 60, 67, 0.60);
  --color-tertiary-label:       rgba(60, 60, 67, 0.30);
  --color-quaternary-label:     rgba(60, 60, 67, 0.18);

  /* Fills */
  --color-fill-primary:         rgba(120, 120, 128, 0.20);
  --color-fill-secondary:       rgba(120, 120, 128, 0.16);

  /* Separators */
  --color-separator:            rgba(60, 60, 67, 0.29);
  --color-separator-opaque:     #C6C6C8;

  /* Accent */
  --color-accent:               #007AFF;   /* iOS Blue */
  --color-accent-destructive:   #FF3B30;   /* iOS Red */
  --color-accent-success:       #34C759;   /* iOS Green */

  /* Tints */
  --color-accent-tint:          rgba(0, 122, 255, 0.12);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary:           #000000;
    --color-bg-secondary:         #1C1C1E;
    --color-bg-tertiary:          #2C2C2E;
    --color-bg-elevated:          #1C1C1E;

    --color-primary-label:        rgba(255, 255, 255, 1.00);
    --color-secondary-label:      rgba(235, 235, 245, 0.60);
    --color-tertiary-label:       rgba(235, 235, 245, 0.30);
    --color-quaternary-label:     rgba(235, 235, 245, 0.18);

    --color-fill-primary:         rgba(120, 120, 128, 0.36);
    --color-fill-secondary:       rgba(120, 120, 128, 0.32);

    --color-separator:            rgba(84, 84, 88, 0.65);
    --color-separator-opaque:     #38383A;

    --color-accent:               #0A84FF;
    --color-accent-destructive:   #FF453A;
    --color-accent-success:       #30D158;
    --color-accent-tint:          rgba(10, 132, 255, 0.15);
  }
}
```

---

### 9.2 Typography Scale

Font stack: `'SF Pro Text', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif`

> Note: `-apple-system` and `BlinkMacSystemFont` resolve to SF Pro on Apple devices. On Android/Chrome, this falls back to `Roboto`. No web font loading required.

```css
:root {
  /* Display */
  --font-large-title:     700 34px/41px var(--font-stack);
  --font-title-1:         700 28px/34px var(--font-stack);
  --font-title-2:         700 22px/28px var(--font-stack);
  --font-title-3:         600 20px/25px var(--font-stack);

  /* Body */
  --font-headline:        600 17px/22px var(--font-stack);
  --font-body:            400 17px/22px var(--font-stack);
  --font-body-emphasized: 600 17px/22px var(--font-stack);
  --font-callout:         400 16px/21px var(--font-stack);
  --font-subheadline:     400 15px/20px var(--font-stack);
  --font-footnote:        400 13px/18px var(--font-stack);
  --font-caption:         400 12px/16px var(--font-stack);
  --font-caption-2:       400 11px/13px var(--font-stack);

  --font-stack: 'SF Pro Text', 'SF Pro Display', -apple-system,
                BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
}
```

---

### 9.3 Spacing & Layout (8pt Grid)

```css
:root {
  --space-1:   4px;
  --space-2:   8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Content margins */
  --content-margin: 16px;    /* 16px on 375px; 20px on 430px+ */
  --content-gutter: 12px;    /* gap between cards */

  /* Border radii */
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-xl:  20px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
}

@media (min-width: 390px) {
  :root { --content-margin: 20px; }
}
```

---

### 9.4 Shadows

```css
:root {
  --shadow-card:    0 2px  8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.04);
  --shadow-modal:   0 8px 32px rgba(0,0,0,0.16), 0 0 1px rgba(0,0,0,0.08);
  --shadow-nav:     0 -0.5px 0 var(--color-separator);
}
```

Dark mode overrides:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --shadow-card:  0 2px 12px rgba(0,0,0,0.30), 0 0 1px rgba(0,0,0,0.20);
    --shadow-modal: 0 8px 40px rgba(0,0,0,0.50);
  }
}
```

---

### 9.5 Iconography

**No emoji.** All icons are inline SVG or SVG sprite.

| Icon | Usage | SF Symbol equivalent |
|---|---|---|
| Play triangle | Player play button | `play.fill` |
| Pause double bar | Player pause button | `pause.fill` |
| Arrow left | Back navigation | `chevron.left` |
| Arrows expand | Enter fullscreen | `arrow.up.left.and.arrow.down.right` |
| Arrows compress | Exit fullscreen | `arrow.down.right.and.arrow.up.left` |
| Star (filled) | Feedback rating — selected | `star.fill` |
| Star (outline) | Feedback rating — unset | `star` |
| Waveform | Haptics active indicator | `waveform` |
| House | Home nav tab | `house.fill` / `house` |
| Message | Feedback nav tab | `message.fill` / `message` |

All SVGs must:
- Use `currentColor` for strokes/fills (inherits CSS `color`)
- Include `aria-hidden="true"` and be paired with a visually hidden `<span>` or `aria-label` on the parent button
- Be sized via `width` and `height` CSS (not SVG attributes) to respect text sizing

---

### 9.6 Motion & Transitions

```css
/* Default transition for interactive elements */
--transition-default: 120ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
--transition-slow:    300ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
--transition-spring:  400ms cubic-bezier(0.34, 1.56, 0.64, 1);   /* overshoot */
```

- Respect `prefers-reduced-motion`: wrap all transform/animation in `@media (prefers-reduced-motion: no-preference)`. Default to instant transitions if motion is reduced.

---

## 10. Responsive Behavior

### Target Viewports

| Device | Width | Notes |
|---|---|---|
| iPhone SE (3rd gen) | 375px | Minimum supported width |
| iPhone 14 / 15 | 390px | Primary design target |
| iPhone 14 Plus / 15 Plus | 428px–430px | Maximum mobile width |
| iPad (optional) | 768px+ | Graceful degradation only; not primary |

### Layout Rules

- All pages use a single-column layout within a centered container.
- `max-width: 430px` on the app root with `margin: 0 auto` — prevents over-stretching on wider screens.
- The player IFrame is always `width: 100vw; max-width: 430px; aspect-ratio: 16/9`.
- Safe area insets via `env(safe-area-inset-*)` for iPhone notch/Dynamic Island/home indicator:

```css
.bottom-nav {
  padding-bottom: calc(var(--space-2) + env(safe-area-inset-bottom));
}

.page-content {
  padding-top: calc(var(--space-4) + env(safe-area-inset-top));
}
```

### Font Scaling

Do not disable user font scaling. All `font-size` values use `px` but respect the browser's default 16px base. Do not use `user-scalable=no` in the viewport meta tag.

---

## 11. Accessibility

| Requirement | Implementation |
|---|---|
| Focusable cards | `tabindex="0"` on all `<article>` video cards |
| Keyboard navigation | All interactive elements reachable via Tab; Enter/Space activate buttons |
| ARIA labels | All icon-only buttons have `aria-label`; icons have `aria-hidden="true"` |
| Star rating semantics | `role="radiogroup"` on container; each star `role="radio"` with `aria-checked` |
| Live regions | `role="status" aria-live="polite"` on haptics badge and toast notifications |
| Color contrast | All text/background combos meet WCAG AA (4.5:1 for body text) |
| Touch targets | Minimum 44×44px tap target on all interactive elements (iOS HIG minimum) |
| Reduced motion | All animations gated on `prefers-reduced-motion: no-preference` |
| Semantic HTML | `<main>`, `<nav>`, `<article>`, `<header>`, `<section>` used appropriately |
| Focus visibility | `:focus-visible` styles provided; `:focus` outline suppressed for pointer users |
| Skip link | `<a href="#main-content" class="skip-link">Skip to content</a>` at top of `<body>` |

---

## 12. Integration Notes

### YouTube IFrame API

- The API script (`https://www.youtube.com/iframe_api`) calls the global function `window.onYouTubeIframeAPIReady` when loaded. Assign this in `youtube.ts` before injecting the script tag.
- Only inject the script once per app session; guard with `if (window.YT && window.YT.Player)` check.
- The IFrame `<div>` placeholder requires a non-empty `id` attribute (e.g., `id="yt-player"`).
- `playsinline: 1` in `playerVars` is **mandatory** for iOS Safari to play inline instead of opening the system video player.

### `web-haptics` Package

- **Install:** `npm i web-haptics` — zero dependencies, MIT license, ~65 kB, ships TypeScript types.
- **Import (vanilla TS):** `import { WebHaptics } from 'web-haptics'`
- **No network calls.** All haptic execution happens on-device via the browser's native Vibration API. There are no endpoints, no authentication, no CORS concerns.
- **Platform support:** Works on most Android browsers. iOS Safari does **not** support the Vibration API — `WebHaptics.isSupported` will be `false` on iOS. The app must degrade gracefully: hide the haptics badge entirely and continue playing the video normally.
- **No error handling required.** The package silently no-ops on unsupported platforms. No `try/catch` is needed around `trigger()` calls.
- **User activation:** The Vibration API requires a user gesture to fire on first use (tap, click). Since the user taps a video card to reach the Player page, this requirement is naturally satisfied before the first `trigger()` fires.
- **Do not overuse haptics.** Reserve `trigger()` for meaningful cue points — beats, transitions, impact moments. If every frame fires a haptic, the feedback loses meaning and battery drains faster.
- **`defaultPatterns` export:** The package also exports `defaultPatterns` for accessing the preset vibration sequences directly, useful for authoring haptics files:

  ```typescript
  import { WebHaptics, defaultPatterns } from 'web-haptics';
  const haptics = new WebHaptics();
  haptics.trigger(defaultPatterns.light);
  ```

### Service Worker & YouTube IFrame

- The YouTube IFrame API script (`https://www.youtube.com/iframe_api`) is cross-origin. The service worker **must not** intercept it (use `allowlist` or `passthrough` for `youtube.com` domains) to avoid CORS issues.
- Similarly, `img.youtube.com` thumbnails can be cached with `CacheFirst` using `opaque` responses — these will succeed for caching even though CORS headers aren't set.

### Build & Deployment

- Vite is the recommended bundler. The `vite-plugin-pwa` plugin handles:
  - Generating the service worker from `src/sw/service-worker.ts`
  - Injecting the precache asset list at build time
  - Generating `manifest.json` (or use static `public/manifest.json`)
- Output directory: `dist/`
- Deployable to any static host: Vercel, Netlify, GitHub Pages, Cloudflare Pages.
- Ensure the host serves `manifest.json` with `Content-Type: application/manifest+json`.
- Ensure HTTPS is enforced (required for Service Workers and PWA install prompts).
