// ============================================================================
// Clicker Kingdom - Main Unified Application Script
// Compatible with both local file:// opening and http/https web servers.
// ============================================================================

// ---------- 1. Config & Game Data Constants ----------
***REMOVED***

const ARMY_ITEMS = [
  { id: 'peasant_spear', name: '농민 창병대', icon: '🗡️', cps: 1, baseCost: 15, desc: '가장 기본적인 영지 창병 수호대' },
  { id: 'royal_archer', name: '왕실 궁수대', icon: '🏹', cps: 5, baseCost: 100, desc: '성벽 위에서 화살을 쏘는 숙련된 정예 궁수' },
  { id: 'elite_cavalry', name: '정예 기병대', icon: '🐎', cps: 20, baseCost: 1100, desc: '전장을 종횡무진 휩쓰는 묵직한 중갑 기병대' },
  { id: 'siege_catapult', name: '공성 투석기', icon: '🏰', cps: 80, baseCost: 12000, desc: '거대한 돌을 날려 적의 전선을 파괴하는 대포' },
  { id: 'guardian_knight', name: '수호 기사단', icon: '🛡️', cps: 350, baseCost: 130000, desc: '왕국의 신성한 맹세를 이행하는 기사단' },
  { id: 'alchemical_golem', name: '연금술 발도 골렘', icon: '🤖', cps: 1500, baseCost: 1400000, desc: '마법 연금술로 연마된 거대한 마도 골렘' },
  { id: 'arcane_cannon', name: '마도 대포 요새', icon: '🔫', cps: 7500, baseCost: 20000000, desc: '마력을 집속시켜 연사하는 차세대 마도 요새' },
  { id: 'dragon_artillery', name: '용의 화염포', icon: '☢️', cps: 40000, baseCost: 330000000, desc: '드래곤의 불꽃으로 광범위 지대를 태우는 대포' },
  { id: 'dimensional_citadel', name: '차원 왜곡 요새', icon: '🛸', cps: 250000, baseCost: 5100000000, desc: '시공간 전선을 왜곡시키는 궁극의 제국 요새' }
];

const MULTIPLIER_RELICS = [
  { id: 'commander_banner', name: "지휘관의 영주 깃발", icon: '🚩', cost: 100, addClick: 1, mult: 1, desc: '클릭당 자금 +1 추가' },
  { id: 'runed_sword', name: "왕국 기사의 명검", icon: '🗡️', cost: 500, addClick: 0, mult: 2, desc: '수동 클릭 자금 2배 증가' },
  { id: 'sovereign_seal', name: "제왕의 옥새", icon: '👑', cost: 10000, addClick: 0, mult: 2, desc: '수동 클릭 자금 2배 추가 증폭' },
  { id: 'thunder_throne', name: "제국의 천둥 옥좌", icon: '⚡', cost: 250000, addClick: 0, mult: 2, desc: '수동 클릭 자금 2배 추가 증폭' },
  { id: 'celestial_crown', name: "천상의 정복자 왕관", icon: '🌟', cost: 5000000, addClick: 0, mult: 2, desc: '수동 클릭 자금 2배 추가 증폭' }
];

// Visual Effects Shop Items
const VISUAL_EFFECTS = [
  { id: 'effect-aura-dragon', name: '🐲 황금 용의 오라', icon: '🐲', cost: 5000, desc: '메인 씰에 웅장한 황금 용의 불꽃 오라 펄스가 휘감깁니다.' },
  { id: 'effect-aura-lightning', name: '⚡ 천둥 번개 전율', icon: '⚡', cost: 50000, desc: '클릭할 때마다 푸른 번개 충격파가 메인 씰에 전율합니다.' },
  { id: 'effect-aura-galaxy', name: '🌌 시공간 별빛 은하수', icon: '🌌', cost: 1000000, desc: '신비로운 자줏빛 신성 은하수 궤도가 씰을 회전합니다.' },
  { id: 'effect-aura-hellfire', name: '🔥 지옥불 용암 분출', icon: '🔥', cost: 25000000, desc: '지옥의 붉은 용암 불꽃 폭발 이펙트가 타오릅니다.' }
];

// Re-balanced Background CPS Items (High Cost, Reduced Yield)
const OFFLINE_CPS_ITEMS = [
  { id: 'bg_administrator', name: '백그라운드 행정 집행관', icon: '🏛️', offlineCps: 5, baseCost: 500000, desc: '웹을 닫아도 백그라운드에서 자금 수확 (초당 +5)' },
  { id: 'bg_guardian_order', name: '시공간 자율 수호 군단', icon: '🛡️', offlineCps: 25, baseCost: 25000000, desc: '자율 작동하는 백그라운드 수호 군단 (초당 +25)' },
  { id: 'bg_dimensional_citadel', name: '차원 왜곡 방치 요새', icon: '🛸', offlineCps: 100, baseCost: 1000000000, desc: '접속 종료 중에도 방치 자금 수확 (초당 +100)' }
];

const KINGDOM_TIERS = [
  { clicks: 0, name: '초라한 오두막', title: '방랑 부족장', core1: '#55504a', core2: '#33302b', borderW: '0px', borderC: 'transparent', gems: 0, crown: false, glow: 0 },
  { clicks: 100, name: '통나무 보루', title: '성주', core1: '#634b35', core2: '#3d2d1f', borderW: '2px', borderC: '#a8794c', gems: 1, crown: false, glow: 0.2 },
  { clicks: 1000, name: '석조 요새', title: '영주', core1: '#4a525d', core2: '#282d35', borderW: '3px', borderC: '#8ca4be', gems: 2, crown: false, glow: 0.4 },
  { clicks: 10000, name: '번창하는 성채', title: '정복왕', core1: '#7a2b37', core2: '#42161d', borderW: '4px', borderC: '#e56b73', gems: 3, crown: true, glow: 0.65 },
  { clicks: 100000, name: '황금 왕국', title: '제국 황제', core1: '#856a28', core2: '#473812', borderW: '5px', borderC: '#f1ce6b', gems: 4, crown: true, glow: 0.85 },
  { clicks: 1000000, name: '천상 제국', title: '천상 패왕', core1: '#4d2b7a', core2: '#281442', borderW: '6px', borderC: '#c48ef5', gems: 4, crown: true, glow: 1.0 }
];

const UNLOCKABLE_TITLES = [
  { id: 'title_novice', name: '초보 영주', req: '기본 지급', desc: '왕국을 건국한 영주' },
  { id: 'title_victor', name: '백전백승의 챔피언', req: '대전 5승 달성', desc: '전장에서 승리를 거둔 명장' },
  { id: 'title_raider', name: '전설의 약탈자', req: '약탈 10,000 클릭', desc: '적의 자금을 휩수한 약탈자' },
  { id: 'title_bulwark', name: '불굴의 기사단장', req: '전투력 10,000 이상', desc: '강력한 제국 군대를 거느린 자' },
  { id: 'title_visionary', name: '제국의 선지자', req: '제보/아이디어 작성', desc: '제국 발전에 기여한 지혜로운 통치자' }
];

const DAILY_MISSIONS = [
  { id: 'm_click200', title: '⚔️ 왕국 수호', desc: '수동 클릭 100회 누르기', reward: 2000, target: 100, type: 'click' },
  { id: 'm_buy_army', title: '🐎 군세 확장', desc: '군대 1회 이상 고용하기', reward: 5000, target: 1, type: 'army' },
  { id: 'm_battle', title: '🛡️ 전장의 지휘관', desc: '친구/AI 대전 1회 완료하기', reward: 10000, target: 1, type: 'battle' },
  { id: 'm_feedback', title: '💡 제국 발전의 소리', desc: '버그 제보 또는 아이디어 제안하기', reward: 20000, target: 1, type: 'feedback' }
];

