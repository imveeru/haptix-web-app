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

      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#icon-star-empty');
      svg.appendChild(use);
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
    this.element.querySelectorAll<HTMLButtonElement>('.star-button').forEach((btn) => {
      const starNum = Number(btn.dataset.star);
      const isFilled = starNum <= this.currentRating;
      const svg = btn.querySelector('svg')!;
      const use = btn.querySelector('use') as SVGUseElement;
      use.setAttribute('href', isFilled ? '#icon-star-filled' : '#icon-star-empty');
      svg.classList.toggle('filled', isFilled);
      svg.classList.toggle('empty', !isFilled);
      btn.setAttribute('aria-checked', isFilled ? 'true' : 'false');
    });
  }
}
