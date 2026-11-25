/*
 * 청첩장 설정
 * ─────────────────────────────────────────────
 * 이름·문구·계좌처럼 화면에 보이는 글자는 index.html 에 그대로 적혀 있어요.
 * 여기에는 날짜 계산, 지도, 참석 응답 저장처럼 "동작"에 필요한 값만 모았어요.
 */
window.WEDDING = {
  // 청첩장 주소 (공유 버튼·링크 복사에 사용)
  siteUrl: 'https://ambosingandcheeseb.github.io/',

  // 예식 일시 (한국 시간 기준)
  date: '2027-03-27',
  time: '11:30',

  // 달력에서 빨간 날로 표시할 공휴일
  holidays: ['2027-03-01'],

  // D-day 문구에 쓰는 이름
  groomShort: '지원',
  brideShort: '성연',

  venue: {
    name: '바울센터',
    address: '전북 전주시 완산구 안행로 130',
    tel: '', // 예식장 전화번호를 넣으면 '오시는 길'에 전화 버튼이 생겨요
    lat: 35.8074573,
    lng: 127.1341107,
    naverQuery: '전주 바울센터',
  },

  // 전세버스 수요 조사 마감 (이 시각이 지나면 응답 창에서 버스 질문이 사라져요)
  busDeadline: '2027-01-31T23:59:59+09:00',

  // 참석 응답을 저장할 Google Apps Script 웹 앱 주소 (README 참고)
  // 비워 두면 '테스트 모드'로 동작하고 응답이 저장되지 않아요.
  rsvpEndpoint: 'https://script.google.com/macros/s/AKfycby5FgHroRemtsIeSstnqNEU9emlDlQei4BoA5RwBfAeVHLrGaX_53YaoDEGM2FkG-ONqg/exec',

  // 카카오 JavaScript 키 (비워 두면 휴대폰 기본 공유 / 링크 복사로 대신해요)
  kakaoJsKey: '',

  // 사진 — 파일을 images/ 폴더에 넣고 경로를 적어 주세요. 비어 있으면 자리표시가 보여요.
  photos: {
    main: '',          // 예: 'images/main.jpg'   (세로 4:5 권장)
    ending: '',        // 예: 'images/ending.jpg' (세로 4:5 권장)
    share: '',         // 예: 'images/og.jpg'     (카카오톡 공유 썸네일, 가로 1200×630 권장)
    gallery: [],       // 예: ['images/gallery/01.jpg', 'images/gallery/02.jpg']  (10:13 권장)
    galleryPlaceholderCount: 6,
  },
};
