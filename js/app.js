// ============================================================================
// Clicker Kingdom - Main Unified Application Script
// Compatible with both local file:// opening and http/https web servers.
// ============================================================================
// NOTE: 모든 게임 상수(제국 단계, 아이템 등)는 js/game-config.js에서 관리합니다.
// ---------- 1. Constants are loaded from js/game-config.js ----------

// ---------- 2. IndexedDB & Storage ----------
const DB_NAME = 'ClickerKingdomDB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('accounts')) db.createObjectStore('accounts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('leaderboard')) db.createObjectStore('leaderboard', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('feedbacks')) db.createObjectStore('feedbacks', { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// hashPassword/verifyPassword removed — now using Supabase Auth (email/password)

async function getAccount(id) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('accounts', 'readonly');
      const req = tx.objectStore('accounts').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function setAccount(acc) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readwrite');
      const req = tx.objectStore('accounts').put(acc);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return false;
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
  if (typeof supabaseGetCurrentUserId === 'function') {
    const userId = await supabaseGetCurrentUserId();
    if (userId) return { id: userId };
  }
  const data = localStorage.getItem('ck_session');
  return data ? JSON.parse(data) : null;
}
async function setSession(id) {
  localStorage.setItem('ck_session', JSON.stringify({ id }));
}
async function clearSession() {
  localStorage.removeItem('ck_session');
}

// 수정: 로컬/클라우드 중 더 최신 계정을 골라 같은 기준으로 사용한다.
function getAccountFreshness(account) {
  if (!account) return 0;
  return Math.max(account.updatedAt || 0, account.lastOfflineTime || 0, account.createdAt || 0);
}

async function loadPreferredAccount(id) {
  // Try Supabase first (authenticated). The id param is kept for backward compat
  // but the authoritative source is the authenticated user.
  if (typeof supabaseLoadAccount === 'function') {
    const cloudAccount = await supabaseLoadAccount();
    if (cloudAccount) {
      await setAccount(cloudAccount);
      return cloudAccount;
    }
  }
  // Fallback to IndexedDB (legacy local accounts)
  return await getAccount(id);
}

function saveEmergencySnapshot() {
  if (!state.currentUser) return;
  try {
    const emergencySnapshot = {
      id: state.currentUser.id,
      clicks: state.currentUser.clicks,
      armies: state.armies,
      relics: state.relics,
      effects: state.effects,
      equippedEffect: state.equippedEffect,
      offlineArmies: state.offlineArmies,
      equippedTitle: state.equippedTitle,
      unlockedTitles: state.unlockedTitles,
      warRecords: state.warRecords,
      missionProgress: state.missionProgress,
      backgroundUrl: state.backgroundUrl,
      lastOfflineTime: Date.now(),
      savedAt: Date.now()
    };
    localStorage.setItem('ck_emergency_snapshot', JSON.stringify(emergencySnapshot));
  } catch (e) {
    // localStorage 쓰기 실패는 무시
  }
}

function applyEmergencySnapshot(account) {
  if (!account || !account.id) return false;
  try {
    const rawSnap = localStorage.getItem('ck_emergency_snapshot');
    if (!rawSnap) return false;

    const snap = JSON.parse(rawSnap);
    if (!snap || snap.id !== account.id) return false;

    let applied = false;
    const snapClicks = typeof snap.clicks === 'string' ? snap.clicks : String(snap.clicks || 0);
    const accClicks = typeof account.clicks === 'string' ? account.clicks : String(account.clicks || 0);
    if (bigGt(snapClicks, accClicks)) {
      account.clicks = snapClicks;
      account.armies = snap.armies || account.armies;
      account.relics = snap.relics || account.relics;
      account.effects = snap.effects || account.effects;
      account.equippedEffect = snap.equippedEffect !== undefined ? snap.equippedEffect : account.equippedEffect;
      account.offlineArmies = snap.offlineArmies || account.offlineArmies;
      account.equippedTitle = snap.equippedTitle || account.equippedTitle;
      account.unlockedTitles = snap.unlockedTitles || account.unlockedTitles;
      account.warRecords = snap.warRecords || account.warRecords;
      account.missionProgress = snap.missionProgress || account.missionProgress;
      account.backgroundUrl = snap.backgroundUrl || account.backgroundUrl;
      account.updatedAt = snap.savedAt;
      applied = true;
    }

    localStorage.removeItem('ck_emergency_snapshot');
    return applied;
  } catch (e) {
    return false;
  }
}

// ---------- 3. Reactive Central Game State ----------
const state = {
  currentUser: null,
  localClicks: "0",
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
  avatar: '👑',
  backgroundUrl: '',
  warRecords: { totalBattles: 0, wins: 0, losses: 0, plunderedClicks: 0 },
  missionProgress: { clickCount: 0, armyCount: 0, battleCount: 0, feedbackCount: 0, claimed: {} },
  lastOfflineTime: Date.now(),
  _lastCpsTick: Date.now(),
  currentView: 'landing'
};

const listeners = [];
function subscribeState(fn) { listeners.push(fn); }
function notifyStateChange() { listeners.forEach(fn => fn(state)); }

function applyBackground(url) {
  if (url && url.trim()) {
    document.body.style.background = `#000 url(${url}) center/cover no-repeat`;
  } else {
    document.body.style.background = '';
  }
}

function getCloudStateSnapshot() {
  if (typeof getCloudSyncState === 'function') return getCloudSyncState();
  return {
    tone: 'error',
    summary: '클라우드 상태 함수를 찾지 못했어.',
    detail: 'js/supabase-sync.js 로드 순서를 확인해 줘.',
    diagnostics: null,
    lastSyncAt: 0,
    lastErrorAt: Date.now()
  };
}

function formatClockTime(ts) {
  if (!ts) return '기록 없음';
  return new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function buildDiagnosticLine(label, result) {
  if (!result) return `${label}: 확인 안 함`;
  return result.ok ? `${label}: 읽기 가능` : `${label}: ${result.code ? `[${result.code}] ` : ''}${result.message}`;
}

function getClicks() {
  const val = state.currentUser ? state.currentUser.clicks : state.localClicks;
  return typeof val === 'string' ? val : String(Math.floor(val || 0));
}

function setClicksDirectly(amount) {
  const val = typeof amount === 'string' ? amount : String(Math.max(0, Math.floor(amount)));
  if (state.currentUser) {
    state.currentUser.clicks = val;
  } else {
    state.localClicks = val;
  }
  notifyStateChange();
}

function addClicks(amount) {
  const added = bigAdd(getClicks(), Math.floor(amount));
  if (state.currentUser) {
    state.currentUser.clicks = added;
  } else {
    state.localClicks = added;
  }
  state.missionProgress.clickCount += amount;
  notifyStateChange();
}

function spendClicks(amount) {
  const current = getClicks();
  if (bigLt(current, amount)) return false;
  const result = bigSub(current, amount);
  if (state.currentUser) {
    state.currentUser.clicks = result;
  } else {
    state.localClicks = result;
  }
  notifyStateChange();
  return true;
}

// ---------- 4. Upgrades & Relics & Effects & Offline CPS ----------
function getArmyCost(item, count) {
  const pow10 = bigPow10AsString(count * count);
  return bigMul(String(item.baseCost), pow10);
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
    showToast('🔒 백그라운드 CPS 구축은 로그인이 필요합니다!');
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
  const pow10 = bigPow10AsString(count * count);
  return bigMul(String(relic.cost), pow10);
}

function buyRelic(relicId) {
  const relic = MULTIPLIER_RELICS.find(r => r.id === relicId);
  if (!relic) return;
  const rawVal = state.relics[relicId];
  const count = typeof rawVal === 'number' ? rawVal : (rawVal ? 1 : 0);
  const cost = getRelicCost(relic, count);

  if (spendClicks(cost)) {
    state.relics[relicId] = count + 1;
    recalculateMultipliers();
    showToast(`👑 보구 [${relic.name}] (x${count + 1})을(를) 연마했습니다!`);
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

  if (state.currentView === 'clicker') startEmojiRain(state.cps);

  notifyStateChange();
}

function recalculateMultipliers() {
  let add = 0;
  let mult = 1;
  MULTIPLIER_RELICS.forEach(r => {
    const rawVal = state.relics[r.id];
    const count = typeof rawVal === 'number' ? rawVal : (rawVal ? 1 : 0);
    if (count > 0) {
      add += r.addClick * count;
      if (r.mult > 1) {
        mult *= Math.pow(r.mult, count);
      }
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
  if (clicks >= MAX_TIER_CLICKS) {
    active = { ...active, beyondMax: true };
  }
  return active;
}

function calcBattlePower() {
  const clicks = getClicks();
  const cpsPower = state.cps * 5;
  const clickPower = Number(bigDiv(clicks, "5"));
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

let activeRoomCode = null;
let currentRoomRole = null; // 'host' or 'guest' or null (AI)
let roomWaitingPollInterval = null;
let battleMatchedAt = null;
let battleTickBusy = false;

function generateRoomCode() {
  myGeneratedRoomCode = String(Math.floor(1000 + Math.random() * 9000));
  return myGeneratedRoomCode;
}

function startBattle(enemyInfo, roomCode = null, role = null) {
  currentEnemy = enemyInfo;
  activeRoomCode = roomCode;
  currentRoomRole = role;
  myClicksInBattle = 0;
  enemyClicksInBattle = 0;
  battleTimeLeft = 10;

  // Room battle: calculate initial time from shared matched_at timestamp
  if (battleMatchedAt) {
    const elapsed = Math.floor((Date.now() - battleMatchedAt) / 1000);
    battleTimeLeft = Math.max(0, 10 - elapsed);
  }

  document.getElementById('battleSetupPanel').hidden = true;
  document.getElementById('battleArenaPanel').hidden = false;

  document.getElementById('enemyNameLabel').textContent = enemyInfo.name;
  document.getElementById('enemyCastleLabel').textContent = enemyInfo.name;
  document.getElementById('enemyPowerLabel').textContent = enemyInfo.power.toLocaleString();
  document.getElementById('battleTimerDisplay').textContent = `${battleTimeLeft}s`;

  updateFrontlineVisual();

  if (battleInterval) clearInterval(battleInterval);
  battleInterval = setInterval(async () => {
    if (battleMatchedAt) {
      const elapsed = Math.floor((Date.now() - battleMatchedAt) / 1000);
      battleTimeLeft = Math.max(0, 10 - elapsed);
    } else {
      battleTimeLeft--;
    }

    if (battleTimeLeft <= 0) {
      endBattle();
      return;
    }

    document.getElementById('battleTimerDisplay').textContent = `${battleTimeLeft}s`;

    // Real-time synchronization for room battles via Supabase
    if (activeRoomCode && typeof supabaseFetchRoom === 'function' && typeof supabaseSubmitBattleTaps === 'function') {
      if (battleTickBusy) return;
      battleTickBusy = true;
      try {
        // Sync my taps to Cloud
        await supabaseSubmitBattleTaps(activeRoomCode, currentRoomRole, myClicksInBattle);
        // Fetch opponent's taps from Cloud
        const r = await supabaseFetchRoom(activeRoomCode);
        if (r) {
          enemyClicksInBattle = currentRoomRole === 'host' ? r.guestTaps : r.hostTaps;
        }
      } finally {
        battleTickBusy = false;
      }
    } else {
      // AI enemy taps: scales with player CPS
      const cpsFactor = Math.min(state.cps || 0, 2000);
      const simulatedTapRate = Math.floor(6 + cpsFactor * 0.02 + Math.random() * (4 + cpsFactor * 0.015));
      enemyClicksInBattle += simulatedTapRate;
    }

    updateFrontlineVisual();
  }, 1000);
}

function registerMyBattleTap() {
  if (battleTimeLeft <= 0) return;
  myClicksInBattle += 1;
  updateFrontlineVisual();
}

function updateFrontlineVisual() {
  const myScore = myClicksInBattle;
  const enemyScore = enemyClicksInBattle;

  let fillPercent = 50;
  const totalScore = myScore + enemyScore;
  if (totalScore > 0) {
    fillPercent = Math.min(95, Math.max(5, (myScore / totalScore) * 100));
  }

  const fillEl = document.getElementById('battleFrontlineFill');
  if (fillEl) fillEl.style.width = `${fillPercent}%`;
}

function endBattle() {
  clearInterval(battleInterval);

  const isWin = myClicksInBattle >= enemyClicksInBattle;
  state.warRecords.totalBattles = (state.warRecords.totalBattles || 0) + 1;
  state.missionProgress.battleCount = (state.missionProgress.battleCount || 0) + 1;

  if (isWin) {
    state.warRecords.wins = (state.warRecords.wins || 0) + 1;
    const plunder = Math.max(1000, myClicksInBattle * 100);
    state.warRecords.plunderedClicks = (state.warRecords.plunderedClicks || 0) + plunder;
    addClicks(plunder);
    showToast(`🎉 대전 승리! 10초 클릭 (${myClicksInBattle}회 vs 적 ${enemyClicksInBattle}회) +${plunder.toLocaleString()} 자금 획득!`);
  } else {
    state.warRecords.losses = (state.warRecords.losses || 0) + 1;
    showToast(`💔 아쉬운 패배... 10초 클릭 (${myClicksInBattle}회 vs 적 ${enemyClicksInBattle}회)`);
  }

  checkTitleUnlocks();
  notifyStateChange();

  battleTickBusy = false;
  activeRoomCode = null;
  currentRoomRole = null;
  battleMatchedAt = null;

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

// Ranking cache — Supabase fetch throttled to once per 30 seconds
let _rankingCache = null;
let _rankingCacheTab = null;
let _rankingCacheTime = 0;
const RANKING_CACHE_TTL = 30000; // 30초

async function renderRankingView(forceRefresh = false) {
  const listEl = document.getElementById('rankingList');
  if (!listEl) return;

  const now = Date.now();
  const cacheValid = _rankingCache &&
    _rankingCacheTab === currentRankTab &&
    (now - _rankingCacheTime) < RANKING_CACHE_TTL &&
    !forceRefresh;

  // If cache is valid, just re-render with cached data (no Supabase call, no flicker)
  if (cacheValid) {
    _renderRankingList(listEl, _rankingCache);
    return;
  }

  listEl.innerHTML = '<div class="ranking-empty">불러오는 중...</div>';
  let leaderboard = await getLeaderboard();

  // Merge cloud leaderboard from Supabase
  if (typeof supabaseFetchLeaderboard === 'function') {
    const cloudList = await supabaseFetchLeaderboard();
    if (cloudList && cloudList.length > 0) {
      cloudList.forEach(cloudEntry => {
        const idx = leaderboard.findIndex(e => e.id === cloudEntry.id);
        if (idx >= 0) {
          if (bigGt(cloudEntry.clicks || "0", leaderboard[idx].clicks || "0")) {
            leaderboard[idx] = cloudEntry;
          }
        } else {
          leaderboard.push(cloudEntry);
        }
      });
    }
  }

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
    leaderboard.sort((a, b) => bigLt(a.clicks || "0", b.clicks || "0") ? 1 : bigGt(a.clicks || "0", b.clicks || "0") ? -1 : 0);
  } else if (currentRankTab === 'power') {
    leaderboard.sort((a, b) => (b.battlePower || 0) - (a.battlePower || 0));
  } else if (currentRankTab === 'honor') {
    leaderboard.sort((a, b) => (b.wins || 0) - (a.wins || 0));
  }

  // Save to cache
  _rankingCache = leaderboard;
  _rankingCacheTab = currentRankTab;
  _rankingCacheTime = Date.now();

  _renderRankingList(listEl, leaderboard);
}

function _renderRankingList(listEl, leaderboard) {
  if (leaderboard.length === 0) {
    listEl.innerHTML = '<div class="ranking-empty">아직 왕국을 세운 영주가 없습니다.<br>첫 번째 통치자가 되어보세요!</div>';
    return;
  }
  listEl.innerHTML = leaderboard.map((entry, i) => {
    const rank = i + 1;
    const isMe = state.currentUser && entry.id === state.currentUser.id;
    let scoreDisplay = '';
    if (currentRankTab === 'clicks') scoreDisplay = `<span title="${(entry.clicks || 0).toLocaleString()}">${formatNumber(entry.clicks || 0)} 클릭</span>`;
    else if (currentRankTab === 'power') scoreDisplay = `⚔️ ${formatNumber(entry.battlePower || 0)}`;
    else if (currentRankTab === 'honor') scoreDisplay = `🏆 ${entry.wins || 0}승`;
    
    // Resolve title name if raw ID is given or missing
    let displayTitle = entry.title || '칭호 없음';
    if (displayTitle.startsWith('title_')) {
      const tObj = UNLOCKABLE_TITLES.find(t => t.id === displayTitle);
      displayTitle = tObj ? tObj.name : '칭호 없음';
    }

    const tierInfo = getTierInfo(entry.clicks || 0);
    const tierDisplay = entry.tierName || (tierInfo.beyondMax ? '???' : tierInfo.name);

    const online = entry.lastOnline && (Date.now() - new Date(entry.lastOnline).getTime() < 60000);
    const onlineDot = online ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4ade80;margin-right:4px;vertical-align:middle;box-shadow:0 0 4px #4ade80;" title="온라인"></span>' : '';

    return `
      <div class="ranking-row ${isMe ? 'me' : ''}">
        <span class="rank-badge ${rank <= 3 ? 'top' + rank : ''}">${crownGlyph(rank)}</span>
        <div class="rank-nickname">
          <span>${onlineDot}${escapeHtml(entry.nickname || '무명 영주')}</span>
          <span class="rank-title-chip">${escapeHtml(displayTitle)}</span>
          <span style="font-size:11px; opacity:0.65; margin-left:6px; color: var(--gold-bright);">${escapeHtml(tierDisplay)}</span>
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

  // Rate limit: 1 submission per 24 hours
  const lastKey = state.currentUser ? `ck_feedback_last_${state.currentUser.id}` : 'ck_feedback_last_anon';
  const lastTime = parseInt(localStorage.getItem(lastKey) || '0', 10);
  if (Date.now() - lastTime < 86400000) {
    const remaining = Math.ceil((86400000 - (Date.now() - lastTime)) / 3600000);
    errEl.textContent = `⏳ 포상금은 24시간에 한 번만 지급됩니다. ${remaining}시간 후에 다시 시도해주세요.`;
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
  localStorage.setItem(lastKey, String(Date.now()));

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

// ---------- 10. Developer Tools Module (local only, no cloud sync) ----------
function isDevMode() {
  return localStorage.getItem('ck_dev_mode') === 'true';
}

function toggleDevMode() {
  const current = isDevMode();
  localStorage.setItem('ck_dev_mode', current ? 'false' : 'true');
  if (!current) {
    showToast('⚙️ 개발자 모드가 활성화되었습니다.');
  } else {
    showToast('⚙️ 개발자 모드가 비활성화되었습니다.');
  }
  renderActiveView();
}

function renderAdminView() {
  const devMode = isDevMode();
  const loginForm = document.getElementById('adminLoginForm');
  const dashboard = document.getElementById('adminDashboardContent');

  if (devMode) {
    if (loginForm) loginForm.hidden = true;
    if (dashboard) dashboard.hidden = false;
    renderCloudStatus();
  } else {
    if (loginForm) loginForm.hidden = false;
    if (dashboard) dashboard.hidden = true;
  }
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
  MULTIPLIER_RELICS.forEach(r => {
    const rawVal = state.relics[r.id];
    const count = typeof rawVal === 'number' ? rawVal : (rawVal ? 1 : 0);
    state.relics[r.id] = count + 5;
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
  showToast('⚙️ [관리자] 모든 군대, 보구, 오프라인 행정관, 이펙트 및 칭호 전체 해금 완료!');
}

// ---------- 11. UI & View Controller Module ----------
function switchView(viewName) {
  if (viewName === 'titles' && !state.currentUser) {
    showToast('🔒 칭호 시스템은 로그인이 필요합니다!');
    openModal('authModal');
    return;
  }
  if (viewName === 'profile' && !state.currentUser) {
    showToast('🔒 프로필 관리는 로그인이 필요합니다!');
    openModal('authModal');
    return;
  }

  // End battle if navigating away during a match
  if (battleInterval) {
    endBattle();
  }

  // Stop shooter mini-game loop if navigating away
  if (viewName !== 'shooter' && typeof shooterActive !== 'undefined' && shooterActive) {
    shooterActive = false;
    if (typeof shooterAnimFrame !== 'undefined' && shooterAnimFrame) {
      cancelAnimationFrame(shooterAnimFrame);
      shooterAnimFrame = null;
    }
  }

  // Start/stop emoji rain based on CPS when entering clicker view
  if (viewName === 'clicker') {
    startEmojiRain(state.cps || 0);
  } else {
    stopEmojiRain();
  }

  state.currentView = viewName;
  const views = ['landingView', 'clickerView', 'shopView', 'battleView', 'shooterView', 'rankingView', 'titlesView', 'missionsView', 'adminView', 'profileView'];
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

  const adminNavBtn = document.getElementById('adminNavBtn');
  if (adminNavBtn) {
    adminNavBtn.hidden = !isDevMode();
  }

  const userChip = document.getElementById('userChip');
  if (userChip && state.currentUser) {
    const avatar = state.avatar || '👑';
    userChip.textContent = `${avatar} ${state.currentUser.nickname}`;
    // Re-bind onclick in case textContent update broke it
    userChip.onclick = () => switchView('profile');
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
  } else if (state.currentView === 'admin') {
    renderAdminView();
  } else if (state.currentView === 'profile') {
    renderProfileView();
  }
}

const AVATAR_OPTIONS = ['👑', '🛡️', '⚔️', '🐲', '⚡', '🌌', '🦁', '🦅', '🧙‍♂️', '🏰', '💎', '🚩', '🔥', '🤖'];

function renderProfileView() {
  if (!state.currentUser) {
    showToast('🔒 프로필 관리는 로그인이 필요합니다!');
    openModal('authModal');
    switchView('clicker');
    return;
  }

  const unlockedTitles = state.unlockedTitles || ['title_novice'];
  const userEffects = state.effects || [];
  const warRecords = state.warRecords || { totalBattles: 0, wins: 0, losses: 0, plunderedClicks: 0 };

  const avatarDisplay = document.getElementById('profileAvatarDisplay');
  const avatarPicker = document.getElementById('avatarPickerContainer');
  const idInput = document.getElementById('profileIdInput');
  const nickInput = document.getElementById('profileNicknameInput');
  const titlesList = document.getElementById('profileTitlesList');
  const effectsList = document.getElementById('profileEffectsList');
  const statsGrid = document.getElementById('profileStatsGrid');

  if (avatarDisplay) avatarDisplay.textContent = state.avatar || '👑';
  if (idInput) idInput.value = state.currentUser.id || '';
  if (nickInput && document.activeElement !== nickInput) nickInput.value = state.currentUser.nickname || '';

  // Render Avatar Options
  if (avatarPicker) {
    avatarPicker.innerHTML = AVATAR_OPTIONS.map(av => `
      <button class="buy-btn ${state.avatar === av ? 'active' : ''}" data-select-avatar="${av}" style="font-size: 20px; padding: 6px 12px; background: ${state.avatar === av ? 'var(--gold-bright)' : 'rgba(0,0,0,0.3)'}; border: ${state.avatar === av ? '2px solid var(--gold)' : '1px solid rgba(212,175,55,0.3)'};">
        ${av}
      </button>
    `).join('');

    avatarPicker.querySelectorAll('[data-select-avatar]').forEach(btn => {
      btn.onclick = () => {
        const selected = btn.getAttribute('data-select-avatar');
        state.avatar = selected;
        if (avatarDisplay) avatarDisplay.textContent = selected;
        renderTopbarActions();
        if (state.currentUser) scheduleSave();
        renderProfileView();
        showToast(`👤 프로필 아이콘이 ${selected}(으)로 변경되었습니다.`);
      };
    });
  }

  // Bind Nickname Save
  const saveNickBtn = document.getElementById('saveNicknameBtn');
  if (saveNickBtn) {
    saveNickBtn.onclick = () => {
      const newNick = nickInput ? nickInput.value.trim() : '';
      if (!newNick) {
        showToast('닉네임을 입력해주세요!');
        return;
      }
      if (newNick.length > 12) {
        showToast('닉네임은 12자 이하로 입력해주세요!');
        return;
      }
      state.currentUser.nickname = newNick;
      renderTopbarActions();
      if (state.currentUser) scheduleSave();
      showToast(`✏️ 닉네임이 [${newNick}] (으)로 변경되었습니다.`);
    };
  }

  // Render Titles in Profile
  if (titlesList) {
    titlesList.innerHTML = UNLOCKABLE_TITLES.map(t => {
      const isUnlocked = unlockedTitles.includes(t.id);
      const isEquipped = state.equippedTitle === t.id;
      return `
        <div class="title-card ${isEquipped ? 'equipped' : ''}" style="padding: 12px;">
          <div class="title-card-name" style="font-size: 13px;">${isUnlocked ? '👑 ' + t.name : '🔒 미해금 칭호'}</div>
          <div class="title-card-desc" style="font-size: 11px;">${t.desc}</div>
          <button class="buy-btn" data-profile-equip-title="${t.id}" ${!isUnlocked || isEquipped ? 'disabled' : ''} style="margin-top: 6px; font-size: 11px; padding: 4px 10px;">
            ${isEquipped ? '장착 중' : isUnlocked ? '장착하기' : '미해금'}
          </button>
        </div>
      `;
    }).join('');

    titlesList.querySelectorAll('[data-profile-equip-title]').forEach(btn => {
      btn.onclick = () => {
        equipTitle(btn.getAttribute('data-profile-equip-title'));
        renderProfileView();
      };
    });
  }

  // Render Visual Effects in Profile
  if (effectsList) {
    effectsList.innerHTML = VISUAL_EFFECTS.map(eff => {
      const owned = userEffects.includes(eff.id);
      const isEquipped = state.equippedEffect === eff.id;
      return `
        <div class="item-card" style="padding: 10px 14px;">
          <div class="item-icon" style="font-size: 24px;">${eff.icon}</div>
          <div class="item-info">
            <span class="item-name">${eff.name} ${isEquipped ? '✨ [장착 중]' : owned ? '🔒 [소지중]' : ''}</span>
            <span class="item-desc">${eff.desc}</span>
          </div>
          <div class="item-action">
            <button class="buy-btn" data-profile-equip-effect="${eff.id}" ${!owned ? 'disabled' : ''}>
              ${isEquipped ? '해제하기' : owned ? '장착하기' : '미해금'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    effectsList.querySelectorAll('[data-profile-equip-effect]').forEach(btn => {
      btn.onclick = () => {
        equipEffect(btn.getAttribute('data-profile-equip-effect'));
        renderProfileView();
      };
    });
  }

  // Background URL
  const bgInput = document.getElementById('profileBgInput');
  const bgPreview = document.getElementById('bgPreview');
  const applyBgBtn = document.getElementById('applyBgBtn');
  const removeBgBtn = document.getElementById('removeBgBtn');

  if (bgInput && document.activeElement !== bgInput) {
    bgInput.value = state.backgroundUrl || '';
  }

  if (bgPreview) {
    if (state.backgroundUrl && state.backgroundUrl.trim()) {
      bgPreview.style.backgroundImage = `url(${state.backgroundUrl})`;
      bgPreview.classList.add('has-bg');
    } else {
      bgPreview.style.backgroundImage = '';
      bgPreview.classList.remove('has-bg');
    }
  }

  if (applyBgBtn) {
    applyBgBtn.onclick = () => {
      const url = bgInput ? bgInput.value.trim() : '';
      state.backgroundUrl = url;
      applyBackground(url);
      if (bgPreview) {
        if (url) {
          bgPreview.style.backgroundImage = `url(${url})`;
          bgPreview.classList.add('has-bg');
        } else {
          bgPreview.style.backgroundImage = '';
          bgPreview.classList.remove('has-bg');
        }
      }
      if (state.currentUser) scheduleSave();
      showToast(url ? '🖼️ 배경 이미지가 적용되었습니다!' : '배경이 제거되었습니다.');
    };
  }

  if (removeBgBtn) {
    removeBgBtn.onclick = () => {
      state.backgroundUrl = '';
      if (bgInput) bgInput.value = '';
      if (bgPreview) {
        bgPreview.style.backgroundImage = '';
        bgPreview.classList.remove('has-bg');
      }
      applyBackground('');
      if (state.currentUser) scheduleSave();
      showToast('배경이 제거되었습니다.');
    };
  }

  // Render Stats Grid
  if (statsGrid) {
    const clicks = getClicks();
    const bp = calcBattlePower();
    const wins = warRecords.wins || 0;
    const losses = warRecords.losses || 0;

    statsGrid.innerHTML = `
      <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(212,175,55,0.25); border-radius: 12px; padding: 12px;">
        <div style="font-size: 11px; color: var(--parchment-dim);">누적 자금</div>
        <div style="font-size: 16px; font-weight: 700; color: var(--gold-bright);" title="${formatNumberFull(clicks)}">${formatNumber(clicks)}</div>
      </div>
      <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(212,175,55,0.25); border-radius: 12px; padding: 12px;">
        <div style="font-size: 11px; color: var(--parchment-dim);">자동 수확 (CPS)</div>
        <div style="font-size: 16px; font-weight: 700; color: var(--gold-bright);">+${formatNumber(state.cps || 0)} /초</div>
      </div>
      <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(212,175,55,0.25); border-radius: 12px; padding: 12px;">
        <div style="font-size: 11px; color: var(--parchment-dim);">백그라운드 CPS</div>
        <div style="font-size: 16px; font-weight: 700; color: var(--gold-bright);">+${formatNumber(state.offlineCps || 0)} /초</div>
      </div>
      <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(212,175,55,0.25); border-radius: 12px; padding: 12px;">
        <div style="font-size: 11px; color: var(--parchment-dim);">종합 전투력</div>
        <div style="font-size: 16px; font-weight: 700; color: var(--gold-bright);" title="${bp.toLocaleString()}">⚔️ ${formatNumber(bp)}</div>
      </div>
      <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(212,175,55,0.25); border-radius: 12px; padding: 12px;">
        <div style="font-size: 11px; color: var(--parchment-dim);">전장 승패</div>
        <div style="font-size: 16px; font-weight: 700; color: var(--gold-bright);">${wins}승 ${losses}패</div>
      </div>
    `;
  }

  // Cloud save button
  const cloudSaveBtn = document.getElementById('profileCloudSaveBtn');
  if (cloudSaveBtn) {
    cloudSaveBtn.onclick = async () => {
      if (!state.currentUser) return;
      cloudSaveBtn.textContent = '☁️ 저장 중...';
      cloudSaveBtn.disabled = true;
      const prev = saveQueued;
      saveQueued = true;
      await flushSave();
      saveQueued = prev;
      cloudSaveBtn.textContent = '☁️ 클라우드에 캐시 저장';
      cloudSaveBtn.disabled = false;
      showToast('☁️ 데이터가 클라우드에 저장되었습니다.');
    };
  }

  // Logout button inside profile page
  const profileLogoutBtn = document.getElementById('profileLogoutBtn');
  if (profileLogoutBtn) {
    profileLogoutBtn.onclick = handleLogout;
  }

  // Admin section — shown when dev mode is active
  const profileAdminSection = document.getElementById('profileAdminSection');
  if (profileAdminSection) {
    if (isDevMode()) {
      profileAdminSection.hidden = false;
      const goAdminBtn = document.getElementById('profileGoAdminBtn');
      if (goAdminBtn) {
        goAdminBtn.onclick = () => {
          switchView('admin');
        };
      }
    } else {
      profileAdminSection.hidden = true;
    }
  }
}

let glitchTimer = null;
let glitchStateToggle = false;
let emojiRainTimer = null;

const RAIN_EMOJIS = ['🪙', '💰', '✨', '💎', '👑', '⚔️', '🛡️', '🐲', '⭐', '🌟'];

function spawnEmojiRain(cps) {
  const container = document.getElementById('emojiRain');
  if (!container) return;
  if (cps <= 0) return;
  const emoji = RAIN_EMOJIS[Math.floor(Math.random() * RAIN_EMOJIS.length)];
  const el = document.createElement('span');
  el.className = 'emoji-drop';
  el.textContent = emoji;
  el.style.left = (5 + Math.random() * 90) + '%';
  el.style.fontSize = (14 + Math.random() * 16) + 'px';
  const fallDuration = 2 + Math.random() * 3;
  el.style.setProperty('--fall-distance', (300 + Math.random() * 300) + 'px');
  el.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
  el.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
  el.style.animationDuration = fallDuration + 's';
  container.appendChild(el);
  setTimeout(() => el.remove(), fallDuration * 1000);
}

function startEmojiRain(cps) {
  stopEmojiRain();
  if (cps <= 0) return;
  const interval = Math.max(10, 3000 / (1 + cps * 0.3));
  emojiRainTimer = setInterval(() => spawnEmojiRain(cps), interval);
  // Spawn a few immediately
  for (let i = 0; i < Math.min(5, Math.ceil(cps / 10)); i++) {
    setTimeout(() => spawnEmojiRain(cps), i * 200);
  }
}

function stopEmojiRain() {
  if (emojiRainTimer) {
    clearInterval(emojiRainTimer);
    emojiRainTimer = null;
  }
  const container = document.getElementById('emojiRain');
  if (container) container.innerHTML = '';
}

function renderClickerView(clicks, tier) {
  const clickCountEl = document.getElementById('clickCount');
  const tierLabelEl = document.getElementById('tierLabel');
  const titleBadgeEl = document.getElementById('currentTitleBadge');
  const sealBtn = document.getElementById('sealBtn');

  if (tier.beyondMax) {
    // Unlock '신' title on achieving max tier
    if (state.currentUser && !(state.unlockedTitles || []).includes('title_god')) {
      state.unlockedTitles = state.unlockedTitles || [];
      state.unlockedTitles.push('title_god');
      showToast('⚡ [신] 칭호를 획득했습니다! 무한의 영역을 초월했습니다.');
    }

    clickCountEl.classList.add('glitch-number');
    tierLabelEl.classList.add('glitch-text');
    if (titleBadgeEl) titleBadgeEl.classList.add('glitch-text');
    if (sealBtn) sealBtn.classList.add('glitch-seal');

    tierLabelEl.textContent = '???';

    // Glitch toggle between numbers and Infinity symbol
    if (!glitchTimer) {
      glitchTimer = setInterval(() => {
        glitchStateToggle = !glitchStateToggle;
        const currentVal = getClicks();
        const el = document.getElementById('clickCount');
        if (el) {
          if (glitchStateToggle) {
            el.textContent = '∞';
          } else {
            el.textContent = formatNumber(currentVal);
          }
        }
      }, 700);
    }
  } else {
    if (glitchTimer) {
      clearInterval(glitchTimer);
      glitchTimer = null;
    }
    clickCountEl.classList.remove('glitch-number');
    tierLabelEl.classList.remove('glitch-text');
    if (titleBadgeEl) titleBadgeEl.classList.remove('glitch-text');
    if (sealBtn) sealBtn.classList.remove('glitch-seal');
    tierLabelEl.textContent = tier.name;
    // 단축 표기 + 전체 숫자 툴팁
    clickCountEl.textContent = formatNumber(clicks);
    clickCountEl.title = typeof clicks === 'string' ? clicks : clicks.toLocaleString();
  }

  document.getElementById('cpsLabel').textContent = `자동 수확: +${formatNumber(state.cps)} /초 | 🌙 백그라운드: +${formatNumber(state.offlineCps)} /초`;
  document.getElementById('guestBanner').hidden = !!state.currentUser;

  const tObj = UNLOCKABLE_TITLES.find(t => t.id === state.equippedTitle);
  const titleLabel = state.currentUser ? (tObj ? tObj.name : '칭호 없음') : '로그인 필요';
  if (titleBadgeEl) {
    titleBadgeEl.textContent = tier.beyondMax ? `⚡ [${titleLabel}]` : `👑 [${titleLabel}]`;
  }

  if (sealBtn) {
    sealBtn.style.setProperty('--core1', tier.core1);
    sealBtn.style.setProperty('--core2', tier.core2);
    sealBtn.style.setProperty('--border-w', tier.borderW);
    sealBtn.style.setProperty('--border-c', tier.borderC);
    sealBtn.style.setProperty('--glow', tier.glow);
    let sealClass = 'seal-btn';
    if (state.equippedEffect) sealClass += ` ${state.equippedEffect}`;
    if (tier.beyondMax) sealClass += ' glitch-seal';
    sealBtn.className = sealClass;
  }

  const crown = document.getElementById('sealCrown');
  if (crown) crown.classList.toggle('visible', tier.crown);

  const gems = document.getElementById('sealGems');
  if (gems) {
    for (let i = 0; i < gems.children.length; i++) {
      gems.children[i].classList.toggle('visible', i < tier.gems);
    }
  }

  renderQuickUpgrades(clicks);
}

function renderQuickUpgrades(clicks) {
  const panel = document.getElementById('quickUpgradesPanel');
  if (!panel) return;

  const affordableArmies = ARMY_ITEMS.filter(item => {
    const count = state.armies[item.id] || 0;
    const cost = getArmyCost(item, count);
    return bigGte(clicks, cost);
  });

  const affordableRelics = MULTIPLIER_RELICS.filter(r => {
    const rawVal = state.relics[r.id];
    const count = typeof rawVal === 'number' ? rawVal : (rawVal ? 1 : 0);
    const cost = getRelicCost(r, count);
    return bigGte(clicks, cost);
  });

  const affordableEffects = VISUAL_EFFECTS.filter(eff => {
    return bigGte(clicks, String(eff.cost)) && !state.effects.includes(eff.id);
  });

  if (affordableArmies.length === 0 && affordableRelics.length === 0 && affordableEffects.length === 0) {
    panel.innerHTML = '';
    return;
  }

  let html = `<div class="quick-upgrades-header"><span>⚡ 구매 가능한 모든 즉시 업그레이드</span></div>`;

  affordableArmies.forEach(item => {
    const count = state.armies[item.id] || 0;
    const cost = getArmyCost(item, count);
    html += `
      <div class="quick-upgrade-card">
        <div class="quick-upgrade-info">
          <span class="quick-upgrade-icon">${item.icon}</span>
          <div>
            <div class="quick-upgrade-name">${item.name} (x${count})</div>
            <div class="quick-upgrade-sub">CPS +${item.cps}</div>
          </div>
        </div>
        <button class="buy-btn" data-quick-buy-army="${item.id}" title="${cost.toLocaleString()}">고용 (${formatNumber(cost)})</button>
      </div>
    `;
  });

  affordableRelics.forEach(topRelic => {
    const rawVal = state.relics[topRelic.id];
    const count = typeof rawVal === 'number' ? rawVal : (rawVal ? 1 : 0);
    const cost = getRelicCost(topRelic, count);
    html += `
      <div class="quick-upgrade-card">
        <div class="quick-upgrade-info">
          <span class="quick-upgrade-icon">${topRelic.icon}</span>
          <div>
            <div class="quick-upgrade-name">${topRelic.name} (x${count})</div>
            <div class="quick-upgrade-sub">${topRelic.desc}</div>
          </div>
        </div>
        <button class="buy-btn" data-quick-buy-relic="${topRelic.id}" title="${cost.toLocaleString()}">연마 (${formatNumber(cost)})</button>
      </div>
    `;
  });

  affordableEffects.forEach(eff => {
    html += `
      <div class="quick-upgrade-card">
        <div class="quick-upgrade-info">
          <span class="quick-upgrade-icon">${eff.icon}</span>
          <div>
            <div class="quick-upgrade-name">${eff.name}</div>
            <div class="quick-upgrade-sub">${eff.desc}</div>
          </div>
        </div>
        <button class="buy-btn" data-quick-buy-effect="${eff.id}" title="${eff.cost.toLocaleString()}">구매 (${formatNumber(eff.cost)})</button>
      </div>
    `;
  });

  panel.innerHTML = html;

  panel.querySelectorAll('[data-quick-buy-army]').forEach(btn => {
    btn.onclick = () => buyArmy(btn.getAttribute('data-quick-buy-army'));
  });
  panel.querySelectorAll('[data-quick-buy-relic]').forEach(btn => {
    btn.onclick = () => buyRelic(btn.getAttribute('data-quick-buy-relic'));
  });
  panel.querySelectorAll('[data-quick-buy-effect]').forEach(btn => {
    btn.onclick = () => buyEffect(btn.getAttribute('data-quick-buy-effect'));
  });
}

function renderShopView(clicks) {
  const armyListEl = document.getElementById('armyShopList');
  if (armyListEl) {
    armyListEl.innerHTML = ARMY_ITEMS.map(item => {
      const count = state.armies[item.id] || 0;
      const cost = getArmyCost(item, count);
      const canAfford = bigGte(clicks, cost);
      return `
        <div class="item-card">
          <div class="item-icon">${item.icon}</div>
          <div class="item-info">
            <span class="item-name">${item.name} <span class="item-count">x${count}</span></span>
            <span class="item-desc">${item.desc} (CPS +${item.cps})</span>
          </div>
          <div class="item-action">
            <button class="buy-btn" data-buy-army="${item.id}" ${canAfford ? '' : 'disabled'} title="${cost}">
              고용 (${formatNumber(cost)})
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
      const rawVal = state.relics[r.id];
      const count = typeof rawVal === 'number' ? rawVal : (rawVal ? 1 : 0);
      const cost = getRelicCost(r, count);
      const canAfford = bigGte(clicks, cost);
      return `
        <div class="item-card">
          <div class="item-icon">${r.icon}</div>
          <div class="item-info">
            <span class="item-name">${r.name} <span class="item-count">x${count}</span></span>
            <span class="item-desc">${r.desc}</span>
          </div>
          <div class="item-action">
            <button class="buy-btn" data-buy-relic="${r.id}" ${canAfford ? '' : 'disabled'} title="${cost}">
              연마 (${formatNumber(cost)})
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
      const canAfford = bigGte(clicks, String(eff.cost)) || owned;
      return `
        <div class="item-card">
          <div class="item-icon">${eff.icon}</div>
          <div class="item-info">
            <span class="item-name">${eff.name} ${isEquipped ? '✨ [장착 중]' : owned ? '🔒 [소지중]' : ''}</span>
            <span class="item-desc">${eff.desc}</span>
          </div>
          <div class="item-action">
            <button class="buy-btn" data-buy-effect="${eff.id}" ${!canAfford ? 'disabled' : ''}>
              ${isEquipped ? '해제하기' : owned ? '장착하기' : `구매 (${formatNumber(eff.cost)})`}
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
    let offlineBanner = '';
    if (!state.currentUser) {
      offlineBanner = `
        <div class="ranking-empty" style="padding: 14px; margin-bottom: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--gold); border-radius: 12px;">
          🔒 백그라운드 CPS 구축은 로그인이 필요합니다.<br>
          <button class="buy-btn" id="offlineLoginBannerBtn" style="margin-top: 8px;">로그인하기</button>
        </div>
      `;
    }
    offlineListEl.innerHTML = offlineBanner + OFFLINE_CPS_ITEMS.map(item => {
      const count = state.offlineArmies[item.id] || 0;
      const cost = getArmyCost(item, count);
      const canAfford = bigGte(clicks, cost) && !!state.currentUser;
      return `
        <div class="item-card">
          <div class="item-icon">${item.icon}</div>
          <div class="item-info">
            <span class="item-name">${item.name} <span class="item-count">x${count}</span></span>
            <span class="item-desc">${item.desc}</span>
          </div>
          <div class="item-action">
            <button class="buy-btn" data-buy-offline="${item.id}" ${canAfford ? '' : 'disabled'}>
              ${!state.currentUser ? '로그인 필요' : `구축 (${formatNumber(cost)})`}
            </button>
          </div>
        </div>
      `;
    }).join('');

    const bannerBtn = document.getElementById('offlineLoginBannerBtn');
    if (bannerBtn) bannerBtn.onclick = () => openModal('authModal');

    offlineListEl.querySelectorAll('[data-buy-offline]').forEach(btn => {
      btn.onclick = () => buyOfflineArmy(btn.getAttribute('data-buy-offline'));
    });
  }
}

function renderTitlesView() {
  const container = document.getElementById('titlesContainer');
  if (!container) return;

  if (!state.currentUser) {
    container.innerHTML = '<div class="ranking-empty">🔒 칭호 시스템은 로그인이 필요합니다!</div>';
    return;
  }

  // Filter out hidden secret titles (like 'title_god') until unlocked
  const visibleTitles = UNLOCKABLE_TITLES.filter(t => {
    if (t.id === 'title_god') {
      return state.unlockedTitles.includes('title_god');
    }
    return true;
  });

  container.innerHTML = visibleTitles.map(t => {
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

const PENDING_SYNC_KEY = 'ck_pending_sync';

function isFileProtocol() {
  return window.location.protocol === 'file:';
}

function savePendingSync(account, retryable = true) {
  if (isFileProtocol()) return;
  try {
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify({ account, savedAt: Date.now(), retryable }));
  } catch (e) { /* localStorage full */ }
}

function clearPendingSync() {
  try { localStorage.removeItem(PENDING_SYNC_KEY); } catch (e) {}
}

function getPendingSync() {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

async function retryPendingSync() {
  const pending = getPendingSync();
  if (!pending || !pending.account) return;
  if (pending.retryable === false) {
    clearPendingSync();
    return;
  }
  if (typeof supabaseSyncAccount !== 'function') return;
  const ok = await supabaseSyncAccount(pending.account);
  if (ok) {
    clearPendingSync();
  } else {
    // Check if retry is still viable
    if (typeof getCloudSyncState === 'function') {
      const st = getCloudSyncState();
      if (st && st.lastErrorRetryable === false) {
        clearPendingSync();
      }
    }
  }
}

function scheduleSave() {
  saveQueued = true;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(flushSave, 1000);
}

function formatTimeDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}
const MAX_OFFLINE_SEC = 86400; // 최대 24시간만 보상

function checkOfflineHarvest(lastTime) {
  if (!lastTime) return;
  const now = Date.now();
  let elapsedSec = Math.floor((now - lastTime) / 1000);
  if (elapsedSec < 0) elapsedSec = 0; // 시스템 시계 되돌림 방어
  const cappedSec = Math.min(elapsedSec, MAX_OFFLINE_SEC);

  if (cappedSec >= 5) {
    const effectiveRate = state.offlineCps > 0 ? state.offlineCps : Math.floor(state.cps * 0.5);
    if (effectiveRate <= 0) return; // 수확률 0이면 보상 없음
    const reward = cappedSec * effectiveRate;
    state.lastOfflineTime = now;

    addClicks(reward);
    if (state.currentUser) scheduleSave();

    const timeEl = document.getElementById('offlineTimeDisplay');
    const earnedEl = document.getElementById('offlineEarnedDisplay');
    const rateEl = document.getElementById('offlineCpsRateDisplay');

    if (timeEl && earnedEl && rateEl) {
      timeEl.textContent = formatTimeDuration(elapsedSec) + (elapsedSec > MAX_OFFLINE_SEC ? ' (최대 적용)' : '');
      earnedEl.textContent = `+${formatNumber(reward)} 클릭`;
      rateEl.textContent = `(백그라운드 수확 속도: +${formatNumber(effectiveRate)} /초)`;
      openModal('offlineHarvestModal');
    } else {
      showToast(`🌙 접속하지 않은 ${formatTimeDuration(elapsedSec)} 동안 +${formatNumber(reward)} 자금을 수확했습니다!`);
    }
  }
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
    account.nickname = state.currentUser.nickname;
    account.avatar = state.avatar || '👑';
    account.armies = state.armies;
    account.relics = state.relics;
    account.effects = state.effects;
    account.equippedEffect = state.equippedEffect;
    account.offlineArmies = state.offlineArmies;
    account.equippedTitle = state.equippedTitle;
    account.unlockedTitles = state.unlockedTitles;
    account.warRecords = state.warRecords;
    account.missionProgress = state.missionProgress;
    account.backgroundUrl = state.backgroundUrl;
    account.lastOfflineTime = state.lastOfflineTime;
    account.battlePower = calcBattlePower();
    account.updatedAt = Date.now(); // 수정: 로컬 캐시에도 최신 저장 시각을 남겨 클라우드와 비교 가능하게 한다.
    await setAccount(account);

    if (typeof supabaseSaveAccount === 'function') {
      const ok = await supabaseSaveAccount(account);
      if (ok) {
        clearPendingSync();
      } else {
        const retryable = (typeof getCloudSyncState === 'function') ? getCloudSyncState().lastErrorRetryable : true;
        savePendingSync(account, retryable);
      }
    }
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

  if (state.currentUser) {
    const avatar = state.avatar || '👑';
    actions.innerHTML = `
      <button class="user-chip" id="userChip" title="프로필 관리">${avatar} ${escapeHtml(state.currentUser.nickname)}</button>
    `;
    document.getElementById('userChip').onclick = () => switchView('profile');
  } else {
    actions.innerHTML = `
      <button class="login-btn" id="loginBtn">로그인</button>
    `;
    document.getElementById('loginBtn').onclick = () => openModal('authModal');
  }
}

function renderCloudStatus() {
  const cloudState = getCloudStateSnapshot();
  const pill = document.getElementById('cloudStatusPill');
  const summary = document.getElementById('cloudStatusSummary');
  const detail = document.getElementById('cloudStatusDetail');
  const diagnostic = document.getElementById('cloudStatusDiagnostic');
  const badge = document.getElementById('cloudMiniBadge');

  const pillLabel = cloudState.tone === 'success'
    ? '☁ 클라우드 정상'
    : cloudState.tone === 'syncing'
      ? '☁ 클라우드 저장 중'
      : cloudState.tone === 'warning'
        ? '☁ 클라우드 부분 오류'
        : cloudState.tone === 'error'
          ? '☁ 클라우드 문제'
          : '☁ 클라우드 대기 중';

  if (pill) {
    pill.className = `cloud-status-pill tone-${cloudState.tone || 'idle'}`;
    pill.textContent = pillLabel;
  }

  if (summary) summary.textContent = cloudState.summary || '클라우드 상태 요약이 없어.';

  if (detail) {
    const stamp = cloudState.lastSyncAt
      ? `마지막 성공: ${formatClockTime(cloudState.lastSyncAt)}`
      : cloudState.lastErrorAt
        ? `마지막 오류: ${formatClockTime(cloudState.lastErrorAt)}`
        : '아직 저장 시도 기록이 없어.';
    detail.textContent = `${cloudState.detail || ''} ${stamp}`.trim();
  }

  if (diagnostic) {
    if (cloudState.diagnostics) {
      diagnostic.textContent = [
        `최근 읽기 진단 ${formatClockTime(cloudState.diagnostics.checkedAt)}`,
        buildDiagnosticLine('accounts', cloudState.diagnostics.accounts),
        buildDiagnosticLine('leaderboard', cloudState.diagnostics.leaderboard),
        buildDiagnosticLine('rooms', cloudState.diagnostics.rooms)
      ].join(' | ');
    } else {
      diagnostic.textContent = '진단 기록 없음';
    }
  }

  if (badge) {
    badge.textContent = pillLabel;
    badge.title = `${cloudState.summary} ${cloudState.detail || ''}`.trim();
  }
}

async function handleCloudRefresh() {
  if (typeof supabaseRunDiagnostics === 'function') {
    await supabaseRunDiagnostics();
    renderTopbarActions();
    renderCloudStatus();
    showToast('☁ 클라우드 진단을 다시 확인했어.');
  } else {
    showToast('☁ 클라우드 진단 함수를 찾지 못했어.');
  }
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pw = document.getElementById('loginPw').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  if (!email || !pw) { errEl.textContent = '이메일과 비밀번호를 입력해 주세요.'; return; }

  if (typeof supabaseSignIn !== 'function') {
    errEl.textContent = 'Supabase 연결을 확인해 주세요.';
    return;
  }

  const result = await supabaseSignIn(email, pw);
  if (result.error) {
    errEl.textContent = result.error.message === 'Invalid login credentials'
      ? '이메일 또는 비밀번호가 올바르지 않아요.'
      : `로그인 실패: ${result.error.message}`;
    return;
  }

  const account = await supabaseLoadAccount();
  if (!account) {
    errEl.textContent = '계정 데이터를 불러오지 못했어요. 새로 가입해 주세요.';
    await supabaseSignOut();
    return;
  }

  // Cache locally
  await setAccount(account);

  if (applyEmergencySnapshot(account)) {
    await setAccount(account);
    scheduleSave();
  }

  state.currentUser = { id: account.user_id, nickname: account.nickname, clicks: String(account.clicks || 0) };
  state.avatar = account.avatar || '👑';
  state.armies = account.armies || {};
  state.relics = account.relics || {};
  state.effects = account.effects || [];
  state.equippedEffect = account.equippedEffect || null;
  state.offlineArmies = account.offlineArmies || {};
  state.equippedTitle = account.equippedTitle || 'title_novice';
  state.unlockedTitles = account.unlockedTitles || ['title_novice'];
  state.warRecords = account.warRecords || { totalBattles: 0, wins: 0, losses: 0, plunderedClicks: 0 };
  state.missionProgress = account.missionProgress || { clickCount: 0, armyCount: 0, battleCount: 0, feedbackCount: 0, claimed: {} };
  state.backgroundUrl = account.backgroundUrl || '';
  state.lastOfflineTime = account.lastOfflineTime || Date.now();

  recalculateCPS();
  recalculateMultipliers();

  applyBackground(state.backgroundUrl);
  checkOfflineHarvest(account.lastOfflineTime);

  await setSession(account.user_id);
  closeModal('authModal');
  renderTopbarActions();
  switchView('clicker');
  showToast(`${account.nickname}님, 다시 오셨네요!`);
}

async function handleSignup() {
  const nickname = document.getElementById('signupNickname').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pw = document.getElementById('signupPw').value;
  const pw2 = document.getElementById('signupPw2').value;
  const errEl = document.getElementById('signupError');
  errEl.textContent = '';

  if (!nickname || !email || !pw || !pw2) { errEl.textContent = '모든 항목을 입력해 주세요.'; return; }
  if (nickname.length > 12) { errEl.textContent = '닉네임은 12자 이하로 입력해 주세요.'; return; }
  if (!email.includes('@')) { errEl.textContent = '올바른 이메일 주소를 입력해 주세요.'; return; }
  if (pw.length < 6) { errEl.textContent = '비밀번호는 6자 이상으로 입력해 주세요.'; return; }
  if (pw !== pw2) { errEl.textContent = '비밀번호가 서로 일치하지 않아요.'; return; }

  if (typeof supabaseSignUp !== 'function') {
    errEl.textContent = 'Supabase 연결을 확인해 주세요.';
    return;
  }

  const result = await supabaseSignUp(email, pw, nickname);
  if (result.error) {
    errEl.textContent = `가입 실패: ${result.error.message}`;
    return;
  }

  // If email confirmation is required, Supabase sends a confirmation email.
  // For now, proceed immediately (user_override_confirmation or disable confirmation in Supabase settings).
  const userId = await supabaseGetCurrentUserId();
  if (!userId) {
    errEl.textContent = '자동 로그인에 실패했어요. 로그인 페이지에서 로그인해 주세요.';
    return;
  }

  const account = {
    user_id: userId,
    nickname,
    clicks: "0",
    armies: {}, relics: {}, effects: [], equippedEffect: null, offlineArmies: {},
    equippedTitle: 'title_novice', unlockedTitles: ['title_novice'],
    warRecords: { totalBattles: 0, wins: 0, losses: 0, plunderedClicks: 0 },
    missionProgress: { clickCount: 0, armyCount: 0, battleCount: 0, feedbackCount: 0, claimed: {} },
    battlePower: 0, wins: 0,
    lastOfflineTime: Date.now(),
    updatedAt: Date.now()
  };

  // Save to Supabase first, then cache locally
  if (typeof supabaseSaveAccount === 'function') {
    const ok = await supabaseSaveAccount(account);
    if (!ok) {
      errEl.textContent = '계정 저장에 실패했어요. 다시 시도해 주세요.';
      await supabaseSignOut();
      return;
    }
  }
  await setAccount(account);

  state.currentUser = { id: userId, nickname, clicks: "0" };
  state.localClicks = "0";
  await setSession(userId);
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
  if (typeof supabaseSignOut === 'function') {
    supabaseSignOut();
  }
  renderTopbarActions();
  switchView('landing');
  showToast('로그아웃 됐어요.');
}

function setupEventListeners() {
  // Global Spacebar Keydown Trigger — e.repeat blocks OS key-repeat auto-fire
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
      if (e.repeat) return; // ← 꾹 누르기 방지
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (state.currentView === 'clicker') {
        e.preventDefault();
        handleSealClick(null);
      } else if (state.currentView === 'battle' && battleTimeLeft > 0) {
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
    createRoomBtn.onclick = async () => {
      if (!state.currentUser) {
        showToast('🔒 친구 대전 및 룸 코드 생성은 로그인이 필요합니다!');
        openModal('authModal');
        return;
      }
      const code = generateRoomCode();
      const roomCard = document.getElementById('myRoomCodeCard');
      if (roomCard) roomCard.hidden = false;
      document.getElementById('roomCodeDisplay').textContent = code;

      // Upload room to Supabase so friend can find it
      if (typeof supabaseCreateRoom === 'function') {
        const ok = await supabaseCreateRoom(code, {
          id: state.currentUser.id,
          nickname: state.currentUser.nickname,
          power: calcBattlePower(),
          cps: state.cps
        });
        if (ok) {
          showToast(`🔑 룸 코드 [${code}] 생성 완료! 친구 입장을 기다리는 중...`);
          
          // Poll for guest arrival
          if (roomWaitingPollInterval) clearInterval(roomWaitingPollInterval);
          roomWaitingPollInterval = setInterval(async () => {
            const r = await supabaseFetchRoom(code);
            if (r && r.status === 'matched') {
              clearInterval(roomWaitingPollInterval);
              roomWaitingPollInterval = null;
              battleMatchedAt = r.matchedAt || Date.now();
              showToast(`⚔️ [${r.guestNickname || '친구'}]님 입장 완료! 대전을 시작합니다!`);
              startBattle({
                name: `👑 ${r.guestNickname || '친구 영주'}의 군대`,
                power: Math.max(1000, state.cps * 8)
              }, code, 'host');
            }
          }, 2000);
        } else {
          showToast(`🔑 룸 코드 [${code}] 생성 완료! (오프라인 모드)`);
        }
      } else {
        showToast(`🔑 나의 룸 코드 [${code}] 생성 완료! 친구에게 알려주세요.`);
      }
    };
  }

  const joinRoomBtn = document.getElementById('joinRoomBtn');
  if (joinRoomBtn) {
    joinRoomBtn.onclick = async () => {
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

      showToast('🔍 친구의 룸을 탐색 중...');

      // Try to fetch real room data from Supabase
      if (typeof supabaseFetchRoom === 'function') {
        const room = await supabaseFetchRoom(inputCode);
        if (room) {
          if (room.hostId === state.currentUser.id) {
            showToast('⚠️ 자신의 룸 코드는 입력할 수 없습니다!');
            return;
          }

          // Mark room as joined in Supabase
          if (typeof supabaseJoinRoom === 'function') {
            const matchedAtStr = await supabaseJoinRoom(inputCode, {
              id: state.currentUser.id,
              nickname: state.currentUser.nickname
            });
            battleMatchedAt = matchedAtStr ? new Date(matchedAtStr).getTime() : Date.now();
          }

          const enemyInfo = {
            name: `👑 ${room.hostNickname || '친구 영주'}의 군대`,
            power: room.hostPower || Math.max(1200, state.cps * 7 + 800)
          };
          showToast(`⚔️ ${room.hostNickname || '친구 영주'} 룸 입장! 대전을 시작합니다!`);
          startBattle(enemyInfo, inputCode, 'guest');
        } else {
          showToast('❌ 룸 코드를 찾을 수 없습니다. 코드를 확인해 주세요.');
          return;
        }
      } else {
        // Offline fallback
        const enemyInfo = {
          name: `[룸 ${inputCode}] 친구 영주의 군대`,
          power: Math.max(1200, state.cps * 7 + 800)
        };
        startBattle(enemyInfo);
      }
    };
  }

  const battleTapBtn = document.getElementById('battleTapBtn');
  if (battleTapBtn) battleTapBtn.addEventListener('pointerdown', registerMyBattleTap);

  // Ranking Tabs & Refresh
  const rankingRefreshBtn = document.getElementById('rankingRefreshBtn');
  if (rankingRefreshBtn) {
    rankingRefreshBtn.onclick = () => {
      renderRankingView(true);
      showToast('🔄 랭킹 정보를 새로고침했습니다.');
    };
  }

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

  // Developer Tools - self-only debug functions (no cloud sync)
  document.getElementById('adminLoginSubmit').onclick = () => {
    toggleDevMode();
  };
  document.getElementById('adminSetClickBtn').onclick = handleAdminCustomClickSet;
  document.getElementById('adminCheat1M').onclick = () => giveAdminGold(1000000);
  document.getElementById('adminCheat10M').onclick = () => giveAdminGold(10000000);
  document.getElementById('adminUnlockAll').onclick = unlockAllForAdmin;

  // Offline Harvest Claim Button
  const offlineClaimBtn = document.getElementById('offlineClaimBtn');
  if (offlineClaimBtn) {
    offlineClaimBtn.onclick = () => {
      closeModal('offlineHarvestModal');
      if (state.currentUser) {
        scheduleSave();
      }
      showToast('🏰 수확금을 수령했습니다! 통치를 계속하세요.');
    };
  }

  // Page Visibility: harvest when user returns to tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.currentUser && state.lastOfflineTime) {
      const elapsed = Math.floor((Date.now() - state.lastOfflineTime) / 1000);
      if (elapsed >= 30) {
        checkOfflineHarvest(state.lastOfflineTime);
        if (state.currentUser) scheduleSave();
      }
    } else if (document.visibilityState === 'hidden' && state.currentUser) {
      if (!activeRoomCode) {
        state.lastOfflineTime = Date.now();
      }
      saveEmergencySnapshot();
      flushSave();
    }
  });

  // Subscribe state changes
  subscribeState(renderActiveView);

  // beforeunload: async flushSave()는 브라우저가 기다려주지 않으므로,
  // 동기적으로 localStorage에 긴급 백업을 저장해 두고
  // 다음 로그인 시 이를 복구하도록 한다.
  window.addEventListener('beforeunload', () => {
    saveEmergencySnapshot();
    flushSave();
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
  setupEventListeners();
  window.addEventListener('ck-cloud-status', () => {
    renderTopbarActions();
    renderCloudStatus();
  });

  const cloudRefreshBtn = document.getElementById('cloudStatusRefreshBtn');
  if (cloudRefreshBtn) cloudRefreshBtn.onclick = handleCloudRefresh;

  if (typeof supabaseInit === 'function') {
    supabaseInit();
  } else if (typeof supabaseRunDiagnostics === 'function') {
    supabaseRunDiagnostics();
  }

  const session = await getSession();
  if (session && session.id) {
    const account = await loadPreferredAccount(session.id);
    if (account) {
      if (applyEmergencySnapshot(account)) {
        await setAccount(account);
        scheduleSave();
      }

      state.currentUser = { id: account.id, nickname: account.nickname, clicks: String(account.clicks || 0) };
      state.avatar = account.avatar || '👑';
      state.armies = account.armies || {};
      state.relics = account.relics || {};
      state.effects = account.effects || [];
      state.equippedEffect = account.equippedEffect || null;
      state.offlineArmies = account.offlineArmies || {};
      state.equippedTitle = account.equippedTitle || 'title_novice';
      state.unlockedTitles = account.unlockedTitles || ['title_novice'];
      state.warRecords = account.warRecords || { totalBattles: 0, wins: 0, losses: 0, plunderedClicks: 0 };
      state.missionProgress = account.missionProgress || { clickCount: 0, armyCount: 0, battleCount: 0, feedbackCount: 0, claimed: {} };
      state.backgroundUrl = account.backgroundUrl || '';
      state.lastOfflineTime = account.lastOfflineTime || Date.now();
      recalculateCPS();
      recalculateMultipliers();

      applyBackground(state.backgroundUrl);
      // Process Offline Background CPS Harvest → show modal popup
      checkOfflineHarvest(account.lastOfflineTime);
    } else {
      await clearSession();
    }
  } else {
    // 세션이 없어도 스냅셟이 남아 있으면 정리
    try { localStorage.removeItem('ck_emergency_snapshot'); } catch (e) {}
  }

  retryPendingSync();
  setInterval(retryPendingSync, 30000);

  renderTopbarActions();
  switchView('landing');
  renderCloudStatus();

  // 1-second auto harvest (CPS) loop — 저장은 5초마다 (매 tick마다 scheduleSave 하지 않음)
  let lastCpsSaveAt = 0;
  setInterval(() => {
    if (state.cps > 0) {
      addClicks(state.cps);
      state._lastCpsTick = Date.now();
      if (state.currentUser) {
        const now = Date.now();
        if (now - lastCpsSaveAt >= 5000) {
          lastCpsSaveAt = now;
          scheduleSave();
        }
      }
    }
  }, 1000);
}

// ---------- 10. Space Cannon Shooter Mini-Game ----------
let shooterAnimFrame = null;
let shooterActive = false;
let shooterScore = 0;
let shooterReward = 0;
let shooterHp = 3;

const shooterPlayer = { x: 300, y: 360, width: 40, height: 25, speed: 6, dx: 0 };
let shooterBullets = [];
let shooterEnemies = [];
let shooterLastShot = 0;

function initShooterGame() {
  const overlay = document.getElementById('shooterOverlay');
  if (overlay) overlay.hidden = true;

  shooterActive = true;
  shooterScore = 0;
  shooterReward = 0;
  shooterHp = 3;
  shooterPlayer.x = 280;
  shooterBullets = [];
  shooterEnemies = [];
  shooterLastShot = 0;

  updateShooterHud();

  const canvas = document.getElementById('shooterCanvas');
  if (!canvas) return;

  // Controls: Mouse Movement / Touch
  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    shooterPlayer.x = (e.clientX - rect.left) * scaleX - shooterPlayer.width / 2;
    shooterPlayer.x = Math.max(0, Math.min(canvas.width - shooterPlayer.width, shooterPlayer.x));
  };

  canvas.ontouchmove = (e) => {
    if (e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      shooterPlayer.x = (e.touches[0].clientX - rect.left) * scaleX - shooterPlayer.width / 2;
      shooterPlayer.x = Math.max(0, Math.min(canvas.width - shooterPlayer.width, shooterPlayer.x));
    }
  };

  // Keyboard controls
  window.onkeydown = (e) => {
    if (state.currentView !== 'shooter') return;
    if (e.key === 'ArrowLeft' || e.key === 'a') shooterPlayer.dx = -shooterPlayer.speed;
    if (e.key === 'ArrowRight' || e.key === 'd') shooterPlayer.dx = shooterPlayer.speed;
  };
  window.onkeyup = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') shooterPlayer.dx = 0;
  };

  if (shooterAnimFrame) cancelAnimationFrame(shooterAnimFrame);
  shooterLoop();
}

function updateShooterHud() {
  const sScore = document.getElementById('shooterScore');
  const sReward = document.getElementById('shooterReward');
  const sHp = document.getElementById('shooterHp');
  if (sScore) sScore.textContent = shooterScore.toLocaleString();
  if (sReward) sReward.textContent = shooterReward.toLocaleString();
  if (sHp) sHp.textContent = '❤️'.repeat(Math.max(0, shooterHp)) || '💀';
}

function shooterLoop() {
  if (!shooterActive) return;

  const canvas = document.getElementById('shooterCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Clear Background
  ctx.fillStyle = '#0b0c1b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Stars Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  for (let i = 0; i < 20; i++) {
    const rx = (Math.sin(i * 99 + Date.now() * 0.001) * 0.5 + 0.5) * canvas.width;
    const ry = ((i * 30 + Date.now() * 0.05) % canvas.height);
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Update Player Position via Keyboard
  shooterPlayer.x += shooterPlayer.dx;
  shooterPlayer.x = Math.max(0, Math.min(canvas.width - shooterPlayer.width, shooterPlayer.x));

  // Draw Player Cannon/Ship
  ctx.fillStyle = '#f1ce6b';
  ctx.fillRect(shooterPlayer.x + 15, shooterPlayer.y - 10, 10, 10); // Cannon Barrel
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(shooterPlayer.x, shooterPlayer.y, shooterPlayer.width, shooterPlayer.height); // Ship Body
  ctx.fillStyle = '#ff8b8b';
  ctx.fillRect(shooterPlayer.x + 5, shooterPlayer.y + 5, 8, 12);
  ctx.fillRect(shooterPlayer.x + 27, shooterPlayer.y + 5, 8, 12);

  // Auto Cannon Firing (Every 180ms)
  const now = Date.now();
  if (now - shooterLastShot > 180) {
    shooterBullets.push({ x: shooterPlayer.x + 18, y: shooterPlayer.y - 10, radius: 4, speed: 8 });
    shooterLastShot = now;
  }

  // Update & Draw Cannon Bullets
  ctx.fillStyle = '#00ffff';
  for (let i = shooterBullets.length - 1; i >= 0; i--) {
    const b = shooterBullets[i];
    b.y -= b.speed;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();

    if (b.y < -10) {
      shooterBullets.splice(i, 1);
    }
  }

  // Spawn Invading Enemies
  if (Math.random() < 0.04) {
    const icons = ['🛸', '👾', '☄️', '🤖'];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    shooterEnemies.push({
      x: Math.random() * (canvas.width - 30),
      y: -30,
      size: 28,
      speed: 1.5 + Math.random() * 2,
      hp: 1,
      icon: icon
    });
  }

  // Update & Draw Enemies
  ctx.font = '22px sans-serif';
  for (let eIdx = shooterEnemies.length - 1; eIdx >= 0; eIdx--) {
    const enemy = shooterEnemies[eIdx];
    enemy.y += enemy.speed;

    ctx.fillText(enemy.icon, enemy.x, enemy.y);

    // Collision Check: Bullet hitting Enemy
    for (let bIdx = shooterBullets.length - 1; bIdx >= 0; bIdx--) {
      const b = shooterBullets[bIdx];
      const dist = Math.hypot(b.x - (enemy.x + 14), b.y - (enemy.y - 10));
      if (dist < 20) {
        // Hit enemy!
        shooterBullets.splice(bIdx, 1);
        shooterEnemies.splice(eIdx, 1);

        shooterScore += 10;
        const rewardEarned = Math.max(50, Math.floor((state.cps || 10) * 1.5));
        shooterReward += rewardEarned;
        addClicks(rewardEarned);

        updateShooterHud();
        break;
      }
    }

    // Check if Enemy Reached Bottom / Hit Player
    if (enemy.y > canvas.height - 20) {
      shooterEnemies.splice(eIdx, 1);
      shooterHp -= 1;
      updateShooterHud();

      if (shooterHp <= 0) {
        endShooterGame();
        return;
      }
    }
  }

  shooterAnimFrame = requestAnimationFrame(shooterLoop);
}

function endShooterGame() {
  shooterActive = false;
  if (shooterAnimFrame) cancelAnimationFrame(shooterAnimFrame);

  showToast(`💥 게임 오버! 점수: ${shooterScore.toLocaleString()}점 | 전리품 +${shooterReward.toLocaleString()} 클릭 획득!`);

  const overlay = document.getElementById('shooterOverlay');
  if (overlay) {
    overlay.hidden = false;
    overlay.querySelector('h3').textContent = '💥 디펜스 슈터 게임 오버';
    overlay.querySelector('p').innerHTML = `최종 점수: <b>${shooterScore.toLocaleString()}점</b><br>획득 자금: <b>+${shooterReward.toLocaleString()} 클릭</b>`;
  }
}

// Execute initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    const startShooterBtn = document.getElementById('startShooterBtn');
    if (startShooterBtn) startShooterBtn.onclick = initShooterGame;
  });
} else {
  init();
  const startShooterBtn = document.getElementById('startShooterBtn');
  if (startShooterBtn) startShooterBtn.onclick = initShooterGame;
}
