import { PageController, Router } from '../router';
import { RouteParams, YTPlayer, YT_PLAYER_STATE, HapticPattern } from '../types';
import { YouTubeService } from '../services/youtube';
import { HapticsService } from '../services/haptics';
import { WebHaptics } from 'web-haptics';
import { toastInstance } from '../components/toast';
import videosData from '../data/videos.json';
import hapticsMapData from '../data/haptics-map.json';

// Simple store for YT api instance so we don't duplicate injections
const ytService = new YouTubeService();

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export class PlayerPage implements PageController {
  private container!: HTMLElement;
  private router: Router;
  private ytPlayer: YTPlayer | null = null;
  private hapticsService: HapticsService | null = null;
  private haptics: WebHaptics | null = null;
  private hapticsTimeout: ReturnType<typeof setTimeout> | null = null;
  private timeUpdateRaf: number | null = null;

  private playPauseBtn!: HTMLButtonElement;
  private playPausePath!: SVGPathElement;
  private muteBtn!: HTMLButtonElement;
  private mutePath!: SVGPathElement;
  private timeDisplay!: HTMLElement;
  private seekBar!: HTMLInputElement;
  private hapticsBadge!: HTMLElement;

  private isSeeking = false;

  constructor(router: Router) {
    this.router = router;
  }

  async mount(container: HTMLElement, params: RouteParams): Promise<void> {
    this.container = container;
    if (!params.videoId) {
      this.router.navigate('home');
      return;
    }

    const video = videosData.find(v => v.id === params.videoId);
    if (!video) {
      this.router.navigate('home');
      return;
    }

    this.render(video.title);
    this.attachEvents();

    await this.setupHaptics(params.videoId);

    this.ytPlayer = await ytService.loadPlayer('yt-player-frame', video.youtubeId, (event) => {
      this.onPlayerStateChange(event.data);
    });
  }

  unmount(): void {
    if (this.timeUpdateRaf !== null) cancelAnimationFrame(this.timeUpdateRaf);
    this.cancelHaptics();
    ytService.destroy();
    this.container.replaceChildren();
  }

  private render(title: string) {
    this.container.innerHTML = `
      <div class="player-page">
        <header class="player-header">
          <button class="back-button" aria-label="Go back" id="back-btn">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
          </button>
          <h2 class="player-title" id="player-title"></h2>
        </header>
        <div class="player-container" id="player-container">
          <div id="yt-player-frame"></div>
        </div>
        <div class="player-controls">
          <div class="haptics-badge" id="haptics-badge" role="status" aria-live="polite">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12V8m4 4v-2m4 6V6m4 6v-3m4 3v-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <span id="haptics-badge-text">...</span>
          </div>
          <div class="controls-row">
            <button class="play-pause-btn" aria-label="Play" id="play-pause-btn">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path id="play-pause-path" d="M8 5v14l11-7z"/></svg>
            </button>
            <button class="mute-btn" aria-label="Mute" id="mute-btn">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path id="mute-path" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            </button>
            <div class="seek-container">
              <span class="time-display" id="time-display">0:00</span>
              <input type="range" id="seek-bar" value="0" step="0.1" aria-label="Seek video">
              <button class="fullscreen-btn" aria-label="Fullscreen" id="fullscreen-btn">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>`;

    (this.container.querySelector('#player-title') as HTMLElement).textContent = title;
    this.playPauseBtn = this.container.querySelector('#play-pause-btn') as HTMLButtonElement;
    this.playPausePath = this.container.querySelector('#play-pause-path') as SVGPathElement;
    this.muteBtn = this.container.querySelector('#mute-btn') as HTMLButtonElement;
    this.mutePath = this.container.querySelector('#mute-path') as SVGPathElement;
    this.timeDisplay = this.container.querySelector('#time-display') as HTMLElement;
    this.seekBar = this.container.querySelector('#seek-bar') as HTMLInputElement;
    this.hapticsBadge = this.container.querySelector('#haptics-badge') as HTMLElement;
  }

  private attachEvents() {
    this.container.querySelector('#back-btn')?.addEventListener('click', () => {
      window.history.back();
    });

    this.playPauseBtn.addEventListener('click', () => {
      if (!this.ytPlayer) return;
      const state = this.ytPlayer.getPlayerState();
      if (state === YT_PLAYER_STATE.PLAYING) {
        console.log("VIDEO PLAYING")
        this.cancelHaptics();
        this.ytPlayer.pauseVideo();
      } else {
        console.log("hapticsService", this.hapticsService);
        console.log("HapticsService", HapticsService.isEffectivelySupported());
        // Trigger haptics directly here — must be inside a user gesture for Web Audio to work
        if (this.hapticsService && HapticsService.isEffectivelySupported()) {
          const { pattern, initialDelay } = this.hapticsService;
          console.log('[Haptics] Final pattern:', pattern);
          this.haptics = new WebHaptics({ debug: true });
          console.log("HAPTICS STARTED");
          this.haptics.trigger(pattern);
          // if (initialDelay > 0) {
          //   console.log("HAPTICS STARTED with delay");
          //   this.hapticsTimeout = setTimeout(() => {
          //     this.hapticsTimeout = null;
          //     this.haptics?.trigger(pattern);
          //   }, initialDelay);
          // } else {
          //   console.log("HAPTICS STARTED");
          //   this.haptics.trigger(pattern);
          // }
        }
        this.ytPlayer.playVideo();
      }
    });

    this.muteBtn.addEventListener('click', () => {
      if (!this.ytPlayer) return;
      if (this.ytPlayer.isMuted()) {
        this.ytPlayer.unMute();
        this.mutePath.setAttribute('d', 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z');
        this.muteBtn.setAttribute('aria-label', 'Mute');
      } else {
        this.ytPlayer.mute();
        this.mutePath.setAttribute('d', 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z');
        this.muteBtn.setAttribute('aria-label', 'Unmute');
      }
    });

    this.seekBar.addEventListener('input', () => {
      this.isSeeking = true;
      this.timeDisplay.textContent = formatTime(parseFloat(this.seekBar.value));
      this.cancelHaptics();
    });

    this.seekBar.addEventListener('change', () => {
      if (!this.ytPlayer) return;
      this.ytPlayer.seekTo(parseFloat(this.seekBar.value), true);
      this.isSeeking = false;
    });

    this.container.querySelector('#fullscreen-btn')?.addEventListener('click', () => {
      this.toggleFullscreen();
    });
  }

  private cancelHaptics() {
    if (this.hapticsTimeout !== null) {
      clearTimeout(this.hapticsTimeout);
      this.hapticsTimeout = null;
    }
    this.haptics?.cancel();
  }

  private async setupHaptics(videoId: string) {
    const entry = hapticsMapData.entries.find(e => e.videoId === videoId);
    if (!entry) {
      this.hapticsBadge.style.display = 'none';
      toastInstance.show('No haptics available for this video');
      return;
    }

    try {
      const url = `${import.meta.env.BASE_URL}${entry.hapticsFile}?v=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      const pattern: HapticPattern = await res.json();

      this.hapticsService = new HapticsService({ pattern });

      if (!HapticsService.isEffectivelySupported()) {
        this.updateHapticsBadgeState('unsupported');
        toastInstance.show('Web Haptics are not supported on this device', 4000);
      } else {
        this.updateHapticsBadgeState('paused');
      }
    } catch (e: any) {
      console.warn('Could not load haptics file:', e.message || e);
      this.hapticsBadge.style.display = 'none';
    }
  }

  private onPlayerStateChange(state: number) {
    if (state === YT_PLAYER_STATE.PLAYING) {
      this.playPausePath.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
      this.playPauseBtn.setAttribute('aria-label', 'Pause');
      this.startSyncLoop();
      if (HapticsService.isEffectivelySupported()) {
        this.updateHapticsBadgeState('active');
      }
    } else {
      this.playPausePath.setAttribute('d', 'M8 5v14l11-7z');
      this.playPauseBtn.setAttribute('aria-label', 'Play');
      this.stopSyncLoop();
      if (HapticsService.isEffectivelySupported()) {
        this.cancelHaptics();
        this.updateHapticsBadgeState('paused');
      }
    }

    if (state === YT_PLAYER_STATE.PLAYING || state === YT_PLAYER_STATE.PAUSED || state === YT_PLAYER_STATE.CUED) {
      this.seekBar.max = this.ytPlayer!.getDuration().toString();
    }
  }

  private updateHapticsBadgeState(state: 'active' | 'paused' | 'unsupported') {
    const textEl = this.container.querySelector('#haptics-badge-text')!;
    this.hapticsBadge.className = `haptics-badge ${state}`;
    const labels = { active: 'Haptics Active', paused: 'Haptics Paused', unsupported: 'Haptics Unsupported' };
    textEl.textContent = labels[state];
  }

  private startSyncLoop() {
    if (this.timeUpdateRaf !== null) return;
    const loop = () => {
      if (!this.isSeeking && this.ytPlayer) {
        const time = this.ytPlayer.getCurrentTime();
        this.seekBar.value = time.toString();
        this.timeDisplay.textContent = formatTime(time);
      }
      this.timeUpdateRaf = requestAnimationFrame(loop);
    };
    this.timeUpdateRaf = requestAnimationFrame(loop);
  }

  private stopSyncLoop() {
    if (this.timeUpdateRaf !== null) {
      cancelAnimationFrame(this.timeUpdateRaf);
      this.timeUpdateRaf = null;
    }
  }

  private toggleFullscreen() {
    const isIOS = /iPhone|iPad/.test(navigator.userAgent);
    const iframeWindow = (this.container.querySelector('#yt-player-frame') as HTMLIFrameElement)?.contentWindow;

    if (isIOS && iframeWindow) {
      iframeWindow.postMessage(JSON.stringify({ event: 'command', func: 'requestFullscreen' }), '*');
    } else {
      const playerContainer = this.container.querySelector('#player-container') as HTMLElement;
      if (!document.fullscreenElement) {
        playerContainer.requestFullscreen?.().catch(console.warn);
      } else {
        document.exitFullscreen?.();
      }
    }
  }
}
