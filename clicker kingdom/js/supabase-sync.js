// ============================================================================
// Supabase Cloud Sync Module
// 랭킹, 배틀룸, 게임 데이터 동기화 + 5분마다 keepalive
// ============================================================================

const CloudSync = (() => {

  
  const SUPABASE_URL = 'https://ufisfakmsaiicetlzjal.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmaXNmYWttc2FpaWNldGx6amFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNzQyMzEsImV4cCI6MjEwMDc1MDIzMX0.J9SYa4O5CxekBezv_HP4gGiF0OtjVj1WZjXlR8O2mbI';

  const SYNC_INTERVAL_MS = 5 * 60 * 1000;

  let supabase = null;
  let syncTimer = null;
  let isConfigured = false;

  function init() {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
      console.log('[CloudSync] Supabase 미설정 - placeholder 모드');
      isConfigured = false;
      return;
    }
    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      isConfigured = true;
      console.log('[CloudSync] Supabase 연결 성공');
      startKeepAlive();
    } catch (e) {
      console.error('[CloudSync] 초기화 실패:', e);
      isConfigured = false;
    }
  }

  // ==================== Keep-Alive ====================

  function startKeepAlive() {
    if (!isConfigured) return;
    keepAlive();
    syncTimer = setInterval(keepAlive, SYNC_INTERVAL_MS);
  }

  function stopKeepAlive() {
    if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
  }

  async function keepAlive() {
    if (!isConfigured || !supabase) return;
    try {
      await supabase.from('keepalive').upsert({
        id: 'server-ping',
        last_ping: new Date().toISOString(),
        status: 'alive'
      }, { onConflict: 'id' });
      console.log('[CloudSync] Keepalive 전송');
    } catch (e) {
      console.warn('[CloudSync] Keepalive 오류:', e);
    }
  }

  // ==================== Game State ====================

  async function saveToCloud(userId, state) {
    if (!isConfigured || !supabase || !userId) return false;
    try {
      const { error } = await supabase.from('game_states').upsert({
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
      }, { onConflict: 'user_id' });
      if (error) { console.warn('[CloudSync] 저장 실패:', error.message); return false; }
      return true;
    } catch (e) { console.warn('[CloudSync] 저장 오류:', e); return false; }
  }

  async function loadFromCloud(userId) {
    if (!isConfigured || !supabase || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('game_states').select('game_data')
        .eq('user_id', userId).single();
      if (error || !data) return null;
      return data.game_data;
    } catch (e) { return null; }
  }

  let saveDebounceTimer = null;
  function debouncedSave(userId, state) {
    if (!isConfigured || !userId) return;
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => saveToCloud(userId, state), 3000);
  }

  // ==================== Leaderboard ====================

  async function getLeaderboard() {
    if (!isConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*');
      if (error) { console.warn('[CloudSync] 랭킹 로드 실패:', error.message); return null; }
      return data || [];
    } catch (e) { return null; }
  }

  async function setLeaderboardEntry(entry) {
    if (!isConfigured || !supabase) return false;
    try {
      const { error } = await supabase
        .from('leaderboard')
        .upsert(entry, { onConflict: 'id' });
      if (error) { console.warn('[CloudSync] 랭킹 저장 실패:', error.message); return false; }
      return true;
    } catch (e) { return false; }
  }

  async function removeLeaderboardEntry(userId) {
    if (!isConfigured || !supabase) return false;
    try {
      await supabase.from('leaderboard').delete().eq('id', userId);
      return true;
    } catch (e) { return false; }
  }

  // ==================== Battle Rooms ====================

  async function createBattleRoom(roomCode, hostData) {
    if (!isConfigured || !supabase) return null;
    try {
      const room = {
        code: roomCode,
        host_id: hostData.id,
        host_nickname: hostData.nickname,
        host_power: hostData.power,
        status: 'waiting',
        host_clicks: 0,
        guest_id: null,
        guest_nickname: null,
        guest_power: null,
        guest_clicks: 0,
        result: null,
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('battle_rooms')
        .upsert(room, { onConflict: 'code' })
        .select()
        .single();
      if (error) { console.warn('[CloudSync] 룸 생성 실패:', error.message); return null; }
      console.log('[CloudSync] 배틀룸 생성:', roomCode);
      return data;
    } catch (e) { return null; }
  }

  async function getBattleRoom(roomCode) {
    if (!isConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('battle_rooms')
        .select('*')
        .eq('code', roomCode)
        .single();
      if (error) return null;
      return data;
    } catch (e) { return null; }
  }

  async function joinBattleRoom(roomCode, guestData) {
    if (!isConfigured || !supabase) return null;
    try {
      const { data: room, error: fetchErr } = await supabase
        .from('battle_rooms')
        .select('*')
        .eq('code', roomCode)
        .eq('status', 'waiting')
        .single();
      if (fetchErr || !room) return null;

      const { error } = await supabase
        .from('battle_rooms')
        .update({
          guest_id: guestData.id,
          guest_nickname: guestData.nickname,
          guest_power: guestData.power,
          status: 'ready'
        })
        .eq('code', roomCode);
      if (error) { console.warn('[CloudSync] 룸 참가 실패:', error.message); return null; }
      console.log('[CloudSync] 배틀룸 참가:', roomCode);
      return { ...room, guest_id: guestData.id, guest_nickname: guestData.nickname, guest_power: guestData.power, status: 'ready' };
    } catch (e) { return null; }
  }

  async function updateBattleClicks(roomCode, side, clicks) {
    if (!isConfigured || !supabase) return;
    try {
      const field = side === 'host' ? 'host_clicks' : 'guest_clicks';
      await supabase.from('battle_rooms').update({ [field]: clicks }).eq('code', roomCode);
    } catch (e) { console.warn('[CloudSync] 배틀 클릭 업데이트 오류:', e); }
  }

  async function setBattleResult(roomCode, result) {
    if (!isConfigured || !supabase) return;
    try {
      await supabase.from('battle_rooms').update({
        status: 'finished',
        result: result
      }).eq('code', roomCode);
    } catch (e) { console.warn('[CloudSync] 배틀 결과 저장 오류:', e); }
  }

  async function cleanupBattleRoom(roomCode) {
    if (!isConfigured || !supabase) return;
    try {
      await supabase.from('battle_rooms').delete().eq('code', roomCode);
    } catch (e) {}
  }

  // ==================== Status ====================

  function getStatus() {
    return { configured: isConfigured, url: isConfigured ? SUPABASE_URL : null, syncActive: !!syncTimer };
  }

  // ==================== Account Auth ====================

  async function saveAccountToCloud(account) {
    if (!isConfigured || !supabase) {
      console.warn('[CloudSync] Supabase 미설정 - 계정 동기화 건너뜀');
      return false;
    }
    try {
      const payload = {
        id: account.id,
        nickname: account.nickname,
***REMOVED***
        clicks: account.clicks || 0,
        armies: account.armies || {},
        relics: account.relics || {},
        effects: account.effects || [],
        equipped_effect: account.equippedEffect || null,
        offline_armies: account.offlineArmies || {},
        equipped_title: account.equippedTitle || 'title_novice',
        unlocked_titles: account.unlockedTitles || ['title_novice'],
        war_records: account.warRecords || {},
        mission_progress: account.missionProgress || {},
        last_offline_time: account.lastOfflineTime || Date.now(),
        created_at: account.createdAt || Date.now(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('accounts')
        .upsert(payload, { onConflict: 'id' })
        .select();
      if (error) {
        console.error('[CloudSync] 계정 저장 실패:', error.message, error.details, error.hint);
        return false;
      }
      console.log('[CloudSync] 계정 저장 성공:', account.id);
      return true;
    } catch (e) {
      console.error('[CloudSync] 계정 저장 오류:', e.message || e);
      return false;
    }
  }

  async function getAccountFromCloud(id) {
    if (!isConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return null;
      return {
        id: data.id,
        nickname: data.nickname,
  ***REMOVED***
        clicks: data.clicks || 0,
        armies: data.armies || {},
        relics: data.relics || {},
        effects: data.effects || [],
        equippedEffect: data.equipped_effect || null,
        offlineArmies: data.offline_armies || {},
        equippedTitle: data.equipped_title || 'title_novice',
        unlockedTitles: data.unlocked_titles || ['title_novice'],
        warRecords: data.war_records || {},
        missionProgress: data.mission_progress || {},
        lastOfflineTime: data.last_offline_time || null,
        createdAt: data.created_at || null
      };
    } catch (e) { return null; }
  }

  async function testConnection() {
    console.log('[CloudSync] === 연결 테스트 ===');
    console.log('설정 상태:', isConfigured);
    if (!isConfigured) { console.log('⚠️ SUPABASE_URL / ANON_KEY가 placeholder 상태입니다.'); return; }
    try {
      const { data, error } = await supabase.from('accounts').select('id').limit(1);
      if (error) {
        console.error('❌ accounts 테이블 조회 실패:', error.message, error.details);
      } else {
        console.log('✅ accounts 테이블 연결 성공! 현재 레코드 수:', data.length);
      }
    } catch (e) {
      console.error('❌ 연결 테스트 오류:', e.message);
    }
  }

  async function migrateAccounts(accountsArray) {
    if (!isConfigured || !supabase) return { ok: 0, fail: 0, errors: [] };
    let ok = 0, fail = 0, errors = [];
    for (const acc of accountsArray) {
      try {
        const result = await saveAccountToCloud(acc);
        if (result) ok++; else { fail++; errors.push(acc.id + ': 저장 실패'); }
      } catch (e) { fail++; errors.push(acc.id + ': ' + (e.message || e)); }
    }
    return { ok, fail, errors };
  }

  return {
    init, keepAlive, saveToCloud, loadFromCloud, debouncedSave,
    stopKeepAlive, getStatus,
    getLeaderboard, setLeaderboardEntry, removeLeaderboardEntry,
    createBattleRoom, getBattleRoom, joinBattleRoom,
    updateBattleClicks, setBattleResult, cleanupBattleRoom,
    saveAccountToCloud, getAccountFromCloud,
    testConnection, migrateAccounts
  };

})();

window.CloudSync = CloudSync;
