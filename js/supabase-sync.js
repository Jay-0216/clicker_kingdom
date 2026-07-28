// ============================================================================
// Clicker Kingdom - Supabase Cloud Synchronization Helper
// ============================================================================

const SUPABASE_URL = "https://ufisfakmsaiicetlzjal.supabase.co"; // Default fallback / placeholder URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmaXNmYWttc2FpaWNldGx6amFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNzQyMzEsImV4cCI6MjEwMDc1MDIzMX0.J9SYa4O5CxekBezv_HP4gGiF0OtjVj1WZjXlR8O2mbI"; // Default fallback key

let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  // Try retrieving custom user credentials from localStorage if configured
  const customUrl = localStorage.getItem('ck_supabase_url') || SUPABASE_URL;
  const customKey = localStorage.getItem('ck_supabase_key') || SUPABASE_ANON_KEY;

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(customUrl, customKey);
      return supabaseClient;
    } catch (e) {
      console.warn("Supabase client init failed:", e);
      return null;
    }
  }
  return null;
}

// Sync Account to Supabase Cloud
async function supabaseSyncAccount(account) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { data, error } = await client
      .from('accounts')
      .upsert({
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
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn("Supabase account sync error:", error);
      return false;
    }

    // Sync to Leaderboard table
    await client
      .from('leaderboard')
      .upsert({
        id: account.id,
        nickname: account.nickname,
        clicks: account.clicks || 0,
        battle_power: account.battlePower || 0,
        wins: (account.warRecords && account.warRecords.wins) || 0,
        title: account.equippedTitle || 'title_novice',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    return true;
  } catch (err) {
    console.warn("Supabase sync exception:", err);
    return false;
  }
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

    if (error || !data) return null;

    return data.map(item => ({
      id: item.id,
      nickname: item.nickname,
      clicks: item.clicks || 0,
      battlePower: item.battle_power || 0,
      wins: item.wins || 0,
      title: item.title || '성주'
    }));
  } catch (err) {
    console.warn("Supabase leaderboard fetch exception:", err);
    return null;
  }
}

// Fetch Cloud Account from Supabase
async function supabaseFetchAccount(id) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
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
      lastOfflineTime: data.last_offline_time || Date.now()
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
        created_at: new Date().toISOString()
      }, { onConflict: 'code' });

    if (error) {
      console.warn('supabaseCreateRoom error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('supabaseCreateRoom exception:', err);
    return false;
  }
}

// Fetch a Room from Supabase by room code
async function supabaseFetchRoom(code) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('rooms')
      .select('*')
      .eq('code', String(code))
      .single();

    if (error || !data) return null;

    // Expire rooms older than 1 hour
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
      hostCps: data.host_cps || 0
    };
  } catch (err) {
    console.warn('supabaseFetchRoom exception:', err);
    return null;
  }
}
