/**
 * TRPG 플랫폼 - Apps Script 백엔드
 * 이 스크립트는 이 파일이 들어있는 스프레드시트를 데이터베이스로 사용합니다.
 * 시트 구성: 캐릭터 / 주사위기록 / 세션로그 / NPC_몬스터 / 게임상태 / 솔로_캐릭터(자동 생성)
 */

const SHEETS = {
  CHAR: '캐릭터',
  ROLL: '주사위기록',
  LOG: '세션로그',
  NPC: 'NPC_몬스터',
  STATE: '게임상태',
  SOLO_CHAR: '솔로_캐릭터'
};

const SOLO_CHAR_HEADERS = ['ID', '캐릭터명', '종족', '클래스', '배경', '능력치(JSON)', '현재HP', '최대HP', '스킬/특기', '소지품', '외형', '골드', '최종수정'];

// ============ 공통 유틸 ============

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('TRPG 플랫폼')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('시트를 찾을 수 없습니다: ' + name + ' (탭 이름이 바뀌지 않았는지 확인하세요)');
  return sh;
}

// 솔로 플레이 모드처럼 나중에 추가된 기능은 사용자가 시트를 수동으로 만들지 않아도
// 되도록, 없으면 헤더와 함께 자동으로 새 탭을 만들어준다. 이미 있으면 그대로 반환.
function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function nowStr_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
}

function sheetToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}

function upsertRowById_(sheetName, obj, idPrefix) {
  const sheet = getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  if (obj.ID) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(obj.ID)) { rowIndex = i + 1; break; }
    }
  }
  if (!obj.ID) {
    obj.ID = idPrefix + new Date().getTime();
  }
  const rowValues = headers.map(h => (obj[h] !== undefined && obj[h] !== null) ? obj[h] : '');
  if (rowIndex === -1) {
    sheet.appendRow(rowValues);
  } else {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  }
  return obj;
}

function deleteRowById_(sheetName, id) {
  const sheet = getSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function adjustHp_(sheetName, id, delta) {
  const sheet = getSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const hpCol = headers.indexOf('현재HP');
  const maxHpCol = headers.indexOf('최대HP');
  if (hpCol === -1) throw new Error('현재HP 컬럼을 찾을 수 없습니다.');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      let newHp = Number(data[i][hpCol] || 0) + delta;
      const maxHp = Number(data[i][maxHpCol] || 0);
      if (newHp < 0) newHp = 0;
      if (maxHp && newHp > maxHp) newHp = maxHp;
      sheet.getRange(i + 1, hpCol + 1).setValue(newHp);
      return newHp;
    }
  }
  throw new Error('대상을 찾을 수 없습니다.');
}

// ============ 캐릭터 ============

function getCharacters() {
  return sheetToObjects_(getSheet_(SHEETS.CHAR));
}

function upsertCharacter(char) {
  char['최종수정'] = nowStr_();
  return upsertRowById_(SHEETS.CHAR, char, 'c');
}

function deleteCharacter(id) {
  return deleteRowById_(SHEETS.CHAR, id);
}

function adjustCharacterHP(id, delta) {
  return adjustHp_(SHEETS.CHAR, id, delta);
}

// ============ NPC / 몬스터 (GM) ============

function getNPCs() {
  return sheetToObjects_(getSheet_(SHEETS.NPC));
}

function upsertNPC(npc) {
  return upsertRowById_(SHEETS.NPC, npc, 'n');
}

function deleteNPC(id) {
  return deleteRowById_(SHEETS.NPC, id);
}

function adjustNpcHP(id, delta) {
  return adjustHp_(SHEETS.NPC, id, delta);
}

// ============ 솔로 플레이 캐릭터 ============
// '솔로_캐릭터' 시트가 없으면 자동으로 만들어서, 사용자가 스프레드시트를 직접
// 열어 탭을 추가하지 않아도 솔로 모드를 바로 쓸 수 있게 한다.

function ensureSoloSheet_() {
  return getOrCreateSheet_(SHEETS.SOLO_CHAR, SOLO_CHAR_HEADERS);
}

function getSoloCharacters() {
  ensureSoloSheet_();
  return sheetToObjects_(getSheet_(SHEETS.SOLO_CHAR));
}

function upsertSoloCharacter(char) {
  ensureSoloSheet_();
  char['최종수정'] = nowStr_();
  return upsertRowById_(SHEETS.SOLO_CHAR, char, 's');
}

function deleteSoloCharacter(id) {
  ensureSoloSheet_();
  // 캐릭터를 지우면 해당 캐릭터의 시나리오 진행 상태도 같이 정리한다.
  setGameState('솔로진행_' + id, '');
  return deleteRowById_(SHEETS.SOLO_CHAR, id);
}

function adjustSoloCharacterHP(id, delta) {
  ensureSoloSheet_();
  return adjustHp_(SHEETS.SOLO_CHAR, id, delta);
}

// ============ 게임 상태 (GM 도구 + 솔로 플레이 진행상태 공용) ============

function getGameState() {
  const sheet = getOrCreateSheet_(SHEETS.STATE, ['키', '값']);
  const values = sheet.getDataRange().getValues();
  const state = {};
  for (let i = 1; i < values.length; i++) {
    const key = values[i][0];
    if (key) state[key] = values[i][1];
  }
  return state;
}

function setGameState(key, value) {
  const sheet = getOrCreateSheet_(SHEETS.STATE, ['키', '값']);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) {
      sheet.getRange(i + 1, 2).setValue(value);
      return true;
    }
  }
  sheet.appendRow([key, value]);
  return true;
}

