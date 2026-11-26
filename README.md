# github.io
모바일 청첩장 페이지 — 양지원 ♥ 김성연 · 2027.03.27 (토) 오전 11:30 · 전주 바울센터

## 파일 구성

| 파일 | 내용 |
| --- | --- |
| `index.html` | 화면에 보이는 모든 글자 (인사말, 혼주, 안내사항, 계좌, 연락처, 참석 팝업 문구) |
| `assets/js/config.js` | 날짜, 지도 좌표, 사진 경로, 참석 응답 저장 주소, 카카오 키 |
| `assets/js/main.js` | 달력·D-day, 약도·길안내, 갤러리·크게 보기, 팝업, 참석 응답, 아래 도우미 바(글씨 크게), 꽃잎, 복사·공유 |
| `assets/css/style.css` | 디자인 |
| `assets/fonts/RIDIBatang-sub.woff2` | 리디바탕에서 자주 쓰는 한글 2,350자만 담은 폰트 (126KB, 원본 707KB) |
| `assets/img/map.jpg` | 바울센터 약도 (OpenStreetMap, 정중앙이 예식장) |
| `images/og.jpg` | 카카오톡 공유 썸네일 (지금은 글자로 만든 임시 카드) |
| `rsvp/apps-script.gs` | 참석 응답을 구글 시트에 저장하는 스크립트 |

`design/` 폴더는 이전 3D 앨범 설계안이며 페이지에서는 쓰지 않아요.

## 미리 보기

```bash
python3 -m http.server 8000
# 휴대폰 화면 크기로 http://localhost:8000 열기
```

## 사진 넣기

1. `images/` 폴더에 사진을 넣어요.
   - 메인 사진 `images/main.jpg` (세로 4:5)
   - 마무리 사진 `images/ending.jpg` (세로 4:5)
   - 갤러리 `images/gallery/01.jpg`, `02.jpg` … (10:13)
   - 카카오톡 공유 썸네일 `images/og.jpg` (가로 1200×630, 지금 있는 임시 카드를 덮어쓰기)
2. `assets/js/config.js`의 `photos`에 경로를 적어요.
3. 갤러리 사진은 누르면 전체 화면으로 크게 볼 수 있어요.

> 카카오톡은 처음 본 링크 미리보기를 한동안 기억해요. 썸네일을 바꾼 뒤 예전 미리보기가 보이면
> [카카오 공유 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 주소를 넣고 '캐시 초기화'를 눌러 주세요.

사진은 긴 변 1600px, 장당 500KB 안팎으로 줄여서 넣으면 카카오톡 안에서도 빨리 떠요.

## 참석 응답 받기 (구글 시트)

1. 구글 시트를 새로 만들고 **확장 프로그램 → Apps Script**를 열어요.
2. `rsvp/apps-script.gs` 내용을 붙여 넣고 저장해요.
3. 위쪽 함수 목록에서 `setup`을 골라 **실행**하고 권한을 허용해요. ('응답', '요약' 시트가 생겨요.)
4. **배포 → 새 배포 → 유형: 웹 앱**을 고르고, 실행 계정은 **나**, 액세스 권한은 **모든 사용자**로 배포해요.
5. 나온 웹 앱 주소(`https://script.google.com/macros/s/…/exec`)를 `assets/js/config.js`의 `rsvpEndpoint`에 넣어요.

주소를 넣기 전에는 응답이 저장되지 않고, 완료 화면에 '테스트 모드'라고 표시돼요.
같은 휴대폰에서 다시 응답하면 시트의 기존 줄이 새 응답으로 바뀌어요.

> 현재 연결됨: 구글 시트 "모바일 청첩장 참석 응답 (양지원♥김성연)"
> Apps Script 코드를 고친 뒤에는 **배포 → 배포 관리 → 수정(연필) → 버전: 새 버전 → 배포**를 해야 반영돼요. 웹 앱 주소는 그대로예요.

- 저장에 실패하면 하객 화면에 "전달하지 못했어요. 다시 눌러 주세요"가 떠요. (성공으로 잘못 표시되지 않아요)
- 버스 수요 조사 마감(`config.js`의 `busDeadline`, 스크립트의 `BUS_DEADLINE`) 뒤에는 버스 질문이 사라지고,
  다시 응답해도 기존 버스 신청은 지워지지 않아요. 마감을 바꾸면 두 곳을 함께 바꿔 주세요.
- 다른 기기에서 같은 성함·구분으로 응답하면 '응답' 시트에서 노란색으로 표시되고, '요약'에 개수가 나와요.
- 참석 팝업은 처음 방문할 때 표지를 잠깐 보여 준 뒤 떠요. 이미 응답했거나, '오늘 하루 보지 않기'를 눌렀거나, 예식 당일부터는 뜨지 않아요.

## 카카오톡 공유 (선택)

[Kakao Developers](https://developers.kakao.com)에서 앱을 만들고 **JavaScript 키**를 `config.js`의 `kakaoJsKey`에 넣어요.
플랫폼 → Web 사이트 도메인에 `https://ambosingandcheeseb.github.io`를 등록해야 해요.
키가 없으면 휴대폰 기본 공유창이 뜨거나, 청첩장 주소가 복사돼요.

## 폰트 · 지도 출처

- 리디바탕: © RIDI Corporation, SIL Open Font License 1.1 (자주 쓰는 글자만 담아 다시 묶었어요. 드문 글자는 원본 폰트에서 자동으로 불러와요)
- 약도: © OpenStreetMap contributors (ODbL), 화면에 출처가 표시돼요

## 배포 (GitHub Pages)

GitHub Pages가 `main` 브랜치 `/ (root)`로 설정되어 있어서, `main`에 올라가면
`https://ambosingandcheeseb.github.io/`에 게시돼요.
주소가 달라지면 `config.js`의 `siteUrl`과 `index.html`의 `og:url`, `og:image`를 함께 바꿔 주세요.
