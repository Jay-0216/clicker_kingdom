// ---------- 10-Second Real-Time Tug-of-War Battle Engine ----------
import { state, addClicks, notifyStateChange } from './state.js';
import { calcBattlePower, checkTitleUnlocks } from './empire.js';
import { showToast } from './ui.js';

let battleInterval = null;
let battleTimeLeft = 10;
let myClicksInBattle = 0;
let enemyClicksInBattle = 0;
let currentEnemy = null;
let currentRoomCode = null;

export function generateRoomCode() {
  currentRoomCode = String(Math.floor(1000 + Math.random() * 9000));
  return currentRoomCode;
}

export function startBattle(enemyInfo) {
  currentEnemy = enemyInfo;
  myClicksInBattle = 0;
  enemyClicksInBattle = 0;
  battleTimeLeft = 10;

  document.getElementById('battleSetupPanel').hidden = true;
  document.getElementById('battleArenaPanel').hidden = false;

  document.getElementById('enemyNameLabel').textContent = enemyInfo.name;
  document.getElementById('enemyPowerLabel').textContent = enemyInfo.power.toLocaleString();
  document.getElementById('battleTimerDisplay').textContent = '10s';

  updateFrontlineVisual();

  battleInterval = setInterval(() => {
    battleTimeLeft--;
    document.getElementById('battleTimerDisplay').textContent = `${battleTimeLeft}s`;

    // AI/Simulated enemy taps
    const simulatedTapRate = Math.floor(enemyInfo.power / 500) + Math.floor(Math.random() * 4);
    enemyClicksInBattle += simulatedTapRate;

    updateFrontlineVisual();

    if (battleTimeLeft <= 0) {
      endBattle();
    }
  }, 1000);
}

export function registerMyBattleTap() {
  if (battleTimeLeft <= 0) return;
  myClicksInBattle += 1;
  updateFrontlineVisual();
}

function updateFrontlineVisual() {
  const myBp = calcBattlePower() + (myClicksInBattle * 150);
  const enemyBp = currentEnemy.power + (enemyClicksInBattle * 150);

  let fillPercent = 50;
  const totalPower = myBp + enemyBp;
  if (totalPower > 0) {
    fillPercent = Math.min(95, Math.max(5, (myBp / totalPower) * 100));
  }

  const fillEl = document.getElementById('battleFrontlineFill');
  if (fillEl) fillEl.style.width = `${fillPercent}%`;
}

function endBattle() {
  clearInterval(battleInterval);

  const myTotalPower = calcBattlePower() + (myClicksInBattle * 150);
  const enemyTotalPower = currentEnemy.power + (enemyClicksInBattle * 150);

  const isWin = myTotalPower >= enemyTotalPower;
  state.warRecords.totalBattles = (state.warRecords.totalBattles || 0) + 1;
  state.missionProgress.battleCount = (state.missionProgress.battleCount || 0) + 1;

  if (isWin) {
    state.warRecords.wins = (state.warRecords.wins || 0) + 1;
    const plunder = Math.max(1000, Math.floor(currentEnemy.power * 0.5));
    state.warRecords.plunderedClicks = (state.warRecords.plunderedClicks || 0) + plunder;
    addClicks(plunder);
    showToast(`🎉 대전 승리! 적 제국의 전선을 무너뜨리고 +${plunder.toLocaleString()} 클릭 자금을 약탈했습니다!`);
  } else {
    state.warRecords.losses = (state.warRecords.losses || 0) + 1;
    showToast(`💔 아쉬운 패배... 적의 방어선에 막혔습니다.`);
  }

  checkTitleUnlocks();
  notifyStateChange();

  setTimeout(() => {
    document.getElementById('battleSetupPanel').hidden = false;
    document.getElementById('battleArenaPanel').hidden = true;
  }, 1500);
}
