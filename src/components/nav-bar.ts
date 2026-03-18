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

    this.element.innerHTML = `
      <a href="#/" class="nav-item" data-route="home" aria-label="Home">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><use href="#icon-home"></use></svg>
        <span class="nav-label">Home</span>
      </a>
      <a href="#/feedback" class="nav-item" data-route="feedback" aria-label="Feedback">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><use href="#icon-feedback"></use></svg>
        <span class="nav-label">Feedback</span>
      </a>`;

    this.router.onRouteChange(this.updateActiveState.bind(this));
  }

  mount(container: HTMLElement) {
    container.appendChild(this.element);
  }

  private updateActiveState(state: RouterState) {
    this.element.querySelectorAll('.nav-item').forEach(item => {
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
