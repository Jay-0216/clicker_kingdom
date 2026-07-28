// ---------- Missions Module ----------
import { DAILY_MISSIONS } from './config.js';
import { state, addClicks, notifyStateChange } from './state.js';
import { showToast } from './ui.js';

export function claimMissionReward(missionId) {
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
