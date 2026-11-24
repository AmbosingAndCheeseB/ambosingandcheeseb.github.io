/**
 * 모바일 청첩장 · 참석 여부 응답을 구글 시트에 저장하는 스크립트
 *
 * 설치 방법은 저장소 README.md 의 "참석 응답 받기" 를 참고하세요.
 * - 같은 휴대폰에서 다시 응답하면 기존 줄을 새 응답으로 덮어써요. (중복 집계 방지)
 * - '요약' 시트에서 참석 인원과 버스 탑승 인원이 자동으로 계산돼요.
 */

var SHEET = '응답';
var SUMMARY = '요약';
var HEADERS = ['받은 시각', '응답 ID', '구분', '성함', '참석 여부', '참석 인원', '버스 희망', '버스 인원', '연락처'];

/** 처음 한 번만 실행: 시트와 요약표를 만들어요. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET);
  if (!sh) {
    var first = ss.getSheets()[0];
    // 새 시트의 빈 기본 탭('시트1')이 있으면 그 탭을 '응답'으로 바꿔 써요
    if (ss.getSheets().length === 1 && first.getLastRow() === 0) sh = first.setName(SHEET);
    else sh = ss.insertSheet(SHEET);
  }
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange('B:B').setNumberFormat('@');
  sh.getRange('I:I').setNumberFormat('@');

  var r = "'" + SHEET + "'!";
  var sum = ss.getSheetByName(SUMMARY) || ss.insertSheet(SUMMARY);
  sum.clear();
  sum.getRange(1, 1, 10, 2).setValues([
    ['항목', '값'],
    ['참석 응답 수', '=COUNTIF(' + r + 'E2:E,"참석")'],
    ['참석 인원 합계', '=SUMIF(' + r + 'E2:E,"참석",' + r + 'F2:F)'],
    ['   └ 신랑측', '=SUMIFS(' + r + 'F2:F,' + r + 'E2:E,"참석",' + r + 'C2:C,"신랑측")'],
    ['   └ 신부측', '=SUMIFS(' + r + 'F2:F,' + r + 'E2:E,"참석",' + r + 'C2:C,"신부측")'],
    ['불참 응답 수', '=COUNTIF(' + r + 'E2:E,"불참")'],
    ['버스 희망 응답 수', '=COUNTIF(' + r + 'G2:G,"희망")'],
    ['버스 탑승 인원 합계', '=SUMIF(' + r + 'G2:G,"희망",' + r + 'H2:H)'],
    ['   └ 신랑측', '=SUMIFS(' + r + 'H2:H,' + r + 'G2:G,"희망",' + r + 'C2:C,"신랑측")'],
    ['   └ 신부측', '=SUMIFS(' + r + 'H2:H,' + r + 'G2:G,"희망",' + r + 'C2:C,"신부측")'],
  ]);
  sum.getRange(1, 1, 1, 2).setFontWeight('bold');
  sum.setColumnWidth(1, 180);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    var row = [
      new Date(),
      clean_(d.clientId, 40),
      clean_(d.side, 10),
      clean_(d.name, 20),
      clean_(d.attend, 10),
      num_(d.count),
      clean_(d.bus, 10),
      num_(d.busCount),
      clean_(d.phone, 20),
    ];

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET);
    if (!sh) { setup(); sh = ss.getSheetByName(SHEET); }

    // 같은 기기(응답 ID)에서 다시 보낸 응답이면 그 줄을 덮어쓰기
    var target = 0;
    var last = sh.getLastRow();
    if (row[1] && last >= 2) {
      var ids = sh.getRange(2, 2, last - 1, 1).getValues();
      for (var i = ids.length - 1; i >= 0; i--) {
        if (String(ids[i][0]) === row[1]) { target = i + 2; break; }
      }
    }
    if (target) sh.getRange(target, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** 브라우저에서 웹 앱 주소를 열었을 때 동작 확인용 */
function doGet() {
  return json_({ ok: true, message: 'RSVP endpoint is running' });
}

function clean_(v, max) {
  v = String(v == null ? '' : v).trim().slice(0, max);
  if (/^[=+\-@]/.test(v)) v = "'" + v; // 시트 수식으로 해석되지 않게
  return v;
}

function num_(v) {
  var n = parseInt(v, 10);
  return isNaN(n) ? 0 : Math.max(0, Math.min(20, n));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
