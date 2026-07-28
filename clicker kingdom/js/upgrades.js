// ---------- Upgrades Module (Army & Relics) ----------
import { ARMY_ITEMS, MULTIPLIER_RELICS } from './config.js';
import { state, getClicks, spendClicks, notifyStateChange } from './state.js';
import { showToast } from './ui.js';

export function getArmyCost(item, count) {
  return Math.floor(item.baseCost * Math.pow(1.15, count));
}

export function buyArmy(itemId) {
  const item = ARMY_ITEMS.find(a => a.id === itemId);
  if (!item) return;
  const currentCount = state.armies[itemId] || 0;
  const cost = getArmyCost(item, currentCount);

  if (spendClicks(cost)) {
    state.armies[itemId] = currentCount + 1;
    state.missionProgress.armyCount = (state.missionProgress.armyCount || 0) + 1;
    recalculateCPS();
    showToast(`🗡️ ${item.name}을(를) 고용했습니다! (CPS +${item.cps})`);
  } else {
    showToast('❌ 자금이 부족합니다!');
  }
}

export function buyRelic(relicId) {
  const relic = MULTIPLIER_RELICS.find(r => r.id === relicId);
  if (!relic) return;
  if (state.relics[relicId]) {
    showToast('이미 보구를 소지하고 있습니다.');
    return;
  }

  if (spendClicks(relic.cost)) {
    state.relics[relicId] = true;
    recalculateMultipliers();
    showToast(`👑 보구 [${relic.name}]을(를) 해금했습니다!`);
  } else {
    showToast('❌ 자금이 부족합니다!');
  }
}

export function recalculateCPS() {
  let totalCps = 0;
  ARMY_ITEMS.forEach(item => {
    const count = state.armies[item.id] || 0;
    totalCps += item.cps * count;
  });
  state.cps = totalCps;
  notifyStateChange();
}

export function recalculateMultipliers() {
  let add = 0;
  let mult = 1;
  MULTIPLIER_RELICS.forEach(r => {
    if (state.relics[r.id]) {
      add += r.addClick;
      mult *= r.mult;
    }
  });
  state.clickMultiplier = (1 + add) * mult;
  notifyStateChange();
}
