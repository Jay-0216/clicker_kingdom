// js/app.js 수정본 (renderTitlesView 구문 오류 해결)
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
