// ---------- Landing Page Module ----------
import { switchView } from './ui.js';

export function initLanding() {
  const startBtn = document.getElementById('landingStartBtn');
  const viewClickerBtn = document.getElementById('landingViewClickerBtn');
  const viewRankBtn = document.getElementById('landingViewRankBtn');

  if (startBtn) {
    startBtn.addEventListener('click', () => switchView('clicker'));
  }
  if (viewClickerBtn) {
    viewClickerBtn.addEventListener('click', () => switchView('clicker'));
  }
  if (viewRankBtn) {
    viewRankBtn.addEventListener('click', () => switchView('ranking'));
  }
}
