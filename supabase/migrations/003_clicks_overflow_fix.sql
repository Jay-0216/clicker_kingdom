-- ============================================================================
-- Clicker Kingdom - 클릭 수 오버플로우 방지 패치
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 문제: clicks 컬럼이 int8/numeric 같은 숫자 타입이면 클리커 게임 특성상
-- 클릭 수가 쉽게 int8 최대치(약 9.2 x 10^18)를 넘어서거나, JS 쪽 JSON
-- 직렬화 과정에서 double 정밀도(약 9 x 10^15) 손실이 발생할 수 있음.
-- 클라이언트(js/app.js, js/game-config.js)는 이제 클릭 수와 아이템 가격을
-- 전부 BigInt 문자열로 다루므로, DB 컬럼도 text로 통일해서 자릿수 제한 없이
-- 안전하게 저장하도록 함.

-- accounts 테이블의 clicks 컬럼을 text로 변환
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'clicks' AND data_type <> 'text'
  ) THEN
    ALTER TABLE accounts ALTER COLUMN clicks TYPE text USING clicks::text;
  END IF;
END $$;

-- leaderboard 테이블의 clicks 컬럼도 동일하게 text로 변환
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leaderboard' AND column_name = 'clicks' AND data_type <> 'text'
  ) THEN
    ALTER TABLE leaderboard ALTER COLUMN clicks TYPE text USING clicks::text;
  END IF;
END $$;

-- 컬럼이 아예 없는 경우(신규 프로젝트)를 대비해 기본값도 함께 보장
ALTER TABLE accounts ALTER COLUMN clicks SET DEFAULT '0';
ALTER TABLE leaderboard ALTER COLUMN clicks SET DEFAULT '0';
