// ---------- Central Reactive Game State ----------

export const state = {
  currentUser: null,
  localClicks: 0,
  clickMultiplier: 1,
  cps: 0,
  armies: {},      // { peasant_spear: 2, royal_archer: 1 }
  relics: {},       // { commander_banner: true }
  equippedTitle: 'title_novice',
  unlockedTitles: ['title_novice'],
  warRecords: {
    totalBattles: 0,
    wins: 0,
    losses: 0,
    plunderedClicks: 0
  },
  missionProgress: {
    clickCount: 0,
    armyCount: 0,
    battleCount: 0,
    feedbackCount: 0,
    claimed: {}
  },
  currentView: 'landing'
};

const listeners = [];

export function subscribeState(fn) {
  listeners.push(fn);
}

export function notifyStateChange() {
  listeners.forEach(fn => fn(state));
}

export function getClicks() {
  return state.currentUser ? state.currentUser.clicks : state.localClicks;
}

export function addClicks(amount) {
  if (state.currentUser) {
    state.currentUser.clicks += amount;
  } else {
    state.localClicks += amount;
  }
  state.missionProgress.clickCount += amount;
  notifyStateChange();
}

export function spendClicks(amount) {
  const current = getClicks();
  if (current < amount) return false;
  if (state.currentUser) {
    state.currentUser.clicks -= amount;
  } else {
    state.localClicks -= amount;
  }
  notifyStateChange();
  return true;
}
