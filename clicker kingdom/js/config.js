// ---------- Config & Game Data Constants ----------

export const ADMIN_PASSWORD = "REMOVED"; // Admin password for game management

// 9 Passive Auto-Clicker Troops (Spacebar Clicker re-themed into Kingdom War concept)
export const ARMY_ITEMS = [
  { id: 'peasant_spear', name: '농민 창병대', icon: '🗡️', cps: 1, baseCost: 15, desc: '가장 기본적인 영지 창병 수호대' },
  { id: 'royal_archer', name: '왕실 궁수대', icon: '🏹', cps: 5, baseCost: 100, desc: '성벽 위에서 화살을 쏘는 숙련된 정예 궁수' },
  { id: 'elite_cavalry', name: '정예 기병대', icon: '🐎', cps: 20, baseCost: 1100, desc: '전장을 종횡무진 휩쓰는 묵직한 중갑 기병대' },
  { id: 'siege_catapult', name: '공성 투석기', icon: '🏰', cps: 80, baseCost: 12000, desc: '거대한 돌을 날려 적의 전선을 파괴하는 대포' },
  { id: 'guardian_knight', name: '수호 기사단', icon: '🛡️', cps: 350, baseCost: 130000, desc: '왕국의 신성한 맹세를 이행하는 기사단' },
  { id: 'alchemical_golem', name: '연금술 발도 골렘', icon: '🤖', cps: 1500, baseCost: 1400000, desc: '마법 연금술로 연마된 거대한 마도 골렘' },
  { id: 'arcane_cannon', name: '마도 대포 요새', icon: '🔫', cps: 7500, baseCost: 20000000, desc: '마력을 집속시켜 연사하는 차세대 마도 요새' },
  { id: 'dragon_artillery', name: '용의 화염포', icon: '☢️', cps: 40000, baseCost: 330000000, desc: '드래곤의 불꽃으로 광범위 지대를 태우는 대포' },
  { id: 'dimensional_citadel', name: '차원 왜곡 요새', icon: '🛸', cps: 250000, baseCost: 5100000000, desc: '시공간 전선을 왜곡시키는 궁극의 제국 요새' }
];

// 5 Manual Click Multiplier Relics
export const MULTIPLIER_RELICS = [
  { id: 'commander_banner', name: "지휘관의 영주 깃발", icon: '🚩', cost: 100, addClick: 1, mult: 1, desc: '클릭당 자금 +1 추가' },
  { id: 'runed_sword', name: "왕국 기사의 명검", icon: '🗡️', cost: 500, addClick: 0, mult: 2, desc: '수동 클릭 자금 2배 증가' },
  { id: 'sovereign_seal', name: "제왕의 옥새", icon: '👑', cost: 10000, addClick: 0, mult: 2, desc: '수동 클릭 자금 2배 추가 증폭' },
  { id: 'thunder_throne', name: "제국의 천둥 옥좌", icon: '⚡', cost: 250000, addClick: 0, mult: 2, desc: '수동 클릭 자금 2배 추가 증폭' },
  { id: 'celestial_crown', name: "천상의 정복자 왕관", icon: '🌟', cost: 5000000, addClick: 0, mult: 2, desc: '수동 클릭 자금 2배 추가 증폭' }
];

// Empire Tier Titles
export const KINGDOM_TIERS = [
  { clicks: 0, name: '초라한 오두막', title: '방랑 부족장', core1: '#55504a', core2: '#33302b', borderW: '0px', borderC: 'transparent', gems: 0, crown: false, glow: 0 },
  { clicks: 100, name: '통나무 보루', title: '성주', core1: '#634b35', core2: '#3d2d1f', borderW: '2px', borderC: '#a8794c', gems: 1, crown: false, glow: 0.2 },
  { clicks: 1000, name: '석조 요새', title: '영주', core1: '#4a525d', core2: '#282d35', borderW: '3px', borderC: '#8ca4be', gems: 2, crown: false, glow: 0.4 },
  { clicks: 10000, name: '번창하는 성채', title: '정복왕', core1: '#7a2b37', core2: '#42161d', borderW: '4px', borderC: '#e56b73', gems: 3, crown: true, glow: 0.65 },
  { clicks: 100000, name: '황금 왕국', title: '제국 황제', core1: '#856a28', core2: '#473812', borderW: '5px', borderC: '#f1ce6b', gems: 4, crown: true, glow: 0.85 },
  { clicks: 1000000, name: '천상 제국', title: '천상 패왕', core1: '#4d2b7a', core2: '#281442', borderW: '6px', borderC: '#c48ef5', gems: 4, crown: true, glow: 1.0 }
];

// Special Unlockable Titles
export const UNLOCKABLE_TITLES = [
  { id: 'title_novice', name: '초보 영주', req: '기본 지급', desc: '왕국을 건국한 영주' },
  { id: 'title_victor', name: '백전백승의 챔피언', req: '대전 5승 달성', desc: '전장에서 승리를 거둔 명장' },
  { id: 'title_raider', name: '전설의 약탈자', req: '약탈 10,000 클릭', desc: '적의 자금을 휩쓴 약탈자' },
  { id: 'title_bulwark', name: '불굴의 기사단장', req: '전투력 10,000 이상', desc: '강력한 제국 군대를 거느린 자' },
  { id: 'title_visionary', name: '제국의 선지자', req: '제보/아이디어 작성', desc: '제국 발전에 기여한 지혜로운 통치자' }
];

// Daily Missions
export const DAILY_MISSIONS = [
  { id: 'm_click200', title: '⚔️ 왕국 수호', desc: '수동 클릭 100회 누르기', reward: 2000, target: 100, type: 'click' },
  { id: 'm_buy_army', title: '🐎 군세 확장', desc: '군대 1회 이상 고용하기', reward: 5000, target: 1, type: 'army' },
  { id: 'm_battle', title: '🛡️ 전장의 지휘관', desc: '친구/AI 대전 1회 완료하기', reward: 10000, target: 1, type: 'battle' },
  { id: 'm_feedback', title: '💡 제국 발전의 소리', desc: '버그 제보 또는 아이디어 제안하기', reward: 20000, target: 1, type: 'feedback' }
];