// ---------- 2. IndexedDB & Storage ----------
const DB_NAME = 'ClickerKingdomDB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      console.log('[Storage] IndexedDB 업그레이드 중...');
      const db = e.target.result;
      if (!db.objectStoreNames.contains('accounts')) db.createObjectStore('accounts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('leaderboard')) db.createObjectStore('leaderboard', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('feedbacks')) db.createObjectStore('feedbacks', { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => {
      console.log('[Storage] IndexedDB 연결 성공');
      resolve(request.result);
    };
    request.onerror = (e) => {
      console.error('[Storage] IndexedDB 연결 실패:', e.target.error);
      reject(request.error);
    };
  });
}

async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  if (!window.crypto || !window.crypto.subtle) {
    console.warn('[Auth] crypto.subtle 미지원 - 폴백 해시 사용');
    let hash = 0;
    for (let i = 0; i < pw.length; i++) {
      const chr = pw.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getAccount(id) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('accounts', 'readonly');
      const req = tx.objectStore('accounts').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => {
        console.error('[Storage] getAccount 오류:', e);
        resolve(null);
      };
    });
  } catch (e) {
    console.error('[Storage] getAccount catch:', e);
    return null;
  }
}

async function setAccount(acc) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readwrite');
      const req = tx.objectStore('accounts').put(acc);
      req.onsuccess = () => {
        console.log('[Storage] 계정 저장 완료:', acc.id);
        resolve(true);
      };
      req.onerror = (e) => {
        console.error('[Storage] setAccount req 오류:', e.target.error);
        reject(e.target.error);
      };
      tx.oncomplete = () => {
        console.log('[Storage] setAccount 트랜잭션 완료');
      };
      tx.onerror = (e) => {
        console.error('[Storage] setAccount 트랜잭션 오류:', e.target.error);
        reject(e.target.error);
      };
    });
  } catch (e) {
    console.error('[Storage] setAccount catch:', e);
    throw e;
  }
}

async function getLeaderboard() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('leaderboard', 'readonly');
      const req = tx.objectStore('leaderboard').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

async function setLeaderboard(list) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('leaderboard', 'readwrite');
      const store = tx.objectStore('leaderboard');
      store.clear();
      list.forEach(entry => store.put(entry));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    return false;
  }
}

async function getFeedbacks() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('feedbacks', 'readonly');
      const req = tx.objectStore('feedbacks').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

async function saveFeedback(fb) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('feedbacks', 'readwrite');
      const req = tx.objectStore('feedbacks').add(fb);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return false;
  }
}

async function getSession() {
  const data = localStorage.getItem('ck_session');
  return data ? JSON.parse(data) : null;
}
async function setSession(id) {
  localStorage.setItem('ck_session', JSON.stringify({ id }));
}
async function clearSession() {
  localStorage.removeItem('ck_session');
}

// ---------- 3. Reactive Central Game State ----------
const state = {
  currentUser: null,
  localClicks: 0,
  clickMultiplier: 1,
  cps: 0,
  offlineCps: 0,
  armies: {},
  relics: {},
  effects: [],
  equippedEffect: null,
  offlineArmies: {},
  equippedTitle: 'title_novice',
  unlockedTitles: ['title_novice'],
  warRecords: { totalBattles: 0, wins: 0, losses: 0, plunderedClicks: 0 },
  missionProgress: { clickCount: 0, armyCount: 0, battleCount: 0, feedbackCount: 0, claimed: {} },
  lastOfflineTime: Date.now(),
  currentView: 'landing'
};

const listeners = [];
function subscribeState(fn) { listeners.push(fn); }
function notifyStateChange() { listeners.forEach(fn => fn(state)); }

function getClicks() {
  return state.currentUser ? state.currentUser.clicks : state.localClicks;
}

function setClicksDirectly(amount) {
  const val = Math.max(0, Math.floor(amount));
  if (state.currentUser) {
    state.currentUser.clicks = val;
  } else {
    state.localClicks = val;
  }
  notifyStateChange();
}

function addClicks(amount) {
  if (state.currentUser) {
    state.currentUser.clicks += amount;
  } else {
    state.localClicks += amount;
  }
  state.missionProgress.clickCount += amount;
  notifyStateChange();
}

