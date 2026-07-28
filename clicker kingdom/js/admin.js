// ---------- Admin Dashboard Module ----------
import { ADMIN_PASSWORD, ARMY_ITEMS, UNLOCKABLE_TITLES } from './config.js';
import { getFeedbacks } from './storage.js';
import { state, addClicks, notifyStateChange } from './state.js';
import { showToast, closeModal } from './ui.js';
import { recalculateCPS, recalculateMultipliers } from './upgrades.js';

export function handleAdminLogin() {
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

export function giveAdminGold(amount) {
  addClicks(amount);
  showToast(`⚙️ [관리자] 치트 자금 +${amount.toLocaleString()} 클릭 지급 완료!`);
}

export function unlockAllForAdmin() {
  ARMY_ITEMS.forEach(item => {
    state.armies[item.id] = (state.armies[item.id] || 0) + 10;
  });
  UNLOCKABLE_TITLES.forEach(t => {
    if (!state.unlockedTitles.includes(t.id)) state.unlockedTitles.push(t.id);
  });
  recalculateCPS();
  recalculateMultipliers();
  notifyStateChange();
  showToast('⚙️ [관리자] 모든 군대 및 칭호 전체 해금 완료!');
}

export async function loadAdminFeedbacks() {
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

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
