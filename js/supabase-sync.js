// ============================================================================
// Clicker Kingdom - Supabase Cloud Synchronization Helper
// ============================================================================
// SECURITY ARCHITECTURE (2026-07-29) — Full Supabase Auth + RLS:
//   ┌──────────────────────────────────────────────────────────────────┐
//   │ 인증: Supabase Auth (email/password)                            │
//   │   - Supabase JS 클라이언트가 세션을 localStorage에 자동 저장     │
//   │   - 페이지 로드 시 getSupabaseClient()가 세션 복원               │
//   │   - 모든 accounts CRUD는 auth.uid() 기반 RLS로 보호             │
//   ├──────────────────────────────────────────────────────────────────┤
//   │ 읽기: Supabase anon key + RLS                                    │
//   │   - accounts: auth.uid() == user_id 인 경우만 접근 가능          │
//   │   - leaderboard: public SELECT (anon)                           │
//   │   - rooms: public ALL (친구 대전)                                │
//   ├──────────────────────────────────────────────────────────────────┤
//   │ 쓰기:                                                           │
//   │   - accounts: client.auth JWT로 upsert (RLS가 user_id 검증)      │
//   │   - leaderboard: Edge Function이 service_role로 upsert           │
//   │   - rooms: anon key로 직접 쓰기                                  │
//   ├──────────────────────────────────────────────────────────────────┤
//   │ Edge Function: JWT 검증 → user_id 검증 → BigInt 범위 체크 →      │
//   │                  service_role로 leaderboard upsert               │
//   └──────────────────────────────────────────────────────────────────┘
// REQUIRED SQL: supabase/migrations/001_full_auth.sql 참고
// EDGE FUNCTION DEPLOY: supabase functions deploy upsert-leaderboard
// ============================================================================

const SUPABASE_URL = "https://ufisfakmsaiicetlzjal.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmaXNmYWttc2FpaWNldGx6amFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNzQyMzEsImV4cCI6MjEwMDc1MDIzMX0.J9SYa4O5CxekBezv_HP4gGiF0OtjVj1WZjXlR8O2mbI";
const EDGE_FUNCTION_URL = SUPABASE_URL + "/functions/v1/upsert-leaderboard";

let supabaseClient = null;
const cloudSyncState = {
  tone: 'idle',
  summary: '클라우드 연결 대기 중',
  detail: '아직 Supabase 연결 상태를 확인하지 않았어요.',
  lastSyncAt: 0,
  lastErrorAt: 0,
  lastErrorRetryable: true,
  diagnostics: null
};

function isRetryableError(error) {
  if (!error) return false;
  const code = error.code ? String(error.code) : '';
  const status = error.status || 0;
  const msg = (error.message || '').toLowerCase();
  // Edge Function specific: AUTH_UNAVAILABLE is not retryable
  if (code === 'NO_SESSION') return false;
  if (code === 'EDGE_ERROR') return false;
  // 4xx: permanent (bad request, auth, not found, RLS)
  if (/^(4(?!29)\d{2})$/.test(code) || (status >= 400 && status < 500 && status !== 429)) return false;
  if (code === '42501') return false; // RLS policy
  if (msg.includes('rls') || msg.includes('policy')) return false;
  if (msg.includes('schema') || msg.includes('relation') || msg.includes('does not exist')) return false;
  return true; // network errors, 5xx, 429 rate limit → retryable
}

function emitCloudSyncState() {
  window.dispatchEvent(new CustomEvent('ck-cloud-status', {
    detail: getCloudSyncState()
  }));
}

function getCloudSyncState() {
  return JSON.parse(JSON.stringify(cloudSyncState));
}

function updateCloudSyncState(patch) {
  Object.assign(cloudSyncState, patch);
  emitCloudSyncState();
}

function formatCloudError(scope, error) {
  const code = error && error.code ? String(error.code) : '';
  const message = error && error.message ? String(error.message) : '알 수 없는 오류';

  if (scope === 'leaderboard' && (code === 'EDGE_ERROR' || code === 'NO_SESSION')) {
    return {
      tone: 'warning',
      summary: '랭킹 동기화에 실패했어.',
      detail: `서버 검증 레이어(${code}): ${message}`
    };
  }

  if (scope === 'rooms' && code === '42501') {
    return {
      tone: 'warning',
      summary: '친구 대전 룸 코드를 클라우드에 저장하지 못했어 (RLS 차단).',
      detail: 'Supabase 콘솔에서 rooms 테이블 anon INSERT를 허용해야 해.'
    };
  }

  if (scope === 'accounts' && code === '42501') {
    return {
      tone: 'warning',
      summary: '계정 저장 권한이 막혀 있어.',
      detail: '이건 정상이야 — accounts 테이블은 anon 쓰기가 차단되어 있어.'
    };
  }

  return {
    tone: 'error',
    summary: `${scope} 동기화 중 문제가 생겼어.`,
    detail: `${code ? `[${code}] ` : ''}${message}`
  };
}