function spendClicks(amount) {
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

// ---------- 4. Upgrades & Relics & Effects & Offline CPS ----------
function getArmyCost(item, count) {
  return Math.floor(item.baseCost * Math.pow(1.15, count));
}

function buyArmy(itemId) {
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

function buyOfflineArmy(itemId) {
  if (!state.currentUser) {
    showToast('🔒 백그라운드 CPS 구매는 로그인이 필요합니다!');
    openModal('authModal');
    return;
  }
  const item = OFFLINE_CPS_ITEMS.find(a => a.id === itemId);
  if (!item) return;
  const currentCount = state.offlineArmies[itemId] || 0;
  const cost = getArmyCost(item, currentCount);

  if (spendClicks(cost)) {
    state.offlineArmies[itemId] = currentCount + 1;
    recalculateCPS();
    showToast(`🌙 [백그라운드] ${item.name}을(를) 구축했습니다! (오프라인 CPS +${item.offlineCps})`);
  } else {
    showToast('❌ 자금이 부족합니다!');
  }
}

function getRelicCost(relic, count) {
  return Math.floor(relic.cost * Math.pow(1.15, count));
}

function buyRelic(relicId) {
  const relic = MULTIPLIER_RELICS.find(r => r.id === relicId);
  if (!relic) return;
  const currentCount = state.relics[relicId] || 0;
  const cost = getRelicCost(relic, currentCount);

  if (spendClicks(cost)) {
    state.relics[relicId] = currentCount + 1;
    recalculateMultipliers();
    showToast(`👑 보구 [${relic.name}]을(를) 강화했습니다! (x${currentCount + 1})`);
  } else {
    showToast('❌ 자금이 부족합니다!');
  }
}

function buyEffect(effectId) {
  const eff = VISUAL_EFFECTS.find(e => e.id === effectId);
  if (!eff) return;
  if (state.effects.includes(effectId)) {
    equipEffect(effectId);
    return;
  }

  if (spendClicks(eff.cost)) {
    state.effects.push(effectId);
    state.equippedEffect = effectId;
    notifyStateChange();
    showToast(`✨ 제국 이펙트 [${eff.name}]을(를) 해금하고 장착했습니다!`);
  } else {
    showToast('❌ 자금이 부족합니다!');
  }
}

function equipEffect(effectId) {
  if (state.equippedEffect === effectId) {
    state.equippedEffect = null;
    showToast('✨ 이펙트 장착을 해제했습니다.');
  } else {
    state.equippedEffect = effectId;
    const eff = VISUAL_EFFECTS.find(e => e.id === effectId);
    showToast(`✨ 이펙트 [${eff ? eff.name : effectId}]을(를) 장착했습니다!`);
  }
  notifyStateChange();
}

function recalculateCPS() {
  let totalCps = 0;
  ARMY_ITEMS.forEach(item => {
    const count = state.armies[item.id] || 0;
    totalCps += item.cps * count;
  });
  state.cps = totalCps;

  let totalOfflineCps = 0;
  OFFLINE_CPS_ITEMS.forEach(item => {
    const count = state.offlineArmies[item.id] || 0;
    totalOfflineCps += item.offlineCps * count;
  });
  state.offlineCps = totalOfflineCps;

  notifyStateChange();
}

function recalculateMultipliers() {
  let add = 0;
  let mult = 1;
  MULTIPLIER_RELICS.forEach(r => {
    const count = state.relics[r.id] || 0;
    if (count > 0) {
      add += r.addClick * count;
      mult *= Math.pow(r.mult, count);
    }
  });
  state.clickMultiplier = (1 + add) * mult;
  notifyStateChange();
}

// ---------- 5. Empire Tier & Titles ----------
function getTierInfo(clicks) {
  let active = KINGDOM_TIERS[0];
  for (let i = KINGDOM_TIERS.length - 1; i >= 0; i--) {
    if (clicks >= KINGDOM_TIERS[i].clicks) {
      active = KINGDOM_TIERS[i];
      break;
    }
  }
  return active;
}

function calcBattlePower() {
  const clicks = getClicks();
  const cpsPower = state.cps * 5;
  const clickPower = Math.floor(clicks / 5);
  const winPower = (state.warRecords.wins || 0) * 500;
  return cpsPower + clickPower + winPower;
}

function checkTitleUnlocks() {
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

function equipTitle(titleId) {
  if (!state.currentUser) {
    showToast('🔒 칭호 시스템은 로그인이 필요합니다!');
    openModal('authModal');
    return;
  }
  if (!state.unlockedTitles.includes(titleId)) {
    showToast('아직 해금되지 않은 칭호입니다.');
    return;
  }
  state.equippedTitle = titleId;
  notifyStateChange();
  const tObj = UNLOCKABLE_TITLES.find(t => t.id === titleId);
  showToast(`👑 칭호 [${tObj ? tObj.name : titleId}]을(를) 장착했습니다.`);
}

// ---------- 6. 10-Second Real-Time Tug-of-War Battle Engine ----------
let battleInterval = null;
let battleTimeLeft = 10;
let myClicksInBattle = 0;
let enemyClicksInBattle = 0;
let currentEnemy = null;
let myGeneratedRoomCode = null;

function generateRoomCode() {
  myGeneratedRoomCode = String(Math.floor(1000 + Math.random() * 9000));
  return myGeneratedRoomCode;
}

function startBattle(enemyInfo) {
  currentEnemy = enemyInfo;
  myClicksInBattle = 0;
  enemyClicksInBattle = 0;
  battleTimeLeft = 10;

  document.getElementById('battleSetupPanel').hidden = true;
  document.getElementById('battleArenaPanel').hidden = false;

  document.getElementById('enemyNameLabel').textContent = enemyInfo.name;
  document.getElementById('enemyCastleLabel').textContent = enemyInfo.name;
  document.getElementById('enemyPowerLabel').textContent = enemyInfo.power.toLocaleString();
  document.getElementById('battleTimerDisplay').textContent = '10s';

  updateFrontlineVisual();

  if (battleInterval) clearInterval(battleInterval);
  battleInterval = setInterval(() => {
    battleTimeLeft--;
    document.getElementById('battleTimerDisplay').textContent = `${battleTimeLeft}s`;

    const simulatedTapRate = Math.floor(enemyInfo.power / 500) + Math.floor(Math.random() * 4);
    enemyClicksInBattle += simulatedTapRate;

    updateFrontlineVisual();

    if (battleTimeLeft <= 0) {
      endBattle();
    }
  }, 1000);
}

function registerMyBattleTap() {
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

// ---------- 7. Missions Module ----------
function claimMissionReward(missionId) {
  const mission = DAILY_MISSIONS.find(m => m.id === missionId);
  if (!mission) return;

  if (state.missionProgress.claimed[missionId]) {
    showToast('이미 보상을 수령한 미션입니다.');
    return;
  }

  let currentProgress = 0;
  if (mission.type === 'click') currentProgress = state.missionProgress.clickCount || 0;
  else if (mission.type === 'army') currentProgress = state.missionProgress.armyCount || 0;
  else if (mission.type === 'battle') currentProgress = state.missionProgress.battleCount || 0;
  else if (mission.type === 'feedback') currentProgress = state.missionProgress.feedbackCount || 0;

  if (currentProgress < mission.target) {
    showToast('아직 달성 조건이 완료되지 않았습니다!');
    return;
  }

  state.missionProgress.claimed[missionId] = true;
  addClicks(mission.reward);
  showToast(`🎁 미션 완료! 보상 +${mission.reward.toLocaleString()} 클릭 지급되었습니다.`);
  notifyStateChange();
}

// ---------- 8. Ranking & Leaderboards ----------
let currentRankTab = 'clicks';

function setRankTab(tab) {
  currentRankTab = tab;
  renderRankingView();
}

function crownGlyph(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return String(rank);
}

async function renderRankingView() {
  const listEl = document.getElementById('rankingList');
  if (!listEl) return;

  listEl.innerHTML = '<div class="ranking-empty">불러오는 중...</div>';
  const leaderboard = await getLeaderboard();

  if (state.currentUser) {
    const idx = leaderboard.findIndex(e => e.id === state.currentUser.id);
    const myBp = calcBattlePower();
    const tObj = UNLOCKABLE_TITLES.find(t => t.id === state.equippedTitle);
    const titleName = tObj ? tObj.name : '방랑 부족장';

    const entryData = {
      id: state.currentUser.id,
      nickname: state.currentUser.nickname,
      clicks: state.currentUser.clicks || 0,
      battlePower: myBp,
      wins: state.warRecords.wins || 0,
      title: titleName
    };

    if (idx >= 0) leaderboard[idx] = entryData;
    else leaderboard.push(entryData);
  }

  if (currentRankTab === 'clicks') {
    leaderboard.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
  } else if (currentRankTab === 'power') {
    leaderboard.sort((a, b) => (b.battlePower || 0) - (a.battlePower || 0));
  } else if (currentRankTab === 'honor') {
    leaderboard.sort((a, b) => (b.wins || 0) - (a.wins || 0));
  }

  if (leaderboard.length === 0) {
    listEl.innerHTML = '<div class="ranking-empty">아직 왕국을 세운 영주가 없습니다.<br>첫 번째 통치자가 되어보세요!</div>';
    return;
  }

  listEl.innerHTML = leaderboard.map((entry, i) => {
    const rank = i + 1;
    const isMe = state.currentUser && entry.id === state.currentUser.id;
    let scoreDisplay = '';
    if (currentRankTab === 'clicks') scoreDisplay = `${(entry.clicks || 0).toLocaleString()} 클릭`;
    else if (currentRankTab === 'power') scoreDisplay = `⚔️ ${(entry.battlePower || 0).toLocaleString()}`;
    else if (currentRankTab === 'honor') scoreDisplay = `🏆 ${entry.wins || 0}승`;

    return `
      <div class="ranking-row ${isMe ? 'me' : ''}">
        <span class="rank-badge ${rank <= 3 ? 'top' + rank : ''}">${crownGlyph(rank)}</span>
        <div class="rank-nickname">
          <span>${escapeHtml(entry.nickname || '무명 영주')}</span>
          <span class="rank-title-chip">${escapeHtml(entry.title || '성주')}</span>
        </div>
        <span class="rank-score">${scoreDisplay}</span>
      </div>
    `;
  }).join('');
}

// ---------- 9. Feedback Module ----------
async function submitFeedback() {
  const category = document.getElementById('feedbackCategory').value;
  const content = document.getElementById('feedbackContent').value.trim();
  const errEl = document.getElementById('feedbackError');
  errEl.textContent = '';

  if (!content) {
    errEl.textContent = '제안 또는 버그 제보 내용을 입력해 주세요.';
    return;
  }

  const fbData = {
    category,
    content,
    author: state.currentUser ? state.currentUser.nickname : '익명 영주',
    createdAt: Date.now(),
    status: '검토 중'
  };

  await saveFeedback(fbData);

  state.missionProgress.feedbackCount = (state.missionProgress.feedbackCount || 0) + 1;
  if (!state.unlockedTitles.includes('title_visionary')) {
    state.unlockedTitles.push('title_visionary');
  }

  const reward = 10000;
  addClicks(reward);
  showToast(`🎁 제보해 주셔서 감사합니다! 포상금 +${reward.toLocaleString()} 클릭 지급되었습니다.`);

  document.getElementById('feedbackContent').value = '';
  closeModal('feedbackModal');
  notifyStateChange();
}

// ---------- 10. Admin Module ----------
function handleAdminLogin() {
  const pw = document.getElementById('adminPwInput').value;
  const errEl = document.getElementById('adminLoginError');
  errEl.textContent = '';

  if (pw !== ADMIN_PASSWORD) {
    errEl.textContent = '비밀번호가 올바르지 않습니다.';
    return;
  }

  document.getElementById('adminLoginForm').hidden = true;
  document.getElementById('adminDashboardContent').hidden = false;
  loadAdminFeedbacks();
}

function handleAdminCustomClickSet() {
  const valInput = document.getElementById('adminCustomClickInput').value;
  if (valInput === '' || isNaN(valInput)) {
    showToast('수동 설정할 클릭 수를 숫자로 입력해주세요!');
    return;
  }
  const amount = parseInt(valInput, 10);
  setClicksDirectly(amount);
  showToast(`⚙️ [관리자] 클릭 수가 ${amount.toLocaleString()} 클릭으로 설정되었습니다.`);
}

function giveAdminGold(amount) {
  addClicks(amount);
  showToast(`⚙️ [관리자] 치트 자금 +${amount.toLocaleString()} 클릭 지급 완료!`);
}

function unlockAllForAdmin() {
  ARMY_ITEMS.forEach(item => {
    state.armies[item.id] = (state.armies[item.id] || 0) + 10;
  });
  OFFLINE_CPS_ITEMS.forEach(item => {
    state.offlineArmies[item.id] = (state.offlineArmies[item.id] || 0) + 5;
  });
  VISUAL_EFFECTS.forEach(eff => {
    if (!state.effects.includes(eff.id)) state.effects.push(eff.id);
  });
  UNLOCKABLE_TITLES.forEach(t => {
    if (!state.unlockedTitles.includes(t.id)) state.unlockedTitles.push(t.id);
  });
  recalculateCPS();
  recalculateMultipliers();
  notifyStateChange();
  showToast('⚙️ [관리자] 모든 군대, 오프라인 행정관, 이펙트 및 칭호 전체 해금 완료!');
}

async function loadAdminFeedbacks() {
  const listEl = document.getElementById('adminFeedbackList');
  if (!listEl) return;
  listEl.innerHTML = '불러오는 중...';

  const feedbacks = await getFeedbacks();
  if (feedbacks.length === 0) {
    listEl.innerHTML = '<div style="color: var(--parchment-dim); font-size: 13px;">제출된 버그 제보가 없습니다.</div>';
    return;
  }

  listEl.innerHTML = feedbacks.map(f => `
    <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(212,175,55,0.3); border-radius: 10px; padding: 10px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--gold-bright); margin-bottom: 4px;">
        <span>[${escapeHtml(f.category)}] ${escapeHtml(f.author)}</span>
        <span>${new Date(f.createdAt).toLocaleDateString()}</span>
      </div>
      <div style="font-size: 13px; color: var(--parchment); white-space: pre-wrap;">${escapeHtml(f.content)}</div>
    </div>
  `).join('');
}

// ---------- 11. UI & View Controller Module ----------
function switchView(viewName) {
  if (viewName === 'titles' && !state.currentUser) {
    showToast('🔒 칭호 시스템은 로그인이 필요합니다!');
    openModal('authModal');
    return;
  }

  state.currentView = viewName;
  const views = ['landingView', 'clickerView', 'shopView', 'battleView', 'rankingView', 'titlesView', 'missionsView'];
  views.forEach(vId => {
    const el = document.getElementById(vId);
    if (el) el.hidden = true;
  });

  const activeEl = document.getElementById(viewName + 'View');
  if (activeEl) activeEl.hidden = false;

  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-nav-view') === viewName);
  });

  renderActiveView();
}

function renderActiveView() {
  const clicks = getClicks();
  const tier = getTierInfo(clicks);

  const userChip = document.getElementById('userChip');
  if (userChip && state.currentUser) {
    userChip.textContent = `${state.currentUser.nickname} (🏰 ${tier.title})`;
  }

  if (state.currentView === 'clicker') {
    renderClickerView(clicks, tier);
  } else if (state.currentView === 'shop') {
    renderShopView(clicks);
  } else if (state.currentView === 'titles') {
    renderTitlesView();
  } else if (state.currentView === 'missions') {
    renderMissionsView();
  } else if (state.currentView === 'ranking') {
    renderRankingView();
  }
}

function renderClickerView(clicks, tier) {
  document.getElementById('clickCount').textContent = clicks.toLocaleString();
  document.getElementById('tierLabel').textContent = tier.name;
  document.getElementById('cpsLabel').textContent = `자동 수확: +${state.cps.toLocaleString()} /초 | 🌙 백그라운드: +${state.offlineCps.toLocaleString()} /초`;
  document.getElementById('guestBanner').hidden = !!state.currentUser;

  const tObj = UNLOCKABLE_TITLES.find(t => t.id === state.equippedTitle);
  document.getElementById('currentTitleBadge').textContent = `👑 [${state.currentUser ? (tObj ? tObj.name : tier.title) : '로그인 필요'}]`;

  const sealBtn = document.getElementById('sealBtn');
  sealBtn.style.setProperty('--core1', tier.core1);
  sealBtn.style.setProperty('--core2', tier.core2);
  sealBtn.style.setProperty('--border-w', tier.borderW);
  sealBtn.style.setProperty('--border-c', tier.borderC);
  sealBtn.style.setProperty('--glow', tier.glow);

  // Apply equipped visual effect aura class
  sealBtn.className = 'seal-btn' + (state.equippedEffect ? ` ${state.equippedEffect}` : '');

  const crown = document.getElementById('sealCrown');
  crown.classList.toggle('visible', tier.crown);

  const gems = document.getElementById('sealGems').children;
  for (let i = 0; i < gems.length; i++) {
    gems[i].classList.toggle('visible', i < tier.gems);
  }

  // Render ALL affordable Quick Upgrades under Clicker
  renderQuickUpgrades(clicks);
}

let prevAffordableIds = new Set();

function renderQuickUpgrades(clicks) {
  const panel = document.getElementById('quickUpgradesPanel');
  if (!panel) return;

  const affordableArmies = ARMY_ITEMS.filter(item => {
    const count = state.armies[item.id] || 0;
    const cost = getArmyCost(item, count);
    return clicks >= cost;
  });

  const affordableRelics = MULTIPLIER_RELICS.filter(r => {
    const count = state.relics[r.id] || 0;
    const cost = getRelicCost(r, count);
    return clicks >= cost;
  });

  if (affordableArmies.length === 0 && affordableRelics.length === 0) {
    panel.innerHTML = '';
    prevAffordableIds = new Set();
    return;
  }

  const currentAffordableIds = new Set();
  affordableArmies.forEach(item => currentAffordableIds.add('army_' + item.id));
  affordableRelics.forEach(r => currentAffordableIds.add('relic_' + r.id));

  let html = `<div class="quick-upgrades-header"><span>⚡ 구매 가능한 즉시 업그레이드</span></div>`;

  affordableArmies.forEach(item => {
    const count = state.armies[item.id] || 0;
    const cost = getArmyCost(item, count);
    const isNew = !prevAffordableIds.has('army_' + item.id);
    html += `
      <div class="quick-upgrade-card ${isNew ? 'quick-upgrade-new' : ''}">
        <div class="quick-upgrade-info">
          <span class="quick-upgrade-icon">${item.icon}</span>
          <div>
            <div class="quick-upgrade-name">${item.name} (x${count})</div>
            <div class="quick-upgrade-sub">CPS +${item.cps}</div>
          </div>
        </div>
        <button class="buy-btn" data-quick-buy-army="${item.id}">고용 (${cost.toLocaleString()})</button>
      </div>
    `;
  });

  affordableRelics.forEach(topRelic => {
    const count = state.relics[topRelic.id] || 0;
    const cost = getRelicCost(topRelic, count);
    const isNew = !prevAffordableIds.has('relic_' + topRelic.id);
    html += `
      <div class="quick-upgrade-card ${isNew ? 'quick-upgrade-new' : ''}">
        <div class="quick-upgrade-info">
          <span class="quick-upgrade-icon">${topRelic.icon}</span>
          <div>
            <div class="quick-upgrade-name">${topRelic.name} (x${count})</div>
            <div class="quick-upgrade-sub">${topRelic.desc}</div>
          </div>
        </div>
        <button class="buy-btn" data-quick-buy-relic="${topRelic.id}">강화 (${cost.toLocaleString()})</button>
      </div>
    `;
  });

  prevAffordableIds = currentAffordableIds;

  panel.innerHTML = html;

  panel.querySelectorAll('[data-quick-buy-army]').forEach(btn => {
    btn.onclick = () => buyArmy(btn.getAttribute('data-quick-buy-army'));
  });
  panel.querySelectorAll('[data-quick-buy-relic]').forEach(btn => {
    btn.onclick = () => buyRelic(btn.getAttribute('data-quick-buy-relic'));
  });
}

function renderShopView(clicks) {
  const armyListEl = document.getElementById('armyShopList');
  if (armyListEl) {
    armyListEl.innerHTML = ARMY_ITEMS.map(item => {
      const count = state.armies[item.id] || 0;
      const cost = getArmyCost(item, count);
      const canAfford = clicks >= cost;
      return `
        <div class="item-card">
          <div class="item-icon">${item.icon}</div>
          <div class="item-info">
            <span class="item-name">${item.name} <span class="item-count">x${count}</span></span>
            <span class="item-desc">${item.desc} (CPS +${item.cps})</span>
          </div>
          <div class="item-action">
            <button class="buy-btn" data-buy-army="${item.id}" ${canAfford ? '' : 'disabled'}>
              고용 (${cost.toLocaleString()})
            </button>
          </div>
        </div>
      `;
    }).join('');

    armyListEl.querySelectorAll('[data-buy-army]').forEach(btn => {
      btn.onclick = () => buyArmy(btn.getAttribute('data-buy-army'));
    });
  }

  const relicListEl = document.getElementById('relicShopList');
  if (relicListEl) {
    relicListEl.innerHTML = MULTIPLIER_RELICS.map(r => {
      const count = state.relics[r.id] || 0;
      const cost = getRelicCost(r, count);
      const canAfford = clicks >= cost;
      return `
        <div class="item-card">
          <div class="item-icon">${r.icon}</div>
          <div class="item-info">
            <span class="item-name">${r.name} <span class="item-count">x${count}</span></span>
            <span class="item-desc">${r.desc}</span>
          </div>
          <div class="item-action">
            <button class="buy-btn" data-buy-relic="${r.id}" ${canAfford ? '' : 'disabled'}>
              강화 (${cost.toLocaleString()})
            </button>
          </div>
        </div>
      `;
    }).join('');

    relicListEl.querySelectorAll('[data-buy-relic]').forEach(btn => {
      btn.onclick = () => buyRelic(btn.getAttribute('data-buy-relic'));
    });
  }

  const effectListEl = document.getElementById('effectShopList');
  if (effectListEl) {
    effectListEl.innerHTML = VISUAL_EFFECTS.map(eff => {
      const owned = state.effects.includes(eff.id);
      const isEquipped = state.equippedEffect === eff.id;
      const canAfford = clicks >= eff.cost || owned;
      return `
        <div class="item-card">
          <div class="item-icon">${eff.icon}</div>
          <div class="item-info">
            <span class="item-name">${eff.name} ${isEquipped ? '✨ [장착 중]' : owned ? '🔒 [소지중]' : ''}</span>
            <span class="item-desc">${eff.desc}</span>
          </div>
          <div class="item-action">
            <button class="buy-btn" data-buy-effect="${eff.id}" ${!canAfford ? 'disabled' : ''}>
              ${isEquipped ? '해제하기' : owned ? '장착하기' : `구매 (${eff.cost.toLocaleString()})`}
            </button>
          </div>
        </div>
      `;
    }).join('');

    effectListEl.querySelectorAll('[data-buy-effect]').forEach(btn => {
      btn.onclick = () => buyEffect(btn.getAttribute('data-buy-effect'));
    });
  }

  const offlineListEl = document.getElementById('offlineShopList');
  if (offlineListEl) {
    if (!state.currentUser) {
      offlineListEl.innerHTML = `
        <div class="ranking-empty" style="text-align:center; padding: 30px;">
          <div style="font-size: 28px; margin-bottom: 10px;">🔒</div>
          <div style="font-size: 15px; font-weight: 700; color: var(--gold-bright); margin-bottom: 6px;">백그라운드 CPS는 로그인이 필요합니다</div>
          <div style="font-size: 13px; color: var(--parchment-dim); margin-bottom: 14px;">로그인하면 웹을 닫아도 자동으로 자금을 수확할 수 있습니다.</div>
          <button class="buy-btn" onclick="document.getElementById('loginBtn')?.click()">로그인하기</button>
        </div>
      `;
    } else {
      offlineListEl.innerHTML = OFFLINE_CPS_ITEMS.map(item => {
        const count = state.offlineArmies[item.id] || 0;
        const cost = getArmyCost(item, count);
        const canAfford = clicks >= cost;
        return `
          <div class="item-card">
            <div class="item-icon">${item.icon}</div>
            <div class="item-info">
              <span class="item-name">${item.name} <span class="item-count">x${count}</span></span>
              <span class="item-desc">${item.desc}</span>
            </div>
            <div class="item-action">
              <button class="buy-btn" data-buy-offline="${item.id}" ${canAfford ? '' : 'disabled'}>
                구축 (${cost.toLocaleString()})
              </button>
            </div>
          </div>
        `;
      }).join('');

      offlineListEl.querySelectorAll('[data-buy-offline]').forEach(btn => {
        btn.onclick = () => buyOfflineArmy(btn.getAttribute('data-buy-offline'));
      });
    }
  }
}

function renderTitlesView() {
  const container = document.getElementById('titlesContainer');
  if (!container) return;

  if (!state.currentUser) {
    container.innerHTML = '<div class="ranking-empty">🔒 칭호 시스템은 로그인이 필요합니다!</div>';
    return;
  }

  container.innerHTML = UNLOCKABLE_TITLES.map(t => {
    const isUnlocked = state.unlockedTitles.includes(t.id);
    const isEquipped = state.equippedTitle === t.id;
    return `
      <div class="title-card ${isEquipped ? 'equipped' : ''}">
        <div class="title-card-name">${isUnlocked ? '👑 ' + t.name : '🔒 미해금 칭호'}</div>
        <div class="title-card-desc">${t.desc} (조건: ${t.req})</div>
        <button class="buy-btn" data-equip-title="${t.id}" ${!isUnlocked || isEquipped ? 'disabled' : ''}>
          ${isEquipped ? '장착 중' : isUnlocked ? '장착하기' : '미해금'}
        </button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-equip-title]').forEach(btn => {
    btn.onclick = () => equipTitle(btn.getAttribute('data-equip-title'));
  });
}

function renderMissionsView() {
  const container = document.getElementById('missionsContainer');
  if (!container) return;

  container.innerHTML = DAILY_MISSIONS.map(m => {
    const isClaimed = !!state.missionProgress.claimed[m.id];
    let current = 0;
    if (m.type === 'click') current = state.missionProgress.clickCount || 0;
    else if (m.type === 'army') current = state.missionProgress.armyCount || 0;
    else if (m.type === 'battle') current = state.missionProgress.battleCount || 0;
    else if (m.type === 'feedback') current = state.missionProgress.feedbackCount || 0;

    const canClaim = current >= m.target && !isClaimed;

    return `
      <div class="mission-card">
        <div class="mission-info">
          <span class="mission-title">${m.title}</span>
          <span style="font-size:12px; color: var(--parchment-dim);">${m.desc} (${Math.min(current, m.target)} / ${m.target})</span>
          <span class="mission-reward">🎁 보상: +${m.reward.toLocaleString()} 클릭</span>
        </div>
        <button class="buy-btn" data-claim-mission="${m.id}" ${canClaim ? '' : 'disabled'}>
          ${isClaimed ? '수령 완료' : canClaim ? '보상 받기' : '진행 중'}
        </button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-claim-mission]').forEach(btn => {
    btn.onclick = () => claimMissionReward(btn.getAttribute('data-claim-mission'));
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = false;
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => { toast.hidden = true; }, 2400);
}

function spawnParticle(x, y) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const p = document.createElement('span');
  p.className = 'particle';

  // Dynamic particle symbols based on equipped effect
  let symbols = ['✦', '✨', '🌟'];
  if (state.equippedEffect === 'effect-aura-dragon') symbols = ['🔥', '✨', '🐲'];
  else if (state.equippedEffect === 'effect-aura-lightning') symbols = ['⚡', '✦', '🌩️'];
  else if (state.equippedEffect === 'effect-aura-galaxy') symbols = ['🌌', '💎', '🌟'];
  else if (state.equippedEffect === 'effect-aura-hellfire') symbols = ['💥', '🔥', '🌋'];

  p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  const dx = (Math.random() - 0.5) * 90;
  p.style.setProperty('--dx', dx + 'px');
  p.style.left = x + 'px';
  p.style.top = y + 'px';
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 850);
}

