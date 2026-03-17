import { Router } from './router';
import { NavBar } from './components/nav-bar';
import { HomePage } from './pages/home';
import { PlayerPage } from './pages/player';
import { FeedbackPage } from './pages/feedback';

// Initialize Router targeting the main-content wrapper
const router = new Router('main-content');

// Register pages
router.register('home', new HomePage(router));
router.register('player', new PlayerPage(router));
router.register('feedback', new FeedbackPage());

// Mount NavBar globally
const appRoot = document.getElementById('app');
if (appRoot) {
  const navBar = new NavBar(router);
  navBar.mount(appRoot);
} else {
  console.error("Failed to find #app root");
}