async function runReadDiagnostic(client, table, column) {
  try {
    const { error } = await client
      .from(table)
      .select(column)
      .limit(1);

    return error ? { ok: false, code: error.code || '', message: error.message || 'read failed' } : { ok: true };
  } catch (err) {
    return { ok: false, code: '', message: err.message || 'read failed' };
  }
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (window.location.protocol === 'file:') {
    updateCloudSyncState({
      tone: 'error',
      summary: '파일 프로토콜에서는 클라우드를 사용할 수 없어요.',
      detail: '파일을 직접 열면 보안 정책(CORS) 때문에 Supabase 연결이 차단돼요. 로컬 서버(http://localhost)를 사용해 주세요.',
      lastErrorAt: Date.now()
    });
    return null;
  }

  // Try retrieving custom user credentials from localStorage if configured
  const customUrl = localStorage.getItem('ck_supabase_url') || SUPABASE_URL;
  const customKey = localStorage.getItem('ck_supabase_key') || SUPABASE_ANON_KEY;

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(customUrl, customKey);
      return supabaseClient;
    } catch (e) {
      console.warn("Supabase client init failed:", e);
      updateCloudSyncState({
        tone: 'error',
        summary: 'Supabase 클라이언트를 만들지 못했어.',
        detail: e.message || 'createClient 실패',
        lastErrorAt: Date.now()
      });
      return null;
    }
  }
  updateCloudSyncState({
    tone: 'error',
    summary: 'Supabase 스크립트를 불러오지 못했어.',
    detail: 'CDN 스크립트 로딩 또는 네트워크를 확인해 줘.',
    lastErrorAt: Date.now()
  });
  return null;
}

async function supabaseSignUp(email, password, nickname) {
  const client = getSupabaseClient();
  if (!client) return { error: { message: 'Supabase client not available' } };
  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { nickname } }
    });
    if (error) return { error };
    return { data, session: data.session };
  } catch (err) {
    return { error: { message: err.message } };
  }
}

async function supabaseSignIn(email, password) {
  const client = getSupabaseClient();
  if (!client) return { error: { message: 'Supabase client not available' } };
  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { error };
    return { data, session: data.session };
  } catch (err) {
    return { error: { message: err.message } };
  }
}

async function supabaseSignOut() {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.auth.signOut();
  } catch (_) {}
}

async function supabaseGetCurrentUserId() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

async function supabaseGetAccessToken() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session?.access_token) return null;
    return data.session.access_token;
  } catch {
    return null;
  }
}

async function supabaseCallEdgeFunction(payload) {
  const token = await supabaseGetAccessToken();
  if (!token) {
    return { ok: false, error: { message: 'Not signed in', code: 'NO_SESSION' } };
  }

  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok) {
      return { ok: false, error: { message: result.error || 'Edge Function error', code: 'EDGE_ERROR', status: res.status } };
    }
    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: { message: err.message || 'Network error', code: 'NETWORK_ERROR' } };
  }
}

async function supabaseInit() {
  getSupabaseClient();
  supabaseRunDiagnostics();
}

async function supabaseRunDiagnostics() {
  const client = getSupabaseClient();
  if (!client) return getCloudSyncState();

  const [accounts, leaderboard, rooms] = await Promise.all([
    runReadDiagnostic(client, 'accounts', 'id'),
    runReadDiagnostic(client, 'leaderboard', 'id'),
    runReadDiagnostic(client, 'rooms', 'code')
  ]);

  const diagnostics = {
    checkedAt: Date.now(),
    accounts,
    leaderboard,
    rooms
  };

  const failed = Object.entries(diagnostics)
    .filter(([key, value]) => key !== 'checkedAt' && value && !value.ok)
    .map(([key, value]) => `${key}: ${value.code ? `[${value.code}] ` : ''}${value.message}`);

  cloudSyncState.diagnostics = diagnostics;

  if (cloudSyncState.tone === 'idle') {
    updateCloudSyncState({
      tone: failed.length ? 'warning' : 'success',
      summary: failed.length ? '클라우드 읽기 진단에서 막힌 항목이 있어.' : '클라우드 연결 확인이 끝났어.',
      detail: failed.length
        ? failed.join(' | ')
        : 'accounts, leaderboard, rooms 읽기 요청은 통과했어.'
    });
  } else {
    emitCloudSyncState();
  }

  return getCloudSyncState();
}