// 솔로 플레이 시나리오 진행 상태(현재 노드/전투 HP/선택 기록 등을 담은 JSON 문자열)를
// 캐릭터별로 저장·조회하기 위한 얇은 래퍼. 실제 저장은 게임상태 시트를 재사용한다.
function getSoloProgress(charId) {
  const state = getGameState();
  return state['솔로진행_' + charId] || '';
}

function setSoloProgress(charId, progressJson) {
  return setGameState('솔로진행_' + charId, progressJson);
}

// ============ 세션 로그 ============

function addSessionLog(author, type, content) {
  const sheet = getSheet_(SHEETS.LOG);
  sheet.appendRow([nowStr_(), author || '익명', type || '기타', content || '']);
  return true;
}

function getSessionLog(limit) {
  const rows = sheetToObjects_(getSheet_(SHEETS.LOG));
  rows.reverse();
  return limit ? rows.slice(0, limit) : rows;
}

// ============ 주사위 굴리기 ============
// 지원 표기법: 1d20, 2d6+3, 4d6kh3(가장 높은 3개 유지), 2d20kl1(가장 낮은 1개 유지),
//              여러 항 조합: 1d20+2d4-1

function parseDiceNotation_(notation) {
  const cleaned = String(notation || '').replace(/\s+/g, '');
  if (!cleaned) throw new Error('주사위 표기법을 입력하세요. 예: 1d20+5');
  const re = /([+-]?)(\d*d\d+(?:k[hl]\d+)?|\d+)/gi;
  let match;
  let matchedLength = 0;
  const terms = [];
  while ((match = re.exec(cleaned)) !== null) {
    matchedLength += match[0].length;
    const sign = match[1] === '-' ? -1 : 1;
    const body = match[2];
    const diceMatch = body.match(/^(\d*)d(\d+)(?:k([hl])(\d+))?$/i);
    if (diceMatch) {
      const count = diceMatch[1] ? parseInt(diceMatch[1], 10) : 1;
      const sides = parseInt(diceMatch[2], 10);
      const keepType = diceMatch[3] ? diceMatch[3].toLowerCase() : null;
      const keepCount = diceMatch[4] ? parseInt(diceMatch[4], 10) : null;
      if (count < 1 || count > 100 || sides < 2 || sides > 1000) {
        throw new Error('주사위 개수(1~100)나 면수(2~1000) 범위를 벗어났습니다.');
      }
      terms.push({ type: 'dice', sign, count, sides, keepType, keepCount });
    } else {
      terms.push({ type: 'flat', sign, value: parseInt(body, 10) });
    }
  }
  if (terms.length === 0 || matchedLength !== cleaned.length) {
    throw new Error('주사위 표기법을 이해하지 못했습니다. 예: 1d20+5, 2d6, 4d6kh3');
  }
  return terms;
}

function rollDice(notation, roller, characterName, memo) {
  const terms = parseDiceNotation_(notation);
  let total = 0;
  const detailParts = [];
  const structTerms = [];
  let hasNatural20 = false;
  let hasNatural1 = false;

  terms.forEach(term => {
    if (term.type === 'flat') {
      total += term.sign * term.value;
      detailParts.push((term.sign < 0 ? '-' : (detailParts.length ? '+' : '')) + term.value);
      structTerms.push({ kind: 'flat', sign: term.sign, value: term.value });
      return;
    }
    const rolls = [];
    for (let i = 0; i < term.count; i++) {
      rolls.push(Math.floor(Math.random() * term.sides) + 1);
    }
    let keptIdx = new Set(rolls.map((v, i) => i));
    if (term.keepType && term.keepCount && term.keepCount < term.count) {
      const sorted = rolls.map((v, i) => ({ v, i }))
        .sort((a, b) => term.keepType === 'h' ? b.v - a.v : a.v - b.v);
      keptIdx = new Set(sorted.slice(0, term.keepCount).map(x => x.i));
    }
    const sum = rolls.reduce((acc, v, i) => acc + (keptIdx.has(i) ? v : 0), 0);
    total += term.sign * sum;
    if (term.sides === 20 && term.count === 1) {
      if (rolls[0] === 20) hasNatural20 = true;
      if (rolls[0] === 1) hasNatural1 = true;
    }
    const rollStr = rolls.map((v, i) => keptIdx.has(i) ? v : '(' + v + ')').join(',');
    const countLabel = term.count + 'd' + term.sides + (term.keepType ? 'k' + term.keepType + term.keepCount : '');
    detailParts.push((term.sign < 0 ? '-' : (detailParts.length ? '+' : '')) + countLabel + '[' + rollStr + ']');
    structTerms.push({
      kind: 'dice',
      sign: term.sign,
      sides: term.sides,
      label: countLabel,
      dice: rolls.map((v, i) => ({ value: v, kept: keptIdx.has(i) }))
    });
  });

  const detail = detailParts.join(' ');
  const rollerName = roller || '익명';
  const character = characterName || '';
  const memoText = memo || '';

  getSheet_(SHEETS.ROLL).appendRow([nowStr_(), rollerName, character, notation, detail, total, memoText]);

  return {
    total: total,
    detail: detail,
    notation: notation,
    terms: structTerms,
    critical: hasNatural20 ? 'success' : (hasNatural1 ? 'fail' : null)
  };
}

function getRollLog(limit) {
  const rows = sheetToObjects_(getSheet_(SHEETS.ROLL));
  rows.reverse();
  return limit ? rows.slice(0, limit) : rows;
}
