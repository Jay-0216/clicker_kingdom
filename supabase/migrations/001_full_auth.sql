-- ============================================================================
-- Clicker Kingdom - Full Supabase Auth + RLS Migration
-- Run this in your Supabase SQL Editor (순서대로 실행)
-- ============================================================================

-- 1. accounts 테이블에 user_id 컬럼 추가 (Supabase Auth와 연결)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- 2. 기존 계정은 user_id가 NULL → 나중에 마이그레이션 필요
--    (앱에서 Supabase Auth 로그인 후 UPDATE로 user_id 채움)

-- 3. RLS: 기존 정책 제거 후 재생성
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_read_only ON accounts;
DROP POLICY IF EXISTS anon_read_write ON accounts;

-- 인증된 유저만 자신의 계정 읽기/쓰기 가능
CREATE POLICY "user_own_account" ON accounts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 새 가입 시 INSERT 허용 (auth.uid()가 아직 세팅 안 된 경우 대비)
CREATE POLICY "user_insert_own" ON accounts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 4. leaderboard: anon SELECT 유지, 쓰기는 Edge Function 전용
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_read_write ON leaderboard;
DROP POLICY IF EXISTS anon_read_only ON leaderboard;

CREATE POLICY "leaderboard_public_read" ON leaderboard
  FOR SELECT
  TO anon
  USING (true);

-- Edge Function이 service_role로 쓰므로 anon INSERT/UPDATE는 없음

-- 5. rooms: 친구 대전용 (모든 anon 허용, 유지)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_read_write ON rooms;

CREATE POLICY "rooms_all_anon" ON rooms
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 6. (선택) leaderboard에 updated_at 컬럼
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 7. (선택) accounts에 created_at / updated_at
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
