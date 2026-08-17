/**
 * 개인용 생성형 AI 솔로 플레이 프록시 (Gemini API)
 *
 * 공유 중인 TRPG 플랫폼(backend/Code.gs, GitHub Pages)과는 완전히 분리된, 별도의
 * 독립 Apps Script 프로젝트에 붙여넣어 쓰는 스크립트입니다. 스프레드시트에
 * 바인딩할 필요가 없습니다(스크립트 홈에서 "새 프로젝트"로 만들면 됩니다).
 *
 * 설정 방법:
 *  1. script.google.com에서 새 독립 프로젝트를 만들고 이 내용을 Code.gs에 붙여넣는다.
 *  2. 왼쪽 톱니바퀴(프로젝트 설정) > 스크립트 속성(Script properties)에서
 *     GEMINI_API_KEY = 본인의 Gemini API 키
 *     를 추가한다. (https://aistudio.google.com 에서 발급)
 *  3. 배포 > 새 배포 > 웹앱, 실행 계정: 나, 액세스: Anyone 으로 배포한다.
 *  4. 배포로 나온 /exec URL을 personal/ai-solo.html에 붙여넣는다.
 *
 * 이 URL은 본인만 알고 있어야 합니다 — 다른 사람에게 공유하는 순간 그 사람도
 * 이 키로 Gemini 토큰을 소모시킬 수 있게 됩니다. 그래서 공유 중인 파티용
 * 배포(backend/Code.gs)와는 절대 합치지 않고 이렇게 분리해 둔 것입니다.
 */

const GEMINI_MODEL = 'gemini-2.5-flash'; // 토큰 비용을 고려한 기본값. 필요하면 다른 모델 ID로 교체.

function doGet(e) {
  return jsonOut_({ ok: true, message: '개인용 Gemini 프록시가 정상 동작 중입니다.' });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, error: '잘못된 요청 형식입니다.' });
  }

  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    return jsonOut_({ ok: false, error: 'GEMINI_API_KEY가 설정되어 있지 않습니다. 스크립트 속성을 확인하세요.' });
  }

  const systemPrompt = body.systemPrompt || '';
  const turns = Array.isArray(body.turns) ? body.turns : []; // [{role:'user'|'model', text:'...'}, ...]

  const contents = turns.map(t => ({
    role: t.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(t.text || '') }]
  }));

  const payload = { contents: contents };
  if (systemPrompt) {
    payload.systemInstruction = { role: 'user', parts: [{ text: systemPrompt }] };
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL +
    ':generateContent?key=' + encodeURIComponent(apiKey);
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const status = res.getResponseCode();
  let data = null;
  try { data = JSON.parse(res.getContentText()); } catch (err) { data = null; }

  if (status !== 200 || !data) {
    return jsonOut_({ ok: false, error: 'Gemini API 오류 (HTTP ' + status + '): ' + res.getContentText().slice(0, 300) });
  }

  const candidate = data.candidates && data.candidates[0];
  const text = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] &&
    candidate.content.parts[0].text;

  if (!text) {
    return jsonOut_({ ok: false, error: 'Gemini 응답에서 텍스트를 찾지 못했습니다. (안전 필터에 걸렸을 수 있습니다)' });
  }

  return jsonOut_({ ok: true, text: text });
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