// ---------- 12. Main Application Flow & Event Binding ----------
let saveQueued = false;
let saveTimeout = null;

function scheduleSave() {
  saveQueued = true;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(flushSave, 1000);
}

async function flushSave() {
  if (!saveQueued || !state.currentUser) return;
  saveQueued = false;
  const snapshotClicks = state.currentUser.clicks;
  const snapshotId = state.currentUser.id;

  state.lastOfflineTime = Date.now();

  const account = await getAccount(snapshotId);
  if (account) {
    account.clicks = snapshotClicks;
    account.armies = state.armies;
    account.relics = state.relics;
    account.effects = state.effects;
    account.equippedEffect = state.equippedEffect;
    account.offlineArmies = state.offlineArmies;
    account.equippedTitle = state.equippedTitle;
    account.unlockedTitles = state.unlockedTitles;
    account.warRecords = state.warRecords;
    account.missionProgress = state.missionProgress;
    account.lastOfflineTime = state.lastOfflineTime;
    await setAccount(account);
  }

  const leaderboard = await getLeaderboard();
  const idx = leaderboard.findIndex(e => e.id === snapshotId);
  const tObj = UNLOCKABLE_TITLES.find(t => t.id === state.equippedTitle);
  const entry = {
    id: snapshotId,
    nickname: state.currentUser.nickname,
    clicks: snapshotClicks,
    battlePower: calcBattlePower(),
    wins: state.warRecords.wins || 0,
    title: tObj ? tObj.name : '방랑 부족장'
  };

  if (idx >= 0) leaderboard[idx] = entry;
  else leaderboard.push(entry);

  await setLeaderboard(leaderboard);

  if (window.CloudSync) {
    window.CloudSync.debouncedSave(snapshotId, state);
  }
}

