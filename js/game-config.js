// ============================================================================
// Clicker Kingdom — Game Configuration File
// 이 파일에서 제국 단계, 아이템, 보구, 이펙트, 칭호, 미션 등
// 모든 게임 수치를 한 곳에서 관리합니다.
// ============================================================================

// ---------- Admin ----------
***REMOVED***

// ---------- 숫자 단축 표기 ----------
// K(1e3) → M → B → T → aa(1e15) → ht(1e18, 핵타) → ac … → ∞(1e60+)
function buildNumberUnits() {
  const units = [{ value: 1e60, suffix: '∞' }];

  for (let exp = 57; exp >= 21; exp -= 3) {
    const idx = (exp - 15) / 3;
    const c1 = String.fromCharCode(97 + Math.floor(idx / 26));
    const c2 = String.fromCharCode(97 + (idx % 26));
    units.push({ value: 10 ** exp, suffix: c1 + c2 });
  }

  units.push(
    { value: 1e18, suffix: 'ht' },  // 핵타 (heokta)
    { value: 1e15, suffix: 'aa' },
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' }
  );

  return units;
}

const SORTED_UNITS = buildNumberUnits();

/**
 * 숫자를 단축 표기로 변환합니다.
 * 예: 1234567 → "1.23M", 1e19 → "10ht"
 * @param {number|string} n
 * @param {number} [decimals=2] 소수점 자릿수
 * @returns {string}
 */
function formatNumber(n, decimals = 2) {
  if (typeof n === 'string') {
    if (n === 'Infinity' || n === '∞') return '∞';
    if (/^-?\d+$/.test(n)) {
      const len = n.startsWith('-') ? n.length - 1 : n.length;
      if (len <= 15) return formatNumber(Number(n), decimals);
      if (n.startsWith('-')) return '-' + formatNumber(n.slice(1), decimals);
      if (len > 60) return '∞';
      const exp = len - 1;
      for (const { value, suffix } of SORTED_UNITS) {
        const unitExp = Math.round(Math.log10(value));
        if (exp >= unitExp) {
          if (suffix === '∞') return '∞';
          const whole = n.slice(0, len - unitExp);
          const frac = n.slice(len - unitExp, len - unitExp + decimals);
          const formatted = frac ? whole + '.' + frac : whole;
          return `${formatted}${suffix}`;
        }
      }
      return n;
    }
    return n;
  }
  if (!isFinite(n) || isNaN(n)) return '∞';
  if (n < 0) return '-' + formatNumber(-n, decimals);
  if (n >= 1e60) return '∞';

  for (const { value, suffix } of SORTED_UNITS) {
    if (n >= value) {
      if (suffix === '∞') return '∞';
      const divided = n / value;
      const formatted = divided >= 100
        ? Math.floor(divided).toString()
        : divided % 1 === 0
          ? divided.toFixed(0)
          : divided.toFixed(decimals).replace(/\.?0+$/, '');
      return `${formatted}${suffix}`;
    }
  }
  return Math.floor(n).toLocaleString();
}

/**
 * 숫자를 full 표기 + 단축 표기 병기로 표시 (툴팁 등에 사용)
 * @param {number} n
 * @returns {string}
 */
function formatNumberFull(n) {
  if (typeof n === 'string') {
    if (n === 'Infinity' || n === '∞') return '∞';
    if (/^-?\d+$/.test(n) && n.length <= 15) return formatNumberFull(Number(n));
    return formatNumber(n);
  }
  if (n < 1e4) return Math.floor(n).toLocaleString();
  return `${formatNumber(n)} (${Math.floor(n).toLocaleString()})`;
}


