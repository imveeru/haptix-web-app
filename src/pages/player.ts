import { PageController, Router } from '../router';
import { RouteParams, YTPlayer, YT_PLAYER_STATE, HapticPattern } from '../types';
import { YouTubeService } from '../services/youtube';
import { HapticsService } from '../services/haptics';
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
  private timeUpdateRaf: number | null = null;
  
  // UI Elements
  private playPauseBtn!: HTMLElement;
  private playIconHTML = '<path d="M8 5v14l11-7z" />';
  private pauseIconHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />';
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
    
    // Setup haptics First
    await this.setupHaptics(params.videoId);
    
    // Then load player 
    // Uses the youtubeId mapped to the internal video.id
    this.ytPlayer = await ytService.loadPlayer('yt-player-frame', video.youtubeId, (event) => {
      this.onPlayerStateChange(event.data);
    });
  }

  unmount(): void {
    if (this.timeUpdateRaf !== null) {
      cancelAnimationFrame(this.timeUpdateRaf);
    }
    if (this.hapticsService) {
      this.hapticsService.stop();
    }
    ytService.destroy();
    this.container.innerHTML = '';
  }

  private render(title: string) {
    this.container.innerHTML = `
      <div class="player-page">
        <header class="player-header">
          <button class="back-button" aria-label="Go back" id="back-btn">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
            </svg>
          </button>
          <h2 class="player-title">${title}</h2>
        </header>
        
        <div class="player-container" id="player-container">
          <div id="yt-player-frame"></div>
        </div>
        
        <div class="player-controls">
          <div class="haptics-badge" id="haptics-badge" role="status" aria-live="polite">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 12V8m4 4v-2m4 6V6m4 6v-3m4 3v-1" stroke-linecap="round"/>
            </svg>
            <span id="haptics-badge-text">...</span>
          </div>

          <div class="controls-row">
            <button class="play-pause-btn" aria-label="Play" id="play-pause-btn">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" id="play-pause-icon">
                ${this.playIconHTML}
              </svg>
            </button>
            <div class="seek-container">
              <span class="time-display" id="time-display">0:00</span>
              <input type="range" id="seek-bar" value="0" step="0.1" aria-label="Seek video">
              <button class="fullscreen-btn" aria-label="Fullscreen" id="fullscreen-btn">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.playPauseBtn = this.container.querySelector('#play-pause-btn') as HTMLElement;
    this.timeDisplay = this.container.querySelector('#time-display') as HTMLElement;
    this.seekBar = this.container.querySelector('#seek-bar') as HTMLInputElement;
    this.hapticsBadge = this.container.querySelector('#haptics-badge') as HTMLElement;
  }

  private attachEvents() {
    this.container.querySelector('#back-btn')?.addEventListener('click', () => {
      window.history.back(); // or router.navigate('home')
    });

    this.playPauseBtn.addEventListener('click', () => {
      if (!this.ytPlayer) return;
      const state = this.ytPlayer.getPlayerState();
      if (state === YT_PLAYER_STATE.PLAYING) {
        this.ytPlayer.pauseVideo();
      } else {
        this.ytPlayer.playVideo();
      }
    });

    this.seekBar.addEventListener('input', () => {
      this.isSeeking = true;
      const val = parseFloat(this.seekBar.value);
      this.timeDisplay.textContent = formatTime(val);
      if (this.hapticsService) {
        this.hapticsService.stop();
      }
    });

    this.seekBar.addEventListener('change', () => {
      if (!this.ytPlayer) return;
      const val = parseFloat(this.seekBar.value);
      this.ytPlayer.seekTo(val, true);
      this.isSeeking = false;
    });

    this.container.querySelector('#fullscreen-btn')?.addEventListener('click', () => {
      this.toggleFullscreen();
    });
  }

  private async setupHaptics(videoId: string) {
    const entry = hapticsMapData.entries.find(e => e.videoId === videoId);
    if (!entry) {
      this.hapticsBadge.style.display = 'none';
      toastInstance.show('No haptics available for this video');
      return;
    }

    try {
      // Fetch haptics pattern from public directory taking Vite base path into account
      // Attach cache buster to override strict PWA caching logic that might be causing phantom 404s
      const url = `${import.meta.env.BASE_URL}${entry.hapticsFile}?v=${Date.now()}`;
      console.log('Fetching haptics file from:', url);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }
      const pattern: HapticPattern = await res.json();
      
      this.hapticsService = new HapticsService({
        pattern
      });

      if (!this.hapticsService.isEffectivelySupported) {
        this.updateHapticsBadgeState('unsupported');
        toastInstance.show('Web Haptics are not supported on this device', 4000);
      } else {
        this.updateHapticsBadgeState('paused');
      }

    } catch (e: any) {
      console.warn('Could not load haptics file Error', e.message || e);
      this.hapticsBadge.style.display = 'none';
    }
  }

  private onPlayerStateChange(state: number) {
    const iconEl = this.container.querySelector('#play-pause-icon')!;

    if (state === YT_PLAYER_STATE.PLAYING) {
      iconEl.innerHTML = this.pauseIconHTML;
      this.playPauseBtn.setAttribute('aria-label', 'Pause');
      this.startSyncLoop();
      if (this.hapticsService?.isEffectivelySupported) {
        this.hapticsService.start();
        this.updateHapticsBadgeState('active');
      }
    } else {
      iconEl.innerHTML = this.playIconHTML;
      this.playPauseBtn.setAttribute('aria-label', 'Play');
      this.stopSyncLoop();
      if (this.hapticsService?.isEffectivelySupported) {
        this.hapticsService.stop();
        this.updateHapticsBadgeState('paused');
      }
    }

    if (state === YT_PLAYER_STATE.PLAYING || state === YT_PLAYER_STATE.PAUSED || state === YT_PLAYER_STATE.CUED) {
      this.seekBar.max = this.ytPlayer!.getDuration().toString();
    }
  }

  private updateHapticsBadgeState(state: 'active' | 'paused' | 'unsupported') {
    const textEl = this.container.querySelector('#haptics-badge-text')!;
    if (state === 'active') {
      this.hapticsBadge.className = 'haptics-badge active';
      textEl.textContent = 'Haptics Active';
    } else if (state === 'paused') {
      this.hapticsBadge.className = 'haptics-badge paused';
      textEl.textContent = 'Haptics Paused';
    } else if (state === 'unsupported') {
      this.hapticsBadge.className = 'haptics-badge unsupported';
      textEl.textContent = 'Haptics Unsupported';
    }
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
    const isIOS = navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad');
    const iframeWindow = (this.container.querySelector('#yt-player-frame') as HTMLIFrameElement)?.contentWindow;

    if (isIOS && iframeWindow) {
      // iOS specific hook
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