function handleSealClick(e) {
  let clickX, clickY;
  if (e && typeof e.clientX === 'number' && e.clientX > 0) {
    clickX = e.clientX;
    clickY = e.clientY;
  } else {
    const sealBtn = document.getElementById('sealBtn');
    if (sealBtn) {
      const rect = sealBtn.getBoundingClientRect();
      clickX = rect.left + rect.width / 2;
      clickY = rect.top + rect.height / 2;
    } else {
      clickX = window.innerWidth / 2;
      clickY = window.innerHeight / 2;
    }
  }

  for (let i = 0; i < 4; i++) {
    spawnParticle(clickX + (Math.random() - 0.5) * 24, clickY + (Math.random() - 0.5) * 24);
  }

  const earned = state.clickMultiplier || 1;
  addClicks(earned);
  if (state.currentUser) scheduleSave();
}

function renderTopbarActions() {
  const actions = document.getElementById('topbarActions');
  if (!actions) return;

  const adminBtn = document.getElementById('adminNavBtn');
  if (adminBtn) {
    adminBtn.hidden = !(state.currentUser && state.currentUser.id === 'jay0216');
  }

  if (state.currentUser) {
    actions.innerHTML = `
      <span class="user-chip" id="userChip">${escapeHtml(state.currentUser.nickname)}</span>
      <button class="text-btn" id="logoutBtn">로그아웃</button>
    `;
    document.getElementById('logoutBtn').onclick = handleLogout;
  } else {
    actions.innerHTML = `
      <button class="login-btn" id="loginBtn">로그인</button>
    `;
    document.getElementById('loginBtn').onclick = () => openModal('authModal');
  }
}

