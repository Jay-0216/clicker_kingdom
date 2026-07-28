// ============================================================================
// Supabase Cloud Sync & Keep-Alive Module
// 5분마다 자동으로 Supabase에 연결을 유지하고 게임 데이터를 동기화합니다.
// ============================================================================

const CloudSync = (() => {

  // ==========================================
  // ⚠️ 여기에 Supabase 프로젝트 정보를 입력하세요
  // ==========================================
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';       // 예: https://xxxxx.supabase.co
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // 예: eyJhbGciOi...

  const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5분
  const KEEPALIVE_TABLE = 'keepalive';
  const STATES_TABLE = 'game_states';

  let supabase = null;
  let syncTimer = null;
  let isConfigured = false;

  // --- 초기화 ---
  function init() {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
      console.log('[CloudSync] Supabase가 설정되지 않았습니다. placeholder 모드로 동작합니다.');
      isConfigured = false;
      return;
    }

    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      isConfigured = true;
      console.log('[CloudSync] Supabase 연결 성공');
      startKeepAlive();
    } catch (e) {
      console.error('[CloudSync] Supabase 초기화 실패:', e);
      isConfigured = false;
    }
  }

  // --- Keep-Alive: 5분마다 Supabase에 ping ---
  function startKeepAlive() {
    if (!isConfigured) return;
    keepAlive();
    syncTimer = setInterval(keepAlive, SYNC_INTERVAL_MS);
  }

  function stopKeepAlive() {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  }

  async function keepAlive() {
    if (!isConfigured || !supabase) return;
    try {
      const { error } = await supabase
        .from(KEEPALIVE_TABLE)
        .upsert({
          id: 'server-ping',
          last_ping: new Date().toISOString(),
          status: 'alive'
        }, { onConflict: 'id' });

      if (error) {
        console.warn('[CloudSync] Keepalive 실패:', error.message);
      } else {
        console.log('[CloudSync] Keepalive 전송 완료');
      }
    } catch (e) {
      console.warn('[CloudSync] Keepalive 오류:', e);
    }
  }

  // --- 게임 데이터 클라우드 저장 ---
  async function saveToCloud(userId, state) {
    if (!isConfigured || !supabase || !userId) return false;
    try {
      const payload = {
        user_id: userId,
        game_data: {
          clicks: state.currentUser ? state.currentUser.clicks : state.localClicks,
          armies: state.armies,
          relics: state.relics,
          effects: state.effects,
          equippedEffect: state.equippedEffect,
          offlineArmies: state.offlineArmies,
          equippedTitle: state.equippedTitle,
          unlockedTitles: state.unlockedTitles,
          warRecords: state.warRecords,
          missionProgress: state.missionProgress,
          lastOfflineTime: Date.now()
        },
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from(STATES_TABLE)
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        console.warn('[CloudSync] 데이터 저장 실패:', error.message);
        return false;
      }
      console.log('[CloudSync] 데이터 저장 완료');
      return true;
    } catch (e) {
      console.warn('[CloudSync] 저장 오류:', e);
      return false;
    }
  }

  // --- 게임 데이터 클라우드 로드 ---
  async function loadFromCloud(userId) {
    if (!isConfigured || !supabase || !userId) return null;
    try {
      const { data, error } = await supabase
        .from(STATES_TABLE)
        .select('game_data')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.log('[CloudSync] 클라우드에 저장된 데이터 없음');
        return null;
      }
      console.log('[CloudSync] 클라우드 데이터 로드 완료');
      return data.game_data;
    } catch (e) {
      console.warn('[CloudSync] 로드 오류:', e);
      return null;
    }
  }

  // --- 상태 변경 시 자동 동기화 (디바운스) ---
  let saveDebounceTimer = null;

  function debouncedSave(userId, state) {
    if (!isConfigured || !userId) return;
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      saveToCloud(userId, state);
    }, 3000);
  }

  // --- 현재 상태 확인 ---
  function getStatus() {
    return {
      configured: isConfigured,
      url: isConfigured ? SUPABASE_URL : null,
      syncActive: !!syncTimer
    };
  }

  return {
    init,
    keepAlive,
    saveToCloud,
    loadFromCloud,
    debouncedSave,
    stopKeepAlive,
    getStatus
  };

})();

// 전역으로 노출
window.CloudSync = CloudSync;
