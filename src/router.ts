import { Route, RouteParams, RouterState } from './types';

export interface PageController {
  mount(container: HTMLElement, params: RouteParams): void;
  unmount(): void;
}

export class Router {
  private currentState: RouterState = { route: 'home', params: {} };
  private listeners: ((state: RouterState) => void)[] = [];
  private activeController: PageController | null = null;
  private pages: Record<Route, PageController> = {} as any;
  private rootElement: HTMLElement;

  constructor(rootElementId: string) {
    const el = document.getElementById(rootElementId);
    if (!el) throw new Error(`Router root #${rootElementId} not found`);
    this.rootElement = el;

    window.addEventListener('hashchange', this.handleHashChange.bind(this));
    // Initial parse
    if (!window.location.hash) {
      window.location.hash = '#/';
    } else {
      this.handleHashChange();
    }
  }

  register(route: Route, controller: PageController) {
    this.pages[route] = controller;
  }

  navigate(route: Route, params?: RouteParams): void {
    let hash = `#/${route === 'home' ? '' : route}`;
    if (params && params.videoId) {
      hash += `/${params.videoId}`;
    }
    window.location.hash = hash;
  }

  getCurrentState(): RouterState {
    return this.currentState;
  }

  onRouteChange(callback: (state: RouterState) => void): void {
    this.listeners.push(callback);
    // trigger immediately for initial state
    callback(this.currentState);
  }

  private handleHashChange(): void {
    const hash = window.location.hash;
    
    // Parse route
    if (hash.startsWith('#/player/')) {
      const videoId = hash.replace('#/player/', '');
      this.currentState = { route: 'player', params: { videoId } };
    } else if (hash === '#/feedback') {
      this.currentState = { route: 'feedback', params: {} };
    } else {
      this.currentState = { route: 'home', params: {} };
    }

    this.notifyListeners();
    this.mountCurrentPage();
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.currentState);
    }
  }

  private mountCurrentPage() {
    if (this.activeController) {
      this.activeController.unmount();
    }

    const controller = this.pages[this.currentState.route];
    if (controller) {
      // Clear root element
      this.rootElement.replaceChildren();
      this.activeController = controller;
      controller.mount(this.rootElement, this.currentState.params);
    } else {
      console.error(`No controller registered for route: ${this.currentState.route}`);
    }
  }
}
