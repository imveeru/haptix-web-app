import { VideoMeta } from '../types';

export class VideoCard {
  private element: HTMLElement;

  constructor(video: VideoMeta, onNavigate: (videoId: string) => void) {
    this.element = document.createElement('article');
    this.element.className = 'video-card';
    this.element.setAttribute('role', 'button');
    this.element.setAttribute('tabindex', '0');

    const mm = Math.floor(video.duration / 60);
    const ss = (video.duration % 60).toString().padStart(2, '0');
    const artistText = video.artist ? `${video.artist} · ` : '';

    const thumbContainer = document.createElement('div');
    thumbContainer.className = 'video-thumb-container';
    const img = document.createElement('img');
    img.className = 'video-thumb';
    img.src = video.thumbnailUrl;
    img.loading = 'lazy';
    img.alt = '';
    thumbContainer.appendChild(img);

    const info = document.createElement('div');
    info.className = 'video-info';
    const title = document.createElement('h3');
    title.className = 'video-title';
    title.textContent = video.title;
    const subtitle = document.createElement('span');
    subtitle.className = 'video-subtitle';
    subtitle.textContent = `${artistText}${mm}:${ss}`;
    info.append(title, subtitle);

    this.element.append(thumbContainer, info);

    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNavigate(video.id);
      }
    });

    this.element.addEventListener('pointerdown', () => {
      this.element.classList.add('pressed');
    });

    this.element.addEventListener('pointerup', () => {
      this.element.classList.remove('pressed');
      onNavigate(video.id);
    });

    this.element.addEventListener('pointercancel', () => {
      this.element.classList.remove('pressed');
    });

    this.element.addEventListener('pointerleave', () => {
      this.element.classList.remove('pressed');
    });
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