async function handleLogin() {
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  if (!id || !pw) { errEl.textContent = '아이디와 비밀번호를 입력해 주세요.'; return; }

  let account;
  try {
    account = await getAccount(id);
  } catch (e) {
    console.error('[Auth] getAccount 오류:', e);
    errEl.textContent = '데이터베이스 오류가 발생했습니다. 페이지를 새로고침 후 다시 시도해 주세요.';
    return;
  }

  if (!account) {
    errEl.textContent = '아이디를 찾을 수 없습니다. 회원가입 먼저 해주세요.';
    return;
  }

  let hash;
  try {
    hash = await hashPassword(pw);
  } catch (e) {
    console.error('[Auth] hashPassword 오류:', e);
    errEl.textContent = '인증 처리 중 오류가 발생했습니다.';
    return;
  }

  if (hash !== account.passwordHash) {
    console.warn('[Auth] 해시 불일치 - 입력:', hash, '저장:', account.passwordHash);
    errEl.textContent = '비밀번호가 올바르지 않습니다.';
    return;
  }

  state.currentUser = { id: account.id, nickname: account.nickname, clicks: account.clicks || 0 };
  state.armies = account.armies || {};
  state.relics = account.relics || {};
  state.effects = account.effects || [];
  state.equippedEffect = account.equippedEffect || null;
  state.offlineArmies = account.offlineArmies || {};
  state.equippedTitle = account.equippedTitle || 'title_novice';
  state.unlockedTitles = account.unlockedTitles || ['title_novice'];
  state.warRecords = account.warRecords || { totalBattles: 0, wins: 0, losses: 0, plunderedClicks: 0 };
  state.missionProgress = account.missionProgress || { clickCount: 0, armyCount: 0, battleCount: 0, feedbackCount: 0, claimed: {} };
  
  recalculateCPS();
  recalculateMultipliers();

  // 클라우드에서 최신 데이터 로드 시도 (IndxDB보다 최신이면 덮어쓰기)
  if (window.CloudSync) {
    const cloudData = await window.CloudSync.loadFromCloud(id);
    if (cloudData) {
      const localTime = account.lastOfflineTime || 0;
      const cloudTime = cloudData.lastOfflineTime || 0;
      if (cloudTime > localTime) {
        state.currentUser.clicks = cloudData.clicks || state.currentUser.clicks;
        state.armies = cloudData.armies || state.armies;
        state.relics = cloudData.relics || state.relics;
        state.effects = cloudData.effects || state.effects;
        state.equippedEffect = cloudData.equippedEffect || state.equippedEffect;
        state.offlineArmies = cloudData.offlineArmies || state.offlineArmies;
        state.equippedTitle = cloudData.equippedTitle || state.equippedTitle;
        state.unlockedTitles = cloudData.unlockedTitles || state.unlockedTitles;
        state.warRecords = cloudData.warRecords || state.warRecords;
        state.missionProgress = cloudData.missionProgress || state.missionProgress;
        recalculateCPS();
        recalculateMultipliers();
        showToast('☁️ 클라우드에서 최신 데이터를 동기화했습니다!');
      }
    }
  }

  // Process Offline Background CPS Harvest
  const now = Date.now();
  const lastTime = account.lastOfflineTime || now;
  const elapsedSec = Math.floor((now - lastTime) / 1000);
  if (elapsedSec >= 5 && state.offlineCps > 0) {
    const reward = elapsedSec * state.offlineCps;
    addClicks(reward);
    showToast(`🌙 접속하지 않은 ${elapsedSec}초 동안 백그라운드 군단이 +${reward.toLocaleString()} 자금을 수확했습니다!`);
  }
  state.lastOfflineTime = now;

  await setSession(account.id);
  closeModal('authModal');
  renderTopbarActions();
  switchView('clicker');
  showToast(`${account.nickname}님, 다시 오셨네요!`);
}

