// ---------- UI & View Controller Module ----------
import { state, getClicks } from './state.js';
import { getTierInfo } from './empire.js';
import { ARMY_ITEMS, MULTIPLIER_RELICS, UNLOCKABLE_TITLES, DAILY_MISSIONS } from './config.js';
import { buyArmy, buyRelic, getArmyCost } from './upgrades.js';
import { claimMissionReward } from './missions.js';
import { equipTitle } from './empire.js';

export function switchView(viewName) {
  state.currentView = viewName;
  const views = ['landingView', 'clickerView', 'shopView', 'battleView', 'rankingView', 'titlesView', 'missionsView'];
  views.forEach(vId => {
    const el = document.getElementById(vId);
    if (el) el.hidden = true;
  });

  const activeEl = document.getElementById(viewName + 'View');
  if (activeEl) activeEl.hidden = false;

  // Nav tab active status
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  renderActiveView();
}

export function renderActiveView() {
  const clicks = getClicks();
  const tier = getTierInfo(clicks);

  // Update topbar display
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
  }
}

function renderClickerView(clicks, tier) {
  document.getElementById('clickCount').textContent = clicks.toLocaleString();
  document.getElementById('tierLabel').textContent = tier.name;
  document.getElementById('cpsLabel').textContent = `자동 수확: +${state.cps.toLocaleString()} /초 | 클릭 파워: +${state.clickMultiplier}`;
  document.getElementById('guestBanner').hidden = !!state.currentUser;

  // Title tag badge
  const tObj = UNLOCKABLE_TITLES.find(t => t.id === state.equippedTitle);
  document.getElementById('currentTitleBadge').textContent = `👑 [${tObj ? tObj.name : tier.title}]`;

  // Seal visuals
  const sealBtn = document.getElementById('sealBtn');
  sealBtn.style.setProperty('--core1', tier.core1);
  sealBtn.style.setProperty('--core2', tier.core2);
  sealBtn.style.setProperty('--border-w', tier.borderW);
  sealBtn.style.setProperty('--border-c', tier.borderC);
  sealBtn.style.setProperty('--glow', tier.glow);

  const crown = document.getElementById('sealCrown');
  crown.classList.toggle('visible', tier.crown);

  const gems = document.getElementById('sealGems').children;
  for (let i = 0; i < gems.length; i++) {
    gems[i].classList.toggle('visible', i < tier.gems);
  }
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
      btn.onclick = () => buyArmy(btn.dataset.buyArmy);
    });
  }

  const relicListEl = document.getElementById('relicShopList');
  if (relicListEl) {
    relicListEl.innerHTML = MULTIPLIER_RELICS.map(r => {
      const owned = !!state.relics[r.id];
      const canAfford = clicks >= r.cost && !owned;
      return `
        <div class="item-card">
          <div class="item-icon">${r.icon}</div>
          <div class="item-info">
            <span class="item-name">${r.name} ${owned ? '🔒 [소지중]' : ''}</span>
            <span class="item-desc">${r.desc}</span>
          </div>
          <div class="item-action">
            <button class="buy-btn" data-buy-relic="${r.id}" ${owned || !canAfford ? 'disabled' : ''}>
              ${owned ? '소지함' : `구매 (${r.cost.toLocaleString()})`}
            </button>
          </div>
        </div>
      `;
    }).join('');

    relicListEl.querySelectorAll('[data-buy-relic]').forEach(btn => {
      btn.onclick = () => buyRelic(btn.dataset.buyRelic);
    });
  }
}

function renderTitlesView() {
  const container = document.getElementById('titlesContainer');
  if (!container) return;

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
    btn.onclick = () => equipTitle(btn.dataset.equipTitle);
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
    btn.onclick = () => claimMissionReward(btn.dataset.claimMission);
  });
}

export function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = false;
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}

export function showToast(msg) {
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

export function spawnParticle(x, y) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const p = document.createElement('span');
  p.className = 'particle';
  p.textContent = '✦';
  const dx = (Math.random() - 0.5) * 90;
  p.style.setProperty('--dx', dx + 'px');
  p.style.left = x + 'px';
  p.style.top = y + 'px';
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 850);
}