// ---------- 제국 단계 (Kingdom Tiers) ----------
// 목표: 초반은 빠르게, 마지막 "무한의 영역"은 약 10해(10핵타) 클릭이 필요
//
// 단계별 요구 클릭 수 (지수적 증가):
//   0 → 초라한 오두막:  0
//   1 → 통나무 보루:    1,000
//   2 → 석조 요새:      50,000
//   3 → 번창하는 성채:  5,000,000 (500만)
//   4 → 황금 왕국:      500,000,000 (5억)
//   5 → 천상 제국:      100,000,000,000 (1000억)
//   6 → 신의 영역:      10,000,000,000,000 (10조)
//   7 → 초월의 왕국:    1,000,000,000,000,000 (1000조)
//   8 → 무한의 영역:    1e19 ≈ 10해 (10핵타)  ← 최종 목표
const KINGDOM_TIERS = [
  {
    clicks: 0,
    name: '초라한 오두막',
    title: '방랑 부족장',
    core1: '#55504a', core2: '#33302b',
    borderW: '0px', borderC: 'transparent',
    gems: 0, crown: false, glow: 0
  },
  {
    clicks: 1e3,           // 1천
    name: '통나무 보루',
    title: '성주',
    core1: '#634b35', core2: '#3d2d1f',
    borderW: '2px', borderC: '#a8794c',
    gems: 1, crown: false, glow: 0.15
  },
  {
    clicks: 5e9,
    name: '석조 요새',
    title: '영주',
    core1: '#4a525d', core2: '#282d35',
    borderW: '3px', borderC: '#8ca4be',
    gems: 2, crown: false, glow: 0.3
  },
  {
    clicks: 5e11,           // 500만
    name: '번창하는 성채',
    title: '정복왕',
    core1: '#7a2b37', core2: '#42161d',
    borderW: '4px', borderC: '#e56b73',
    gems: 3, crown: true, glow: 0.5
  },
  {
    clicks: 5e15,         // 5억
    name: '황금 왕국',
    title: '제국 황제',
    core1: '#856a28', core2: '#473812',
    borderW: '5px', borderC: '#f1ce6b',
    gems: 4, crown: true, glow: 0.7
  },
  {
    clicks: 1e17,      // 1000억
    name: '천상 제국',
    title: '천상 패왕',
    core1: '#4d2b7a', core2: '#281442',
    borderW: '6px', borderC: '#c48ef5',
    gems: 4, crown: true, glow: 0.85
  },
  {
    clicks: 1e18,    // 10조
    name: '신의 영역',
    title: '불멸의 신황',
    core1: '#1a3a6b', core2: '#0d1f3b',
    borderW: '7px', borderC: '#60aaff',
    gems: 5, crown: true, glow: 0.95
  },
  {
    clicks: 1e20,              // 1000조
    name: '초월의 왕국',
    title: '우주의 지배자',
    core1: '#3b1a6b', core2: '#1f0d3b',
    borderW: '8px', borderC: '#df7fff',
    gems: 6, crown: true, glow: 1.0
  },
  {
    clicks: 1e60,              // 약 10해 (10핵타) — 최종 목표
    name: '무한의 영역',
    title: '무한의 존재',
    core1: '#1a1a1a', core2: '#000000',
    borderW: '10px', borderC: '#ffffff',
    gems: 10, crown: true, glow: 1.2
  },
];

// 이 값을 초과하면 beyondMax (신 칭호 해금, 글리치 효과)
const MAX_TIER_CLICKS = 1e200;


