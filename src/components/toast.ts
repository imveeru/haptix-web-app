export class Toast {
  private element: HTMLElement;
  private messageEl: HTMLElement;
  private timeoutId: number | null = null;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'toast-container';
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-live', 'polite');

    const iconSvg = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
    `;

    this.messageEl = document.createElement('span');
    this.messageEl.className = 'toast-message';

    this.element.innerHTML = iconSvg;
    this.element.appendChild(this.messageEl);
    
    document.body.appendChild(this.element);
  }

  show(message: string, durationMs: number = 3000) {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
    }

    this.messageEl.textContent = message;
    
    // Trigger reflow to ensure transition runs if it was just hidden
    void this.element.offsetWidth;
    
    this.element.classList.add('visible');

    this.timeoutId = window.setTimeout(() => {
      this.hide();
    }, durationMs);
  }

  hide() {
    this.element.classList.remove('visible');
    this.timeoutId = null;
  }
}

export const toastInstance = new Toast();