// Save Account to Supabase (authenticated — RLS verifies user_id = auth.uid())
async function supabaseSaveAccount(account) {
  const client = getSupabaseClient();
  if (!client) return false;

  const userId = await supabaseGetCurrentUserId();
  if (!userId) {
    updateCloudSyncState({
      tone: 'error',
      summary: '로그인이 필요해.',
      detail: 'Supabase에 저장하려면 먼저 로그인해 줘.',
      lastErrorAt: Date.now()
    });
    return false;
  }

  updateCloudSyncState({
    tone: 'syncing',
    summary: '클라우드에 저장 중이야...',
    detail: `${account.nickname || ''} 계정을 Supabase에 저장하는 중이야.`
  });

  try {
    const { error } = await client
      .from('accounts')
      .upsert({
        user_id: userId,
        nickname: account.nickname || '',
        clicks: account.clicks || "0",
        armies: account.armies || {},
        relics: account.relics || {},
        effects: account.effects || [],
        equipped_effect: account.equippedEffect || null,
        offline_armies: account.offlineArmies || {},
        equipped_title: account.equippedTitle || 'title_novice',
        unlocked_titles: account.unlockedTitles || ['title_novice'],
        war_records: account.warRecords || {},
        mission_progress: account.missionProgress || {},
        background_url: account.backgroundUrl || '',
        battle_power: account.battlePower || 0,
        wins: (account.warRecords && account.warRecords.wins) || 0,
        last_offline_time: account.lastOfflineTime || Date.now(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn("Supabase account save error:", error);
      updateCloudSyncState({
        tone: 'error',
        summary: '클라우드 저장 실패.',
        detail: error.message,
        lastErrorAt: Date.now()
      });
      return false;
    }

    // Sync to Leaderboard via Edge Function
    const edgeResult = await supabaseCallEdgeFunction({
      id: userId,
      nickname: account.nickname || '',
      clicks: String(account.clicks || "0"),
      battle_power: account.battlePower || 0,
      wins: (account.warRecords && account.warRecords.wins) || 0,
      title: account.equippedTitle || 'title_novice',
      last_online: new Date().toISOString()
    });

    if (!edgeResult.ok) {
      console.warn("Leaderboard sync error:", edgeResult.error);
      updateCloudSyncState({
        tone: 'warning',
        summary: '계정은 저장됐지만 랭킹 동기화는 실패했어.',
        detail: edgeResult.error.message || 'Edge Function 오류',
        lastErrorAt: Date.now(),
        lastSyncAt: Date.now()
      });
      return true;
    }

    updateCloudSyncState({
      tone: 'success',
      summary: '클라우드 저장 완료!',
      detail: `${account.nickname || ''} 계정과 랭킹 데이터를 저장했어.`,
      lastSyncAt: Date.now()
    });

    return true;
  } catch (err) {
    console.warn("Supabase save exception:", err);
    updateCloudSyncState({
      tone: 'error',
      summary: '클라우드 저장 중 오류.',
      detail: err.message,
      lastErrorAt: Date.now(),
      lastErrorRetryable: true
    });
    return false;
  }
}

// Load Account from Supabase (authenticated — RLS verifies user_id = auth.uid())
async function supabaseLoadAccount() {
  const client = getSupabaseClient();
  if (!client) return null;

  const userId = await supabaseGetCurrentUserId();
  if (!userId) return null;

  try {
    const { data, error } = await client
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      if (error && error.code !== 'PGRST116') {
        console.warn("Supabase load error:", error);
      }
      return null;
    }

    return {
      user_id: data.user_id,
      nickname: data.nickname,
      avatar: data.avatar || '👑',
      clicks: String(data.clicks || 0),
      armies: data.armies || {},
      relics: data.relics || {},
      effects: data.effects || [],
      equippedEffect: data.equipped_effect || null,
      offlineArmies: data.offline_armies || {},
      equippedTitle: data.equipped_title || 'title_novice',
      unlockedTitles: data.unlocked_titles || ['title_novice'],
      warRecords: data.war_records || {},
      missionProgress: data.mission_progress || {},
      battlePower: data.battle_power || 0,
      backgroundUrl: data.background_url || '',
      wins: data.wins || 0,
      lastOfflineTime: data.last_offline_time || Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now()
    };
  } catch (err) {
    console.warn("Supabase load exception:", err);
    return null;
  }
}

// DEPRECATED: replaced by supabaseSaveAccount / supabaseLoadAccount
async function supabaseSyncAccount(account) {
  return await supabaseSaveAccount(account);
}

// Fetch Cloud Leaderboard from Supabase
async function supabaseFetchLeaderboard() {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('leaderboard')
      .select('*')
      .order('clicks', { ascending: false })
      .limit(50);

    if (error || !data) {
      if (error) {
        const formatted = formatCloudError('leaderboard', error);
        updateCloudSyncState({
          tone: formatted.tone,
          summary: formatted.summary,
          detail: formatted.detail,
          lastErrorAt: Date.now()
        });
      }
      return null;
    }

    return data.map(item => ({
      id: item.id,
      nickname: item.nickname,
      clicks: item.clicks || 0,
      battlePower: item.battle_power || 0,
      wins: item.wins || 0,
      title: item.title || '성주',
      lastOnline: item.last_online || null
    }));
  } catch (err) {
    console.warn("Supabase leaderboard fetch exception:", err);
    return null;
  }
}

