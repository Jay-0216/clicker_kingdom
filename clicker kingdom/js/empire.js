// ---------- Empire Tier & Titles Module ----------
import { KINGDOM_TIERS, UNLOCKABLE_TITLES } from './config.js';
import { state, getClicks, notifyStateChange } from './state.js';
import { showToast } from './ui.js';

export function getTierInfo(clicks) {
  let active = KINGDOM_TIERS[0];
  for (let i = KINGDOM_TIERS.length - 1; i >= 0; i--) {
    if (clicks >= KINGDOM_TIERS[i].clicks) {
      active = KINGDOM_TIERS[i];
      break;
    }
  }
  return active;
}

export function calcBattlePower() {
  const clicks = getClicks();
  const cpsPower = state.cps * 5;
  const clickPower = Math.floor(clicks / 5);
  const winPower = (state.warRecords.wins || 0) * 500;
  return cpsPower + clickPower + winPower;
}

export function checkTitleUnlocks() {
  const bp = calcBattlePower();
  const wins = state.warRecords.wins || 0;
  const plundered = state.warRecords.plunderedClicks || 0;

  if (wins >= 5 && !state.unlockedTitles.includes('title_victor')) {
    state.unlockedTitles.push('title_victor');
    showToast('🏆 칭호 해금: [백전백승의 챔피언]!');
  }
  if (plundered >= 10000 && !state.unlockedTitles.includes('title_raider')) {
    state.unlockedTitles.push('title_raider');
    showToast('💰 칭호 해금: [전설의 약탈자]!');
  }
  if (bp >= 10000 && !state.unlockedTitles.includes('title_bulwark')) {
    state.unlockedTitles.push('title_bulwark');
    showToast('🛡️ 칭호 해금: [불굴의 기사단장]!');
  }
  notifyStateChange();
}

export function equipTitle(titleId) {
  if (!state.unlockedTitles.includes(titleId)) {
    showToast('아직 해금되지 않은 칭호입니다.');
    return;
  }
  state.equippedTitle = titleId;
  notifyStateChange();
  const tObj = UNLOCKABLE_TITLES.find(t => t.id === titleId);
  showToast(`👑 칭호 [${tObj ? tObj.name : titleId}]을(를) 장착했습니다.`);
}
