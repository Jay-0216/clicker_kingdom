// ---------- Ranking & Leaderboards Module ----------
import { getLeaderboard } from './storage.js';
import { state } from './state.js';
import { UNLOCKABLE_TITLES, KINGDOM_TIERS } from './config.js';
import { calcBattlePower } from './empire.js';

let currentRankTab = 'clicks';

export function setRankTab(tab) {
  currentRankTab = tab;
  renderRankingView();
}

function crownGlyph(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return String(rank);
}

export async function renderRankingView() {
  const listEl = document.getElementById('rankingList');
  if (!listEl) return;

  listEl.innerHTML = '<div class="ranking-empty">불러오는 중...</div>';
  const leaderboard = await getLeaderboard();

  // If logged in, update my entry in leaderboard snapshot
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

  // Sort based on active tab
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

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