// Fetch Cloud Account from Supabase by user_id (UUID)
async function supabaseFetchAccount(userId) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      if (error && error.code !== 'PGRST116') {
        console.warn("Supabase fetch account error:", error.message);
      }
      return null;
    }

    return {
      user_id: data.user_id,
      nickname: data.nickname,
      avatar: data.avatar || '👑',
      clicks: String(data.clicks || 0),
      armies: data.armies || {},
      relics: data.relics || {},
      effects: data.effects || [],
      equippedEffect: data.equipped_effect || null,
      offlineArmies: data.offline_armies || {},
      equippedTitle: data.equipped_title || 'title_novice',
      unlockedTitles: data.unlocked_titles || ['title_novice'],
      warRecords: data.war_records || {},
      missionProgress: data.mission_progress || {},
      battlePower: data.battle_power || 0,
      backgroundUrl: data.background_url || '',
      wins: data.wins || 0,
      lastOfflineTime: data.last_offline_time || Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now()
    };
  } catch (err) {
    console.warn("Supabase fetch account exception:", err);
    return null;
  }
}

// Create / Update a Room in Supabase for friend battles
async function supabaseCreateRoom(code, hostData) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('rooms')
      .upsert({
        code: String(code),
        host_id: hostData.id,
        host_nickname: hostData.nickname,
        host_power: hostData.power || 0,
        host_cps: hostData.cps || 0,
        status: 'waiting',
        guest_id: null,
        guest_nickname: null,
        host_taps: 0,
        guest_taps: 0,
        created_at: new Date().toISOString()
      }, { onConflict: 'code' });

    if (error) {
      console.warn('supabaseCreateRoom error:', error);
      const formatted = formatCloudError('rooms', error);
      updateCloudSyncState({
        tone: formatted.tone,
        summary: formatted.summary,
        detail: formatted.detail,
        lastErrorAt: Date.now()
      });
      return false;
    }
    updateCloudSyncState({
      tone: 'success',
      summary: '친구 대전 룸 코드를 클라우드에 저장했어.',
      detail: `${code} 룸 코드를 Supabase rooms 테이블에 올렸어.`,
      lastSyncAt: Date.now()
    });
    return true;
  } catch (err) {
    console.warn('supabaseCreateRoom exception:', err);
    const formatted = formatCloudError('rooms', err);
    updateCloudSyncState({
      tone: formatted.tone,
      summary: formatted.summary,
      detail: formatted.detail,
      lastErrorAt: Date.now()
    });
    return false;
  }
}

// Join room as guest
async function supabaseJoinRoom(code, guestData) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const matchedAt = new Date().toISOString();
    const { error } = await client
      .from('rooms')
      .update({
        guest_id: guestData.id,
        guest_nickname: guestData.nickname,
        status: 'matched',
        matched_at: matchedAt
      })
      .eq('code', String(code));

    if (error) {
      console.warn('supabaseJoinRoom error:', error);
      return false;
    }
    return matchedAt;
  } catch (err) {
    console.warn('supabaseJoinRoom exception:', err);
    return false;
  }
}

// Fetch / Poll room state
async function supabaseFetchRoom(code) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('rooms')
      .select('*')
      .eq('code', String(code))
      .single();

    if (error || !data) {
      return null;
    }

    const age = Date.now() - new Date(data.created_at).getTime();
    if (age > 3600000) {
      await client.from('rooms').delete().eq('code', String(code));
      return null;
    }

    return {
      code: data.code,
      hostId: data.host_id,
      hostNickname: data.host_nickname,
      hostPower: data.host_power || 0,
      hostCps: data.host_cps || 0,
      status: data.status || 'waiting',
      guestId: data.guest_id,
      guestNickname: data.guest_nickname,
      hostTaps: data.host_taps || 0,
      guestTaps: data.guest_taps || 0,
      matchedAt: data.matched_at ? new Date(data.matched_at).getTime() : null
    };
  } catch (err) {
    console.warn('supabaseFetchRoom exception:', err);
    return null;
  }
}

// Update battle tap count in real time
async function supabaseSubmitBattleTaps(code, role, tapCount) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = role === 'host' ? { host_taps: tapCount } : { guest_taps: tapCount };
    await client.from('rooms').update(payload).eq('code', String(code));
    return true;
  } catch (err) {
    return false;
  }
}
