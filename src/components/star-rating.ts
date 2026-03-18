export class StarRating {
  private element: HTMLElement;
  private currentRating: number;
  private onChange: (rating: number) => void;

  constructor(questionId: string, label: string, currentRating: number, onChange: (rating: number) => void) {
    this.currentRating = currentRating;
    this.onChange = onChange;

    this.element = document.createElement('div');
    this.element.id = questionId;
    this.element.className = 'star-rating';
    this.element.setAttribute('role', 'radiogroup');
    this.element.setAttribute('aria-label', label);

    this.buildStars();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  reset() {
    this.currentRating = 0;
    this.updateStars();
  }

  private buildStars() {
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'star-button';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.setAttribute('aria-label', `${i} stars`);
      btn.dataset.star = String(i);

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('aria-hidden', 'true');
      svg.classList.add('star-icon', 'empty');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z');
      svg.appendChild(path);
      btn.appendChild(svg);

      btn.addEventListener('click', () => {
        if (this.currentRating === i) return;
        this.currentRating = i;
        btn.classList.add('animate');
        setTimeout(() => btn.classList.remove('animate'), 150);
        this.updateStars();
        this.onChange(i);
      });

      this.element.appendChild(btn);
    }
  }

  private updateStars() {
    const STAR_FILLED = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';
    const STAR_EMPTY = 'M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z';
    this.element.querySelectorAll<HTMLButtonElement>('.star-button').forEach((btn) => {
      const starNum = Number(btn.dataset.star);
      const isFilled = starNum <= this.currentRating;
      const svg = btn.querySelector('svg')!;
      const path = btn.querySelector('path') as SVGPathElement;
      path.setAttribute('d', isFilled ? STAR_FILLED : STAR_EMPTY);
      svg.classList.toggle('filled', isFilled);
      svg.classList.toggle('empty', !isFilled);
      btn.setAttribute('aria-checked', isFilled ? 'true' : 'false');
    });
  }
}
