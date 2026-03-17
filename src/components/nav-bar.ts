import { RouterState } from '../types';
import { Router } from '../router';

export class NavBar {
  private element: HTMLElement;
  private router: Router;

  constructor(router: Router) {
    this.router = router;
    this.element = document.createElement('nav');
    this.element.className = 'bottom-nav';
    this.element.setAttribute('aria-label', 'Main navigation');
    
    this.render();
    
    // Listen to route changes to update active state
    this.router.onRouteChange(this.updateActiveState.bind(this));
  }

  mount(container: HTMLElement) {
    container.appendChild(this.element);
  }

  private render() {
    this.element.innerHTML = `
      <a href="#/" class="nav-item" data-route="home" aria-label="Home">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        <span class="nav-label">Home</span>
      </a>
      <a href="#/feedback" class="nav-item" data-route="feedback" aria-label="Feedback">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
        <span class="nav-label">Feedback</span>
      </a>
    `;

    // Add click event logic is not strictly necessary since they are real <a> tags,
    // but useful if we wanted to prevent default or add sounds.
  }

  private updateActiveState(state: RouterState) {
    const items = this.element.querySelectorAll('.nav-item');
    items.forEach(item => {
      if (item.getAttribute('data-route') === state.route) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
      } else {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
      }
    });
  }
}
