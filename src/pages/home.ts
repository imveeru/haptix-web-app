import { PageController, Router } from '../router';
import { RouteParams, VideoMeta } from '../types';
import { VideoCard } from '../components/video-card';
// Note: In a real app we might fetch this async. Since it's local we just import it.
import videosData from '../data/videos.json';

export class HomePage implements PageController {
  private container!: HTMLElement;
  private router: Router;

  constructor(router: Router) {
    this.router = router;
  }

  mount(container: HTMLElement, _params: RouteParams): void {
    this.container = container;
    this.render();
  }

  unmount(): void {
    this.container.innerHTML = '';
  }

  private render() {
    this.container.innerHTML = `
      <header class="home-header">
        <h1 class="home-title">Haptix</h1>
        <button id="test-haptics-btn" class="test-haptics-btn">Test Haptics</button>
      </header>
      <div class="video-grid" id="video-grid"></div>
    `;

    const grid = this.container.querySelector('#video-grid') as HTMLElement;
    const videos = videosData as VideoMeta[];

    videos.forEach(video => {
      const card = new VideoCard(video, (videoId) => {
        this.router.navigate('player', { videoId });
      });
      grid.appendChild(card.getElement());
    });

    const testHapticsBtn = this.container.querySelector('#test-haptics-btn');
    if (testHapticsBtn) {
      testHapticsBtn.addEventListener('click', () => {
        import('web-haptics').then(({ WebHaptics }) => {
          const haptics = new WebHaptics();
          haptics.trigger('success');
        });
      });
    }
  }
}