async function handleSignup() {
  const nickname = document.getElementById('signupNickname').value.trim();
  const id = document.getElementById('signupId').value.trim();
  const pw = document.getElementById('signupPw').value;
  const pw2 = document.getElementById('signupPw2').value;
  const errEl = document.getElementById('signupError');
  errEl.textContent = '';

  if (!nickname || !id || !pw || !pw2) { errEl.textContent = '모든 항목을 입력해 주세요.'; return; }
  if (nickname.length > 12) { errEl.textContent = '닉네임은 12자 이하로 입력해 주세요.'; return; }
  if (id.length < 3) { errEl.textContent = '아이디는 3자 이상으로 입력해 주세요.'; return; }
  if (pw.length < 4) { errEl.textContent = '비밀번호는 4자 이상으로 입력해 주세요.'; return; }
  if (pw !== pw2) { errEl.textContent = '비밀번호가 서로 일치하지 않아요.'; return; }

  let existing;
  try {
    existing = await getAccount(id);
  } catch (e) {
    console.error('[Auth] 회원가입 getAccount 오류:', e);
    errEl.textContent = '데이터베이스 오류가 발생했습니다.';
    return;
  }
  if (existing) { errEl.textContent = '이미 사용 중인 아이디예요.'; return; }

  let passwordHash;
  try {
    passwordHash = await hashPassword(pw);
  } catch (e) {
    console.error('[Auth] 회원가입 hashPassword 오류:', e);
    errEl.textContent = '비밀번호 처리 중 오류가 발생했습니다.';
    return;
  }

  const account = {
    id, nickname, passwordHash, clicks: 0,
    armies: {}, relics: {}, effects: [], equippedEffect: null, offlineArmies: {}, equippedTitle: 'title_novice', unlockedTitles: ['title_novice'],
    warRecords: { totalBattles: 0, wins: 0, losses: 0, plunderedClicks: 0 },
    missionProgress: { clickCount: 0, armyCount: 0, battleCount: 0, feedbackCount: 0, claimed: {} },
    lastOfflineTime: Date.now(),
    createdAt: Date.now()
  };

  try {
    await setAccount(account);
  } catch (e) {
    console.error('[Auth] 회원가입 setAccount 오류:', e);
    errEl.textContent = '계정 저장 중 오류가 발생했습니다. 다시 시도해 주세요.';
    return;
  }

  state.currentUser = { id, nickname, clicks: 0 };
  state.localClicks = 0;
  await setSession(id);
  closeModal('authModal');
  renderTopbarActions();
  switchView('clicker');
  showToast(`환영해요, ${nickname}님! 영지가 생성됐어요.`);
}

async function handleLogout() {
  await flushSave();
  state.currentUser = null;
  state.localClicks = 0;
  await clearSession();
  renderTopbarActions();
  switchView('landing');
  showToast('로그아웃 됐어요.');
}

