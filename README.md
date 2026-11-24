# github.io
모바일 청첩장 페이지 — 양지원 ♥ 김성연 · 2027.03.27 (토) 오전 11:30 · 전주 바울센터

## 파일 구성

| 파일 | 내용 |
| --- | --- |
| `index.html` | 화면에 보이는 모든 글자 (인사말, 혼주, 안내사항, 계좌, 연락처, 참석 팝업 문구) |
| `assets/js/config.js` | 날짜, 지도 좌표, 사진 경로, 참석 응답 저장 주소, 카카오 키 |
| `assets/js/main.js` | 달력·D-day, 지도, 갤러리, 팝업, 참석 응답, 복사·공유 |
| `assets/css/style.css` | 디자인 |
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
   - 카카오톡 공유 썸네일 `images/og.jpg` (가로 1200×630)
2. `assets/js/config.js`의 `photos`에 경로를 적어요.
3. 공유 썸네일은 `index.html`의 `og:image` 줄 주석을 풀어 주세요.

사진은 긴 변 1600px, 장당 500KB 안팎으로 줄여서 넣으면 카카오톡 안에서도 빨리 떠요.

## 참석 응답 받기 (구글 시트)

1. 구글 시트를 새로 만들고 **확장 프로그램 → Apps Script**를 열어요.
2. `rsvp/apps-script.gs` 내용을 붙여 넣고 저장해요.
3. 위쪽 함수 목록에서 `setup`을 골라 **실행**하고 권한을 허용해요. ('응답', '요약' 시트가 생겨요.)
4. **배포 → 새 배포 → 유형: 웹 앱**을 고르고, 실행 계정은 **나**, 액세스 권한은 **모든 사용자**로 배포해요.
5. 나온 웹 앱 주소(`https://script.google.com/macros/s/…/exec`)를 `assets/js/config.js`의 `rsvpEndpoint`에 넣어요.

주소를 넣기 전에는 응답이 저장되지 않고, 완료 화면에 '테스트 모드'라고 표시돼요.
같은 휴대폰에서 다시 응답하면 시트의 기존 줄이 새 응답으로 바뀌어요.

## 카카오톡 공유 (선택)

[Kakao Developers](https://developers.kakao.com)에서 앱을 만들고 **JavaScript 키**를 `config.js`의 `kakaoJsKey`에 넣어요.
플랫폼 → Web 사이트 도메인에 `https://ambosingandcheeseb.github.io`를 등록해야 해요.
키가 없으면 휴대폰 기본 공유창이 뜨거나, 청첩장 주소가 복사돼요.

## 배포 (GitHub Pages)

GitHub Pages가 `main` 브랜치 `/ (root)`로 설정되어 있어서, `main`에 올라가면
`https://ambosingandcheeseb.github.io/`에 게시돼요.
주소가 달라지면 `config.js`의 `siteUrl`과 `index.html`의 `og:url`, `og:image`를 함께 바꿔 주세요.
