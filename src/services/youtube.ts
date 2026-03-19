import { YTPlayer, YTPlayerEvent } from '../types';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player: new (elementId: string, options: any) => YTPlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
  }
}

export class YouTubeService {
  private player: YTPlayer | null = null;
  private isApiLoaded = false;
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  async loadPlayer(elementId: string, videoId: string, onStateChange: (event: YTPlayerEvent) => void): Promise<YTPlayer> {
    if (!this.isApiLoaded) {
      await this.injectApi();
    } else {
      this.resolveReady(); // already injected
    }

    await this.readyPromise;

    return new Promise((resolve) => {
      this.player = new window.YT.Player(elementId, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          fs: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
        },
        events: {
          onReady: () => resolve(this.player!),
          onStateChange: onStateChange
        }
      });
    });
  }

  private injectApi(): Promise<void> {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        this.isApiLoaded = true;
        resolve();
        this.resolveReady();
        return;
      }
      
      window.onYouTubeIframeAPIReady = () => {
        this.isApiLoaded = true;
        resolve();
        this.resolveReady();
      };
      
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    });
  }

  destroy() {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
  }
}