// ---------- 군대 아이템 (Army Items) ----------
const ARMY_ITEMS = [
  {
    id: 'peasant_spear',
    name: '농민 창병대',
    icon: '🗡️',
    cps: 0.1,
    baseCost: 15,
    desc: '가장 기본적인 영지 창병 수호대'
  },
  {
    id: 'royal_archer',
    name: '왕실 궁수대',
    icon: '🏹',
    cps: 0.5,
    baseCost: 100,
    desc: '성벽 위에서 화살을 쏘는 숙련된 정예 궁수'
  },
  {
    id: 'elite_cavalry',
    name: '정예 기병대',
    icon: '🐎',
    cps: 2,
    baseCost: 1100,
    desc: '전장을 종횡무진 휩쓰는 묵직한 중갑 기병대'
  },
  {
    id: 'siege_catapult',
    name: '공성 투석기',
    icon: '🏰',
    cps: 8,
    baseCost: 12000,
    desc: '거대한 돌을 날려 적의 전선을 파괴하는 대포'
  },
  {
    id: 'guardian_knight',
    name: '수호 기사단',
    icon: '🛡️',
    cps: 35,
    baseCost: 130000,
    desc: '왕국의 신성한 맹세를 이행하는 기사단'
  },
  {
    id: 'alchemical_golem',
    name: '연금술 발도 골렘',
    icon: '🤖',
    cps: 150,
    baseCost: 1400000,
    desc: '마법 연금술로 연마된 거대한 마도 골렘'
  },
  {
    id: 'arcane_cannon',
    name: '마도 대포 요새',
    icon: '🔫',
    cps: 750,
    baseCost: 20000000,
    desc: '마력을 집속시켜 연사하는 차세대 마도 요새'
  },
  {
    id: 'dragon_artillery',
    name: '용의 화염포',
    icon: '☢️',
    cps: 4000,
    baseCost: 330000000,
    desc: '드래곤의 불꽃으로 광범위 지대를 태우는 대포'
  },
  {
    id: 'dimensional_citadel',
    name: '차원 왜곡 요새',
    icon: '🛸',
    cps: 25000,
    baseCost: 5100000000,
    desc: '시공간 전선을 왜곡시키는 궁극의 제국 요새'
  },
  // 후반 콘텐츠: 고가 유닛 추가 (무한의 영역 진입을 위해)
  {
    id: 'celestial_legion',
    name: '천상 정예 군단',
    icon: '✨',
    cps: 200000,
    baseCost: 100000000000,    // 1000억
    desc: '천상에서 내려온 불멸의 정예 군단'
  },
  {
    id: 'void_annihilator',
    name: '허공 소멸포',
    icon: '🌌',
    cps: 2000000,
    baseCost: 100000000000000,  // 10조
    desc: '허공의 에너지를 집속해 적을 소멸시키는 초병기'
  },
  {
    id: 'infinity_engine',
    name: '무한 에너지 기관',
    icon: '♾️',
    cps: 30000000,
    baseCost: 1e16,            // 1000조
    desc: '무한한 에너지를 생성하는 신화급 초월 병기'
  },
];


// ---------- 보구 (Multiplier Relics) ----------
const MULTIPLIER_RELICS = [
  {
    id: 'commander_banner',
    name: '지휘관의 영주 깃발',
    icon: '🚩',
    cost: 1000,
    addClick: 1,
    mult: 1,
    desc: '클릭당 자금 +1 추가'
  },
  {
    id: 'runed_sword',
    name: '왕국 기사의 명검',
    icon: '🗡️',
    cost: 500000,
    addClick: 2,
    mult: 1,
    desc: '클릭당 자금 +2 추가'
  },
  {
    id: 'sovereign_seal',
    name: '제왕의 옥새',
    icon: '👑',
    cost: 10000000000,
    addClick: 50,
    mult: 1,
    desc: '수동 클릭 자금 +50추가'
  }
  
];


// ---------- 시각 효과 (Visual Effects) ----------
const VISUAL_EFFECTS = [
  {
    id: 'effect-aura-dragon',
    name: '🐲 황금 용의 오라',
    icon: '🐲',
    cost: 5000,
    desc: '메인 씰에 웅장한 황금 용의 불꽃 오라 펄스가 휘감깁니다.'
  },
  {
    id: 'effect-aura-lightning',
    name: '⚡ 천둥 번개 전율',
    icon: '⚡',
    cost: 50000,
    desc: '클릭할 때마다 푸른 번개 충격파가 메인 씰에 전율합니다.'
  },
  {
    id: 'effect-aura-galaxy',
    name: '🌌 시공간 별빛 은하수',
    icon: '🌌',
    cost: 1000000,
    desc: '신비로운 자줏빛 신성 은하수 궤도가 씰을 회전합니다.'
  },
  {
    id: 'effect-aura-hellfire',
    name: '🔥 지옥불 용암 분출',
    icon: '🔥',
    cost: 25000000,
    desc: '지옥의 붉은 용암 불꽃 폭발 이펙트가 타오릅니다.'
  },
];


