export class Toast {
  private element: HTMLElement;
  private messageEl: HTMLElement;
  private timeoutId: number | null = null;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'toast-container';
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-live', 'polite');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('toast-icon');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#icon-check');
    svg.appendChild(use);

    this.messageEl = document.createElement('span');
    this.messageEl.className = 'toast-message';

    this.element.append(svg, this.messageEl);
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
