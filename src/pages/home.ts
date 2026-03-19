import { PageController, Router } from '../router';
import { RouteParams, VideoMeta } from '../types';
import { VideoCard } from '../components/video-card';
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
    this.container.replaceChildren();
  }

  private render() {
    this.container.innerHTML = `
      <header class="home-header">
        <h1 class="home-title">Haptix</h1>
        <button id="test-haptics-btn" class="test-haptics-btn">Test Haptics</button>
      </header>
      <div class="video-grid" id="video-grid"></div>`;

    const grid = this.container.querySelector('#video-grid') as HTMLElement;
    (videosData as VideoMeta[]).forEach(video => {
      grid.appendChild(new VideoCard(video, (videoId) => {
        this.router.navigate('player', { videoId });
      }).getElement());
    });

    this.container.querySelector('#test-haptics-btn')?.addEventListener('click', () => {
      import('web-haptics').then(({ WebHaptics }) => {
        new WebHaptics({ debug: true }).trigger([
          { "duration": 363, "intensity": 0.99 },
          { "delay": 4637, "duration": 296, "intensity": 0.28 },
          { "delay": 4704, "duration": 515, "intensity": 0.81 },
          { "delay": 4485, "duration": 298, "intensity": 0.88 },
          { "delay": 4702, "duration": 272, "intensity": 0.77 },
          { "delay": 4728, "duration": 560, "intensity": 0.62 },
          { "delay": 4440, "duration": 470, "intensity": 0.93 },
          { "delay": 4530, "duration": 368, "intensity": 0.03 },
          { "delay": 4632, "duration": 333, "intensity": 0.2 },
          { "delay": 4667, "duration": 191, "intensity": 0.4 },
          { "delay": 4809, "duration": 359, "intensity": 0.28 },
          { "delay": 4641, "duration": 533, "intensity": 0.27 },
          { "delay": 4467, "duration": 469, "intensity": 0.66 },
          { "delay": 4531, "duration": 578, "intensity": 0.33 },
          { "delay": 4422, "duration": 259, "intensity": 0.3 },
          { "delay": 4741, "duration": 265, "intensity": 0.13 },
          { "delay": 4735, "duration": 211, "intensity": 0.75 },
          { "delay": 4789, "duration": 382, "intensity": 0.89 },
          { "delay": 4618, "duration": 583, "intensity": 0.36 },
          { "delay": 4417, "duration": 110, "intensity": 0.99 },
          { "delay": 4890, "duration": 266, "intensity": 0.88 },
          { "delay": 4734, "duration": 169, "intensity": 0.09 },
          { "delay": 4831, "duration": 340, "intensity": 0.83 },
          { "delay": 4660, "duration": 551, "intensity": 0.63 },
          { "delay": 4449, "duration": 593, "intensity": 0.87 },
          { "delay": 4407, "duration": 286, "intensity": 0.52 },
          { "delay": 4714, "duration": 128, "intensity": 0.55 },
          { "delay": 4872, "duration": 527, "intensity": 0.04 },
          { "delay": 4473, "duration": 583, "intensity": 0.83 },
          { "delay": 4417, "duration": 197, "intensity": 0.18 },
        ]);
      });
    });
  }
}
