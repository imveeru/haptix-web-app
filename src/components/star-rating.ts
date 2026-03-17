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
    
    this.render();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  reset() {
    this.currentRating = 0;
    this.updateUI();
  }

  private render() {
    this.element.innerHTML = '';
    
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'star-button';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', i === this.currentRating ? 'true' : 'false');
      btn.setAttribute('aria-label', `${i} stars`);
      
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      svg.classList.add('star-icon');
      
      if (i <= this.currentRating) {
        svg.classList.add('filled');
        svg.innerHTML = '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />';
      } else {
        svg.classList.add('empty');
        // Outline star path
        svg.innerHTML = '<path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/>';
      }
      
      btn.appendChild(svg);
      
      btn.addEventListener('click', () => {
        this.setRating(i, btn);
      });
      
      this.element.appendChild(btn);
    }
  }

  private setRating(rating: number, targetBtn: HTMLElement) {
    if (this.currentRating === rating) return; // Optional: allow deselecting if needed? Spec says integer ratings only.
    
    this.currentRating = rating;
    targetBtn.classList.add('animate');
    setTimeout(() => {
      targetBtn.classList.remove('animate');
    }, 150);
    
    this.updateUI();
    this.onChange(rating);
  }

  private updateUI() {
    this.render(); // Re-render simplifies state
  }
}