// ---------- 오프라인 CPS 아이템 ----------
const OFFLINE_CPS_ITEMS = [
  {
    id: 'bg_administrator',
    name: '백그라운드 행정 집행관',
    icon: '🏛️',
    offlineCps: 1,
    baseCost: 200000000000,
    desc: '웹을 닫아도 백그라운드에서 자금 수확 (초당 +1)'
  },
  {
    id: 'bg_guardian_order',
    name: '시공간 자율 수호 군단',
    icon: '🛡️',
    offlineCps: 5,
    baseCost: 8000000000000,
    desc: '자율 작동하는 백그라운드 수호 군단 (초당 +5)'
  },
  {
    id: 'bg_dimensional_citadel',
    name: '차원 왜곡 방치 요새',
    icon: '🛸',
    offlineCps: 15,
    baseCost: 140000000000000,
    desc: '접속 종료 중에도 방치 자금 수확 (초당 +15)'
  },
];


// ---------- 해금 가능한 칭호 ----------
const UNLOCKABLE_TITLES = [
  {
    id: 'title_novice',
    name: '초보 영주',
    req: '기본 지급',
    desc: '왕국을 건국한 영주'
  },
  {
    id: 'title_victor',
    name: '백전백승의 챔피언',
    req: '대전 5승 달성',
    desc: '전장에서 승리를 거둔 명장'
  },
  {
    id: 'title_raider',
    name: '전설의 약탈자',
    req: '약탈 10,000 클릭',
    desc: '적의 자금을 휩수한 약탈자'
  },
  {
    id: 'title_bulwark',
    name: '불굴의 기사단장',
    req: '전투력 10,000 이상',
    desc: '강력한 제국 군대를 거느린 자'
  },
  {
    id: 'title_visionary',
    name: '제국의 선지자',
    req: '제보/아이디어 작성',
    desc: '제국 발전에 기여한 지혜로운 통치자'
  },
  {
    id: 'title_god',
    name: '신',
    req: '무한의 영역 초월',
    desc: '무한의 영역을 넘어선 존재'
  },
];


// ---------- 일일 미션 ----------
const DAILY_MISSIONS = [
  {
    id: 'm_click200',
    title: '⚔️ 왕국 수호',
    desc: '수동 클릭 100회 누르기',
    reward: 2000,
    target: 100,
    type: 'click'
  },
  {
    id: 'm_buy_army',
    title: '🐎 군세 확장',
    desc: '군대 1회 이상 고용하기',
    reward: 5000,
    target: 1,
    type: 'army'
  },
  {
    id: 'm_battle',
    title: '🛡️ 전장의 지휘관',
    desc: '친구/AI 대전 1회 완료하기',
    reward: 10000,
    target: 1,
    type: 'battle'
  },
  {
    id: 'm_feedback',
    title: '💡 제국 발전의 소리',
    desc: '버그 제보 또는 아이디어 제안하기',
    reward: 20000,
    target: 1,
    type: 'feedback'
  },
];

// ---------- BigInt 기반 무한 정수 유틸리티 (Python 스타일) ----------
function toBig(val) {
  if (typeof val === 'bigint') return val;
  if (typeof val === 'string' && /^-?\d+$/.test(val)) return BigInt(val);
  if (typeof val === 'number' && isFinite(val) && val <= Number.MAX_SAFE_INTEGER) return BigInt(Math.floor(val));
  return BigInt(0);
}
function bigGte(a, b) { return toBig(a) >= toBig(b); }
function bigGt(a, b) { return toBig(a) > toBig(b); }
function bigLt(a, b) { return toBig(a) < toBig(b); }
function bigLte(a, b) { return toBig(a) <= toBig(b); }
function bigAdd(a, b) { return (toBig(a) + toBig(b)).toString(); }
function bigSub(a, b) { return (toBig(a) - toBig(b)).toString(); }
function bigMul(a, b) { return (toBig(a) * toBig(b)).toString(); }
function bigDiv(a, b) { return (toBig(a) / toBig(b)).toString(); }
function bigMax(a, b) { return bigGte(a, b) ? toBig(a).toString() : toBig(b).toString(); }
function bigMin(a, b) { return bigLte(a, b) ? toBig(a).toString() : toBig(b).toString(); }
function bigPow10AsString(exp) { return '1' + '0'.repeat(exp); }

