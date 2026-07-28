// ---------- Feedback & Idea Submission Module ----------
import { saveFeedback } from './storage.js';
import { state, addClicks, notifyStateChange } from './state.js';
import { showToast, closeModal } from './ui.js';

export async function submitFeedback() {
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

  // Give reward
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
