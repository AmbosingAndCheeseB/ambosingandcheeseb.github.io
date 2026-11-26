/**
 * 모바일 청첩장 · 참석 여부 응답을 구글 시트에 저장하는 스크립트
 *
 * 설치 방법은 저장소 README.md 의 "참석 응답 받기" 를 참고하세요.
 * - 같은 휴대폰에서 다시 응답하면 기존 줄을 새 응답으로 덮어써요. (중복 집계 방지)
 * - 다른 기기에서 같은 성함·구분으로 응답하면 '응답' 시트에서 노란색으로 표시돼요.
 * - 버스 수요 조사 마감(BUS_DEADLINE) 뒤에 다시 응답해도 기존 버스 신청은 지워지지 않아요.
 * - '요약' 시트에서 참석 인원과 버스 탑승 인원이 자동으로 계산돼요.
 *
 * 코드를 바꾼 뒤에는 [배포 → 배포 관리 → 수정 → 버전: 새 버전 → 배포] 를 해야 반영돼요.
 */

var SHEET = '응답';
var SUMMARY = '요약';
var HEADERS = ['받은 시각', '응답 ID', '구분', '성함', '참석 여부', '참석 인원', '버스 희망', '버스 인원', '연락처'];
var BUS_DEADLINE = new Date('2027-01-31T23:59:59+09:00');

var ALLOWED = {
  side: ['신랑측', '신부측'],
  attend: ['참석', '불참'],
  bus: ['', '희망', '미희망'],
};

/** 처음 한 번 (그리고 이 코드를 새로 붙여 넣은 뒤 한 번) 실행: 시트·요약표·중복 표시를 만들어요. */
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

  // 같은 성함 + 구분이 두 줄 이상이면 노란색 (다른 기기에서 중복 응답했을 수 있어요)
  var dupRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($D2<>"",COUNTIFS($D$2:$D,$D2,$C$2:$C,$C2)>1)')
    .setBackground('#FFF2B3')
    .setRanges([sh.getRange('A2:I')])
    .build();
  sh.setConditionalFormatRules([dupRule]);

  var r = "'" + SHEET + "'!";
  var sum = ss.getSheetByName(SUMMARY) || ss.insertSheet(SUMMARY);
  sum.clear();
  sum.getRange(1, 1, 11, 2).setValues([
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
    ['중복 의심 줄 (노란색)', '=SUMPRODUCT((' + r + 'D2:D<>"")*(COUNTIFS(' + r + 'D2:D,' + r + 'D2:D,' + r + 'C2:C,' + r + 'C2:C)>1))'],
  ]);
  sum.getRange(1, 1, 1, 2).setFontWeight('bold');
  sum.setColumnWidth(1, 200);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(25000)) return json_({ ok: false, error: 'busy' });

    var d = JSON.parse(e.postData.contents);
    var side = pick_(d.side, ALLOWED.side);
    var attend = pick_(d.attend, ALLOWED.attend);
    var name = clean_(d.name, 20);
    if (!side || !attend || !name) return json_({ ok: false, error: 'invalid' });

    var row = [
      new Date(),
      clean_(d.clientId, 40),
      side,
      name,
      attend,
      attend === '참석' ? num_(d.count) : 0,
      attend === '참석' ? (pick_(d.bus, ALLOWED.bus) || '') : '',
      0,
      '',
    ];
    if (row[6] === '희망') { row[7] = num_(d.busCount); row[8] = clean_(d.phone, 20); }

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

    // 버스 수요 조사 마감 뒤: 참석이면 기존 버스 신청을 그대로 두고, 새 버스 신청은 받지 않아요
    if (new Date() > BUS_DEADLINE && attend === '참석') {
      if (target) {
        var old = sh.getRange(target, 7, 1, 3).getValues()[0];
        row[6] = old[0]; row[7] = old[1]; row[8] = old[2];
        if (row[7] > row[5]) row[7] = row[5];
      } else {
        row[6] = ''; row[7] = 0; row[8] = '';
      }
    }

    if (target) sh.getRange(target, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) { /* 잠금을 못 얻은 경우 */ }
  }
}

/** 브라우저에서 웹 앱 주소를 열었을 때 동작 확인용 */
function doGet() {
  return json_({ ok: true, message: 'RSVP endpoint is running' });
}

function pick_(v, list) {
  v = String(v == null ? '' : v).trim();
  return list.indexOf(v) > -1 ? v : null;
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
