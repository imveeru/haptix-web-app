import { VideoMeta } from '../types';

export class VideoCard {
  private element: HTMLElement;
  private video: VideoMeta;
  private onNavigate: (videoId: string) => void;

  constructor(video: VideoMeta, onNavigate: (videoId: string) => void) {
    this.video = video;
    this.onNavigate = onNavigate;
    
    this.element = document.createElement('article');
    this.element.className = 'video-card';
    this.element.setAttribute('role', 'button');
    this.element.setAttribute('tabindex', '0');
    
    this.render();
    this.attachEvents();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  private render() {
    const mm = Math.floor(this.video.duration / 60);
    const ss = (this.video.duration % 60).toString().padStart(2, '0');
    const timeStr = `${mm}:${ss}`;
    
    const artistText = this.video.artist ? `${this.video.artist} · ` : '';

    this.element.innerHTML = `
      <div class="video-thumb-container">
        <img class="video-thumb" src="${this.video.thumbnailUrl}" loading="lazy" alt="" />
      </div>
      <div class="video-info">
        <h3 class="video-title">${this.video.title}</h3>
        <span class="video-subtitle">${artistText}${timeStr}</span>
      </div>
    `;
  }

  private attachEvents() {
    // Keyboard support
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.onNavigate(this.video.id);
      }
    });

    // Pointer events
    this.element.addEventListener('pointerdown', () => {
      this.element.classList.add('pressed');
    });

    this.element.addEventListener('pointerup', () => {
      this.element.classList.remove('pressed');
      // On tap finish
      this.onNavigate(this.video.id);
    });

    this.element.addEventListener('pointercancel', () => {
      this.element.classList.remove('pressed');
    });

    this.element.addEventListener('pointerleave', () => {
      this.element.classList.remove('pressed');
    });
  }
}