function setupEventListeners() {
  // Global Spacebar Keydown Trigger
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (state.currentView === 'clicker') {
        e.preventDefault();
        handleSealClick(null);
      } else if (state.currentView === 'battle') {
        e.preventDefault();
        registerMyBattleTap();
      }
    }
  });

  // Landing Buttons
  const startBtn = document.getElementById('landingStartBtn');
  const viewRankBtn = document.getElementById('landingViewRankBtn');
  if (startBtn) startBtn.onclick = () => switchView('clicker');
  if (viewRankBtn) viewRankBtn.onclick = () => switchView('ranking');

  // Shop Tabs
  const shopTabArmyBtn = document.getElementById('shopTabArmyBtn');
  const shopTabRelicBtn = document.getElementById('shopTabRelicBtn');
  const shopTabEffectBtn = document.getElementById('shopTabEffectBtn');
  const shopTabOfflineBtn = document.getElementById('shopTabOfflineBtn');
  if (shopTabArmyBtn && shopTabRelicBtn && shopTabEffectBtn && shopTabOfflineBtn) {
    shopTabEffectBtn.onclick = () => {
      shopTabEffectBtn.classList.add('active');
      shopTabArmyBtn.classList.remove('active');
      shopTabRelicBtn.classList.remove('active');
      shopTabOfflineBtn.classList.remove('active');
      document.getElementById('effectShopList').hidden = false;
      document.getElementById('armyShopList').hidden = true;
      document.getElementById('relicShopList').hidden = true;
      document.getElementById('offlineShopList').hidden = true;
    };
    shopTabArmyBtn.onclick = () => {
      shopTabArmyBtn.classList.add('active');
      shopTabEffectBtn.classList.remove('active');
      shopTabRelicBtn.classList.remove('active');
      shopTabOfflineBtn.classList.remove('active');
      document.getElementById('armyShopList').hidden = false;
      document.getElementById('effectShopList').hidden = true;
      document.getElementById('relicShopList').hidden = true;
      document.getElementById('offlineShopList').hidden = true;
    };
    shopTabRelicBtn.onclick = () => {
      shopTabRelicBtn.classList.add('active');
      shopTabEffectBtn.classList.remove('active');
      shopTabArmyBtn.classList.remove('active');
      shopTabOfflineBtn.classList.remove('active');
      document.getElementById('relicShopList').hidden = false;
      document.getElementById('effectShopList').hidden = true;
      document.getElementById('armyShopList').hidden = true;
      document.getElementById('offlineShopList').hidden = true;
    };
    shopTabOfflineBtn.onclick = () => {
      shopTabOfflineBtn.classList.add('active');
      shopTabEffectBtn.classList.remove('active');
      shopTabArmyBtn.classList.remove('active');
      shopTabRelicBtn.classList.remove('active');
      document.getElementById('offlineShopList').hidden = false;
      document.getElementById('effectShopList').hidden = true;
      document.getElementById('armyShopList').hidden = true;
      document.getElementById('relicShopList').hidden = true;
    };
  }

  // Seal Click
  const sealBtn = document.getElementById('sealBtn');
  if (sealBtn) {
    sealBtn.addEventListener('pointerdown', handleSealClick);
  }

  // Topbar logo click -> Go landing
  const logo = document.getElementById('logoHeader');
  if (logo) logo.onclick = () => switchView('landing');

  // Nav tab buttons
  document.querySelectorAll('[data-nav-view]').forEach(btn => {
    btn.onclick = () => switchView(btn.getAttribute('data-nav-view'));
  });

  // Battle buttons & Room code logic
  const aiBattleBtn = document.getElementById('aiBattleBtn');
  if (aiBattleBtn) {
    aiBattleBtn.onclick = () => {
      startBattle({ name: '야만족 족장의 암흑 군대', power: Math.max(500, state.cps * 8 + 200) });
    };
  }

  const createRoomBtn = document.getElementById('createRoomBtn');
  if (createRoomBtn) {
    createRoomBtn.onclick = () => {
      if (!state.currentUser) {
        showToast('🔒 친구 대전 및 룸 코드 생성은 로그인이 필요합니다!');
        openModal('authModal');
        return;
      }
      const code = generateRoomCode();
      const roomCard = document.getElementById('myRoomCodeCard');
      if (roomCard) roomCard.hidden = false;
      document.getElementById('roomCodeDisplay').textContent = code;
      showToast(`🔑 나의 룸 코드 [${code}] 생성 완료! 친구에게 알려주세요.`);
    };
  }

  const joinRoomBtn = document.getElementById('joinRoomBtn');
  if (joinRoomBtn) {
    joinRoomBtn.onclick = () => {
      if (!state.currentUser) {
        showToast('🔒 친구 대전은 로그인이 필요합니다!');
        openModal('authModal');
        return;
      }

      const inputCode = document.getElementById('roomCodeInput').value.trim();
      if (!inputCode) {
        showToast('4자리 친구 룸 코드를 입력해 주세요!');
        return;
      }

      if (myGeneratedRoomCode && inputCode === myGeneratedRoomCode) {
        showToast('⚠️ 자신의 룸 코드는 입력할 수 없습니다! 친구의 룸 코드를 입력해 주세요.');
        return;
      }

      startBattle({ name: `[룸 ${inputCode}] 친구 영주의 군대`, power: Math.max(1200, state.cps * 7 + 800) });
    };
  }

  const battleTapBtn = document.getElementById('battleTapBtn');
  if (battleTapBtn) battleTapBtn.addEventListener('pointerdown', registerMyBattleTap);

  // Ranking Tabs
  document.querySelectorAll('[data-rank-tab]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-rank-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setRankTab(btn.getAttribute('data-rank-tab'));
    };
  });

  // Auth Modals
  document.getElementById('tabLogin').onclick = () => setModalTab('login');
  document.getElementById('tabSignup').onclick = () => setModalTab('signup');
  document.getElementById('loginSubmit').onclick = handleLogin;
  document.getElementById('signupSubmit').onclick = handleSignup;
  document.getElementById('guestSignupBtn').onclick = () => openModal('authModal');
  document.getElementById('authModalClose').onclick = () => closeModal('authModal');

  // Feedback Modal
  document.getElementById('feedbackNavBtn').onclick = () => openModal('feedbackModal');
  document.getElementById('feedbackSubmitBtn').onclick = submitFeedback;
  document.getElementById('feedbackModalClose').onclick = () => closeModal('feedbackModal');

  // Admin Modal & Direct Custom Click Count Set
  document.getElementById('adminNavBtn').onclick = () => openModal('adminModal');
  document.getElementById('adminLoginSubmit').onclick = handleAdminLogin;
  document.getElementById('adminSetClickBtn').onclick = handleAdminCustomClickSet;
  document.getElementById('adminCheat1M').onclick = () => giveAdminGold(1000000);
  document.getElementById('adminCheat10M').onclick = () => giveAdminGold(10000000);
  document.getElementById('adminUnlockAll').onclick = unlockAllForAdmin;
  document.getElementById('adminModalClose').onclick = () => closeModal('adminModal');

  // Subscribe state changes
  subscribeState(renderActiveView);

  window.addEventListener('beforeunload', () => {
    flushSave();
    if (window.CloudSync && state.currentUser) {
      window.CloudSync.saveToCloud(state.currentUser.id, state);
    }
  });
}

function setModalTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabSignup').classList.toggle('active', !isLogin);
  document.getElementById('loginForm').hidden = !isLogin;
  document.getElementById('signupForm').hidden = isLogin;

  const welcomeEl = document.getElementById('authWelcomeText');
  if (welcomeEl) {
    welcomeEl.textContent = isLogin ? '다시 오신 것을 환영합니다. 황제시여' : '저희의 황제가 되어 제국을 건설하십시오';
  }
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function init() {
  if (window.CloudSync) window.CloudSync.init();
  setupEventListeners();

  const session = await getSession();
  if (session && session.id) {
    const account = await getAccount(session.id);
    if (account) {
      state.currentUser = { id: account.id, nickname: account.nickname, clicks: account.clicks || 0 };
      state.armies = account.armies || {};
      state.relics = account.relics || {};
      state.effects = account.effects || [];
      state.equippedEffect = account.equippedEffect || null;
      state.offlineArmies = account.offlineArmies || {};
      state.equippedTitle = account.equippedTitle || 'title_novice';
      state.unlockedTitles = account.unlockedTitles || ['title_novice'];
      state.warRecords = account.warRecords || { totalBattles: 0, wins: 0, losses: 0, plunderedClicks: 0 };
      state.missionProgress = account.missionProgress || { clickCount: 0, armyCount: 0, battleCount: 0, feedbackCount: 0, claimed: {} };
      recalculateCPS();
      recalculateMultipliers();

      // 클라우드에서 최신 데이터 로드 시도
      if (window.CloudSync) {
        const cloudData = await window.CloudSync.loadFromCloud(session.id);
        if (cloudData) {
          const localTime = account.lastOfflineTime || 0;
          const cloudTime = cloudData.lastOfflineTime || 0;
          if (cloudTime > localTime) {
            state.currentUser.clicks = cloudData.clicks || state.currentUser.clicks;
            state.armies = cloudData.armies || state.armies;
            state.relics = cloudData.relics || state.relics;
            state.effects = cloudData.effects || state.effects;
            state.equippedEffect = cloudData.equippedEffect || state.equippedEffect;
            state.offlineArmies = cloudData.offlineArmies || state.offlineArmies;
            state.equippedTitle = cloudData.equippedTitle || state.equippedTitle;
            state.unlockedTitles = cloudData.unlockedTitles || state.unlockedTitles;
            state.warRecords = cloudData.warRecords || state.warRecords;
            state.missionProgress = cloudData.missionProgress || state.missionProgress;
            recalculateCPS();
            recalculateMultipliers();
          }
        }
      }

      // Process Offline Background CPS Harvest on startup
      const now = Date.now();
      const lastTime = account.lastOfflineTime || now;
      const elapsedSec = Math.floor((now - lastTime) / 1000);
      if (elapsedSec >= 5 && state.offlineCps > 0) {
        const reward = elapsedSec * state.offlineCps;
        addClicks(reward);
        showToast(`🌙 접속하지 않은 ${elapsedSec}초 동안 백그라운드 군단이 +${reward.toLocaleString()} 자금을 수확했습니다!`);
      }
      state.lastOfflineTime = now;
    } else {
      await clearSession();
    }
  }

  renderTopbarActions();
  switchView('landing');

  // 1-second auto harvest (CPS) loop
  setInterval(() => {
    if (state.cps > 0) {
      addClicks(state.cps);
      if (state.currentUser) scheduleSave();
    }
  }, 1000);
}

// Execute initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
