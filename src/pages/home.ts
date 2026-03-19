import { WebHaptics } from 'web-haptics';
import { PageController, Router } from '../router';
import { RouteParams, VideoMeta } from '../types';
import { VideoCard } from '../components/video-card';
import { getOrCreateHapticsInstance, destroyHapticsInstance } from '../services/haptics-instance';
import videosData from '../data/videos.json';

export class HomePage implements PageController {
  private container!: HTMLElement;
  private router: Router;
  private hapticsDestroyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(router: Router) {
    this.router = router;
  }

  mount(container: HTMLElement, _params: RouteParams): void {
    this.container = container;
    this.render();
  }

  unmount(): void {
    if (this.hapticsDestroyTimer !== null) {
      clearTimeout(this.hapticsDestroyTimer);
      this.hapticsDestroyTimer = null;
      getOrCreateHapticsInstance().cancel();
    }
    this.container.replaceChildren();
  }

  private render() {
    const supported = WebHaptics.isSupported;
    this.container.innerHTML = `
      <header class="home-header">
        <div class="home-header-left">
          <h1 class="home-title">Haptix</h1>
          <div class="haptics-support-chip ${supported ? 'supported' : 'unsupported'}">
            <span class="haptics-support-dot"></span>
            ${supported ? 'Haptics Supported' : 'Not Supported'}
          </div>
        </div>
        <button id="test-haptics-btn" class="test-haptics-btn">Test Haptics</button>
      </header>
      <div class="video-grid" id="video-grid"></div>`;

    const grid = this.container.querySelector('#video-grid') as HTMLElement;
    (videosData as VideoMeta[]).forEach(video => {
      grid.appendChild(new VideoCard(video, (videoId) => {
        this.router.navigate('player', { videoId });
      }).getElement());
    });

    const testBtn = this.container.querySelector('#test-haptics-btn') as HTMLButtonElement;
    if (testBtn) testBtn.onclick = this.onTestHapticsClick.bind(this);
  }

  private onTestHapticsClick() {
    const haptics = getOrCreateHapticsInstance();
    haptics.trigger([
      { duration: 30, intensity: 0.1 },
      { delay: 60, duration: 40, intensity: 0.6 },
      { delay: 60, duration: 40, intensity: 0.6 },
      { delay: 60, duration: 40, intensity: 0.6 },
      { delay: 60, duration: 40, intensity: 0.6 },
      { delay: 130, duration: 700, intensity: 1 },
    ]);

    if (this.hapticsDestroyTimer !== null) clearTimeout(this.hapticsDestroyTimer);
    this.hapticsDestroyTimer = setTimeout(() => {
      this.hapticsDestroyTimer = null;
      destroyHapticsInstance();
    }, 15000);
  }
}
